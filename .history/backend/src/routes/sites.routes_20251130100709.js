// backend/src/routes/sites.routes.js - FIXED
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Custom admin authorization that accepts both Admin and Administrator
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login first'
    });
  }

  const userRole = req.user.role?.toLowerCase();
  
  if (userRole !== 'admin' && userRole !== 'administrator') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Admin role required. Your role: ${req.user.role}`
    });
  }

  next();
};

router.use(authenticateToken);

// GET /api/sites - List all active sites
router.get('/', async (req, res) => {
  try {
    const [sites] = await pool.query(`
      SELECT 
        s.*,
        COUNT(p.id) as permit_count
      FROM sites s
      LEFT JOIN permits p ON s.id = p.site_id
      WHERE s.is_active = TRUE
      GROUP BY s.id
      ORDER BY s.name
    `);
    
    console.log('✅ Fetched sites:', sites.length);
    res.json({ success: true, data: sites });
  } catch (error) {
    console.error('❌ Get sites error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sites', 
      error: error.message 
    });
  }
});

// GET /api/sites/:id - Get site by ID
router.get('/:id', async (req, res) => {
  try {
    const [sites] = await pool.query(`
      SELECT 
        s.*,
        COUNT(p.id) as permit_count
      FROM sites s
      LEFT JOIN permits p ON s.id = p.site_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [req.params.id]);
    
    if (sites.length === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    
    res.json({ success: true, data: sites[0] });
  } catch (error) {
    console.error('❌ Get site error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch site', 
      error: error.message 
    });
  }
});

// POST /api/sites - Create new site (Admin only)
router.post('/', authorizeAdmin, async (req, res) => {
  try {
    const { site_code, name, location, address, city, state, country } = req.body;
    
    console.log('📥 Create site request:', { site_code, name, location });
    
    if (!site_code || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Site code and name are required' 
      });
    }

    // Check if site_code already exists
    const [existing] = await pool.query(
      'SELECT id FROM sites WHERE site_code = ?',
      [site_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Site code '${site_code}' already exists` 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO sites (site_code, name, location, address, city, state, country, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [
        site_code, 
        name, 
        location || null, 
        address || null, 
        city || null, 
        state || null, 
        country || 'India'
      ]
    );

    const [newSite] = await pool.query('SELECT * FROM sites WHERE id = ?', [result.insertId]);
    
    console.log('✅ Site created:', newSite[0]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Site created successfully', 
      data: newSite[0] 
    });
  } catch (error) {
    console.error('❌ Create site error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Site code already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create site', 
      error: error.message 
    });
  }
});

// PUT /api/sites/:id - Update site (Admin only)
router.put('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { name, location, address, city, state, country, is_active } = req.body;
    
    console.log('📥 Update site request:', { id: req.params.id, name, location });
    
    // Check if site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Site not found' 
      });
    }
    
    await pool.query(
      `UPDATE sites 
       SET name = ?, 
           location = ?, 
           address = ?, 
           city = ?, 
           state = ?, 
           country = ?, 
           is_active = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        name, 
        location || null, 
        address || null, 
        city || null, 
        state || null, 
        country || 'India', 
        is_active !== undefined ? is_active : true, 
        req.params.id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    
    console.log('✅ Site updated:', updated[0]);
    
    res.json({ 
      success: true, 
      message: 'Site updated successfully', 
      data: updated[0] 
    });
  } catch (error) {
    console.error('❌ Update site error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update site', 
      error: error.message 
    });
  }
});

// DELETE /api/sites/:id - Delete site (Admin only)
router.delete('/:id', authorizeAdmin, async (req, res) => {
  try {
    console.log('📥 Delete site request:', req.params.id);
    
    // Check if site has permits
    const [permits] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE site_id = ?', 
      [req.params.id]
    );
    
    if (permits[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete site - it has ${permits[0].count} existing permit(s)` 
      });
    }

    // Check if site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Site not found' 
      });
    }

    await pool.query('DELETE FROM sites WHERE id = ?', [req.params.id]);
    
    console.log('✅ Site deleted:', req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Site deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete site error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete site', 
      error: error.message 
    });
  }
});

module.exports = router;