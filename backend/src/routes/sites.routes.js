// backend/src/routes/sites.routes.js - UPDATED WITH REQUESTER FILTERING
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/sites - Get sites (filtered by requester if applicable)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const assignedOnly = req.query.assignedOnly === 'true';
    const isAdmin = !assignedOnly && (userRole.includes('admin') || userRole.includes('administrator'));
    const isRequester = userRole.includes('supervisor') || userRole.includes('requester') || assignedOnly;

    console.log('📥 GET /api/sites - User:', userId, 'Role:', userRole, 'isAdmin:', isAdmin, 'isRequester:', isRequester, 'assignedOnly:', assignedOnly);

    let query;
    let params;

    // Admin sees all sites with permit counts
    if (isAdmin) {
      query = `
        SELECT s.*, 
               COUNT(p.id) as permit_count
        FROM sites s
        LEFT JOIN permits p ON s.id = p.site_id
        WHERE s.is_active = TRUE
        GROUP BY s.id
        ORDER BY s.name
      `;
      params = [];
    }
    // Requesters/Supervisors/Approvers see only their assigned sites
    else if (isRequester) {
      query = `
        SELECT s.*, 
               COUNT(DISTINCT p.id) as permit_count
        FROM sites s
        LEFT JOIN permits p ON s.id = p.site_id
        WHERE s.is_active = TRUE AND s.id IN (
          SELECT site_id FROM requester_sites WHERE requester_user_id = ?
          UNION
          SELECT site_id FROM site_approvers 
          WHERE area_manager_id = ? OR safety_officer_id = ? OR site_leader_id = ?
        )
        GROUP BY s.id
        ORDER BY s.name
      `;
      params = [userId, userId, userId, userId];
    }
    // Other roles see all sites with permit counts
    else {
      query = `
        SELECT s.*, 
               COUNT(DISTINCT p.id) as permit_count
        FROM sites s
        LEFT JOIN permits p ON s.id = p.site_id
        WHERE s.is_active = TRUE
        GROUP BY s.id
        ORDER BY s.name
      `;
      params = [];
    }

    const [sites] = await pool.query(query, params);

    console.log(`✅ Fetched ${sites.length} sites for user ${userId}`);

    res.json({
      success: true,
      count: sites.length,
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

// GET /api/sites/:id - Get site by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isAdmin = userRole.includes('admin') || userRole.includes('administrator');
    const isRequester = userRole.includes('supervisor') || userRole.includes('requester');

    let query;
    let params;

    // Admin can view any site
    if (isAdmin) {
      query = 'SELECT * FROM sites WHERE id = ?';
      params = [id];
    }
    // Requesters can only view their assigned sites
    else if (isRequester) {
      query = `
        SELECT s.* 
        FROM sites s
        INNER JOIN requester_sites rs ON s.id = rs.site_id
        WHERE s.id = ? AND rs.requester_user_id = ?
      `;
      params = [id, userId];
    }
    // Others can view any site
    else {
      query = 'SELECT * FROM sites WHERE id = ?';
      params = [id];
    }

    const [sites] = await pool.query(query, params);

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found or you do not have access to this site'
      });
    }

    res.json({
      success: true,
      data: sites[0]
    });
  } catch (error) {
    console.error('❌ Error fetching site:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching site',
      error: error.message
    });
  }
});

// POST /api/sites - Create site (Admin only)
router.post('/', authorizeAdmin, async (req, res) => {
  try {
    const { site_code, name, location, address, city, state, country } = req.body;

    console.log('📥 POST /api/sites - Creating new site:', { site_code, name });

    if (!site_code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Site code and name are required'
      });
    }

    // Check if site_code already exists
    const [existing] = await pool.query(
      'SELECT id FROM sites WHERE site_code = ?',
      [site_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Site code '${site_code}' already exists`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO sites (site_code, name, location, address, city, state, country, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [
        site_code,
        name,
        location || null,
        address || null,
        city || null,
        state || null,
        country || 'India'
      ]
    );

    const [newSite] = await pool.query('SELECT * FROM sites WHERE id = ?', [result.insertId]);

    console.log('✅ Site created:', newSite[0]);

    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      data: newSite[0]
    });
  } catch (error) {
    console.error('❌ Create site error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Site code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create site',
      error: error.message
    });
  }
});

// PUT /api/sites/:id - Update site (Admin only)
router.put('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { name, location, address, city, state, country, is_active } = req.body;

    console.log('📥 Update site request:', { id: req.params.id, name, location });

    // Check if site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    await pool.query(
      `UPDATE sites 
       SET name = ?, 
           location = ?, 
           address = ?, 
           city = ?, 
           state = ?, 
           country = ?, 
           is_active = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        location || null,
        address || null,
        city || null,
        state || null,
        country || 'India',
        is_active !== undefined ? is_active : true,
        req.params.id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);

    console.log('✅ Site updated:', updated[0]);

    res.json({
      success: true,
      message: 'Site updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Update site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site',
      error: error.message
    });
  }
});

// DELETE /api/sites/:id - Delete site (Admin only)
router.delete('/:id', authorizeAdmin, async (req, res) => {
  try {
    console.log('📥 Delete site request:', req.params.id);

    // Check if site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if site has any permits
    const [permits] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE site_id = ?',
      [req.params.id]
    );

    if (permits[0].count > 0) {
      console.log(`⚠️ Cannot delete site ${req.params.id} - has ${permits[0].count} permit(s)`);
      return res.status(400).json({
        success: false,
        message: `Cannot delete site with ${permits[0].count} existing permit(s). Please close or cancel all permits first.`
      });
    }

    // Soft delete (set is_active = FALSE)
    await pool.query('UPDATE sites SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [req.params.id]);

    console.log('✅ Site deleted (soft delete)');

    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete site',
      error: error.message
    });
  }
});

module.exports = router;