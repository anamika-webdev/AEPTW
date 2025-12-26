// backend/src/routes/users.routes.js - UPDATED WITH REQUESTER FILTERING
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

const authenticate = authenticateToken;

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (!req.user || (req.user.role?.toLowerCase() !== 'admin' && req.user.role?.toLowerCase() !== 'administrator')) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
  }
  next();
};

// All routes require authentication
router.use(authenticateToken);

// GET /api/users - Get all users (Admin only)
router.get('/', authorizeAdmin, async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, 
             u.site_id, s.name as site_name,
             u.job_role, u.created_at, u.is_active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN sites s ON u.site_id = s.id
      WHERE u.is_active = TRUE
    `;
    const params = [];

    if (role) {
      // ✅ UPDATED: Use LIKE to matching roles in comma-separated list
      query += ' AND u.role LIKE ?';
      params.push(`%${role}%`);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await pool.query(query, params);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET /api/users/workers - Get workers (filtered by requester if applicable)
router.get('/workers', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase();

    console.log('📥 GET /api/users/workers - User:', userId, 'Role:', userRole);

    let query;
    let params;

    // Admin sees all workers
    if (userRole === 'admin' || userRole === 'administrator') {
      query = `
        SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
               u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.role LIKE '%Worker%' AND u.is_active = TRUE
        ORDER BY u.full_name
      `;
      params = [];
    }
    // Requesters/Supervisors see only their assigned workers
    else if (userRole === 'requester' || userRole === 'supervisor') {
      query = `
        SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
               u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        INNER JOIN requester_workers rw ON u.id = rw.worker_user_id
        WHERE u.role LIKE '%Worker%' AND u.is_active = TRUE AND rw.requester_user_id = ?
        ORDER BY u.full_name
      `;
      params = [userId];
    }
    // Other roles see all workers (or you can restrict further)
    else {
      query = `
        SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
               u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.role = 'Worker' AND u.is_active = TRUE
        ORDER BY u.full_name
      `;
      params = [];
    }

    const [workers] = await pool.query(query, params);

    console.log(`✅ Fetched ${workers.length} workers for user ${userId}`);

    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    console.error('❌ Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});
// GET /api/users/approvers - Get all active approvers
router.get('/approvers', authenticateToken, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT 
        u.id, 
        u.login_id, 
        u.full_name, 
        u.email, 
        u.role,
        u.department_id,
        d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role IN ('Approver_AreaManager', 'Approver_Safety', 'Approver_SiteLeader') 
         AND u.is_active = TRUE
       ORDER BY u.role, u.full_name`
    );

    console.log(`✅ Fetched ${approvers.length} approvers for user ${req.user.id} (${req.user.role})`);

    res.json({
      success: true,
      count: approvers.length,
      data: approvers
    });

  } catch (error) {
    console.error('❌ Error fetching approvers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approvers',
      error: error.message
    });
  }
});

// GET /api/users/approvers/area-managers - Get area managers
router.get('/approvers/area-managers', authenticateToken, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT u.id, u.login_id, u.full_name, u.email, u.role,
              u.department_id, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role LIKE '%Approver_AreaManager%' AND u.is_active = TRUE
       ORDER BY u.full_name`
    );

    console.log(`✅ Fetched ${approvers.length} area managers`);

    res.json({
      success: true,
      count: approvers.length,
      data: approvers
    });
  } catch (error) {
    console.error('❌ Error fetching area managers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching area managers',
      error: error.message
    });
  }
});

// GET /api/users/approvers/safety-officers - Get safety officers
router.get('/approvers/safety-officers', authenticateToken, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT u.id, u.login_id, u.full_name, u.email, u.role,
              u.department_id, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role LIKE '%Approver_Safety%' AND u.is_active = TRUE
       ORDER BY u.full_name`
    );

    console.log(`✅ Fetched ${approvers.length} safety officers`);

    res.json({
      success: true,
      count: approvers.length,
      data: approvers
    });
  } catch (error) {
    console.error('❌ Error fetching safety officers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching safety officers',
      error: error.message
    });
  }
});

