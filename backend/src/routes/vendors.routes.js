// backend/src/routes/vendors.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/vendors - Get all vendors
router.get('/', async (req, res) => {
  try {
    const [vendors] = await pool.query(`
      SELECT 
        id,
        company_name,
        contact_person,
        contact_email,
        contact_phone,
        license_number,
        created_at
      FROM vendors
      ORDER BY company_name ASC
    `);
    
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors',
      error: error.message
    });
  }
});

module.exports = router;