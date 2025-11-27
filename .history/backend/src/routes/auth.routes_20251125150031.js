// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Your database connection

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d'; // 7 days

// ============================================
// POST /api/auth/register - User Registration
// ============================================
router.post('/register', async (req, res) => {
  const connection = await db.getConnection();
  
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
        message: 'Missing required fields. Please provide login_id, full_name, email, password, and role.'
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

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT id, login_id, email FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      const conflictField = existingUser.login_id === login_id ? 'login ID' : 'email';
      
      console.log('❌ User already exists:', { conflictField, value: existingUser[conflictField] });
      
      return res.status(409).json({
        success: false,
        message: `User with this ${conflictField} already exists`
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Insert new user
    const department = req.body.department || null;
    
    console.log('💾 Inserting user into database...');
    const [result] = await connection.query(
      `INSERT INTO users 
       (login_id, full_name, email, password_hash, role, department, auth_provider, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'local', NOW())`,
      [login_id, full_name, email, password_hash, role, department]
    );

    const userId = result.insertId;
    console.log('✅ User created successfully with ID:', userId);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        login_id: login_id,
        email: email,
        role: role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return user data (without password)
    const newUser = {
      id: userId,
      login_id,
      full_name,
      email,
      role,
      department,
      auth_provider: 'local',
      created_at: new Date().toISOString()
    };

    console.log('✅ Registration completed successfully');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Check for specific MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'User with this login ID or email already exists'
      });
    }
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        success: false,
        message: 'Database table not found. Please run database migrations.'
      });
    }

    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Database schema error. Please run: add_auth_columns.sql migration'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

// ============================================
// POST /api/auth/login - User Login
// ============================================
router.post('/login', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔐 Login request received:', {
      login_id: req.body.login_id
    });

    const { login_id, password } = req.body;

    // Validate input
    if (!login_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both login ID and password'
      });
    }

    // Find user
    const [users] = await connection.query(
      'SELECT * FROM users WHERE login_id = ?',
      [login_id]
    );

    if (users.length === 0) {
      console.log('❌ User not found:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    const user = users[0];

    // Check if user has password (local auth)
    if (!user.password_hash) {
      console.log('❌ User has no password (SSO user):', login_id);
      return res.status(401).json({
        success: false,
        message: 'This account uses SSO login. Please use SSO to sign in.'
      });
    }

    // Verify password
    console.log('🔐 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        login_id: user.login_id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;

    console.log('✅ Login successful for user:', login_id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

// ============================================
// GET /api/auth/verify - Verify JWT Token
// ============================================
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data
    const connection = await db.getConnection();
    const [users] = await connection.query(
      'SELECT id, login_id, full_name, email, role, department, auth_provider, created_at FROM users WHERE id = ?',
      [decoded.id]
    );
    connection.release();

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
      message: 'Token verification failed'
    });
  }
});

// ============================================
// POST /api/auth/logout - Logout
// ============================================
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============================================
// Health Check
// ============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;