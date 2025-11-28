// backend/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total sites
    const [sitesResult] = await pool.query('SELECT COUNT(*) as count FROM sites');
    const totalSites = sitesResult[0].count;

    // Get total workers (users with role Requester)
    const [workersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Requester'"
    );
    const totalWorkers = workersResult[0].count;

    // Get total supervisors (users with role Approver_AreaManager or Approver_Safety)
    const [supervisorsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role IN ('Approver_AreaManager', 'Approver_Safety')"
    );
    const totalSupervisors = supervisorsResult[0].count;

    // Get total PTW issued
    const [ptwResult] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const totalPTW = ptwResult[0].count;

    // Get PTW by category
    const [categoryResult] = await pool.query(`
      SELECT permit_type, COUNT(*) as count 
      FROM permits 
      GROUP BY permit_type
    `);

    // Calculate percentages
    const categoryData = categoryResult.map(row => ({
      name: row.permit_type,
      value: row.count,
      percentage: totalPTW > 0 ? Math.round((row.count / totalPTW) * 100) : 0
    }));

    // Get recent PTWs (last 5)
    const [recentPTWs] = await pool.query(`
      SELECT 
        p.id,
        p.permit_serial as number,
        p.work_description as description,
        s.name as site,
        u.full_name as issuer,
        DATE_FORMAT(p.start_time, '%Y-%m-%d') as date,
        p.status
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      JOIN users u ON p.created_by_user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: {
        totalSites,
        totalWorkers,
        totalSupervisors,
        totalPTW
      },
      categoryData,
      recentPTWs
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/admin/permits - All permits with filters
router.get('/permits', async (req, res) => {
  try {
    const { site, status, category } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.permit_serial as number,
        p.permit_type as category,
        s.name as site,
        p.work_location as location,
        p.work_description as workDescription,
        u.full_name as issuer,
        DATE_FORMAT(p.start_time, '%Y-%m-%d') as startDate,
        DATE_FORMAT(p.end_time, '%Y-%m-%d') as endDate,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') as createdDate,
        p.status
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      JOIN users u ON p.created_by_user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (site && site !== 'all') {
      query += ' AND s.name = ?';
      params.push(site);
    }

    if (status && status !== 'all') {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (category && category !== 'all') {
      query += ' AND p.permit_type = ?';
      params.push(category);
    }

    query += ' ORDER BY p.created_at DESC';

    const [permits] = await pool.query(query, params);

    res.json({ permits });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

// GET /api/admin/users - All users
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        id,
        login_id,
        full_name as name,
        email,
        role,
        department as site,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users - Add new user
router.post('/users', async (req, res) => {
  try {
    const { type, fullName, email, phone, site } = req.body;

    // Validate required fields
    if (!fullName || !email || !site) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Map type to database role
    const roleMapping = {
      'Worker': 'Requester',
      'Supervisor': 'Approver_AreaManager',
      'Admin': 'Admin'
    };

    const role = roleMapping[type] || 'Requester';

    // Generate login_id from name
    const loginId = fullName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

    const [result] = await pool.query(
      'INSERT INTO users (login_id, full_name, email, role, department) VALUES (?, ?, ?, ?, ?)',
      [loginId, fullName, email, role, site]
    );

    const [newUser] = await pool.query(
      'SELECT id, login_id, full_name as name, email, role, department as site FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ user: newUser[0] });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/sites - All sites
router.get('/sites', async (req, res) => {
  try {
    const [sites] = await pool.query(`
      SELECT 
        id,
        site_code,
        name,
        address as location,
        'active' as status
      FROM sites
      ORDER BY id ASC
    `);

    res.json({ sites });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// POST /api/admin/sites - Add new site
router.post('/sites', async (req, res) => {
  try {
    const { name, location, area } = req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate site_code from name
    const siteCode = name.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 100);

    const [result] = await pool.query(
      'INSERT INTO sites (site_code, name, address) VALUES (?, ?, ?)',
      [siteCode, name, location]
    );

    const [newSite] = await pool.query(
      'SELECT id, site_code, name, address as location FROM sites WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      site: {
        ...newSite[0],
        area,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error adding site:', error);
    res.status(500).json({ error: 'Failed to add site' });
  }
});

// DELETE /api/admin/sites/:id - Delete site
router.delete('/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if site has permits
    const [permits] = await pool.query('SELECT COUNT(*) as count FROM permits WHERE site_id = ?', [id]);
    
    if (permits[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete site with existing permits' 
      });
    }

    const [result] = await pool.query('DELETE FROM sites WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

module.exports = router;