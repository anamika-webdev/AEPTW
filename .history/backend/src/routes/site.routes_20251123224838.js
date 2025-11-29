const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all sites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites ORDER BY name');
    res.json({
      success: true,
      count: sites.length,
      data: sites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sites',
      error: error.message
    });
  }
});

// Get site by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    
    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.json({
      success: true,
      data: sites[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching site',
      error: error.message
    });
  }
});

// Create new site (Admin only)
router.post('/', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { site_code, name, address } = req.body;

    const [result] = await pool.query(
      'INSERT INTO sites (site_code, name, address) VALUES (?, ?, ?)',
      [site_code, name, address]
    );

    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating site',
      error: error.message
    });
  }
});

// Update site (Admin only)
router.put('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { site_code, name, address } = req.body;

    await pool.query(
      'UPDATE sites SET site_code = ?, name = ?, address = ? WHERE id = ?',
      [site_code, name, address, req.params.id]
    );

    res.json({
      success: true,
      message: 'Site updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating site',
      error: error.message
    });
  }
});

// Delete site (Admin only)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM sites WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting site',
      error: error.message
    });
  }
});

module.exports = router;