const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all hazards
router.get('/hazards', authenticateToken, async (req, res) => {
  try {
    const [hazards] = await pool.query('SELECT * FROM master_hazards ORDER BY name');
    res.json({
      success: true,
      count: hazards.length,
      data: hazards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hazards',
      error: error.message
    });
  }
});

// Get hazard by ID
router.get('/hazards/:id', authenticateToken, async (req, res) => {
  try {
    const [hazards] = await pool.query('SELECT * FROM master_hazards WHERE id = ?', [req.params.id]);
    
    if (hazards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hazard not found'
      });
    }

    res.json({
      success: true,
      data: hazards[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hazard',
      error: error.message
    });
  }
});

// Get all PPE
router.get('/ppe', authenticateToken, async (req, res) => {
  try {
    const [ppe] = await pool.query('SELECT * FROM master_ppe ORDER BY name');
    res.json({
      success: true,
      count: ppe.length,
      data: ppe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PPE',
      error: error.message
    });
  }
});

// Get PPE by ID
router.get('/ppe/:id', authenticateToken, async (req, res) => {
  try {
    const [ppe] = await pool.query('SELECT * FROM master_ppe WHERE id = ?', [req.params.id]);
    
    if (ppe.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PPE not found'
      });
    }

    res.json({
      success: true,
      data: ppe[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PPE',
      error: error.message
    });
  }
});

// Get all checklist questions or filter by permit type
router.get('/checklist', authenticateToken, async (req, res) => {
  try {
    const { permit_type } = req.query;
    
    let query = 'SELECT * FROM master_checklist_questions';
    let params = [];
    
    if (permit_type) {
      query += ' WHERE permit_type = ?';
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
    res.status(500).json({
      success: false,
      message: 'Error fetching checklist questions',
      error: error.message
    });
  }
});

// Get checklist questions by permit type (alternative route)
router.get('/checklist/:permit_type', authenticateToken, async (req, res) => {
  try {
    const [questions] = await pool.query(
      'SELECT * FROM master_checklist_questions WHERE permit_type = ? ORDER BY id',
      [req.params.permit_type]
    );
    
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching checklist questions',
      error: error.message
    });
  }
});

module.exports = router;