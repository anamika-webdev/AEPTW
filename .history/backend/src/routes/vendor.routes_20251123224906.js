const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all vendors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [vendors] = await pool.query('SELECT * FROM vendors ORDER BY company_name');
    res.json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors',
      error: error.message
    });
  }
});

// Get vendor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [vendors] = await pool.query('SELECT * FROM vendors WHERE id = ?', [req.params.id]);
    
    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendors[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor',
      error: error.message
    });
  }
});

// Create vendor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { company_name, contact_person, license_number } = req.body;

    const [result] = await pool.query(
      'INSERT INTO vendors (company_name, contact_person, license_number) VALUES (?, ?, ?)',
      [company_name, contact_person, license_number]
    );

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating vendor',
      error: error.message
    });
  }
});

// Update vendor
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { company_name, contact_person, license_number } = req.body;

    await pool.query(
      'UPDATE vendors SET company_name = ?, contact_person = ?, license_number = ? WHERE id = ?',
      [company_name, contact_person, license_number, req.params.id]
    );

    res.json({
      success: true,
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating vendor',
      error: error.message
    });
  }
});

// Delete vendor (Admin only)
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM vendors WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting vendor',
      error: error.message
    });
  }
});

module.exports = router;