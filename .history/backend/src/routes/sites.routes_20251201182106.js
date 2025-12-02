// backend/src/routes/sites.routes.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/sites - Get all sites from admin database
router.get('/', async (req, res) => {
  try {
    const { city, state } = req.query;
    
    console.log('📥 GET /api/sites - Fetching sites from admin database...');
    
    let query = `
      SELECT 
        id,
        site_id,
        site_name,
        location,
        city,
        state,
        latitude,
        longitude,
        created_at
      FROM sites
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by city if provided
    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }
    
    // Filter by state if provided
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }
    
    query += ' ORDER BY site_name ASC';
    
    const [sites] = await pool.query(query, params);
    
    console.log(`✅ Successfully fetched ${sites.length} sites from admin database`);
    
    res.json({
      success: true,
      count: sites.length,
      data: sites
    });
  } catch (error) {
    console.error('❌ Error fetching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sites from database',
      error: error.message
    });
  }
});

// GET /api/sites/:id - Get specific site by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 GET /api/sites/${id} - Fetching site...`);
    
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_id,
        site_name,
        location,
        city,
        state,
        latitude,
        longitude,
        created_at
      FROM sites
      WHERE id = ?
    `, [id]);
    
    if (sites.length === 0) {
      console.warn(`⚠️ Site with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    console.log(`✅ Successfully fetched site: ${sites[0].site_name}`);
    
    res.json({
      success: true,
      data: sites[0]
    });
  } catch (error) {
    console.error('❌ Error fetching site:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching site from database',
      error: error.message
    });
  }
});

// POST /api/sites - Create new site (admin only)
router.post('/', async (req, res) => {
  try {
    const { site_id, site_name, location, city, state, latitude, longitude } = req.body;
    
    console.log('📥 POST /api/sites - Creating new site:', { site_id, site_name });
    
    // Basic validation
    if (!site_id || !site_name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: site_id, site_name, location'
      });
    }
    
    // Check if site_id already exists
    const [existing] = await pool.query(
      'SELECT id FROM sites WHERE site_id = ?',
      [site_id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Site with this site_id already exists'
      });
    }
    
    // Insert new site
    const [result] = await pool.query(`
      INSERT INTO sites (site_id, site_name, location, city, state, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [site_id, site_name, location, city || null, state || null, latitude || null, longitude || null]);
    
    console.log(`✅ Successfully created site with ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      data: {
        id: result.insertId,
        site_id,
        site_name,
        location,
        city,
        state
      }
    });
  } catch (error) {
    console.error('❌ Error creating site:', error);
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
    const { site_name, location, city, state, latitude, longitude } = req.body;
    
    console.log(`📥 PUT /api/sites/${id} - Updating site...`);
    
    // Check if site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (site_name !== undefined) {
      updates.push('site_name = ?');
      params.push(site_name);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      params.push(city);
    }
    if (state !== undefined) {
      updates.push('state = ?');
      params.push(state);
    }
    if (latitude !== undefined) {
      updates.push('latitude = ?');
      params.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push('longitude = ?');
      params.push(longitude);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    await pool.query(
      `UPDATE sites SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    console.log(`✅ Successfully updated site with ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Site updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating site:', error);
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
    
    console.log(`📥 DELETE /api/sites/${id} - Deleting site...`);
    
    // Check if site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Check if site is used in any permits
    const [permits] = await pool.query('SELECT COUNT(*) as count FROM permits WHERE site_id = ?', [id]);
    
    if (permits[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete site that is used in permits'
      });
    }
    
    // Delete site
    await pool.query('DELETE FROM sites WHERE id = ?', [id]);
    
    console.log(`✅ Successfully deleted site with ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting site:', error);
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
    
    console.log(`📥 GET /api/sites/search/${query} - Searching sites...`);
    
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_id,
        site_name,
        location,
        city,
        state,
        latitude,
        longitude
      FROM sites
      WHERE site_name LIKE ? 
        OR location LIKE ? 
        OR site_id LIKE ? 
        OR city LIKE ?
      ORDER BY site_name ASC
      LIMIT 50
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
    
    console.log(`✅ Found ${sites.length} sites matching query`);
    
    res.json({
      success: true,
      count: sites.length,
      data: sites
    });
  } catch (error) {
    console.error('❌ Error searching sites:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching sites',
      error: error.message
    });
  }
});

module.exports = router;