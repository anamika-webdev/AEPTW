// backend/src/routes/requester-assignments.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login first'
    });
  }

  const userRole = req.user.role?.toLowerCase();

  if (userRole !== 'admin' && userRole !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  next();
};

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(authorizeAdmin);

// ============= GET ASSIGNMENTS FOR A REQUESTER =============

// GET /api/requester-assignments/:requesterId - Get all assignments for a requester
router.get('/:requesterId', async (req, res) => {
  try {
    const { requesterId } = req.params;

    console.log(`📥 GET assignments for requester ID: ${requesterId}`);

    // Get user role to determine which tables to check
    const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [requesterId]);
    const role = user[0]?.role || '';

    // 1. Get assigned sites from requester_sites (for Supervisors/Requesters)
    let [assignedSites] = await pool.query(`
      SELECT rs.id as assignment_id, s.*, rs.assigned_at
      FROM requester_sites rs
      JOIN sites s ON rs.site_id = s.id
      WHERE rs.requester_user_id = ?
      ORDER BY s.name
    `, [requesterId]);

    // 2. ALSO Get assigned sites from site_approvers (if has Approver role)
    if (role.toLowerCase().includes('approver')) {
      let roleColumn = '';
      if (role.includes('AreaOwner') || role.includes('AreaManager')) roleColumn = 'area_manager_id';
      else if (role.includes('Safety')) roleColumn = 'safety_officer_id';
      else if (role.includes('SiteLeader')) roleColumn = 'site_leader_id';

      if (roleColumn) {
        const [approverSites] = await pool.query(`
                SELECT 
                    sa.id as assignment_id,
                    s.*,
                    sa.updated_at as assigned_at
                FROM sites s
                INNER JOIN site_approvers sa ON s.id = sa.site_id
                WHERE sa.${roleColumn} = ?
                ORDER BY s.name
            `, [requesterId]);

        // Combine and ensure unique sites by ID
        const existingIds = new Set(assignedSites.map(s => s.id));
        approverSites.forEach(site => {
          if (!existingIds.has(site.id)) {
            assignedSites.push(site);
          }
        });
      }
    }

    // 3. Get assigned workers
    const [assignedWorkers] = await pool.query(`
      SELECT rw.id as assignment_id, u.*, rw.assigned_at
      FROM requester_workers rw
      JOIN users u ON rw.worker_user_id = u.id
      WHERE rw.requester_user_id = ?
      ORDER BY u.full_name
    `, [requesterId]);

    console.log(`✅ Found ${assignedSites.length} assigned sites and ${assignedWorkers.length} assigned workers`);

    res.json({
      success: true,
      data: {
        sites: assignedSites,
        workers: assignedWorkers
      }
    });
  } catch (error) {
    console.error('❌ Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// ============= ASSIGN SITES TO REQUESTER =============

// POST /api/requester-assignments/:requesterId/sites - Assign sites to requester
router.post('/:requesterId/sites', async (req, res) => {
  try {
    const { requesterId } = req.params;
    const { site_ids } = req.body; // Array of site IDs
    const adminId = req.user.id;

    console.log(`📥 POST - Assigning sites to user ${requesterId}:`, site_ids);

    if (!site_ids || !Array.isArray(site_ids)) {
      return res.status(400).json({
        success: false,
        message: 'site_ids array is required'
      });
    }

    // Get user role
    const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [requesterId]);
    const role = user[0]?.role || '';

    // 1. Update requester_sites (for Supervisors/Requesters)
    if (role.toLowerCase().includes('supervisor') || role.toLowerCase().includes('requester')) {
      // Remove existing
      await pool.query('DELETE FROM requester_sites WHERE requester_user_id = ?', [requesterId]);

      // Insert new if any
      if (site_ids.length > 0) {
        const values = site_ids.map(siteId => [requesterId, siteId, adminId]);
        await pool.query(
          'INSERT INTO requester_sites (requester_user_id, site_id, assigned_by_admin_id) VALUES ?',
          [values]
        );
      }
    }

    // 2. Update site_approvers (if has Approver role)
    if (role.toLowerCase().includes('approver')) {
      let roleColumn = '';
      if (role.includes('AreaOwner') || role.includes('AreaManager')) roleColumn = 'area_manager_id';
      else if (role.includes('Safety')) roleColumn = 'safety_officer_id';
      else if (role.includes('SiteLeader')) roleColumn = 'site_leader_id';

      if (roleColumn) {
        // Remove from all sites first
        await pool.query(`UPDATE site_approvers SET ${roleColumn} = NULL WHERE ${roleColumn} = ?`, [requesterId]);

        // Assign to new sites
        for (const siteId of site_ids) {
          const [existing] = await pool.query('SELECT id FROM site_approvers WHERE site_id = ?', [siteId]);
          if (existing.length > 0) {
            await pool.query(`UPDATE site_approvers SET ${roleColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE site_id = ?`, [requesterId, siteId]);
          } else {
            await pool.query(`INSERT INTO site_approvers (site_id, ${roleColumn}) VALUES (?, ?)`, [siteId, requesterId]);
          }
        }
      }
    }

    console.log(`✅ Successfully updated site assignments for user ${requesterId}`);

    res.json({
      success: true,
      message: `Site assignments updated successfully`
    });
  } catch (error) {
    console.error('❌ Error assigning sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning sites',
      error: error.message
    });
  }
});

// ============= ASSIGN WORKERS TO REQUESTER =============

// POST /api/requester-assignments/:requesterId/workers - Assign workers to user
router.post('/:requesterId/workers', async (req, res) => {
  try {
    const { requesterId } = req.params;
    const { worker_ids } = req.body; // Array of worker user IDs
    const adminId = req.user.id;

    console.log(`📥 POST - Assigning workers to user ${requesterId}:`, worker_ids);

    if (!worker_ids || !Array.isArray(worker_ids)) {
      return res.status(400).json({
        success: false,
        message: 'worker_ids array is required'
      });
    }

    // Remove existing
    await pool.query('DELETE FROM requester_workers WHERE requester_user_id = ?', [requesterId]);

    // Insert new if any
    if (worker_ids.length > 0) {
      const values = worker_ids.map(workerId => [requesterId, workerId, adminId]);
      await pool.query(
        'INSERT INTO requester_workers (requester_user_id, worker_user_id, assigned_by_admin_id) VALUES ?',
        [values]
      );
    }

    console.log(`✅ Successfully assigned ${worker_ids.length} workers to user ${requesterId}`);

    res.json({
      success: true,
      message: `Workers assigned successfully`
    });
  } catch (error) {
    console.error('❌ Error assigning workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning workers',
      error: error.message
    });
  }
});

