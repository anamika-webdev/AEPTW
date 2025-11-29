// backend/src/routes/vendors.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/vendors - Get all vendors
router.get('/', async (req, res) => {
  try {
    // Query only columns that exist in the vendors table
    const [vendors] = await pool.query(`
      SELECT 
        id,
        company_name,
        contact_person,
        license_number,
        created_at
      FROM vendors
      ORDER BY company_name ASC
    `);
    
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors',
      error: error.message
    });
  }
});

// GET /api/vendors/:id - Get vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [vendors] = await pool.query(`
      SELECT 
        id,
        company_name,
        contact_person,
        license_number,
        created_at
      FROM vendors
      WHERE id = ?
    `, [id]);
    
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
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor',
      error: error.message
    });
  }
});

// POST /api/vendors - Create vendor
router.post('/', async (req, res) => {
  try {
    const { company_name, contact_person, license_number } = req.body;
    
    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }
    
    const [result] = await pool.query(`
      INSERT INTO vendors (company_name, contact_person, license_number)
      VALUES (?, ?, ?)
    `, [company_name, contact_person || null, license_number || null]);
    
    const [newVendor] = await pool.query(`
      SELECT 
        id,
        company_name,
        contact_person,
        license_number,
        created_at
      FROM vendors
      WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      data: newVendor[0],
      message: 'Vendor created successfully'
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vendor',
      error: error.message
    });
  }
});

// PUT /api/vendors/:id - Update vendor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, contact_person, license_number } = req.body;
    
    // Check if vendor exists
    const [existing] = await pool.query('SELECT id FROM vendors WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    await pool.query(`
      UPDATE vendors 
      SET company_name = ?, contact_person = ?, license_number = ?
      WHERE id = ?
    `, [company_name, contact_person || null, license_number || null, id]);
    
    const [updatedVendor] = await pool.query(`
      SELECT 
        id,
        company_name,
        contact_person,
        license_number,
        created_at
      FROM vendors
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: updatedVendor[0],
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vendor',
      error: error.message
    });
  }
});

// DELETE /api/vendors/:id - Delete vendor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists
    const [existing] = await pool.query('SELECT id FROM vendors WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Check if vendor is used in any permits
    const [permits] = await pool.query('SELECT COUNT(*) as count FROM permits WHERE vendor_id = ?', [id]);
    
    if (permits[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vendor with existing permits'
      });
    }
    
    await pool.query('DELETE FROM vendors WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vendor',
      error: error.message
    });
  }
});

module.exports = router;