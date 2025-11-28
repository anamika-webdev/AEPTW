// backend/src/routes/sites.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/sites - Get all sites
router.get('/', async (req, res) => {
  try {
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_code,
        name,
        address
      FROM sites
      ORDER BY name ASC
    `);
    
    res.json({
      success: true,
      data: sites
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sites',
      error: error.message
    });
  }
});

module.exports = router;