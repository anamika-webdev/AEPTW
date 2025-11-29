const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

router.post('/login', async (req, res) => {
  try {
    const { login_id, email, password } = req.body;
    const identifier = login_id || email;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login ID and password are required'
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE login_id = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'No password set'
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id, login_id: user.login_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const { password_hash, ...userData } = user;

    res.json({
      success: true,
      data: { token, user: userData },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { login_id, full_name, email, password, role, department } = req.body;

    if (!login_id || !full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'User exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (login_id, full_name, email, password_hash, role, department, auth_provider) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [login_id, full_name, email, password_hash, role || 'Requester', department, 'local']
    );

    const [newUser] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, data: { user: newUser[0] }, message: 'Registration successful' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

module.exports = router;
