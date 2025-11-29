const db = require('../config/database');
const logger = require('../utils/logger');

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const [vendors] = await db.query('SELECT * FROM vendors ORDER BY company_name');

    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    logger.error('Get all vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors'
    });
  }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const [vendors] = await db.query('SELECT * FROM vendors WHERE id = ?', [req.params.id]);

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
    logger.error('Get vendor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor'
    });
  }
};

// Create vendor
exports.createVendor = async (req, res) => {
  try {
    const { company_name, contact_person, license_number } = req.body;

    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const [result] = await db.query(`
      INSERT INTO vendors (company_name, contact_person, license_number) 
      VALUES (?, ?, ?)
    `, [company_name, contact_person, license_number]);

    logger.info(`Vendor created: ${company_name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: {
        id: result.insertId,
        company_name,
        contact_person,
        license_number
      }
    });
  } catch (error) {
    logger.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor'
    });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, contact_person, license_number } = req.body;

    const [vendors] = await db.query('SELECT id FROM vendors WHERE id = ?', [id]);
    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    await db.query(`
      UPDATE vendors 
      SET company_name = ?, contact_person = ?, license_number = ?
      WHERE id = ?
    `, [company_name, contact_person, license_number, id]);

    logger.info(`Vendor updated: ID ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    logger.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor'
    });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vendor has permits
    const [permits] = await db.query('SELECT COUNT(*) as count FROM permits WHERE vendor_id = ?', [id]);
    if (permits[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vendor with existing permits'
      });
    }

    await db.query('DELETE FROM vendors WHERE id = ?', [id]);

    logger.info(`Vendor deleted: ID ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    logger.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor'
    });
  }
};