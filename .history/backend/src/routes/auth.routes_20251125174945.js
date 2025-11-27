// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database'); // ✅ Import pool correctly

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

// ============================================
// POST /api/v1/auth/register - User Registration
// ============================================
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', {
      login_id: req.body.login_id,
      email: req.body.email,
      role: req.body.role
    });

    // Validate required fields
    const { login_id, full_name, email, password, role } = req.body;
    
    if (!login_id || !full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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

    // Validate role
    const validRoles = ['Requester', 'Approver_AreaManager', 'Approver_Safety', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    console.log('🔍 Checking if user exists...');
    
    // Check if user already exists (use mysql2/promise with array destructuring)
    const [existingUsers] = await pool.query(
      'SELECT id, login_id, email FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      const conflictField = existingUser.login_id === login_id ? 'login_id' : 'email';
      
      console.log(`⚠️ User already exists with ${conflictField}:`, existingUser[conflictField]);
      
      return res.status(409).json({
        success: false,
        message: `User with this ${conflictField} already exists`
      });
    }

    console.log('🔐 Hashing password...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    console.log('💾 Inserting new user...');

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (login_id, full_name, email, password_hash, role, auth_provider) 
       VALUES (?, ?, ?, ?, ?, 'local')`,
      [login_id, full_name, email, password_hash, role]
    );

    const userId = result.insertId;

    console.log('✅ User created successfully:', { userId, login_id, email, role });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId, 
        login_id, 
        role,
        email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: userId,
          login_id,
          full_name,
          email,
          role
        }
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// POST /api/v1/auth/login - User Login
// ============================================
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request received:', {
      login_id: req.body.login_id
    });

    const { login_id, password } = req.body;

    // Validate required fields
    if (!login_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login ID and password are required'
      });
    }

    console.log('🔍 Looking up user...');

    // Get user from database
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, password_hash, role, auth_provider FROM users WHERE login_id = ?',
      [login_id]
    );

    if (users.length === 0) {
      console.log('⚠️ User not found:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    const user = users[0];

    // Check if user uses Google SSO
    if (user.auth_provider === 'google' && !user.password_hash) {
      console.log('⚠️ Google SSO user attempting password login:', login_id);
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please use "Sign in with Google"'
      });
    }

    console.log('🔐 Verifying password...');

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('⚠️ Invalid password for user:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    console.log('✅ Login successful:', { userId: user.id, login_id: user.login_id, role: user.role });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        login_id: user.login_id, 
        role: user.role,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Return success response
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
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// GET /api/v1/auth/me - Get Current User
// ============================================
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department, created_at FROM users WHERE id = ?',
      [decoded.userId]
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
    console.error('❌ Get user error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// ============================================
// POST /api/v1/auth/logout - User Logout
// ============================================
router.post('/logout', async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from storage
    
    // Optionally, you can blacklist the token here if you implement token blacklisting
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;