// GET /api/users/approvers/site-leaders - Get site leaders
router.get('/approvers/site-leaders', authenticateToken, async (req, res) => {
  try {
    const [approvers] = await pool.query(
      `SELECT u.id, u.login_id, u.full_name, u.email, u.role,
              u.department_id, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role LIKE '%Approver_SiteLeader%' AND u.is_active = TRUE
       ORDER BY u.full_name`
    );

    console.log(`✅ Fetched ${approvers.length} site leaders`);

    res.json({
      success: true,
      count: approvers.length,
      data: approvers
    });
  } catch (error) {
    console.error('❌ Error fetching site leaders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching site leaders',
      error: error.message
    });
  }
});


// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.job_role, u.created_at, u.is_active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// POST /api/users - Create user (Admin only)
router.post('/', authorizeAdmin, async (req, res) => {
  try {
    const { login_id, full_name, email, password, role, department, job_role } = req.body;

    console.log('📥 POST /api/users - Creating user:', { login_id, role, job_role });

    // Validation
    if (!login_id || !full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if login_id or email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE login_id = ? OR email = ?',
      [login_id, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Login ID or email already exists'
      });
    }

    // Get department_id
    let department_id = null;
    if (department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ?',
        [department]
      );
      if (deptResult.length > 0) {
        department_id = deptResult[0].id;
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (login_id, full_name, email, password_hash, role, department_id, job_role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [login_id, full_name, email, password_hash, role, department_id, job_role || null]
    );

    const [newUser] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.job_role, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [result.insertId]);

    console.log('✅ User created:', newUser[0]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser[0]
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, password, role, department, job_role, is_active } = req.body;

    console.log('📥 PUT /api/users/:id - Updating user:', id);

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get department_id
    let department_id = null;
    if (department) {
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ?',
        [department]
      );
      if (deptResult.length > 0) {
        department_id = deptResult[0].id;
      }
    }

    // Build update query
    let updateFields = [];
    let params = [];

    if (full_name) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }
    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      params.push(password_hash);
    }
    if (role) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (department_id !== null) {
      updateFields.push('department_id = ?');
      params.push(department_id);
    }
    if (job_role !== undefined) {
      updateFields.push('job_role = ?');
      params.push(job_role || null);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const [updated] = await pool.query(`
      SELECT u.id, u.login_id, u.full_name, u.email, u.role, 
             u.department_id, d.name as department_name, u.job_role, u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [id]);

    console.log('✅ User updated:', updated[0]);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📥 DELETE /api/users/:id - Deleting user:', id);

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete (set is_active = FALSE)
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);

    console.log('✅ User deleted (soft delete)');

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});


// PATCH /api/users/bulk-update - Bulk update users (Admin only)
router.patch('/bulk-update', authorizeAdmin, async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    console.log('📥 PATCH /api/users/bulk-update', { count: userIds?.length, updates });

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users selected for update'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    // White list allowed fields
    const allowedFields = ['role', 'department', 'department_id', 'job_role', 'is_active'];
    const updateFields = [];
    const params = [];

    // Handle department name to id conversion if needed
    if (updates.department) {
      // If department name passed, get ID
      const [deptResult] = await pool.query(
        'SELECT id FROM departments WHERE name = ?',
        [updates.department]
      );
      if (deptResult.length > 0) {
        updateFields.push('department_id = ?');
        params.push(deptResult[0].id);
      }
    } else if (updates.department_id !== undefined) {
      updateFields.push('department_id = ?');
      params.push(updates.department_id);
    }

    // Handle site name to id conversion
    if (updates.site) {
      const [siteResult] = await pool.query(
        'SELECT id FROM sites WHERE name = ?',
        [updates.site]
      );
      if (siteResult.length > 0) {
        updateFields.push('site_id = ?');
        params.push(siteResult[0].id);
      }
    } else if (updates.site_id !== undefined) {
      updateFields.push('site_id = ?');
      params.push(updates.site_id);
    }

    // Handle other fields
    if (updates.role) {
      updateFields.push('role = ?');
      params.push(updates.role);
    }
    if (updates.job_role !== undefined) {
      updateFields.push('job_role = ?');
      params.push(updates.job_role || null);
    }
    if (updates.is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(updates.is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');

    // Add user IDs to params
    params.push(...userIds);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id IN (${userIds.map(() => '?').join(', ')})
    `;

    await pool.query(query, params);

    // ✅ NEW: If site was updated, also assign it to Supervisors/Requesters for permit management
    if (updates.site || updates.site_id) {
      const siteIdToAssign = updates.site_id || (updates.site ? (await pool.query('SELECT id FROM sites WHERE name = ?', [updates.site]))[0][0]?.id : null);

      if (siteIdToAssign) {
        console.log('🏢 Assigning site to Supervisors/Requesters for permit management...');

        // Get users who were updated and are Supervisors/Requesters
        const [updatedUsers] = await pool.query(
          `SELECT id, role FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
          userIds
        );

        let assignedCount = 0;
        for (const user of updatedUsers) {
          // Check if user is Supervisor or Requester
          if (user.role && (user.role.includes('Supervisor') || user.role.includes('Requester'))) {
            // Check if assignment already exists
            const [existing] = await pool.query(
              'SELECT id FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
              [user.id, siteIdToAssign]
            );

            if (existing.length === 0) {
              // Create assignment
              await pool.query(
                'INSERT INTO requester_sites (requester_user_id, site_id) VALUES (?, ?)',
                [user.id, siteIdToAssign]
              );
              assignedCount++;
            }
          }
        }

        if (assignedCount > 0) {
          console.log(`✅ Assigned ${assignedCount} Supervisor(s)/Requester(s) to site for permit management`);
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully updated ${userIds.length} users`
    });

  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating users',
      error: error.message
    });
  }
});


