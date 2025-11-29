// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication and Admin role
router.use(authenticateToken);
router.use(authorize('Admin'));

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [sitesResult] = await pool.query('SELECT COUNT(*) as count FROM sites WHERE is_active = TRUE');
    const [workersResult] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'Worker' AND is_active = TRUE");
    const [supervisorsResult] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role IN ('Approver_AreaManager', 'Approver_Safety', 'Approver_SiteLeader') AND is_active = TRUE");
    const [ptwResult] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const [activeResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Active'");
    const [pendingResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Pending_Approval'");
    const [closedResult] = await pool.query("SELECT COUNT(*) as count FROM permits WHERE status = 'Closed'");
    
    const [categoryResult] = await pool.query(`
      SELECT permit_type, COUNT(*) as count 
      FROM permits 
      GROUP BY permit_type
    `);

    res.json({
      success: true,
      data: {
        totalSites: sitesResult[0].count,
        totalWorkers: workersResult[0].count,
        totalSupervisors: supervisorsResult[0].count,
        totalPTW: ptwResult[0].count,
        activePTW: activeResult[0].count,
        pendingPTW: pendingResult[0].count,
        closedPTW: closedResult[0].count,
        ptwByCategory: categoryResult
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

module.exports = router;