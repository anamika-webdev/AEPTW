// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');  // Updated path for src/ structure
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');  // Updated path

// All routes require authentication
router.use(authenticateToken);

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total sites
    const [totalSitesResult] = await pool.query('SELECT COUNT(*) as count FROM sites');
    const totalSites = totalSitesResult[0].count;

    // New sites this month
    const [newSitesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM sites WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );
    const newSites = newSitesResult[0].count;

    // Total workers
    const [totalWorkersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Requester'"
    );
    const totalWorkers = totalWorkersResult[0].count;
    const activeWorkers = totalWorkers; // Simplified

    // Total supervisors
    const [totalSupervisorsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role IN ('Approver_AreaManager', 'Approver_Safety')"
    );
    const totalSupervisors = totalSupervisorsResult[0].count;

    // Total PTW
    const [totalPTWResult] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const totalPTW = totalPTWResult[0].count;

    // PTW this month
    const [ptwThisMonthResult] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );
    const ptwThisMonth = ptwThisMonthResult[0].count;

    // Calculate increase percentage
    const ptwIncrease = totalPTW > 0 ? ((ptwThisMonth / totalPTW) * 100).toFixed(1) : 0;

    // PTW by category
    const [categoryResults] = await pool.query(
      'SELECT permit_type, COUNT(*) as count FROM permits GROUP BY permit_type'
    );

    const categoryData = categoryResults.map(row => ({
      name: row.permit_type,
      value: row.count,
      percentage: totalPTW > 0 ? ((row.count / totalPTW) * 100).toFixed(1) : 0
    }));

    // Recent PTWs (last 5)
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
        newSites,
        totalWorkers,
        activeWorkers,
        totalSupervisors,
        totalPTW,
        ptwIncrease: parseFloat(ptwIncrease)
      },
      categoryData,
      recentPTWs
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/admin/permits - All permits with filters
router.get('/permits', async (req, res) => {
  try {
    const { site, status, category, startDate, endDate } = req.query;

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

    if (startDate) {
      query += ' AND DATE(p.start_time) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(p.end_time) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY p.created_at DESC';

    const [permits] = await pool.query(query, params);

    res.json({ permits });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

// GET /api/admin/permits/:id - Single permit details
router.get('/permits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [permits] = await pool.query(`
      SELECT p.*, s.name as site_name, s.address, u.full_name, u.email
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      JOIN users u ON p.created_by_user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (permits.length === 0) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const permit = permits[0];

    // Get team members
    const [teamMembers] = await pool.query(
      'SELECT * FROM permit_team_members WHERE permit_id = ?',
      [id]
    );

    // Get hazards
    const [hazards] = await pool.query(`
      SELECT h.* FROM permit_hazards ph
      JOIN master_hazards h ON ph.hazard_id = h.id
      WHERE ph.permit_id = ?
    `, [id]);

    // Get PPE
    const [ppe] = await pool.query(`
      SELECT p.* FROM permit_ppe pp
      JOIN master_ppe p ON pp.ppe_id = p.id
      WHERE pp.permit_id = ?
    `, [id]);

    // Get approvals
    const [approvals] = await pool.query(`
      SELECT pa.*, u.full_name
      FROM permit_approvals pa
      JOIN users u ON pa.approver_user_id = u.id
      WHERE pa.permit_id = ?
    `, [id]);

    res.json({
      permit,
      teamMembers,
      hazards,
      ppe,
      approvals
    });
  } catch (error) {
    console.error('Error fetching permit details:', error);
    res.status(500).json({ error: 'Failed to fetch permit details' });
  }
});

// GET /api/admin/users - All users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT 
        id,
        login_id,
        full_name as name,
        email,
        role,
        department as site,
        created_at
      FROM users
      WHERE 1=1
    `;

    const params = [];

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.query(query, params);

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

    if (!fullName || !email || !site) {
      return res.status(400).json({ error: 'Full name, email, and site are required' });
    }

    // Map type to role
    const roleMap = {
      'Worker': 'Requester',
      'Supervisor': 'Approver_AreaManager',
      'Safety': 'Approver_Safety',
      'Admin': 'Admin'
    };

    const role = roleMap[type] || 'Requester';

    // Generate login_id
    const login_id = fullName.toLowerCase().replace(/\s+/g, '').substring(0, 10) + 
                     Math.floor(Math.random() * 1000);

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (login_id, full_name, email, role, department) VALUES (?, ?, ?, ?, ?)',
      [login_id, fullName, email, role, site]
    );

    res.status(201).json({
      user: {
        id: result.insertId,
        login_id,
        name: fullName,
        email,
        role,
        site
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, department } = req.body;

    const updates = [];
    const params = [];

    if (fullName) {
      updates.push('full_name = ?');
      params.push(fullName);
    }

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (department) {
      updates.push('department = ?');
      params.push(department);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [users] = await pool.query(
      'SELECT id, login_id, full_name as name, email, role, department as site FROM users WHERE id = ?',
      [id]
    );

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has created any permits
    const [permits] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE created_by_user_id = ?',
      [id]
    );

    if (permits[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user who has created permits' 
      });
    }

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
        s.id,
        s.site_code,
        s.name,
        s.address as location,
        COUNT(p.id) as permit_count
      FROM sites s
      LEFT JOIN permits p ON s.id = p.site_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);

    const sitesWithStatus = sites.map(site => ({
      ...site,
      status: 'active'
    }));

    res.json({ sites: sitesWithStatus });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// POST /api/admin/sites - Add new site
router.post('/sites', async (req, res) => {
  try {
    const { name, location, area } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }

    // Generate site_code
    const site_code = name.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 100);

    // Check if site code exists
    const [existing] = await pool.query(
      'SELECT id FROM sites WHERE site_code = ?',
      [site_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Site code already exists. Please try again.' });
    }

    // Insert site
    const [result] = await pool.query(
      'INSERT INTO sites (site_code, name, address) VALUES (?, ?, ?)',
      [site_code, name, location]
    );

    res.status(201).json({
      site: {
        id: result.insertId,
        site_code,
        name,
        location,
        area,
        status: 'active',
        permit_count: 0
      }
    });
  } catch (error) {
    console.error('Error adding site:', error);
    res.status(500).json({ error: 'Failed to add site' });
  }
});

// PUT /api/admin/sites/:id - Update site
router.put('/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (location) {
      updates.push('address = ?');
      params.push(location);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE sites SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const [sites] = await pool.query(
      'SELECT id, site_code, name, address as location FROM sites WHERE id = ?',
      [id]
    );

    res.json({ site: { ...sites[0], status: 'active' } });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// DELETE /api/admin/sites/:id - Delete site
router.delete('/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if site has any permits
    const [permits] = await pool.query(
      'SELECT COUNT(*) as count FROM permits WHERE site_id = ?',
      [id]
    );

    if (permits[0].count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete site with ${permits[0].count} existing permit(s)` 
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

// GET /api/admin/analytics - Dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    // Permits by status
    const [statusData] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM permits
      GROUP BY status
    `);

    // Permits trend (last 7 days)
    const [trendData] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM permits
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date ASC
    `);

    // Permits by site
    const [siteData] = await pool.query(`
      SELECT 
        s.name,
        COUNT(p.id) as count
      FROM sites s
      LEFT JOIN permits p ON s.id = p.site_id
      GROUP BY s.id
      ORDER BY count DESC
    `);

    // Top issuers
    const [issuerData] = await pool.query(`
      SELECT 
        u.full_name,
        COUNT(p.id) as count
      FROM users u
      LEFT JOIN permits p ON u.id = p.created_by_user_id
      GROUP BY u.id
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      statusData,
      trendData,
      siteData,
      issuerData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;