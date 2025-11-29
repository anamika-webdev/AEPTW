// src/routes/departments.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET /api/departments - List all departments
router.get('/', async (req, res) => {
  try {
    const [departments] = await pool.query('SELECT * FROM departments WHERE is_active = TRUE ORDER BY name');
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
  }
});

// POST /api/departments - Create new department (Admin only)
router.post('/', authorize('Admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    const [newDept] = await pool.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Department created successfully', data: newDept[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Department name already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create department', error: error.message });
  }
});

// PUT /api/departments/:id - Update department (Admin only)
router.put('/:id', authorize('Admin'), async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    
    await pool.query(
      'UPDATE departments SET name = ?, description = ?, is_active = ? WHERE id = ?',
      [name, description || null, is_active !== undefined ? is_active : true, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Department updated successfully', data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update department', error: error.message });
  }
});

// DELETE /api/departments/:id - Delete department (Admin only)
router.delete('/:id', authorize('Admin'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users WHERE department_id = ?', [req.params.id]);
    if (users[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete department with assigned users' });
    }

    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message });
  }
});

module.exports = router;