// ============= GET AVAILABLE RESOURCES =============

// GET /api/requester-assignments/available/sites - Get all available sites
router.get('/available/sites', async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites WHERE is_active = TRUE ORDER BY name');

    res.json({
      success: true,
      data: sites
    });
  } catch (error) {
    console.error('❌ Error fetching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sites',
      error: error.message
    });
  }
});

// GET /api/requester-assignments/available/workers - Get all available workers
router.get('/available/workers', async (req, res) => {
  try {
    const [workers] = await pool.query(`
      SELECT id, login_id, full_name, email, role, department_id
      FROM users 
      WHERE role = 'Worker' AND is_active = TRUE
      ORDER BY full_name
    `);

    res.json({
      success: true,
      data: workers
    });
  } catch (error) {
    console.error('❌ Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

// ============= DELETE SPECIFIC ASSIGNMENT =============

// DELETE /api/requester-assignments/sites/:assignmentId - Remove specific site assignment
router.delete('/sites/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    await pool.query('DELETE FROM requester_sites WHERE id = ?', [assignmentId]);

    res.json({
      success: true,
      message: 'Site assignment removed successfully'
    });
  } catch (error) {
    console.error('❌ Error removing site assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing site assignment',
      error: error.message
    });
  }
});

// DELETE /api/requester-assignments/workers/:assignmentId - Remove specific worker assignment
router.delete('/workers/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    await pool.query('DELETE FROM requester_workers WHERE id = ?', [assignmentId]);

    res.json({
      success: true,
      message: 'Worker assignment removed successfully'
    });
  } catch (error) {
    console.error('❌ Error removing worker assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing worker assignment',
      error: error.message
    });
  }
});

module.exports = router;