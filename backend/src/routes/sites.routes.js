// backend/src/routes/sites.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/sites - Get all sites
router.get('/', async (req, res) => {
  try {
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_code,
        name,
        address
      FROM sites
      ORDER BY name ASC
    `);
    
    res.json({
      success: true,
      data: sites
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sites',
      error: error.message
    });
  }
});

// GET /api/sites/:id - Get site by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_code,
        name,
        address
      FROM sites
      WHERE id = ?
    `, [id]);
    
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
    console.error('Error fetching site:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching site',
      error: error.message
    });
  }
});

// POST /api/sites - Create new site
router.post('/', async (req, res) => {
  try {
    const { site_code, name, address } = req.body;
    
    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name and address are required'
      });
    }
    
    // Generate site_code if not provided
    const generatedSiteCode = site_code || name.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000);
    
    const [result] = await pool.query(`
      INSERT INTO sites (site_code, name, address)
      VALUES (?, ?, ?)
    `, [generatedSiteCode, name, address]);
    
    // Fetch the created site
    const [newSite] = await pool.query(`
      SELECT id, site_code, name, address
      FROM sites
      WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      data: newSite[0]
    });
  } catch (error) {
    console.error('Error creating site:', error);
    
    // Handle duplicate site_code error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Site code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating site',
      error: error.message
    });
  }
});

// PUT /api/sites/:id - Update site
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { site_code, name, address } = req.body;
    
    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name and address are required'
      });
    }
    
    // Check if site exists
    const [existingSite] = await pool.query('SELECT id FROM sites WHERE id = ?', [id]);
    
    if (existingSite.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Update site
    await pool.query(`
      UPDATE sites 
      SET site_code = ?, name = ?, address = ?
      WHERE id = ?
    `, [site_code, name, address, id]);
    
    // Fetch updated site
    const [updatedSite] = await pool.query(`
      SELECT id, site_code, name, address
      FROM sites
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Site updated successfully',
      data: updatedSite[0]
    });
  } catch (error) {
    console.error('Error updating site:', error);
    
    // Handle duplicate site_code error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Site code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating site',
      error: error.message
    });
  }
});

// DELETE /api/sites/:id - Delete site
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if site has associated permits
    const [permits] = await pool.query('SELECT COUNT(*) as count FROM permits WHERE site_id = ?', [id]);
    
    if (permits[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete site with existing permits'
      });
    }
    
    // Delete site
    const [result] = await pool.query('DELETE FROM sites WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting site',
      error: error.message
    });
  }
});

// GET /api/sites/search/:query - Search sites
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_code,
        name,
        address
      FROM sites
      WHERE 
        name LIKE ? OR 
        site_code LIKE ? OR 
        address LIKE ?
      ORDER BY name ASC
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
    
    res.json({
      success: true,
      data: sites
    });
  } catch (error) {
    console.error('Error searching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching sites',
      error: error.message
    });
  }
});

module.exports = router;