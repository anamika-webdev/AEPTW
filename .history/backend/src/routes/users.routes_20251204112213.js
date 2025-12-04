// backend/src/routes/users.routes.js - UPDATED WITH REQUESTER FILTERING
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (!req.user || (req.user.role?.toLowerCase() !== 'admin' && req.user.role?.toLowerCase() !== 'administrator')) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
  }
  next();
};

// All routes require authentication
router.use(authenticateToken);

// GET /api/users - Get all users (Admin only)
router.get('/', authorizeAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = `
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.created_at, u.is_active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const [users] = await pool.query(query, params);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET /api/users/workers - Get workers (filtered by requester if applicable)
router.get('/workers', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase();
    
    console.log('📥 GET /api/users/workers - User:', userId, 'Role:', userRole);
    
    let query;
    let params;
    
    // Admin sees all workers
    if (userRole === 'admin' || userRole === 'administrator') {
      query = `
        SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
               u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.role = 'Worker' AND u.is_active = TRUE
        ORDER BY u.full_name
      `;
      params = [];
    }
    // Requesters/Supervisors see only their assigned workers
    else if (userRole === 'requester' || userRole === 'supervisor') {
      query = `
        SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
               u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        INNER JOIN requester_workers rw ON u.id = rw.worker_user_id
        WHERE u.role = 'Worker' AND u.is_active = TRUE AND rw.requester_user_id = ?
        ORDER BY u.full_name
      `;
      params = [userId];
    }
    // Other roles see all workers (or you can restrict further)
    else {
      query = `
        SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
               u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.role = 'Worker' AND u.is_active = TRUE
        ORDER BY u.full_name
      `;
      params = [];
    }
    
    const [workers] = await pool.query(query, params);
    
    console.log(`✅ Fetched ${workers.length} workers for user ${userId}`);
    
    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    console.error('❌ Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.created_at, u.is_active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// POST /api/users - Create user (Admin only)
router.post('/', authorizeAdmin, async (req, res) => {
  try {
    const { login_id, full_name, email, password, role, department } = req.body;
    
    console.log('📥 POST /api/users - Creating user:', { login_id, role });
    
    // Validation
    if (!login_id || !full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if login_id or email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Login ID or email already exists'
      });
    }
    
    // Get department_id
    let department_id = null;
    if (department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ?',
        [department]
      );
      if (deptResult.length > 0) {
        department_id = deptResult[0].id;
      }
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (login_id, full_name, email, password_hash, role, department_id, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [login_id, full_name, email, password_hash, role, department_id]
    );
    
    const [newUser] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [result.insertId]);
    
    console.log('✅ User created:', newUser[0]);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser[0]
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, password, role, department, is_active } = req.body;
    
    console.log('📥 PUT /api/users/:id - Updating user:', id);
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get department_id
    let department_id = null;
    if (department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ?',
        [department]
      );
      if (deptResult.length > 0) {
        department_id = deptResult[0].id;
      }
    }
    
    // Build update query
    let updateFields = [];
    let params = [];
    
    if (full_name) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }
    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      params.push(password_hash);
    }
    if (role) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (department_id !== null) {
      updateFields.push('department_id = ?');
      params.push(department_id);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(id);
    
    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    const [updated] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [id]);
    
    console.log('✅ User updated:', updated[0]);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📥 DELETE /api/users/:id - Deleting user:', id);
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Soft delete (set is_active = FALSE)
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
    
    console.log('✅ User deleted (soft delete)');
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// GET /api/users/approvers - Get all active approvers
router.get('/approvers', authenticate, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT 
        id, 
        login_id, 
        full_name, 
        email, 
        role,
        department_name
       FROM users 
       WHERE role IN ('Approver_AreaManager', 'Approver_Safety', 'Approver_SiteLeader') 
         AND is_active = TRUE
       ORDER BY role, full_name`
    );
    
    res.json({
      success: true,
      count: approvers.length,
      data: approvers
    });
    
  } catch (error) {
    console.error('Error fetching approvers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approvers',
      error: error.message
    });
  }
});

// GET /api/users/approvers/area-managers - Get area managers
router.get('/approvers/area-managers', authenticate, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT id, login_id, full_name, email, role
       FROM users 
       WHERE role = 'Approver_AreaManager' AND is_active = TRUE
       ORDER BY full_name`
    );
    
    res.json({ success: true, data: approvers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching area managers' });
  }
});

// GET /api/users/approvers/safety-officers - Get safety officers
router.get('/approvers/safety-officers', authenticate, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT id, login_id, full_name, email, role
       FROM users 
       WHERE role = 'Approver_Safety' AND is_active = TRUE
       ORDER BY full_name`
    );
    
    res.json({ success: true, data: approvers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching safety officers' });
  }
});

// GET /api/users/approvers/site-leaders - Get site leaders
router.get('/approvers/site-leaders', authenticate, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT id, login_id, full_name, email, role
       FROM users 
       WHERE role = 'Approver_SiteLeader' AND is_active = TRUE
       ORDER BY full_name`
    );
    
    res.json({ success: true, data: approvers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching site leaders' });
  }
});
module.exports = router;