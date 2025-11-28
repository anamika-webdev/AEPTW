// backend/src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/users/workers - Get all workers (Requester role)
router.get('/workers', async (req, res) => {
  try {
    const [workers] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        role,
        department,
        created_at
      FROM users
      WHERE role = 'Requester'
      ORDER BY full_name ASC
    `);
    
    res.json({
      success: true,
      data: workers
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

module.exports = router;