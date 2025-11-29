// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const passport = require('../config/passport');

// ==================== REGISTER NEW USER ====================
router.post('/register', async (req, res) => {
  try {
    const { login_id, full_name, email, password, role, department } = req.body;

    // Validate required fields
    if (!login_id || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
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

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Approver_Safety', 'Approver_AreaManager', 'Requester'];
    const userRole = role || 'Requester'; // Default to Requester
    
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this login ID or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (
        login_id, full_name, email, password_hash, role, department, 
        auth_provider, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'local', NOW(), NOW())`,
      [login_id, full_name, email, password_hash, userRole, department || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertId, 
        role: userRole,
        authProvider: 'local'
      },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log(`New user registered: ${email} (${userRole})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: result.insertId,
        login_id,
        full_name,
        email,
        role: userRole,
        department: department || null,
        auth_provider: 'local'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== LOCAL LOGIN (Email/Password) ====================
router.post('/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;

    // Validate input
    if (!login_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login ID and password are required'
      });
    }

    // Get user from database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE login_id = ? AND auth_provider = ?',
      [login_id, 'local']
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if user has password_hash
    if (!user.password_hash) {
      // For backward compatibility: if no password_hash, allow any password
      console.warn(`User ${login_id} has no password hash - allowing login (DEV MODE)`);
    } else {
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        authProvider: 'local'
      },
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Log successful login
    console.log(`Local login successful: ${user.email} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
        auth_provider: 'local'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== GOOGLE OAuth ROUTES ====================

// Initiate Google OAuth flow
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login?error=auth_failed',
    session: false 
  }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          authProvider: 'google'
        },
        process.env.JWT_SECRET || 'default_secret_change_in_production',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Log successful OAuth login
      console.log(`Google OAuth login successful: ${user.email} (${user.role})`);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        login_id: user.login_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        auth_provider: 'google'
      }))}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
);

// ==================== TOKEN VERIFICATION ====================
router.get('/verify', async (req, res) => {
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
      'SELECT id, login_id, full_name, email, role, department, auth_provider FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    console.log('User logged out');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;