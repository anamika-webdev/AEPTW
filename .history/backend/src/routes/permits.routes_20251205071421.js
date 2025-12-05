// backend/src/routes/permits.routes.js
// COMPLETE WORKFLOW IMPLEMENTATION

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// IMPORTANT: Route Order Matters!
// Specific routes (like /my-initiated) MUST come BEFORE parameterized routes (like /:id)
// Otherwise Express will match /my-initiated to /:id with id="my-initiated"
// ============================================================================

// ============================================================================
// ADMIN ROUTES - Get All Permits
// ============================================================================

// GET /api/permits - Get all permits (Admin view)
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/permits - Fetching all permits');
    
    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        u.full_name as created_by_name,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    console.log(`✅ Found ${permits.length} total permits`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching all permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permits',
      error: error.message
    });
  }
});

// ============================================================================
// SUPERVISOR ROUTES - Get Permits by Status
// ============================================================================

// GET /api/permits/my-initiated - Initiated PTWs (waiting for approval)
router.get('/my-initiated', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-initiated - User: ${userId}`);

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Initiated'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);

    console.log(`✅ Found ${permits.length} initiated PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching initiated PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching initiated PTWs',
      error: error.message
    });
  }
});

// GET /api/permits/my-approved - Approved PTWs (waiting for final submit)
router.get('/my-approved', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-approved - User: ${userId}`);

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Approved'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);

    console.log(`✅ Found ${permits.length} approved PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching approved PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved PTWs',
      error: error.message
    });
  }
});

// GET /api/permits/my-ready-to-start - Ready to start PTWs
router.get('/my-ready-to-start', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-ready-to-start - User: ${userId}`);

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Ready_To_Start'
      GROUP BY p.id
      ORDER BY p.start_time ASC
    `, [userId]);

    console.log(`✅ Found ${permits.length} ready-to-start PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching ready-to-start PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ready-to-start PTWs',
      error: error.message
    });
  }
});

// GET /api/permits/my-in-progress - In progress PTWs (Active)
router.get('/my-in-progress', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-in-progress - User: ${userId}`);

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Active'
      GROUP BY p.id
      ORDER BY p.started_at DESC
    `, [userId]);

    console.log(`✅ Found ${permits.length} in-progress PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching in-progress PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching in-progress PTWs',
      error: error.message
    });
  }
});

// GET /api/permits/my-closed - Closed PTWs
router.get('/my-closed', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-closed - User: ${userId}`);

    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Closed'
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `, [userId]);

    console.log(`✅ Found ${permits.length} closed PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching closed PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching closed PTWs',
      error: error.message
    });
  }
});

// ============================================================================
// WORKFLOW ACTION ROUTES
// ============================================================================

// POST /api/permits/:id/final-submit - Supervisor does final submit after all approvals
router.post('/:id/final-submit', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`📥 POST /api/permits/${id}/final-submit - User: ${userId}`);
    
    // Get permit details
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ?`,
      [id]
    );
    
    if (permits.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    const permit = permits[0];
    
    // Verify user is the creator
    if (permit.created_by_user_id !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only the permit creator can do final submit'
      });
    }
    
    // Verify status is 'Approved'
    if (permit.status !== 'Approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot final submit. Current status: ${permit.status}. Must be 'Approved'.`
      });
    }
    
    // Verify all assigned approvers have approved
    const approvalChecks = [];
    
    if (permit.area_manager_id) {
      if (permit.area_manager_status !== 'Approved') {
        approvalChecks.push('Area Manager has not approved yet');
      }
    }
    
    if (permit.safety_officer_id) {
      if (permit.safety_officer_status !== 'Approved') {
        approvalChecks.push('Safety Officer has not approved yet');
      }
    }
    
    if (permit.site_leader_id) {
      if (permit.site_leader_status !== 'Approved') {
        approvalChecks.push('Site Leader has not approved yet');
      }
    }
    
    if (approvalChecks.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Not all approvers have approved',
        details: approvalChecks
      });
    }
    
    // Update permit status to Ready_To_Start
    await connection.query(
      `UPDATE permits 
       SET status = 'Ready_To_Start',
           final_submitted_at = NOW(),
           final_submitted_by_user_id = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [userId, id]
    );
    
    await connection.commit();
    
    console.log(`✅ Permit ${id} final submitted - Status: Ready_To_Start`);
    
    res.json({
      success: true,
      message: 'PTW final submitted successfully',
      data: {
        permit_id: id,
        status: 'Ready_To_Start',
        final_submitted_at: new Date()
      }
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error in final submit:', error);
    res.status(500).json({
      success: false,
      message: 'Error doing final submit',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/permits/:id/start - Start PTW (work begins)
router.post('/:id/start', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`📥 POST /api/permits/${id}/start - User: ${userId}`);
    
    // Get permit details
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ?`,
      [id]
    );
    
    if (permits.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    const permit = permits[0];
    
    // Verify user is the creator
    if (permit.created_by_user_id !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only the permit creator can start the PTW'
      });
    }
    
    // Verify status is 'Ready_To_Start'
    if (permit.status !== 'Ready_To_Start') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot start PTW. Current status: ${permit.status}. Must be 'Ready_To_Start'.`
      });
    }
    
    // Check if current time >= start_time
    const now = new Date();
    const startTime = new Date(permit.start_time);
    
    if (now < startTime) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot start PTW before scheduled start time: ${startTime.toLocaleString()}`
      });
    }
    
    // Update permit status to Active
    await connection.query(
      `UPDATE permits 
       SET status = 'Active',
           started_at = NOW(),
           started_by_user_id = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [userId, id]
    );
    
    await connection.commit();
    
    console.log(`✅ Permit ${id} started - Status: Active`);
    
    res.json({
      success: true,
      message: 'PTW started successfully',
      data: {
        permit_id: id,
        status: 'Active',
        started_at: new Date()
      }
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error starting PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting PTW',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});
// GET /api/permits/my-initiated - Get PTWs waiting for approval
router.get('/my-initiated', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📥 GET /api/permits/my-initiated - User: ${userId}`);
    
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status,
        p.area_manager_status,
        p.safety_officer_status,
        p.site_leader_status,
        p.created_at,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Initiated'
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} initiated PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching initiated PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching initiated PTWs',
      error: error.message
    });
  }
});

