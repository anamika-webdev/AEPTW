// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Your database connection

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d'; // 7 days

// Debug: Log database object properties
console.log('🔍 Database object type:', typeof db);
console.log('🔍 Database object keys:', Object.keys(db));
console.log('🔍 Has getConnection:', typeof db.getConnection);
console.log('🔍 Has query:', typeof db.query);
console.log('🔍 Has execute:', typeof db.execute);
console.log('🔍 Has promise:', typeof db.promise);

// Helper function to execute queries - Universal version
const executeQuery = async (query, params) => {
  try {
    // Method 1: Connection pool with getConnection
    if (typeof db.getConnection === 'function') {
      console.log('Using getConnection method');
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query(query, params);
        return [rows];
      } finally {
        connection.release();
      }
    }
    
    // Method 2: Promise-based pool
    else if (typeof db.promise === 'function') {
      console.log('Using promise method');
      const promisePool = db.promise();
      const [rows] = await promisePool.query(query, params);
      return [rows];
    }
    
    // Method 3: Direct execute method
    else if (typeof db.execute === 'function') {
      console.log('Using execute method');
      const [rows] = await db.execute(query, params);
      return [rows];
    }
    
    // Method 4: Direct query method (promise-based)
    else if (typeof db.query === 'function') {
      console.log('Using query method');
      return new Promise((resolve, reject) => {
        db.query(query, params, (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        });
      });
    }
    
    // Method 5: Check if db itself is the pool and has query
    else if (db.constructor && db.constructor.name === 'Pool') {
      console.log('Using Pool directly');
      const [rows] = await db.query(query, params);
      return [rows];
    }
    
    else {
      console.error('❌ Database object structure:', {
        type: typeof db,
        constructor: db.constructor?.name,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(db))
      });
      throw new Error('Database connection method not found. Check console for debug info.');
    }
  } catch (error) {
    console.error('❌ Query execution error:', error);
    throw error;
  }
};

// ============================================
// POST /api/auth/register - User Registration
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
    const [existingUsers] = await executeQuery(
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
    const [result] = await executeQuery(
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
        message: 'Database schema error. Please run the SQL migration to add password_hash column.',
        hint: 'Run: ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// POST /api/auth/login - User Login
// ============================================
router.post('/login', async (req, res) => {
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
    const [users] = await executeQuery(
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
    const [users] = await executeQuery(
      'SELECT id, login_id, full_name, email, role, department, auth_provider, created_at FROM users WHERE id = ?',
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