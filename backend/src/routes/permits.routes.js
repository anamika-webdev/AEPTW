// backend/src/routes/permits.routes.js
// COMPLETE WORKFLOW IMPLEMENTATION - CLEANED VERSION

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // Import upload middleware

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// IMPORTANT: Route Order Matters!
// Specific routes (like /my-initiated) MUST come BEFORE parameterized routes (like /:id)
// Otherwise Express will match /my-initiated to /:id with id="my-initiated"
// ============================================================================

// ============================================================================
// SUPERVISOR ROUTES - Get Permits by Status (MUST BE FIRST)
// ============================================================================
// POST /api/permits/:id/request-extension - Request PTW extension
router.post('/:id/request-extension', async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    const userId = req.user.id;

    console.log(`📥 POST /api/permits/${id}/request-extension - User: ${userId}`);

    if (!new_end_time || !reason) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: new_end_time, reason'
      });
    }

    // Get permit details including current approvers
    const [permits] = await connection.query(
      `SELECT 
        id,
        permit_serial,
        status,
        end_time,
        site_leader_id,
        safety_officer_id,
        created_by_user_id
      FROM permits 
      WHERE id = ?`,
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

    // Only Active permits can be extended
    if (permit.status !== 'Active' && permit.status !== 'Extension_Requested') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot extend permit with status: ${permit.status}. Only Active permits can be extended.`
      });
    }

    // Verify that new end time is after current end time
    const currentEndTime = new Date(permit.end_time);
    const requestedEndTime = new Date(new_end_time);

    if (requestedEndTime <= currentEndTime) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'New end time must be after current end time'
      });
    }

    console.log(`📋 Original Permit Approvers:`, {
      site_leader_id: permit.site_leader_id,
      safety_officer_id: permit.safety_officer_id
    });

    // Insert extension request with approvers from the original permit
    const [extensionResult] = await connection.query(`
      INSERT INTO permit_extensions (
        permit_id, 
        requested_by_user_id, 
        requested_at,
        original_end_time,
        new_end_time, 
        reason, 
        status,
        site_leader_id,
        site_leader_status,
        safety_officer_id,
        safety_officer_status
      ) VALUES (?, ?, NOW(), ?, ?, ?, 'Pending', ?, ?, ?, ?)
    `, [
      id,
      userId,
      permit.end_time,
      new_end_time,
      reason,
      permit.site_leader_id || null,
      permit.site_leader_id ? 'Pending' : null,
      permit.safety_officer_id || null,
      permit.safety_officer_id ? 'Pending' : null
    ]);

    const extensionId = extensionResult.insertId;

    console.log(`✅ Extension request created with ID: ${extensionId}`);
    console.log(`📋 Extension Approvers assigned:`, {
      site_leader_id: permit.site_leader_id,
      safety_officer_id: permit.safety_officer_id
    });

    // Update permit status to Extension_Requested
    await connection.query(
      `UPDATE permits 
       SET status = 'Extension_Requested', 
           updated_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    console.log(`✅ Permit ${permit.permit_serial} status changed to Extension_Requested`);

    // Create notifications for approvers
    const approverNotifications = [];

    if (permit.site_leader_id) {
      approverNotifications.push({
        user_id: permit.site_leader_id,
        role: 'Site Leader'
      });
    }

    if (permit.safety_officer_id) {
      approverNotifications.push({
        user_id: permit.safety_officer_id,
        role: 'Safety In-charge'
      });
    }

    for (const approver of approverNotifications) {
      await connection.query(`
        INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
        VALUES (?, ?, 'EXTENSION_REQUEST', ?, NOW())
      `, [
        approver.user_id,
        id,
        `Extension request for PTW ${permit.permit_serial} requires your approval as ${approver.role}. Requested by supervisor to extend until ${new Date(new_end_time).toLocaleString()}.`
      ]);
    }

    console.log(`✅ Created ${approverNotifications.length} extension approval notifications`);

    await connection.commit();

    res.json({
      success: true,
      message: 'Extension requested successfully. Awaiting approval from Site Leader and Safety In-charge.',
      data: {
        extension_id: extensionId,
        permit_id: id,
        original_end_time: permit.end_time,
        new_end_time,
        status: 'Extension_Requested',
        approvers_notified: approverNotifications.map(a => a.role)
      }
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
      ORDER BY p.updated_at DESC
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

// GET /api/permits/my-rejected - Get rejected PTWs
router.get('/my-rejected', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-rejected - User: ${userId}`);

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
      AND p.status = 'Rejected'
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `, [userId]);

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

// GET /api/permits/my-active - Active/in-progress PTWs
router.get('/my-active', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-active - User: ${userId}`);

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
      AND p.status = 'Active'
      GROUP BY p.id
      ORDER BY p.started_at DESC
    `, [userId]);

    console.log(`✅ Found ${permits.length} active PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching active PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active PTWs',
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

// GET /api/permits/my-extended - Extended/Extension Requested PTWs
router.get('/my-extended', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 GET /api/permits/my-extended - User: ${userId}`);

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
      AND p.status IN ('Extension_Requested', 'Extended')
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `, [userId]);

    console.log(`✅ Found ${permits.length} extended PTWs`);

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('❌ Error fetching extended PTWs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching extended PTWs',
      error: error.message
    });
  }
});

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
// CREATE PERMIT
// ============================================================================

// POST /api/permits - Create new permit
router.post('/', async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const userId = req.user.id;
    console.log('📥 Creating new PTW...');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

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
      issuer_signature,
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

    // Validation
    if (!site_id || !work_description || !work_location || !start_time || !end_time) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: site_id, work_description, work_location, start_time, end_time'
      });
    }

    // At least one approver required
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

    console.log(`✅ Creating PTW: ${permit_serial}, Status: ${initialStatus}`);

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
        issuer_signature,    
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      permit_serial,
      site_id,
      Array.isArray(permit_types) ? permit_types.join(',') : permit_types,
      work_description,
      work_location,
      start_time,
      end_time,
      receiver_name || null,
      receiver_contact || null,
      permit_initiator || null,
      permit_initiator_contact || null,
      issue_department || null,
      issuer_signature || null,
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

    // Create notifications for approvers
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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating permit',
      error: error.message,
      details: error.stack
    });
  } finally {
    if (connection) connection.release();
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

    // Update permit status to Ready_To_Start
    await connection.query(
      `UPDATE permits 
       SET status = 'Ready_To_Start',
           final_submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [id]
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

    // Update permit status to Active
    await connection.query(
      `UPDATE permits 
       SET status = 'Active',
           started_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [id]
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
// GET /api/permits/:id - Get permit by ID with ALL details
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/permits/${id} - Fetching complete permit details`);

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permit ID'
      });
    }

    // Get permit details with all joins
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
        message: `Permit with ID ${id} not found`
      });
    }

    const permit = permits[0];
    console.log(`✅ Found permit: ${permit.permit_serial}`);

    // Get team members
    let teamMembers = [];
    try {
      const [members] = await pool.query(
        `SELECT id, name, role, contact_number 
         FROM permit_team_members 
         WHERE permit_id = ? 
         ORDER BY id`,
        [id]
      );
      teamMembers = members;
      console.log(`📋 Found ${teamMembers.length} team members`);
    } catch (err) {
      console.log('⚠️ Error fetching team members (table may not exist):', err.message);
    }

    // Get hazards
    let hazards = [];
    try {
      const [haz] = await pool.query(`
        SELECT h.id, h.name, h.description
        FROM permit_hazards ph
        JOIN master_hazards h ON ph.hazard_id = h.id
        WHERE ph.permit_id = ?
        ORDER BY h.id
      `, [id]);
      hazards = haz;
      console.log(`⚠️ Found ${hazards.length} hazards`);
    } catch (err) {
      console.log('⚠️ Error fetching hazards (tables may not exist):', err.message);
    }

    // Get PPE
    let ppe = [];
    try {
      const [ppeItems] = await pool.query(`
        SELECT p.id, p.name, p.description
        FROM permit_ppe pp
        JOIN master_ppe p ON pp.ppe_id = p.id
        WHERE pp.permit_id = ?
        ORDER BY p.id
      `, [id]);
      ppe = ppeItems;
      console.log(`🛡️ Found ${ppe.length} PPE items`);
    } catch (err) {
      console.log('⚠️ Error fetching PPE (tables may not exist):', err.message);
    }

    // Get checklist responses
    let checklistResponses = [];
    try {
      const [responses] = await pool.query(`
        SELECT 
          cr.id,
          mq.question,
          cr.response,
          cr.remarks
        FROM permit_checklist_responses cr
        JOIN master_checklist_questions mq ON cr.question_id = mq.id
        WHERE cr.permit_id = ?
        ORDER BY mq.id
      `, [id]);
      checklistResponses = responses;
      console.log(`✅ Found ${checklistResponses.length} checklist responses`);
    } catch (err) {
      console.log('⚠️ Error fetching checklist (tables may not exist):', err.message);
    }

    // Get extensions
    let extensions = [];
    try {
      const [exts] = await pool.query(`
        SELECT 
          pe.*,
          u.full_name as requested_by_name,
          u.email as requested_by_email
        FROM permit_extensions pe
        LEFT JOIN users u ON pe.requested_by_user_id = u.id
        WHERE pe.permit_id = ?
        ORDER BY pe.requested_at DESC
      `, [id]);
      extensions = exts;
      console.log(`✅ Found ${extensions.length} extensions`);
    } catch (err) {
      console.log('⚠️ Error fetching extensions:', err.message);
    }

    // Return complete permit details
    console.log('✅ Sending complete permit data');
    res.json({
      success: true,
      data: {
        permit,
        team_members: teamMembers,
        hazards,
        ppe,
        checklist_responses: checklistResponses,
        extensions: extensions
      }
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
// POST /api/permits/:id/request-extension - Request PTW Extension
// ============================================================================
router.post('/:id/request-extension', async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    const userId = req.user.id;

    console.log(`📥 POST /api/permits/${id}/request-extension - User: ${userId}`);
    console.log('Extension data:', { new_end_time, reason });

    // Validate inputs
    if (!new_end_time || !reason) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'New end time and reason are required'
      });
    }

    // Check if permit exists and is in Active status
    const [permits] = await connection.query(
      'SELECT id, status, permit_serial, site_leader_id, safety_officer_id FROM permits WHERE id = ?',
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

    if (permit.status !== 'Active' && permit.status !== 'Extension_Requested') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot extend permit with status: ${permit.status}. Only Active permits can be extended.`
      });
    }

    // Insert extension request into permit_extensions table
    try {
      await connection.query(`
        INSERT INTO permit_extensions (
          permit_id, 
          requested_by_user_id, 
          requested_at,
          new_end_time, 
          reason, 
          status,
          site_leader_id,
          site_leader_status,
          safety_officer_id,
          safety_officer_status
        ) VALUES (?, ?, NOW(), ?, ?, 'Pending', ?, 'Pending', ?, 'Pending')
      `, [id, userId, new_end_time, reason, permit.site_leader_id, permit.safety_officer_id]);

      console.log('✅ Extension request inserted into permit_extensions with approvers');
    } catch (err) {
      console.log('⚠️ permit_extensions table may not exist or missing columns:', err.message);
      throw err;
    }

    // Update permit status to Extension_Requested
    await connection.query(
      `UPDATE permits 
       SET status = 'Extension_Requested', 
           updated_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    console.log(`✅ Permit ${permit.permit_serial} status changed to Extension_Requested`);

    await connection.commit();

    res.json({
      success: true,
      message: 'Extension requested successfully',
      data: {
        permit_id: id,
        new_end_time,
        status: 'Extension_Requested'
      }
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

// ============================================================================
// POST /api/permits/:id/close - Close PTW
// ============================================================================
router.post('/:id/close', upload.array('images', 10), async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const userId = req.user.id;

    // Parse body (multipart/form-data converts booleans to strings)
    const housekeeping_done = req.body.housekeeping_done === 'true';
    const tools_removed = req.body.tools_removed === 'true';
    const locks_removed = req.body.locks_removed === 'true';
    const area_restored = req.body.area_restored === 'true';
    const remarks = req.body.remarks;

    // Parse evidence metadata
    const { descriptions, categories, timestamps, latitudes, longitudes } = req.body;

    console.log(`📥 POST /api/permits/${id}/close - User: ${userId}`);
    console.log('Closure data:', { housekeeping_done, tools_removed, locks_removed, area_restored, remarks });

    // Validate required fields
    if (
      req.body.housekeeping_done === undefined ||
      req.body.tools_removed === undefined ||
      req.body.locks_removed === undefined ||
      req.body.area_restored === undefined
    ) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'All checklist items are required: housekeeping_done, tools_removed, locks_removed, area_restored'
      });
    }

    // Check if all items are true
    if (!housekeeping_done || !tools_removed || !locks_removed || !area_restored) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'All checklist items must be completed before closing the permit'
      });
    }

    // Check if permit exists and is in Active status
    const [permits] = await connection.query(
      'SELECT id, status, permit_serial FROM permits WHERE id = ?',
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

    if (permit.status !== 'Active' && permit.status !== 'Extension_Requested' && permit.status !== 'Extended' && permit.status !== 'Ready_To_Start') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot close permit with status: ${permit.status}. Only Active, Ready To Start, or Extended permits can be closed.`
      });
    }

    // Insert closure record into permit_closure table
    let closureId;
    try {
      const [result] = await connection.query(`
        INSERT INTO permit_closure (
          permit_id, 
          closed_by_user_id, 
          closed_at,
          housekeeping_done, 
          tools_removed, 
          locks_removed, 
          area_restored, 
          remarks
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
      `, [id, userId, housekeeping_done, tools_removed, locks_removed, area_restored, remarks || null]);

      closureId = result.insertId;
      console.log('✅ Closure record inserted into permit_closure, ID:', closureId);
    } catch (err) {
      console.error('❌ Error creating closure record:', err);
      throw err;
    }

    // Handle Evidence Uploads
    if (req.files && req.files.length > 0) {
      const descArray = JSON.parse(descriptions || '[]');
      const catArray = JSON.parse(categories || '[]');
      const timeArray = JSON.parse(timestamps || '[]');
      const latArray = JSON.parse(latitudes || '[]');
      const lonArray = JSON.parse(longitudes || '[]');
      const files = req.files;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `/uploads/closure/${file.filename}`;

        await connection.query(
          `INSERT INTO permit_closure_evidence (
            closure_id, 
            permit_id, 
            file_path, 
            category,
            description, 
            timestamp, 
            latitude, 
            longitude,
            captured_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            closureId,
            id,
            filePath,
            catArray[i] || 'other',
            descArray[i] || null,
            timeArray[i] || new Date(),
            latArray[i] || null,
            lonArray[i] || null,
            userId
          ]
        );
      }
      console.log(`✅ Uploaded ${files.length} closure evidence images`);
    }

    // Update permit status to Closed
    await connection.query(
      `UPDATE permits 
       SET status = 'Closed', 
           updated_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    console.log(`✅ Permit ${permit.permit_serial} closed successfully`);

    await connection.commit();

    res.json({
      success: true,
      message: 'Permit closed successfully',
      data: {
        permit_id: id,
        closed_at: new Date(),
        status: 'Closed'
      }
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

// ⭐ NEW: Upload closure evidence with photos
router.post('/:id/closure/evidence', authenticateToken, upload.array('images', 10), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { descriptions, categories, timestamps, latitudes, longitudes } = req.body;
    const userId = req.user.id;

    console.log(`📸 POST /api/permits/${id}/closure/evidence - User: ${userId}`);

    // Check if permit has closure
    const [closures] = await connection.query(
      'SELECT id FROM permit_closure WHERE permit_id = ?',
      [id]
    );

    if (closures.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permit closure not found. Please close the permit first.'
      });
    }

    const closureId = closures[0].id;

    // Parse arrays from request body
    const descArray = JSON.parse(descriptions || '[]');
    const catArray = JSON.parse(categories || '[]');
    const timeArray = JSON.parse(timestamps || '[]');
    const latArray = JSON.parse(latitudes || '[]');
    const lonArray = JSON.parse(longitudes || '[]');

    const files = req.files;
    const evidenceRecords = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `/uploads/closure/${file.filename}`;

      const [result] = await connection.query(
        `INSERT INTO permit_closure_evidence (
          closure_id, 
          permit_id, 
          file_path, 
          category,
          description, 
          timestamp, 
          latitude, 
          longitude,
          captured_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          closureId,
          id,
          filePath,
          catArray[i] || 'other',
          descArray[i] || null,
          timeArray[i] || new Date(),
          latArray[i] || null,
          lonArray[i] || null,
          userId
        ]
      );

      evidenceRecords.push({
        id: result.insertId,
        file_path: filePath,
        category: catArray[i] || 'other',
        description: descArray[i] || null,
        timestamp: timeArray[i] || new Date(),
        latitude: latArray[i] || null,
        longitude: lonArray[i] || null
      });
    }

    console.log(`✅ Uploaded ${evidenceRecords.length} closure evidence images`);

    res.json({
      success: true,
      message: 'Closure evidence uploaded successfully',
      data: evidenceRecords
    });

  } catch (error) {
    console.error('❌ Error uploading closure evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload closure evidence',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ⭐ NEW: Get closure evidence for a permit
router.get('/:id/closure/evidence', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [evidence] = await pool.query(
      `SELECT 
        pce.*,
        u.full_name as captured_by_name
      FROM permit_closure_evidence pce
      LEFT JOIN users u ON pce.captured_by_user_id = u.id
      WHERE pce.permit_id = ?
      ORDER BY pce.timestamp DESC`,
      [id]
    );

    res.json({
      success: true,
      data: evidence
    });

  } catch (error) {
    console.error('❌ Error fetching closure evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch closure evidence'
    });
  }
});
module.exports = router;