// src/routes/auth.routes.js - COMPLETE WITH SELF-REGISTRATION
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// POST /api/auth/register - PUBLIC USER REGISTRATION (Self Sign-up)
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      full_name,
      password,
      role,
      department
    } = req.body;

    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Email:', email);
    console.log('Full name:', full_name);
    console.log('Role:', role);
    console.log('Department:', department);

    // Validation
    if (!email || !full_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter'
      });
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter'
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number'
      });
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one special character (@$!%*?&)'
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please use a different email or try logging in.'
      });
    }

    // Generate login_id from email (part before @)
    const login_id = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check if login_id already exists
    const [existingLoginId] = await pool.query(
      'SELECT id FROM users WHERE login_id = ?',
      [login_id]
    );

    let finalLoginId = login_id;
    if (existingLoginId.length > 0) {
      // Append random number to make it unique
      const randomSuffix = Math.floor(Math.random() * 10000);
      finalLoginId = `${login_id}_${randomSuffix}`;
    }

    console.log('Generated login_id:', finalLoginId);

    // Default role if not provided or invalid
    const validRoles = ['Requester', 'Worker', 'Approver_AreaManager', 'Approver_Safety', 'Approver_SiteLeader'];
    const userRole = role && validRoles.includes(role) ? role : 'Requester';

    // Get department_id if department name is provided
    let department_id = null;
    if (department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ? AND is_active = TRUE',
        [department]
      );
      
      if (deptResult.length > 0) {
        department_id = deptResult[0].id;
      }
    }

    // Hash password
    console.log('Hashing password...');
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    console.log('Creating user account...');
    const [result] = await pool.query(
      `INSERT INTO users (
        login_id, full_name, email, password_hash, 
        role, department_id, auth_provider, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 'local', TRUE)`,
      [finalLoginId, full_name, email, password_hash, userRole, department_id]
    );

    // Get created user
    const [newUser] = await pool.query(
      `SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
              u.department_id, d.name as department_name, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    console.log('✅ User registered successfully:', newUser[0].login_id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: newUser[0]
      }
    });
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { login_id, email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login ID:', login_id);
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    // Validation
    if (!password || (!login_id && !email)) {
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
      console.log('❌ No user found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    console.log('✓ User found:', user.login_id);
    console.log('✓ User role:', user.role);
    console.log('✓ Has password hash:', !!user.password_hash);

    // Check if password_hash exists
    if (!user.password_hash) {
      console.log('❌ User has no password hash');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
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
        message: 'Invalid credentials'
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

    // Remove sensitive data
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
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Login failed',
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

    // Validate new password strength
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
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
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
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

// GET /api/auth/check-email - Check if email is available
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    res.json({
      success: true,
      data: {
        available: users.length === 0,
        email: email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability'
    });
  }
});

module.exports = router;