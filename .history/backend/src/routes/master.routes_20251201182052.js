// backend/src/routes/master.routes.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// ============= HAZARDS =============

// GET /api/master/hazards - Get all hazards
router.get('/hazards', async (req, res) => {
  try {
    const { permit_type } = req.query;
    
    console.log('📥 GET /api/master/hazards - Fetching hazards from admin database...');
    
    let query = 'SELECT * FROM master_hazards WHERE 1=1';
    const params = [];
    
    if (permit_type) {
      query += ' AND permit_type = ?';
      params.push(permit_type);
    }
    
    query += ' ORDER BY id';
    
    const [hazards] = await pool.query(query, params);
    
    console.log(`✅ Successfully fetched ${hazards.length} hazards from admin database`);
    
    res.json({
      success: true,
      count: hazards.length,
      data: hazards
    });
  } catch (error) {
    console.error('❌ Error fetching hazards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hazards from database',
      error: error.message
    });
  }
});

// POST /api/master/hazards - Create new hazard (admin only)
router.post('/hazards', async (req, res) => {
  try {
    const { hazard_name, category, permit_type, risk_level } = req.body;
    
    console.log('📥 POST /api/master/hazards - Creating new hazard:', { hazard_name, permit_type });
    
    const [result] = await pool.query(
      'INSERT INTO master_hazards (hazard_name, category, permit_type, risk_level) VALUES (?, ?, ?, ?)',
      [hazard_name, category, permit_type, risk_level]
    );
    
    console.log(`✅ Successfully created hazard with ID: ${result.insertId}`);
    
    res.json({
      success: true,
      data: { id: result.insertId, hazard_name, category, permit_type, risk_level }
    });
  } catch (error) {
    console.error('❌ Error creating hazard:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating hazard',
      error: error.message
    });
  }
});

// ============= PPE =============

// GET /api/master/ppe - Get all PPE items
router.get('/ppe', async (req, res) => {
  try {
    const { ppe_type } = req.query;
    
    console.log('📥 GET /api/master/ppe - Fetching PPE items from admin database...');
    
    let query = 'SELECT * FROM master_ppe WHERE 1=1';
    const params = [];
    
    if (ppe_type) {
      query += ' AND ppe_type = ?';
      params.push(ppe_type);
    }
    
    query += ' ORDER BY id';
    
    const [ppeItems] = await pool.query(query, params);
    
    console.log(`✅ Successfully fetched ${ppeItems.length} PPE items from admin database`);
    
    res.json({
      success: true,
      count: ppeItems.length,
      data: ppeItems
    });
  } catch (error) {
    console.error('❌ Error fetching PPE:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PPE items from database',
      error: error.message
    });
  }
});

// POST /api/master/ppe - Create new PPE item (admin only)
router.post('/ppe', async (req, res) => {
  try {
    const { ppe_name, ppe_type, description } = req.body;
    
    console.log('📥 POST /api/master/ppe - Creating new PPE item:', { ppe_name, ppe_type });
    
    const [result] = await pool.query(
      'INSERT INTO master_ppe (ppe_name, ppe_type, description) VALUES (?, ?, ?)',
      [ppe_name, ppe_type, description]
    );
    
    console.log(`✅ Successfully created PPE item with ID: ${result.insertId}`);
    
    res.json({
      success: true,
      data: { id: result.insertId, ppe_name, ppe_type, description }
    });
  } catch (error) {
    console.error('❌ Error creating PPE item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating PPE item',
      error: error.message
    });
  }
});

// ============= CHECKLIST QUESTIONS =============

// GET /api/master/checklist-questions - Get checklist questions
router.get('/checklist-questions', async (req, res) => {
  try {
    const { permit_type } = req.query;
    
    console.log('📥 GET /api/master/checklist-questions - Fetching questions from admin database...');
    
    let query = 'SELECT * FROM master_checklist_questions WHERE 1=1';
    const params = [];
    
    if (permit_type) {
      query += ' AND permit_type = ?';
      params.push(permit_type);
    }
    
    query += ' ORDER BY section_number, question_number';
    
    const [questions] = await pool.query(query, params);
    
    console.log(`✅ Successfully fetched ${questions.length} checklist questions from admin database`);
    
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('❌ Error fetching checklist questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching checklist questions from database',
      error: error.message
    });
  }
});

// POST /api/master/checklist-questions - Create new checklist question (admin only)
router.post('/checklist-questions', async (req, res) => {
  try {
    const { permit_type, section_name, section_number, question_text, question_number, response_type, is_mandatory } = req.body;
    
    console.log('📥 POST /api/master/checklist-questions - Creating new question:', { permit_type, question_text });
    
    const [result] = await pool.query(`
      INSERT INTO master_checklist_questions 
      (permit_type, section_name, section_number, question_text, question_number, response_type, is_mandatory) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [permit_type, section_name, section_number, question_text, question_number, response_type || 'radio', is_mandatory || true]);
    
    console.log(`✅ Successfully created checklist question with ID: ${result.insertId}`);
    
    res.json({
      success: true,
      data: { 
        id: result.insertId, 
        permit_type, 
        section_name, 
        question_text,
        response_type: response_type || 'radio'
      }
    });
  } catch (error) {
    console.error('❌ Error creating checklist question:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checklist question',
      error: error.message
    });
  }
});

// PUT /api/master/checklist-questions/:id - Update checklist question
router.put('/checklist-questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, section_name, section_number, question_number, response_type, is_mandatory } = req.body;
    
    console.log(`📥 PUT /api/master/checklist-questions/${id} - Updating question...`);
    
    const updates = [];
    const params = [];
    
    if (question_text !== undefined) {
      updates.push('question_text = ?');
      params.push(question_text);
    }
    if (section_name !== undefined) {
      updates.push('section_name = ?');
      params.push(section_name);
    }
    if (section_number !== undefined) {
      updates.push('section_number = ?');
      params.push(section_number);
    }
    if (question_number !== undefined) {
      updates.push('question_number = ?');
      params.push(question_number);
    }
    if (response_type !== undefined) {
      updates.push('response_type = ?');
      params.push(response_type);
    }
    if (is_mandatory !== undefined) {
      updates.push('is_mandatory = ?');
      params.push(is_mandatory);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    await pool.query(
      `UPDATE master_checklist_questions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    console.log(`✅ Successfully updated checklist question with ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Checklist question updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating checklist question:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating checklist question',
      error: error.message
    });
  }
});

// DELETE /api/master/checklist-questions/:id - Delete checklist question
router.delete('/checklist-questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 DELETE /api/master/checklist-questions/${id} - Deleting question...`);
    
    await pool.query('DELETE FROM master_checklist_questions WHERE id = ?', [id]);
    
    console.log(`✅ Successfully deleted checklist question with ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Checklist question deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting checklist question:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting checklist question',
      error: error.message
    });
  }
});

// ============= DEPARTMENTS =============

// GET /api/master/departments - Get all departments
router.get('/departments', async (req, res) => {
  try {
    console.log('📥 GET /api/master/departments - Fetching departments from admin database...');
    
    const [departments] = await pool.query('SELECT * FROM departments ORDER BY name');
    
    console.log(`✅ Successfully fetched ${departments.length} departments from admin database`);
    
    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments from database',
      error: error.message
    });
  }
});

module.exports = router;