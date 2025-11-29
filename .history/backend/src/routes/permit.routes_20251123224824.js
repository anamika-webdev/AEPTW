const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all permits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [permits] = await pool.query(`
      SELECT p.*, s.name as site_name, u.full_name as created_by_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permits',
      error: error.message
    });
  }
});

// Get permit by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [permits] = await pool.query(`
      SELECT p.*, s.name as site_name, u.full_name as created_by_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    res.json({
      success: true,
      data: permits[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permit',
      error: error.message
    });
  }
});

// Create permit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      site_id,
      permit_type,
      work_location,
      work_description,
      start_time,
      end_time,
      receiver_name
    } = req.body;

    // Generate permit serial
    const year = new Date().getFullYear();
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE YEAR(created_at) = ?',
      [year]
    );
    const permitNumber = String(countResult[0].count + 1).padStart(4, '0');
    const permit_serial = `PTW-${year}-${permitNumber}`;

    const [result] = await pool.query(
      `INSERT INTO permits 
      (permit_serial, site_id, created_by_user_id, permit_type, work_location, 
       work_description, start_time, end_time, receiver_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        permit_serial,
        site_id,
        req.user.id,
        permit_type,
        work_location,
        work_description,
        start_time,
        end_time,
        receiver_name,
        'Draft'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      data: {
        id: result.insertId,
        permit_serial
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating permit',
      error: error.message
    });
  }
});

// Update permit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const permitId = req.params.id;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(permitId);

    await pool.query(
      `UPDATE permits SET ${setClause} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Permit updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating permit',
      error: error.message
    });
  }
});

// Delete permit
router.delete('/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM permits WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Permit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting permit',
      error: error.message
    });
  }
});

module.exports = router;