// backend/src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        role,
        contact,
        site_id,
        created_at
      FROM users
      ORDER BY full_name ASC
    `);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET /api/users/workers - Get all workers (Requester role)
router.get('/workers', async (req, res) => {
  try {
    const [workers] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        contact,
        site_id
      FROM users
      WHERE role = 'Requester'
      ORDER BY full_name ASC
    `);
    
    res.json({
      success: true,
      data: workers
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        role,
        contact,
        site_id,
        created_at
      FROM users
      WHERE id = ?
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
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, contact, role, site_id } = req.body;
    
    // Check if user exists
    const [existingUser] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user
    await pool.query(`
      UPDATE users 
      SET full_name = ?, email = ?, contact = ?, role = ?, site_id = ?
      WHERE id = ?
    `, [full_name, email, contact, role, site_id, id]);
    
    // Fetch updated user
    const [updatedUser] = await pool.query(`
      SELECT id, login_id, full_name, email, role, contact, site_id
      FROM users
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has created permits
    const [permits] = await pool.query('SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ?', [id]);
    
    if (permits[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing permits'
      });
    }
    
    // Delete user
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// GET /api/users/search/:query - Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const [users] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name,
        email,
        role,
        contact,
        site_id
      FROM users
      WHERE 
        full_name LIKE ? OR 
        email LIKE ? OR 
        login_id LIKE ?
      ORDER BY full_name ASC
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
});

module.exports = router;