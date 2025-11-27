// backend/routes/admin.routes.complete.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

// Apply authentication to all admin routes
router.use(authenticateToken);

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total sites
    const [sitesResult] = await pool.query('SELECT COUNT(*) as count FROM sites');
    const totalSites = sitesResult[0].count;

    // Get sites with new count this month
    const [newSitesResult] = await pool.query(`
      SELECT COUNT(*) as count FROM sites 
      WHERE MONTH(CURRENT_DATE) = MONTH(CURRENT_DATE)
    `);
    const newSites = newSitesResult[0].count;

    // Get total workers (Requester role)
    const [workersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Requester'"
    );
    const totalWorkers = workersResult[0].count;

    // Get active workers (can be determined by recent activity)
    const [activeWorkersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Requester'"
    );
    const activeWorkers = activeWorkersResult[0].count;

    // Get total supervisors (Approver roles)
    const [supervisorsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role IN ('Approver_AreaManager', 'Approver_Safety')"
    );
    const totalSupervisors = supervisorsResult[0].count;

    // Get total PTW issued
    const [ptwResult] = await pool.query('SELECT COUNT(*) as count FROM permits');
    const totalPTW = ptwResult[0].count;

    // Get PTW issued this month
    const [ptwMonthResult] = await pool.query(`
      SELECT COUNT(*) as count FROM permits 
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE)
    `);
    const ptwThisMonth = ptwMonthResult[0].count;
    
    // Calculate percentage increase
    const ptwIncrease = totalPTW > 0 ? Math.round((ptwThisMonth / totalPTW) * 100) : 0;

    // Get PTW by category with percentages
    const [categoryResult] = await pool.query(`
      SELECT 
        permit_type as name, 
        COUNT(*) as value 
      FROM permits 
      GROUP BY permit_type
    `);

    const categoryData = categoryResult.map(row => ({
      name: row.name,
      value: row.value,
      percentage: totalPTW > 0 ? Math.round((row.value / totalPTW) * 100) : 0
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
        newSites,
        totalWorkers,
        activeWorkers,
        totalSupervisors,
        totalPTW,
        ptwIncrease
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
        DATE_FORMAT(p.created_at, 'Created %Y-%m-%d') as createdDate,
        p.status,
        p.created_at
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

// GET /api/admin/permits/:id - Get single permit details
router.get('/permits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.address as site_address,
        u.full_name as created_by_name,
        u.email as created_by_email
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      JOIN users u ON p.created_by_user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (permits.length === 0) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    // Get team members
    const [teamMembers] = await pool.query(`
      SELECT * FROM permit_team_members WHERE permit_id = ?
    `, [id]);

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
      SELECT 
        pa.*,
        u.full_name as approver_name
      FROM permit_approvals pa
      JOIN users u ON pa.approver_user_id = u.id
      WHERE pa.permit_id = ?
    `, [id]);

    res.json({
      permit: permits[0],
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
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
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

    // Map frontend type to database role
    const roleMapping = {
      'Worker': 'Requester',
      'Supervisor': 'Approver_AreaManager',
      'Safety': 'Approver_Safety',
      'Admin': 'Admin'
    };

    const role = roleMapping[type] || 'Requester';

    // Generate unique login_id
    const loginId = fullName.toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 10) + 
      Math.floor(Math.random() * 1000);

    // Check if login_id or email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [loginId, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

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

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, department } = req.body;

    const updateFields = [];
    const params = [];

    if (fullName) {
      updateFields.push('full_name = ?');
      params.push(fullName);
    }
    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (role) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (department) {
      updateFields.push('department = ?');
      params.push(department);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [updatedUser] = await pool.query(
      'SELECT id, login_id, full_name as name, email, role, department as site FROM users WHERE id = ?',
      [id]
    );

    res.json({ user: updatedUser[0] });
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
        COUNT(p.id) as permit_count,
        'active' as status
      FROM sites s
      LEFT JOIN permits p ON s.id = p.site_id
      GROUP BY s.id, s.site_code, s.name, s.address
      ORDER BY s.id ASC
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

    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }

    // Generate unique site_code
    const siteCode = name.substring(0, 4).toUpperCase() + 
      Math.floor(Math.random() * 100);

    // Check if site_code already exists
    const [existing] = await pool.query(
      'SELECT id FROM sites WHERE site_code = ?',
      [siteCode]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Site code already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO sites (site_code, name, address) VALUES (?, ?, ?)',
      [siteCode, name, location]
    );

    const [newSite] = await pool.query(
      `SELECT 
        id, 
        site_code, 
        name, 
        address as location,
        'active' as status
      FROM sites WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ 
      site: {
        ...newSite[0],
        area,
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

    const updateFields = [];
    const params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (location) {
      updateFields.push('address = ?');
      params.push(location);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE sites SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const [updatedSite] = await pool.query(
      'SELECT id, site_code, name, address as location FROM sites WHERE id = ?',
      [id]
    );

    res.json({ site: updatedSite[0] });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// DELETE /api/admin/sites/:id - Delete site
router.delete('/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if site has permits
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
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC
    `);

    // Permits by site
    const [siteData] = await pool.query(`
      SELECT 
        s.name as site,
        COUNT(p.id) as count
      FROM sites s
      LEFT JOIN permits p ON s.id = p.site_id
      GROUP BY s.id, s.name
      ORDER BY count DESC
    `);

    // Top issuers
    const [issuerData] = await pool.query(`
      SELECT 
        u.full_name as name,
        COUNT(p.id) as count
      FROM users u
      LEFT JOIN permits p ON u.id = p.created_by_user_id
      GROUP BY u.id, u.full_name
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