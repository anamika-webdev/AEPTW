const pool = require('../config/database');

// ==================== PPE ====================

// @desc    Get all PPE
// @route   GET /api/v1/master/ppe
// @access  Private
const getAllPPE = async (req, res, next) => {
  try {
    const [ppe] = await pool.query('SELECT * FROM master_ppe ORDER BY name');

    res.status(200).json({
      success: true,
      data: { ppe }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create PPE
// @route   POST /api/v1/master/ppe
// @access  Private (Admin)
const createPPE = async (req, res, next) => {
  try {
    const { name, icon_url } = req.body;

    const [result] = await pool.query(
      'INSERT INTO master_ppe (name, icon_url) VALUES (?, ?)',
      [name, icon_url]
    );

    res.status(201).json({
      success: true,
      message: 'PPE created successfully',
      data: {
        id: result.insertId,
        name,
        icon_url
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update PPE
// @route   PUT /api/v1/master/ppe/:id
// @access  Private (Admin)
const updatePPE = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon_url } = req.body;

    const [result] = await pool.query(
      'UPDATE master_ppe SET name = ?, icon_url = ? WHERE id = ?',
      [name, icon_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'PPE not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'PPE updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete PPE
// @route   DELETE /api/v1/master/ppe/:id
// @access  Private (Admin)
const deletePPE = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM master_ppe WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'PPE not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'PPE deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HAZARDS ====================

// @desc    Get all hazards
// @route   GET /api/v1/master/hazards
// @access  Private
const getAllHazards = async (req, res, next) => {
  try {
    const [hazards] = await pool.query('SELECT * FROM master_hazards ORDER BY name');

    res.status(200).json({
      success: true,
      data: { hazards }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create hazard
// @route   POST /api/v1/master/hazards
// @access  Private (Admin)
const createHazard = async (req, res, next) => {
  try {
    const { name, category, icon_url } = req.body;

    const [result] = await pool.query(
      'INSERT INTO master_hazards (name, category, icon_url) VALUES (?, ?, ?)',
      [name, category, icon_url]
    );

    res.status(201).json({
      success: true,
      message: 'Hazard created successfully',
      data: {
        id: result.insertId,
        name,
        category,
        icon_url
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hazard
// @route   PUT /api/v1/master/hazards/:id
// @access  Private (Admin)
const updateHazard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, icon_url } = req.body;

    const [result] = await pool.query(
      'UPDATE master_hazards SET name = ?, category = ?, icon_url = ? WHERE id = ?',
      [name, category, icon_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hazard not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hazard updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hazard
// @route   DELETE /api/v1/master/hazards/:id
// @access  Private (Admin)
const deleteHazard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM master_hazards WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hazard not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hazard deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CHECKLIST QUESTIONS ====================

// @desc    Get checklist questions by permit type
// @route   GET /api/v1/master/checklist-questions
// @access  Private
const getChecklistQuestions = async (req, res, next) => {
  try {
    const { permit_type } = req.query;

    let query = 'SELECT * FROM master_checklist_questions';
    const params = [];

    if (permit_type) {
      query += ' WHERE permit_type = ?';
      params.push(permit_type);
    }

    query += ' ORDER BY id';

    const [questions] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: { questions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create checklist question
// @route   POST /api/v1/master/checklist-questions
// @access  Private (Admin)
const createChecklistQuestion = async (req, res, next) => {
  try {
    const { permit_type, question_text, is_mandatory } = req.body;

    const [result] = await pool.query(
      'INSERT INTO master_checklist_questions (permit_type, question_text, is_mandatory) VALUES (?, ?, ?)',
      [permit_type, question_text, is_mandatory]
    );

    res.status(201).json({
      success: true,
      message: 'Checklist question created successfully',
      data: {
        id: result.insertId,
        permit_type,
        question_text,
        is_mandatory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update checklist question
// @route   PUT /api/v1/master/checklist-questions/:id
// @access  Private (Admin)
const updateChecklistQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permit_type, question_text, is_mandatory } = req.body;

    const [result] = await pool.query(
      'UPDATE master_checklist_questions SET permit_type = ?, question_text = ?, is_mandatory = ? WHERE id = ?',
      [permit_type, question_text, is_mandatory, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Checklist question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Checklist question updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete checklist question
// @route   DELETE /api/v1/master/checklist-questions/:id
// @access  Private (Admin)
const deleteChecklistQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM master_checklist_questions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Checklist question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Checklist question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // PPE
  getAllPPE,
  createPPE,
  updatePPE,
  deletePPE,
  // Hazards
  getAllHazards,
  createHazard,
  updateHazard,
  deleteHazard,
  // Checklist Questions
  getChecklistQuestions,
  createChecklistQuestion,
  updateChecklistQuestion,
  deleteChecklistQuestion
};