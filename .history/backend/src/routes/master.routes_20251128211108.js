// backend/src/routes/master.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/master/hazards - Get all hazards
router.get('/hazards', async (req, res) => {
  try {
    const [hazards] = await pool.query(`
      SELECT 
        id,
        name,
        category,
        icon_url
      FROM master_hazards
      ORDER BY category, name
    `);
    
    res.json({
      success: true,
      data: hazards
    });
  } catch (error) {
    console.error('Error fetching hazards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hazards',
      error: error.message
    });
  }
});

// GET /api/master/ppe - Get all PPE items
router.get('/ppe', async (req, res) => {
  try {
    const [ppe] = await pool.query(`
      SELECT 
        id,
        name,
        icon_url
      FROM master_ppe
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: ppe
    });
  } catch (error) {
    console.error('Error fetching PPE:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PPE',
      error: error.message
    });
  }
});

// GET /api/master/checklist-questions - Get checklist questions
router.get('/checklist-questions', async (req, res) => {
  try {
    const { permit_type } = req.query;
    
    let query = 'SELECT * FROM master_checklist_questions WHERE 1=1';
    const params = [];
    
    if (permit_type) {
      query += ' AND permit_type = ?';
      params.push(permit_type);
    }
    
    query += ' ORDER BY id';
    
    const [questions] = await pool.query(query, params);
    
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching checklist questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching checklist questions',
      error: error.message
    });
  }
});

module.exports = router;