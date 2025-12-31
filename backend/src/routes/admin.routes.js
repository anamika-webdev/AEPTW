// backend/src/routes/admin.routes.js - COMPLETE WITH USER CRUD
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');

router.use(authenticateToken);
router.use(authorizeAdmin);

// ============= STATS =============

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [sitesResult] = await pool.query('SELECT COUNT(*) as count FROM sites WHERE is_active = TRUE');
    const totalSites = sitesResult[0].count;

    const [workersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role LIKE '%Worker%' AND is_active = TRUE"
    );
    const totalWorkers = workersResult[0].count;

    const [supervisorsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE (role LIKE '%Supervisor%' OR role LIKE '%Requester%' OR role LIKE '%Approver%') 
       AND is_active = TRUE`
    );
    const totalSupervisors = supervisorsResult[0].count;

    const [ptwResult] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const totalPTW = ptwResult[0].count;

    const [activeResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status IN ('Active', 'Extension_Requested')");
    const activePTW = activeResult[0].count;

    const [pendingResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Initiated' OR status = 'Pending_Approval'");
    const pendingPTW = pendingResult[0].count;

    const [closedResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Closed'");
    const closedPTW = closedResult[0].count;

    res.json({
      success: true,
      data: {
        totalSites,
        totalWorkers,
        totalSupervisors,
        totalPTW,
        activePTW,
        pendingPTW,
        closedPTW
      }
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// ============= USERS CRUD =============

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, department_id, is_active } = req.query;

    let query = `
      SELECT 
        u.id,
        u.login_id,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        d.name as department_name,
        u.site_id,
        (SELECT GROUP_CONCAT(DISTINCT s2.name SEPARATOR ', ')
         FROM (
           SELECT site_id FROM requester_sites WHERE requester_user_id = u.id
           UNION
           SELECT site_id FROM site_approvers WHERE area_manager_id = u.id OR safety_officer_id = u.id OR site_leader_id = u.id
           UNION
           SELECT id as site_id FROM sites WHERE id = u.site_id
         ) as all_sites
         JOIN sites s2 ON all_sites.site_id = s2.id
        ) as site_name,
        u.job_role,
        u.phone,
        u.is_active,
        u.created_at,
        COUNT(DISTINCT p.id) as permit_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN permits p ON u.id = p.created_by_user_id
      WHERE 1=1
    `;

    const params = [];

    if (role) {
      query += ' AND u.role LIKE ?';
      params.push(`%${role}%`);
    }

    if (department_id) {
      query += ' AND u.department_id = ?';
      params.push(department_id);
    }

    if (is_active !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(is_active === 'true' || is_active === true);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const [users] = await pool.query(query, params);

    console.log('✅ Fetched users:', users.length);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.login_id,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', async (req, res) => {
  try {
    const { full_name, email, password, role, department, department_id } = req.body;

    console.log('📥 Create user request:', { full_name, email, role, department });

    // Validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR login_id = ?',
      [email, email.split('@')[0]]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate login_id from email
    let login_id = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check if login_id exists
    const [existingLoginId] = await pool.query(
      'SELECT id FROM users WHERE login_id = ?',
      [login_id]
    );

    if (existingLoginId.length > 0) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      login_id = `${login_id}_${randomSuffix}`;
    }

    // Get department_id if department name provided
    let final_department_id = department_id;
    if (!final_department_id && department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ? AND is_active = TRUE',
        [department]
      );
      if (deptResult.length > 0) {
        final_department_id = deptResult[0].id;
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (
        login_id, full_name, email, password_hash, 
        role, department_id, auth_provider, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'local', TRUE, NOW())`,
      [login_id, full_name, email, password_hash, role, final_department_id]
    );

    // Get created user
    const [newUser] = await pool.query(`
      SELECT 
        u.id,
        u.login_id,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [result.insertId]);

    console.log('✅ User created:', newUser[0].login_id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser[0]
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { full_name, email, password, role, department, department_id } = req.body;

    console.log('📥 Update user request:', { id: req.params.id, full_name, email, role });

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get department_id if department name provided
    let final_department_id = department_id;
    if (!final_department_id && department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ? AND is_active = TRUE',
        [department]
      );
      if (deptResult.length > 0) {
        final_department_id = deptResult[0].id;
      }
    }

    // Update with or without password
    if (password && password.trim() !== '') {
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users 
         SET full_name = ?, email = ?, password_hash = ?, role = ?, department_id = ?, updated_at = NOW()
         WHERE id = ?`,
        [full_name, email, password_hash, role, final_department_id, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE users 
         SET full_name = ?, email = ?, role = ?, department_id = ?, updated_at = NOW()
         WHERE id = ?`,
        [full_name, email, role, final_department_id, req.params.id]
      );
    }

    // Get updated user
    const [updated] = await pool.query(`
      SELECT 
        u.id,
        u.login_id,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.params.id]);

    console.log('✅ User updated:', updated[0].login_id);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    console.log('📥 Delete user request:', req.params.id);

    // Don't allow deleting self
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has permits
    const [permits] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ?',
      [req.params.id]
    );

    if (permits[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user - they have ${permits[0].count} existing permit(s)`
      });
    }

    // Check if user exists
    const [existing] = await pool.query('SELECT id, login_id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    console.log('✅ User deleted:', existing[0].login_id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

module.exports = router;