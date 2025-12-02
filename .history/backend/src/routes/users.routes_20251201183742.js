// backend/src/routes/users.routes.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/users/workers
router.get('/workers', async (req, res) => {
  try {
    console.log('📥 GET /api/users/workers');
    
    const [workers] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        role,
        is_active,
        created_at
      FROM users
      WHERE (role = 'Requester' OR role = 'Worker') 
        AND is_active = TRUE
      ORDER BY full_name ASC
    `);
    
    console.log(`✅ Fetched ${workers.length} workers`);
    
    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    console.error('❌ Error fetching workers:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

// GET /api/users - Get all users with optional filters
router.get('/', async (req, res) => {
  try {
    const { role, department_id, is_active } = req.query;
    
    console.log('📥 GET /api/users - Fetching users with filters:', { role, department_id, is_active });
    
    let query = `
      SELECT 
        u.id,
        u.login_id,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        u.is_active,
        u.created_at
      FROM users u
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by role
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    
    // Filter by department
    if (department_id) {
      query += ' AND u.department_id = ?';
      params.push(department_id);
    }
    
    // Filter by active status
    if (is_active !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(is_active === 'true' || is_active === true ? 1 : 0);
    } else {
      // Default: only active users
      query += ' AND u.is_active = TRUE';
    }
    
    query += ' ORDER BY u.full_name ASC';
    
    const [users] = await pool.query(query, params);
    
    console.log(`✅ Successfully fetched ${users.length} users from admin database`);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching users from database',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get specific user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 GET /api/users/${id} - Fetching user...`);
    
    const [users] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        role,
        department_id,
        is_active,
        created_at
      FROM users
      WHERE id = ?
    `, [id]);
    
    if (users.length === 0) {
      console.warn(`⚠️ User with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ Successfully fetched user: ${users[0].full_name}`);
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching user from database',
      error: error.message
    });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', async (req, res) => {
  try {
    const { login_id, full_name, email, role, password, department_id } = req.body;
    
    console.log('📥 POST /api/users - Creating new user:', { login_id, full_name, role });
    
    // Basic validation
    if (!login_id || !full_name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: login_id, full_name, email, role'
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
        message: 'User with this login_id or email already exists'
      });
    }
    
    // Insert new user
    const [result] = await pool.query(`
      INSERT INTO users (login_id, full_name, email, role, password_hash, department_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [login_id, full_name, email, role, password || null, department_id || null]);
    
    console.log(`✅ Successfully created user with ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.insertId,
        login_id,
        full_name,
        email,
        role
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, department_id, is_active } = req.body;
    
    console.log(`📥 PUT /api/users/${id} - Updating user...`);
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (department_id !== undefined) {
      updates.push('department_id = ?');
      params.push(department_id);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    console.log(`✅ Successfully updated user with ID: ${id}`);
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 DELETE /api/users/${id} - Deleting user...`);
    
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
    
    console.log(`✅ Successfully deleted user with ID: ${id}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;