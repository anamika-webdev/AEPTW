// userRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, login_id, full_name, email, role, department FROM users ORDER BY full_name');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, login_id, full_name, email, role, department FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { login_id, full_name, email, role, department } = req.body;
    const [result] = await pool.query(
      'INSERT INTO users (login_id, full_name, email, role, department) VALUES (?, ?, ?, ?, ?)',
      [login_id, full_name, email, role, department]
    );
    res.status(201).json({ success: true, message: 'User created', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { full_name, email, role, department } = req.body;
    await pool.query(
      'UPDATE users SET full_name = ?, email = ?, role = ?, department = ? WHERE id = ?',
      [full_name, email, role, department, req.params.id]
    );
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;