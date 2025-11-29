const pool = require('../config/database');

// @desc    Get all permits with filters
// @route   GET /api/v1/permits
// @access  Private
const getPermits = async (req, res, next) => {
  try {
    const { 
      status, 
      permit_type, 
      site_id, 
      start_date, 
      end_date,
      page = 1,
      limit = 10 
    } = req.query;

    let query = `
      SELECT 
        p.*,
        u.full_name as creator_name,
        s.name as site_name,
        v.company_name as vendor_name
      FROM permits p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE 1=1
    `;
    
    const params = [];

    // Add filters
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (permit_type) {
      query += ' AND p.permit_type = ?';
      params.push(permit_type);
    }

    if (site_id) {
      query += ' AND p.site_id = ?';
      params.push(site_id);
    }

    if (start_date) {
      query += ' AND p.start_time >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND p.end_time <= ?';
      params.push(end_date);
    }

    // Role-based filtering
    if (req.user.role === 'Requester') {
      query += ' AND p.created_by_user_id = ?';
      params.push(req.user.id);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [permits] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM permits p WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }
    if (permit_type) {
      countQuery += ' AND p.permit_type = ?';
      countParams.push(permit_type);
    }
    if (site_id) {
      countQuery += ' AND p.site_id = ?';
      countParams.push(site_id);
    }
    if (req.user.role === 'Requester') {
      countQuery += ' AND p.created_by_user_id = ?';
      countParams.push(req.user.id);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: {
        permits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single permit by ID
// @route   GET /api/v1/permits/:id
// @access  Private
const getPermitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        u.full_name as creator_name,
        u.email as creator_email,
        s.name as site_name,
        s.site_code,
        v.company_name as vendor_name,
        v.contact_person as vendor_contact
      FROM permits p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = ?
    `, [id]);

    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    const permit = permits[0];

    // Get PPE
    const [ppe] = await pool.query(`
      SELECT mp.* 
      FROM permit_ppe pp
      JOIN master_ppe mp ON pp.ppe_id = mp.id
      WHERE pp.permit_id = ?
    `, [id]);

    // Get Hazards
    const [hazards] = await pool.query(`
      SELECT mh.* 
      FROM permit_hazards ph
      JOIN master_hazards mh ON ph.hazard_id = mh.id
      WHERE ph.permit_id = ?
    `, [id]);

    // Get Team Members
    const [teamMembers] = await pool.query(
      'SELECT * FROM permit_team_members WHERE permit_id = ?',
      [id]
    );

    // Get Checklist Responses
    const [checklistResponses] = await pool.query(`
      SELECT 
        pcr.*,
        mcq.question_text,
        mcq.is_mandatory
      FROM permit_checklist_responses pcr
      JOIN master_checklist_questions mcq ON pcr.question_id = mcq.id
      WHERE pcr.permit_id = ?
    `, [id]);

    // Get Approvals
    const [approvals] = await pool.query(`
      SELECT 
        pa.*,
        u.full_name as approver_name,
        u.email as approver_email
      FROM permit_approvals pa
      JOIN users u ON pa.approver_user_id = u.id
      WHERE pa.permit_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        permit,
        ppe,
        hazards,
        teamMembers,
        checklistResponses,
        approvals
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new permit
// @route   POST /api/v1/permits
// @access  Private (Requester, Admin)
const createPermit = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      site_id,
      vendor_id,
      permit_type,
      work_location,
      work_description,
      start_time,
      end_time,
      receiver_name,
      ppe_ids = [],
      hazard_ids = [],
      team_members = [],
      checklist_responses = []
    } = req.body;

    // Generate permit serial number
    const permit_serial = `EPTW-${Date.now()}`;

    // Insert permit
    const [permitResult] = await connection.query(`
      INSERT INTO permits (
        permit_serial, site_id, created_by_user_id, vendor_id,
        permit_type, work_location, work_description,
        start_time, end_time, receiver_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')
    `, [
      permit_serial, site_id, req.user.id, vendor_id,
      permit_type, work_location, work_description,
      start_time, end_time, receiver_name
    ]);

    const permit_id = permitResult.insertId;

    // Insert PPE
    if (ppe_ids.length > 0) {
      const ppeValues = ppe_ids.map(ppe_id => [permit_id, ppe_id]);
      await connection.query(
        'INSERT INTO permit_ppe (permit_id, ppe_id) VALUES ?',
        [ppeValues]
      );
    }

    // Insert Hazards
    if (hazard_ids.length > 0) {
      const hazardValues = hazard_ids.map(hazard_id => [permit_id, hazard_id]);
      await connection.query(
        'INSERT INTO permit_hazards (permit_id, hazard_id) VALUES ?',
        [hazardValues]
      );
    }

    // Insert Team Members
    if (team_members.length > 0) {
      const teamValues = team_members.map(member => [
        permit_id,
        member.worker_name,
        member.worker_role,
        member.badge_id,
        member.is_qualified
      ]);
      await connection.query(`
        INSERT INTO permit_team_members 
        (permit_id, worker_name, worker_role, badge_id, is_qualified) 
        VALUES ?
      `, [teamValues]);
    }

    // Insert Checklist Responses
    if (checklist_responses.length > 0) {
      const checklistValues = checklist_responses.map(response => [
        permit_id,
        response.question_id,
        response.response,
        response.remarks
      ]);
      await connection.query(`
        INSERT INTO permit_checklist_responses 
        (permit_id, question_id, response, remarks) 
        VALUES ?
      `, [checklistValues]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      data: {
        permit_id,
        permit_serial
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Update permit
// @route   PUT /api/v1/permits/:id
// @access  Private
const updatePermit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if permit exists
    const [permits] = await pool.query('SELECT * FROM permits WHERE id = ?', [id]);
    
    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    const permit = permits[0];

    // Check permissions
    if (req.user.role === 'Requester' && permit.created_by_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this permit'
      });
    }

    // Only allow updates to draft permits
    if (permit.status !== 'Draft' && req.user.role === 'Requester') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update permit after submission'
      });
    }

    // Build update query
    const allowedFields = [
      'work_location', 'work_description', 'start_time', 'end_time',
      'receiver_name', 'status'
    ];

    const updateFields = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await pool.query(
      `UPDATE permits SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.status(200).json({
      success: true,
      message: 'Permit updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit permit for approval
// @route   POST /api/v1/permits/:id/submit
// @access  Private (Requester)
const submitPermit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [permits] = await pool.query('SELECT * FROM permits WHERE id = ?', [id]);
    
    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    const permit = permits[0];

    if (permit.created_by_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (permit.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Permit already submitted'
      });
    }

    await pool.query(
      'UPDATE permits SET status = ? WHERE id = ?',
      ['Pending_Approval', id]
    );

    res.status(200).json({
      success: true,
      message: 'Permit submitted for approval'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete permit
// @route   DELETE /api/v1/permits/:id
// @access  Private (Admin, Requester - own drafts only)
const deletePermit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [permits] = await pool.query('SELECT * FROM permits WHERE id = ?', [id]);
    
    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    const permit = permits[0];

    // Check permissions
    if (req.user.role !== 'Admin') {
      if (permit.created_by_user_id !== req.user.id || permit.status !== 'Draft') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this permit'
        });
      }
    }

    await pool.query('DELETE FROM permits WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Permit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/v1/permits/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // Total permits
    const [[totalPermits]] = await pool.query(
      'SELECT COUNT(*) as total FROM permits'
    );

    // Active permits
    const [[activePermits]] = await pool.query(
      'SELECT COUNT(*) as total FROM permits WHERE status = "Active"'
    );

    // Pending approvals
    const [[pendingApprovals]] = await pool.query(
      'SELECT COUNT(*) as total FROM permits WHERE status = "Pending_Approval"'
    );

    // Permits by type
    const [permitsByType] = await pool.query(`
      SELECT permit_type, COUNT(*) as count 
      FROM permits 
      GROUP BY permit_type
    `);

    // Recent permits
    const [recentPermits] = await pool.query(`
      SELECT p.*, u.full_name as creator_name, s.name as site_name
      FROM permits p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN sites s ON p.site_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        totalPermits: totalPermits.total,
        activePermits: activePermits.total,
        pendingApprovals: pendingApprovals.total,
        permitsByType,
        recentPermits
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermits,
  getPermitById,
  createPermit,
  updatePermit,
  submitPermit,
  deletePermit,
  getDashboardStats
};