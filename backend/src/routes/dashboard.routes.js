// backend/src/routes/dashboard.routes.js - UPDATED with supervisor stats
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/supervisor/stats - Get supervisor dashboard statistics
router.get('/supervisor/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Total permits created by this supervisor
    const [totalPermits] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ?',
      [userId]
    );

    // Initiated permits (Draft status)
    const [initiatedPermits] = await pool.query(
      "SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ? AND status = 'Draft'",
      [userId]
    );

    // Approved permits
    const [approvedPermits] = await pool.query(
      "SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ? AND status = 'Active'",
      [userId]
    );

    // In progress permits
    const [inProgressPermits] = await pool.query(
      "SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ? AND status IN ('Active', 'Extension_Requested')",
      [userId]
    );

    // Closed permits
    const [closedPermits] = await pool.query(
      "SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ? AND status = 'Closed'",
      [userId]
    );

    // Total workers assigned to this supervisor in requester_workers
    const [totalWorkers] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM requester_workers
      WHERE requester_user_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: {
        total_permits: totalPermits[0].count,
        initiated_permits: initiatedPermits[0].count,
        approved_permits: approvedPermits[0].count,
        in_progress_permits: inProgressPermits[0].count,
        closed_permits: closedPermits[0].count,
        total_workers: totalWorkers[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supervisor statistics',
      error: error.message
    });
  }
});

// GET /api/dashboard/stats - General dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total stats
    const [totalPermits] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const [totalSites] = await pool.query('SELECT COUNT(*) as count FROM sites');
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');

    // Role-based stats
    const [supervisors] = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE (role LIKE '%Supervisor%' OR role LIKE '%Requester%' OR role LIKE '%Approver%') 
      AND is_active = TRUE
    `);

    const [workers] = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE role LIKE '%Worker%' 
      AND is_active = TRUE
    `);

    // Task/Permit status
    const [active] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status IN ('Active', 'Extension_Requested', 'Pending_Approval')");
    const [completed] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Closed'");

    res.json({
      success: true,
      data: {
        totalPermits: totalPermits[0].count,
        totalSites: totalSites[0].count,
        totalUsers: totalUsers[0].count,
        totalSupervisors: supervisors[0].count,
        totalWorkers: workers[0].count,
        activeTasks: active[0].count,
        completedTasks: completed[0].count,
        totalTasks: totalPermits[0].count,
        activePermits: active[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;