// src/routes/auth.routes.js - IMPROVED WITH DEBUGGING
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { login_id, email, password } = req.body;

    // Debug logging
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login ID:', login_id);
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    // Validation
    if (!password || (!login_id && !email)) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Login ID/Email and password are required'
      });
    }

    // Find user by login_id or email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE (login_id = ? OR email = ?) AND is_active = TRUE',
      [login_id || email, email || login_id]
    );

    console.log('Users found in DB:', users.length);

    if (users.length === 0) {
      console.log('❌ No user found with login_id/email:', login_id || email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - User not found'
      });
    }

    const user = users[0];
    console.log('✓ User found:', user.login_id);
    console.log('✓ User role:', user.role);
    console.log('✓ Has password hash:', !!user.password_hash);

    // Check if password_hash exists
    if (!user.password_hash) {
      console.log('❌ User has no password hash set');
      return res.status(401).json({
        success: false,
        message: 'User account not properly configured. Please contact administrator.'
      });
    }

    // Verify password
    console.log('Comparing password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Wrong password'
      });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - JWT_SECRET missing'
      });
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      {
        id: user.id,
        login_id: user.login_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove sensitive data from response
    delete user.password_hash;
    delete user.google_id;

    console.log('✅ Login successful for:', user.login_id, '(', user.role, ')');
    console.log('===================\n');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===================\n');
    
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// POST /api/auth/register - Register new user (Admin only)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    // Only admin can register new users
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can register new users'
      });
    }

    const {
      login_id,
      full_name,
      email,
      password,
      role,
      department_id,
      phone
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, and role are required'
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this login ID or email already exists'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (login_id, full_name, email, password_hash, role, department_id, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [login_id, full_name, email, password_hash, role, department_id || null, phone || null]
    );

    // Get created user
    const [newUser] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department_id, phone, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ User registered successfully:', login_id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser[0]
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

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.*, d.name as department_name 
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    delete user.password_hash;
    delete user.google_id;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user information',
      error: error.message
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [new_password_hash, req.user.id]
    );

    console.log('✅ Password changed for user:', req.user.login_id);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// POST /api/auth/test-password - Test password hashing (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test-password', async (req, res) => {
    try {
      const { password, hash } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      // Generate new hash
      const newHash = await bcrypt.hash(password, 10);
      
      // If hash provided, test it
      let isValid = null;
      if (hash) {
        isValid = await bcrypt.compare(password, hash);
      }

      res.json({
        success: true,
        data: {
          password: password,
          newHash: newHash,
          providedHash: hash || null,
          hashValid: isValid
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = router;