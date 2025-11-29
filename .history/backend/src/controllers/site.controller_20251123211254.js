const pool = require('../config/database');

// @desc    Get all sites
// @route   GET /api/v1/sites
// @access  Private
const getSites = async (req, res, next) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites ORDER BY name');

    res.status(200).json({
      success: true,
      data: { sites }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single site
// @route   GET /api/v1/sites/:id
// @access  Private
const getSiteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [sites] = await pool.query('SELECT * FROM sites WHERE id = ?', [id]);

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { site: sites[0] }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create site
// @route   POST /api/v1/sites
// @access  Private (Admin only)
const createSite = async (req, res, next) => {
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
        id: result.insertId,
        site_code,
        name,
        address
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update site
// @route   PUT /api/v1/sites/:id
// @access  Private (Admin only)
const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { site_code, name, address } = req.body;

    const [result] = await pool.query(
      'UPDATE sites SET site_code = ?, name = ?, address = ? WHERE id = ?',
      [site_code, name, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete site
// @route   DELETE /api/v1/sites/:id
// @access  Private (Admin only)
const deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM sites WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite
};