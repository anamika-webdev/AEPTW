// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication and Admin role
router.use(authenticateToken);

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', authorize('Admin'), async (req, res) => {
  try {
    // Get total sites
    const [sitesResult] = await pool.query('SELECT COUNT(*) as count FROM sites WHERE is_active = TRUE');
    const totalSites = sitesResult[0].count;

    // Get total workers
    const [workersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Worker' AND is_active = TRUE"
    );
    const totalWorkers = workersResult[0].count;

    // Get total supervisors (all approver types + requesters)
    const [supervisorsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE role IN ('Approver_AreaManager', 'Approver_Safety', 'Approver_SiteLeader', 'Requester') 
       AND is_active = TRUE`
    );
    const totalSupervisors = supervisorsResult[0].count;

    // Get total PTW issued
    const [ptwResult] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const totalPTW = ptwResult[0].count;

    // Get active PTW
    const [activeResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Active'");
    const activePTW = activeResult[0].count;

    // Get pending PTW
    const [pendingResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Pending_Approval'");
    const pendingPTW = pendingResult[0].count;

    // Get closed PTW
    const [closedResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Closed'");
    const closedPTW = closedResult[0].count;

    // Get PTW by category
    const [categoryResult] = await pool.query(`
      SELECT permit_type, COUNT(*) as count 
      FROM permits 
      GROUP BY permit_type
    `);

    // Calculate percentages for category data
    const categoryData = categoryResult.map(row => ({
      name: row.permit_type,
      value: row.count,
      percentage: totalPTW > 0 ? ((row.count / totalPTW) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        totalSites,
        totalWorkers,
        totalSupervisors,
        totalPTW,
        activePTW,
        pendingPTW,
        closedPTW,
        ptwByCategory: categoryData
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// GET /api/admin/users - Get all users (Admin only)
router.get('/users', authorize('Admin'), async (req, res) => {
  try {
    const { role, department_id, is_active } = req.query;

    let query = `
      SELECT u.*, d.name as department_name 
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (department_id) {
      query += ' AND u.department_id = ?';
      params.push(department_id);
    }

    if (is_active !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY u.full_name';

    const [users] = await pool.query(query, params);

    // Remove sensitive data
    users.forEach(user => {
      delete user.password_hash;
      delete user.google_id;
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// GET /api/admin/recent-activity - Get recent PTW activity
router.get('/recent-activity', authorize('Admin'), async (req, res) => {
  try {
    const [activity] = await pool.query(`
      SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.status,
        p.work_location,
        p.created_at,
        u.full_name as created_by,
        s.name as site_name
      FROM permits p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN sites s ON p.site_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

// GET /api/admin/permits - Get all permits (Admin only)
router.get('/permits', authorize('Admin'), async (req, res) => {
  try {
    const { status, site_id, permit_type } = req.query;

    let query = `
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        u.full_name as created_by_name,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (site_id) {
      query += ' AND p.site_id = ?';
      params.push(site_id);
    }

    if (permit_type) {
      query += ' AND p.permit_type = ?';
      params.push(permit_type);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [permits] = await pool.query(query, params);

    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    console.error('Get permits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permits',
      error: error.message
    });
  }
});

module.exports = router;