// POST /api/users/bulk-import - Bulk create users (Admin only)
router.post('/bulk-import', authorizeAdmin, async (req, res) => {
  try {
    const { users } = req.body;

    console.log('📥 POST /api/users/bulk-import', { count: users?.length });

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users provided for import'
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each user
    for (const [index, user] of users.entries()) {
      try {
        const { login_id, full_name, email, password, role, department, job_role } = user;

        // Basic validation
        if (!login_id || !full_name || !email || !password || !role) {
          throw new Error(`Row ${index + 1}: Missing required fields (login_id, full_name, email, password, role)`);
        }

        // Check duplicates
        const [existing] = await pool.query(
          'SELECT id, is_active FROM users WHERE login_id = ? OR email = ?',
          [login_id, email]
        );

        // Get department_id
        let department_id = null;
        if (department) {
          const [deptResult] = await pool.query(
            'SELECT id FROM departments WHERE name = ?',
            [department]
          );
          if (deptResult.length > 0) {
            department_id = deptResult[0].id;
          }
        }

        const password_hash = await bcrypt.hash(password, 10);

        if (existing.length > 0) {
          // Conflict check: if multiple users found (e.g. one matches login, separate one matches email)
          if (existing.length > 1) {
            throw new Error(`Row ${index + 1}: Ambiguous match - Login ID and Email match different existing users.`);
          }

          const existingUser = existing[0];

          // UPDATE existing user (Active or Inactive)
          await pool.query(
            `UPDATE users 
               SET full_name = ?, email = ?, password_hash = ?, role = ?, department_id = ?, job_role = ?, is_active = TRUE, updated_at = NOW()
               WHERE id = ?`,
            [full_name, email, password_hash, role, department_id, job_role || null, existingUser.id]
          );

        } else {
          // Insert new user
          await pool.query(
            `INSERT INTO users (login_id, full_name, email, password_hash, role, department_id, job_role, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
            [login_id, full_name, email, password_hash, role, department_id, job_role || null]
          );
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push(error.message);
      }
    }

    res.json({
      success: true,
      message: `Import completed. Successful: ${results.successful}, Failed: ${results.failed}`,
      data: results
    });

  } catch (error) {
    console.error('❌ Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing users',
      error: error.message
    });
  }
});


module.exports = router;