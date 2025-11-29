@'
// backend/src/routes/auth.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// POST /api/auth/login - ACCEPTS BOTH login_id AND email
router.post('/login', async (req, res) => {
  try {
    const { login_id, email, password } = req.body;

    // Accept either login_id or email
    const identifier = login_id || email;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login ID (or email) and password are required'
      });
    }

    console.log('Login attempt with identifier:', identifier);

    // Try to find user by login_id OR email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE login_id = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      console.log('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    console.log('User found:', user.login_id, 'Role:', user.role);

    // Check if user has password_hash
    if (!user.password_hash) {
      console.log('No password_hash found for user');
      return res.status(401).json({
        success: false,
        message: 'Please use Google Sign-In for this account'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log('Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        login_id: user.login_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove sensitive data from response
    const { password_hash, ...userData } = user;

    console.log('Login successful for user:', user.login_id);

    res.json({
      success: true,
      data: {
        token,
        user: userData
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const { login_id, full_name, email, password, role, department } = req.body;

    if (!login_id || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this login ID or email already exists'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (login_id, full_name, email, password_hash, role, department, auth_provider)
       VALUES (?, ?, ?, ?, ?, ?, 'local')`,
      [login_id, full_name, email, password_hash, role || 'Requester', department]
    );

    // Fetch the created user
    const [newUser] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: {
        user: newUser[0]
      },
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Fetch fresh user data
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;
