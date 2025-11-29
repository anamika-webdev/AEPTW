// backend/src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/supervisor/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = {
      total_permits: 0,
      initiated_permits: 0,
      approved_permits: 0,
      in_progress_permits: 0,
      closed_permits: 0,
      total_workers: 0
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Supervisor stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats', data: { total_permits: 0, initiated_permits: 0, approved_permits: 0, in_progress_permits: 0, closed_permits: 0, total_workers: 0 } });
  }
});

module.exports = router;