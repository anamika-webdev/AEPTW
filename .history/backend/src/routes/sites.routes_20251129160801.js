// src/routes/sites.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET /api/sites - List all sites
router.get('/', async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites WHERE is_active = TRUE ORDER BY name');
    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sites', error: error.message });
  }
});

// GET /api/sites/:id - Get site by ID
router.get('/:id', async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    if (sites.length === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    res.json({ success: true, data: sites[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch site', error: error.message });
  }
});

// POST /api/sites - Create new site (Admin only)
router.post('/', authorize('Admin'), async (req, res) => {
  try {
    const { site_code, name, location, address, city, state, country } = req.body;
    
    if (!site_code || !name) {
      return res.status(400).json({ success: false, message: 'Site code and name are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO sites (site_code, name, location, address, city, state, country) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [site_code, name, location || null, address || null, city || null, state || null, country || 'India']
    );

    const [newSite] = await pool.query('SELECT * FROM sites WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Site created successfully', data: newSite[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Site code already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create site', error: error.message });
  }
});

// PUT /api/sites/:id - Update site (Admin only)
router.put('/:id', authorize('Admin'), async (req, res) => {
  try {
    const { name, location, address, city, state, country, is_active } = req.body;
    
    await pool.query(
      'UPDATE sites SET name = ?, location = ?, address = ?, city = ?, state = ?, country = ?, is_active = ? WHERE id = ?',
      [name, location || null, address || null, city || null, state || null, country || 'India', is_active !== undefined ? is_active : true, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Site updated successfully', data: updated[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update site', error: error.message });
  }
});

// DELETE /api/sites/:id - Delete site (Admin only)
router.delete('/:id', authorize('Admin'), async (req, res) => {
  try {
    const [permits] = await pool.query('SELECT COUNT(*) as count FROM permits WHERE site_id = ?', [req.params.id]);
    if (permits[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete site with existing permits' });
    }

    await pool.query('DELETE FROM sites WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete site', error: error.message });
  }
});

module.exports = router;