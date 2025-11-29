const pool = require('../config/database');

// @desc    Get all vendors
// @route   GET /api/v1/vendors
// @access  Private
const getVendors = async (req, res, next) => {
  try {
    const [vendors] = await pool.query('SELECT * FROM vendors ORDER BY company_name');

    res.status(200).json({
      success: true,
      data: { vendors }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor
// @route   GET /api/v1/vendors/:id
// @access  Private
const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [vendors] = await pool.query('SELECT * FROM vendors WHERE id = ?', [id]);

    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { vendor: vendors[0] }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create vendor
// @route   POST /api/v1/vendors
// @access  Private (Admin)
const createVendor = async (req, res, next) => {
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
        id: result.insertId,
        company_name,
        contact_person,
        license_number
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/v1/vendors/:id
// @access  Private (Admin)
const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company_name, contact_person, license_number } = req.body;

    const [result] = await pool.query(
      'UPDATE vendors SET company_name = ?, contact_person = ?, license_number = ? WHERE id = ?',
      [company_name, contact_person, license_number, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/v1/vendors/:id
// @access  Private (Admin)
const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM vendors WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
};