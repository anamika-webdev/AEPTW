// backend/src/routes/auth.routes.js - FIXED TO ALLOW ADMIN REGISTRATION
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

    // FIXED: Include Admin and Administrator in valid roles
    const validRoles = [
      'Admin',
      'Administrator', 
      'Requester', 
      'Worker', 
      'Approver_AreaManager', 
      'Approver_Safety', 
      'Approver_SiteLeader',
      'Supervisor'
    ];
    
    const userRole = role && validRoles.includes(role) ? role : 'Requester';
    
    console.log('Role validation:', {
      requestedRole: role,
      isValid: validRoles.includes(role),
      finalRole: userRole
    });

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
    console.log('Creating user account with role:', userRole);
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

    console.log('✅ User registered successfully:', {
      login_id: newUser[0].login_id,
      role: newUser[0].role
    });

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login ID:', login_id);

    // Validation
    if (!login_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login ID and password are required'
      });
    }

    // Find user by login_id
    const [users] = await pool.query(
      'SELECT * FROM users WHERE login_id = ? AND is_active = TRUE',
      [login_id]
    );

    if (users.length === 0) {
      console.log('❌ User not found:', login_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', login_id);
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

    console.log('✅ Login successful:', {
      login_id: user.login_id,
      role: user.role
    });

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
          department: user.department_id
        }
      }
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
});

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
              u.department_id, d.name as department_name, u.created_at
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

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // In a more advanced implementation, you might want to blacklist the token
  console.log('User logged out:', req.user.login_id);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;