// GET /api/permits/my-approved - Get PTWs approved and ready for final submit
router.get('/my-approved', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📥 GET /api/permits/my-approved - User: ${userId}`);
    
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status,
        p.area_manager_status,
        p.safety_officer_status,
        p.site_leader_status,
        p.created_at,
        p.updated_at,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Approved'
      GROUP BY p.id
      ORDER BY p.updated_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} approved PTWs ready for final submit`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching approved PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved PTWs',
      error: error.message
    });
  }
});

// GET /api/permits/my-rejected - Get rejected PTWs
router.get('/my-rejected', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📥 GET /api/permits/my-rejected - User: ${userId}`);
    
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status,
        p.rejection_reason,
        p.area_manager_status,
        p.safety_officer_status,
        p.site_leader_status,
        p.created_at,
        p.updated_at,
        s.name as site_name,
        s.site_code,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE p.created_by_user_id = ?
      AND p.status = 'Rejected'
      GROUP BY p.id
      ORDER BY p.updated_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} rejected PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching rejected PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rejected PTWs',
      error: error.message
    });
  }
});

// ============================================================================
// GET PERMIT BY ID - Must come AFTER all specific routes
// ============================================================================

// GET /api/permits/:id - Get permit by ID with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching permit details for ID: ${id}`);
    
    // Get permit details
    const [permits] = await pool.query(`
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        s.address as site_address,
        u.full_name as created_by_name,
        u.email as created_by_email,
        u.phone as created_by_contact,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.id = ?
    `, [id]);
    
    if (permits.length === 0) {
      console.log(`⚠️ Permit not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    const permit = permits[0];
    console.log(`✅ Found permit: ${permit.permit_serial}`);
    
    // Get team members
    const [teamMembers] = await pool.query(
      `SELECT * FROM permit_team_members WHERE permit_id = ? ORDER BY id`,
      [id]
    );
    
    // Get hazards
    const [hazards] = await pool.query(
      `SELECT ph.*, mh.name as hazard_name 
       FROM permit_hazards ph
       LEFT JOIN master_hazards mh ON ph.hazard_id = mh.id
       WHERE ph.permit_id = ?`,
      [id]
    );
    
    // Get PPE
    const [ppe] = await pool.query(
      `SELECT pp.*, mp.name as ppe_name 
       FROM permit_ppe pp
       LEFT JOIN master_ppe mp ON pp.ppe_id = mp.id
       WHERE pp.permit_id = ?`,
      [id]
    );
    
    // Get checklist responses
    const [checklistResponses] = await pool.query(
      `SELECT pcr.*, mcq.question_text 
       FROM permit_checklist_responses pcr
       LEFT JOIN master_checklist_questions mcq ON pcr.question_id = mcq.id
       WHERE pcr.permit_id = ?
       ORDER BY pcr.question_id`,
      [id]
    );
    
    // Combine all data
    const fullPermit = {
      ...permit,
      team_members: teamMembers,
      hazards: hazards,
      ppe: ppe,
      checklist_responses: checklistResponses
    };
    
    res.json({
      success: true,
      data: fullPermit
    });
    
  } catch (error) {
    console.error('❌ Error fetching permit details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permit details',
      error: error.message
    });
  }
});

// ============================================================================
// CREATE PERMIT
// ============================================================================

// POST /api/permits - Create new permit
router.post('/', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const userId = req.user.id;
    console.log('📥 Creating new PTW (Initiated)...');
    
    const {
      site_id,
      permit_types,
      work_description,
      work_location,
      start_time,
      end_time,
      receiver_name,
      receiver_contact,
      permit_initiator,
      permit_initiator_contact,
      issue_department,
      team_members,
      hazard_ids,
      ppe_ids,
      control_measures,
      other_hazards,
      checklist_responses,
      swms_file_url,
      swms_text,
      area_manager_id,
      safety_officer_id,
      site_leader_id
    } = req.body;

    // Validation - at least one approver required
    if (!area_manager_id && !safety_officer_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least Area Manager or Safety Officer must be assigned'
      });
    }

    // Generate permit serial
    const [lastPermit] = await connection.query(
      'SELECT permit_serial FROM permits ORDER BY id DESC LIMIT 1'
    );
    
    let serialNumber = 1;
    if (lastPermit.length > 0 && lastPermit[0].permit_serial) {
      const lastSerial = lastPermit[0].permit_serial.split('-')[1];
      serialNumber = parseInt(lastSerial) + 1;
    }
    const permit_serial = `PTW-${String(serialNumber).padStart(4, '0')}`;

    // Determine initial status
    const hasApprovers = area_manager_id || safety_officer_id || site_leader_id;
    const initialStatus = hasApprovers ? 'Initiated' : 'Active';

    console.log(`✅ Creating PTW: {
  serial: '${permit_serial}',
  status: '${initialStatus}',
  approvers: { 
    area_manager: ${!!area_manager_id}, 
    safety_officer: ${!!safety_officer_id}, 
    site_leader: ${!!site_leader_id}
  }
}`);

    // Insert permit
    const [result] = await connection.query(`
      INSERT INTO permits (
        permit_serial,
        site_id,
        permit_type,
        work_description,
        work_location,
        start_time,
        end_time,
        receiver_name,
        receiver_contact,
        permit_initiator,
        permit_initiator_contact,
        issue_department,
        control_measures,
        other_hazards,
        swms_file_url,
        swms_text,
        created_by_user_id,
        area_manager_id,
        safety_officer_id,
        site_leader_id,
        area_manager_status,
        safety_officer_status,
        site_leader_status,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      permit_serial,
      site_id,
      Array.isArray(permit_types) ? permit_types.join(',') : permit_types,
      work_description,
      work_location,
      start_time,
      end_time,
      receiver_name,
      receiver_contact || null,
      permit_initiator,
      permit_initiator_contact || null,
      issue_department || null,
      control_measures || null,
      other_hazards || null,
      swms_file_url || null,
      swms_text || null,
      userId,
      area_manager_id || null,
      safety_officer_id || null,
      site_leader_id || null,
      area_manager_id ? 'Pending' : null,
      safety_officer_id ? 'Pending' : null,
      site_leader_id ? 'Pending' : null,
      initialStatus
    ]);

    const permitId = result.insertId;
    console.log(`✅ Permit created with ID: ${permitId}`);

    // Insert team members
    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        await connection.query(`
          INSERT INTO permit_team_members (
            permit_id, worker_name, company_name, badge_id, 
            worker_role, contact_number
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          permitId,
          member.worker_name,
          member.company_name || null,
          member.badge_id || null,
          member.worker_role || null,
          member.contact_number || null
        ]);
      }
      console.log(`✅ Inserted ${team_members.length} team members`);
    }

    // Insert hazards
    if (hazard_ids && hazard_ids.length > 0) {
      for (const hazardId of hazard_ids) {
        await connection.query(
          'INSERT INTO permit_hazards (permit_id, hazard_id) VALUES (?, ?)',
          [permitId, hazardId]
        );
      }
      console.log(`✅ Inserted ${hazard_ids.length} hazards`);
    }

    // Insert PPE
    if (ppe_ids && ppe_ids.length > 0) {
      for (const ppeId of ppe_ids) {
        await connection.query(
          'INSERT INTO permit_ppe (permit_id, ppe_id) VALUES (?, ?)',
          [permitId, ppeId]
        );
      }
      console.log(`✅ Inserted ${ppe_ids.length} PPE items`);
    }

    // Insert checklist responses
    if (checklist_responses && checklist_responses.length > 0) {
      for (const response of checklist_responses) {
        await connection.query(`
          INSERT INTO permit_checklist_responses (
            permit_id, question_id, response, remarks
          ) VALUES (?, ?, ?, ?)
        `, [
          permitId,
          response.question_id,
          response.response,
          response.remarks || null
        ]);
      }
      console.log(`✅ Inserted ${checklist_responses.length} checklist responses`);
    }

    // Create notifications for approvers if status is Initiated
    if (initialStatus === 'Initiated') {
      const approverNotifications = [];
      
      if (area_manager_id) {
        approverNotifications.push({
          user_id: area_manager_id,
          role: 'Area Manager'
        });
      }
      
      if (safety_officer_id) {
        approverNotifications.push({
          user_id: safety_officer_id,
          role: 'Safety Officer'
        });
      }
      
      if (site_leader_id) {
        approverNotifications.push({
          user_id: site_leader_id,
          role: 'Site Leader'
        });
      }

      for (const approver of approverNotifications) {
        await connection.query(`
          INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
          VALUES (?, ?, 'APPROVAL_REQUEST', ?, NOW())
        `, [
          approver.user_id,
          permitId,
          `PTW ${permit_serial} requires your approval as ${approver.role}`
        ]);
      }
      
      console.log(`✅ Created ${approverNotifications.length} approval notifications`);
    }

    await connection.commit();
    console.log('✅ Transaction committed successfully');

    res.status(201).json({
      success: true,
      message: `Permit created successfully with status: ${initialStatus}`,
      data: {
        id: permitId,
        permit_serial: permit_serial,
        status: initialStatus
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error creating PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating permit',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ============================================================================
// UPDATE & DELETE ROUTES
// ============================================================================

// PUT /api/permits/:id - Update permit
router.put('/:id', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    const updateFields = req.body;
    
    // Build dynamic update query
    const allowedFields = [
      'work_description', 'work_location', 'start_time', 'end_time',
      'receiver_name', 'receiver_contact', 'control_measures', 
      'other_hazards', 'status'
    ];
    
    const updates = [];
    const values = [];
    
    Object.keys(updateFields).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(updateFields[key]);
      }
    });
    
    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    await connection.query(
      `UPDATE permits SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Permit updated successfully'
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error updating permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permit',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/permits/:id - Delete permit
router.delete('/:id', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Delete related records first
    await connection.query('DELETE FROM permit_team_members WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_hazards WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_ppe WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_checklist_responses WHERE permit_id = ?', [id]);
    
    // Delete notifications
    await connection.query('DELETE FROM notifications WHERE permit_id = ?', [id]);
    
    // Delete the permit
    await connection.query('DELETE FROM permits WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Permit deleted successfully'
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error deleting permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting permit',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ============================================================================
// EXTEND & CLOSE ROUTES
// ============================================================================

// POST /api/permits/:id/request-extension - Request extension
router.post('/:id/request-extension', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    const userId = req.user.id;
    
    // Insert extension request
    await connection.query(`
      INSERT INTO permit_extensions (
        permit_id, requested_by_user_id, requested_at,
        new_end_time, reason, status
      ) VALUES (?, ?, NOW(), ?, ?, 'Pending')
    `, [id, userId, new_end_time, reason]);
    
    // Update permit status
    await connection.query(
      `UPDATE permits SET status = 'Extension_Requested', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Extension requested successfully'
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error requesting extension:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting extension',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/permits/:id/close - Close permit
router.post('/:id/close', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { housekeeping_done, tools_removed, locks_removed, area_restored, remarks } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (
      housekeeping_done === undefined || 
      tools_removed === undefined || 
      locks_removed === undefined || 
      area_restored === undefined
    ) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required checklist fields'
      });
    }
    
    // Check if permit exists
    const [permits] = await connection.query(
      'SELECT id, status FROM permits WHERE id = ?',
      [id]
    );
    
    if (permits.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    // Try to insert into permit_closure table (if it exists)
    try {
      await connection.query(`
        INSERT INTO permit_closure (
          permit_id, closed_by_user_id, closed_at,
          housekeeping_done, tools_removed, locks_removed, 
          area_restored, remarks
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
      `, [
        id, userId,
        housekeeping_done ? 1 : 0,
        tools_removed ? 1 : 0,
        locks_removed ? 1 : 0,
        area_restored ? 1 : 0,
        remarks || null
      ]);
    } catch (err) {
      console.log('⚠️ permit_closure table may not exist, skipping...');
    }
    
    // Update permit status to Closed
    await connection.query(
      `UPDATE permits SET status = 'Closed', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Permit closed successfully'
    });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error closing permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing permit',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;