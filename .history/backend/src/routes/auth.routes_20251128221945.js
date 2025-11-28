// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;

    console.log('Login attempt for:', login_id);

    if (!login_id || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Login ID and password are required' 
      });
    }

    // Get user from database
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department FROM users WHERE login_id = ?',
      [login_id]
    );

    if (users.length === 0) {
      console.log('User not found:', login_id);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];
    console.log('User found:', user.login_id, 'Role:', user.role);

    // For demo: accept any password
    // In production, verify with bcrypt:
    // const isValidPassword = await bcrypt.compare(password, user.password_hash);
    // if (!isValidPassword) {
    //   return res.status(401).json({ success: false, message: 'Invalid credentials' });
    // }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        login_id: user.login_id,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('Login successful for:', user.login_id);

    // Return response in the format frontend expects
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          login_id: user.login_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: error.message 
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { login_id, full_name, email, password, role, department } = req.body;

    console.log('Registration attempt:', { login_id, email, role });

    if (!login_id || !full_name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Hash password (for production)
    // const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (login_id, full_name, email, role, department) VALUES (?, ?, ?, ?, ?)',
      [login_id, full_name, email, role || 'Requester', department]
    );

    console.log('User registered successfully:', login_id);

    // Return response in the format frontend expects
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.insertId,
          login_id,
          full_name,
          email,
          role: role || 'Requester',
          department
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_in_production');
    
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
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
    res.status(403).json({ 
      success: false,
      message: 'Invalid token',
      error: error.message 
    });
  }
});

module.exports = router;