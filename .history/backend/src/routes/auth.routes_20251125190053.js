// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

// ============================================
// POST /api/auth/register - User Registration
// ============================================
router.post('/register', async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('📝 REGISTRATION REQUEST');
    console.log('========================================');
    console.log('Body:', {
      login_id: req.body.login_id,
      email: req.body.email,
      full_name: req.body.full_name,
      role: req.body.role,
      department: req.body.department
    });

    // Validate required fields
    const { login_id, full_name, email, password, role, department } = req.body;
    
    if (!login_id || !full_name || !email || !password || !role) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: login_id, full_name, email, password, role'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate role
    const validRoles = ['Requester', 'Approver_AreaManager', 'Approver_Safety', 'Admin'];
    if (!validRoles.includes(role)) {
      console.log('❌ Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    console.log('🔍 Checking if user exists...');
    
    // Check if user already exists
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
        message: `User with this ${conflictField} already exists. ${conflictField === 'email' ? 'Please use a different email or try logging in.' : 'Please choose a different login ID.'}`
      });
    }

    console.log('🔐 Hashing password...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    console.log('💾 Inserting new user into database...');

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (login_id, full_name, email, password_hash, role, department, auth_provider) 
       VALUES (?, ?, ?, ?, ?, ?, 'local')`,
      [login_id, full_name, email, password_hash, role, department || null]
    );

    const userId = result.insertId;

    console.log('✅ User created successfully!');
    console.log('   User ID:', userId);
    console.log('   Login ID:', login_id);
    console.log('   Email:', email);
    console.log('   Role:', role);

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

    console.log('🔑 JWT token generated');

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
          role,
          department: department || null
        }
      }
    });

  } catch (error) {
    console.error('\n❌ REGISTRATION ERROR:');
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// POST /api/auth/login - User Login
// ============================================
router.post('/login', async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('🔐 LOGIN REQUEST');
    console.log('========================================');
    console.log('Body:', {
      login_id: req.body.login_id,
      password: req.body.password ? '***' : 'MISSING'
    });

    const { login_id, password } = req.body;

    // Validate required fields
    if (!login_id || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Login ID and password are required'
      });
    }

    console.log('🔍 Looking up user in database...');
    console.log('   Login ID:', login_id.trim());

    // Get user from database
    let users;
    try {
      [users] = await pool.query(
        'SELECT id, login_id, full_name, email, password_hash, role, department, auth_provider FROM users WHERE login_id = ?',
        [login_id.trim()]
      );
      console.log('   Query executed successfully');
      console.log('   Found users:', users.length);
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      throw dbError;
    }

    if (users.length === 0) {
      console.log('⚠️ User not found:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid login ID or password'
      });
    }

    const user = users[0];
    console.log('✓ User found:');
    console.log('   ID:', user.id);
    console.log('   Login ID:', user.login_id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Has password:', user.password_hash ? 'YES' : 'NO');

    // Check if password exists
    if (!user.password_hash) {
      console.log('⚠️ No password hash found for user');
      return res.status(401).json({
        success: false,
        message: 'Invalid login ID or password. This account may need to be re-created.'
      });
    }

    console.log('🔐 Verifying password...');

    // Verify password
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('   Password verification result:', isPasswordValid);
    } catch (bcryptError) {
      console.error('❌ Bcrypt comparison error:', bcryptError);
      throw bcryptError;
    }

    if (!isPasswordValid) {
      console.log('⚠️ Invalid password for user:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid login ID or password'
      });
    }

    console.log('✅ Login successful!');
    console.log('   User ID:', user.id);
    console.log('   Login ID:', user.login_id);
    console.log('   Role:', user.role);

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

    console.log('🔑 JWT token generated');

    // Update last login
    try {
      await pool.query(
        'UPDATE users SET updated_at = NOW() WHERE id = ?',
        [user.id]
      );
      console.log('✓ Updated last login timestamp');
    } catch (updateError) {
      console.error('⚠️ Failed to update last login:', updateError);
      // Don't fail the login if we can't update the timestamp
    }

    // Return success response
    const response = {
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
    };

    console.log('📤 Sending response...');
    res.json(response);

  } catch (error) {
    console.error('\n❌ LOGIN ERROR:');
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Login failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// GET /api/auth/me - Get Current User
// ============================================
router.get('/me', async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('👤 GET CURRENT USER');
    console.log('========================================');

    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    console.log('🔍 Verifying token...');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✓ Token valid for user ID:', decoded.userId);

    // Get user from database
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, role, department, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      console.log('⚠️ User not found for ID:', decoded.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', users[0].login_id);

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('\n❌ GET USER ERROR:', error.message);
    
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
// POST /api/auth/logout - User Logout
// ============================================
router.post('/logout', async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('🚪 LOGOUT REQUEST');
    console.log('========================================');
    
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