// backend/src/routes/permits.routes.js - CORRECTED FOR ACTUAL DATABASE SCHEMA
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);


//  POST /api/permits route 

router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('📥 Creating new PTW (Initiated)...');
    await connection.beginTransaction();
    
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
      team_members = [],
      hazard_ids = [],
      ppe_ids = [],
      control_measures,
      other_hazards,
      checklist_responses = [],
      swms_file_url,
      swms_text,
      area_manager_id,
      safety_officer_id,
      site_leader_id
      // ❌ NO issuer_signature, area_manager_signature, etc. - Approvers will add signatures
    } = req.body;

    // Generate permit serial number
    const [lastPermit] = await connection.query(
      'SELECT permit_serial FROM permits ORDER BY id DESC LIMIT 1'
    );
    
    let newSerialNumber = 'PTW-0001';
    if (lastPermit.length > 0 && lastPermit[0].permit_serial) {
      const lastNumber = parseInt(lastPermit[0].permit_serial.split('-').pop());
      newSerialNumber = `PTW-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    const permit_type_string = Array.isArray(permit_types) ? permit_types.join(',') : (permit_types || 'General');
    const created_by_user_id = req.user?.id || 1;

    // ✅ CORRECT WORKFLOW: Always start as Initiated (Pending_Approval)
    const status = 'Initiated';  // or 'Pending_Approval'
    
    // Set approval statuses to Pending for all assigned approvers
    let area_manager_status = null;
    let safety_officer_status = null;
    let site_leader_status = null;
    
    if (area_manager_id) area_manager_status = 'Pending';
    if (safety_officer_id) safety_officer_status = 'Pending';
    if (site_leader_id) site_leader_status = 'Pending';
    
    const hasApprovers = area_manager_id || safety_officer_id || site_leader_id;
    
    if (!hasApprovers) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one approver must be assigned'
      });
    }

    console.log('✅ Creating PTW:', {
      serial: newSerialNumber,
      status: status,
      approvers: {
        area_manager: !!area_manager_id,
        safety_officer: !!safety_officer_id,
        site_leader: !!site_leader_id
      }
    });

    // Insert permit WITHOUT signatures (signatures added during approval)
    const [permitResult] = await connection.query(`
      INSERT INTO permits (
        permit_serial, site_id, created_by_user_id, permit_type,
        work_location, work_description, start_time, end_time,
        receiver_name, receiver_contact, permit_initiator,
        permit_initiator_contact, issue_department, control_measures,
        other_hazards, swms_file_url, swms_text, 
        area_manager_id, safety_officer_id, site_leader_id,
        area_manager_status, safety_officer_status, site_leader_status,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      newSerialNumber, site_id, created_by_user_id, permit_type_string,
      work_location || '', work_description || '', start_time, end_time,
      receiver_name || '', receiver_contact || '', permit_initiator || '',
      permit_initiator_contact || '', issue_department || '',
      control_measures || '', other_hazards || '', swms_file_url || null,
      swms_text || null, 
      area_manager_id || null, safety_officer_id || null, site_leader_id || null,
      area_manager_status, safety_officer_status, site_leader_status,
      status
    ]);

    const permitId = permitResult.insertId;

    // Insert team members
    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        await connection.query(`
          INSERT INTO permit_team_members (permit_id, worker_name, company_name, worker_role, badge_id, phone, email)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          permitId, 
          member.worker_name || '', 
          member.company_name || '', 
          member.worker_role || 'Worker', 
          member.badge_id || '', 
          member.phone || '', 
          member.email || ''
        ]);
      }
    }

    // Insert hazards
    if (hazard_ids && hazard_ids.length > 0) {
      for (const hazardId of hazard_ids) {
        await connection.query(`INSERT INTO permit_hazards (permit_id, hazard_id) VALUES (?, ?)`, [permitId, hazardId]);
      }
    }

    // Insert PPE
    if (ppe_ids && ppe_ids.length > 0) {
      for (const ppeId of ppe_ids) {
        await connection.query(`INSERT INTO permit_ppe (permit_id, ppe_id) VALUES (?, ?)`, [permitId, ppeId]);
      }
    }

    // Insert checklist
    if (checklist_responses && checklist_responses.length > 0) {
      for (const response of checklist_responses) {
        await connection.query(`
          INSERT INTO permit_checklist_responses (permit_id, question_id, response, remarks)
          VALUES (?, ?, ?, ?)
        `, [permitId, response.question_id || 0, response.response || 'N/A', response.remarks || null]);
      }
    }

    // Create notifications for approvers
    const notificationMessages = [];
    
    if (area_manager_id) {
      await connection.query(`
        INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
        VALUES (?, ?, 'APPROVAL_REQUEST', ?, NOW())
      `, [area_manager_id, permitId, `PTW ${newSerialNumber} requires your approval as Area Manager`]);
      notificationMessages.push(`Area Manager (ID: ${area_manager_id})`);
    }
    
    if (safety_officer_id) {
      await connection.query(`
        INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
        VALUES (?, ?, 'APPROVAL_REQUEST', ?, NOW())
      `, [safety_officer_id, permitId, `PTW ${newSerialNumber} requires your approval as Safety Officer`]);
      notificationMessages.push(`Safety Officer (ID: ${safety_officer_id})`);
    }
    
    if (site_leader_id) {
      await connection.query(`
        INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
        VALUES (?, ?, 'APPROVAL_REQUEST', ?, NOW())
      `, [site_leader_id, permitId, `PTW ${newSerialNumber} requires your approval as Site Leader`]);
      notificationMessages.push(`Site Leader (ID: ${site_leader_id})`);
    }

    await connection.commit();

    console.log('✅ PTW created successfully:', {
      id: permitId,
      serial: newSerialNumber,
      status: status,
      notifications_sent_to: notificationMessages
    });

    res.status(201).json({
      success: true,
      message: `PTW ${newSerialNumber} created and sent for approval`,
      data: { 
        id: permitId, 
        permit_serial: newSerialNumber,
        status: status,
        approvers_notified: notificationMessages.length
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating PTW',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// GET /api/permits/my-supervisor-permits - Get permits created by logged-in supervisor
router.get('/my-supervisor-permits', async (req, res) => {
  try {
    const userId = req.user.id; // From auth token
    
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
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    console.error('❌ Error fetching supervisor permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supervisor permits',
      error: error.message
    });
  }
});

// GET /api/permits/:id - Get permit by ID with details (CORRECTED FOR ACTUAL SCHEMA)
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
        u.phone as created_by_contact
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
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
    let teamMembers = [];
    try {
      const [result] = await pool.query(`
        SELECT * FROM permit_team_members WHERE permit_id = ?
      `, [id]);
      teamMembers = result || [];
      console.log(`✅ Found ${teamMembers.length} team members`);
    } catch (error) {
      console.error('⚠️ Error fetching team members:', error.message);
      teamMembers = [];
    }
    
    // Get hazards with CORRECTED column names (using 'name' instead of 'hazard_name')
    let hazards = [];
    try {
      const [result] = await pool.query(`
        SELECT 
          ph.id,
          ph.permit_id,
          ph.hazard_id,
          COALESCE(mh.name, 'Unknown Hazard') as hazard_name,
          COALESCE(mh.category, mh.risk_level, 'Medium') as risk_level,
          mh.description
        FROM permit_hazards ph
        LEFT JOIN master_hazards mh ON ph.hazard_id = mh.id
        WHERE ph.permit_id = ?
      `, [id]);
      hazards = result || [];
      console.log(`✅ Found ${hazards.length} hazards`);
    } catch (error) {
      console.error('⚠️ Error fetching hazards:', error.message);
      console.error('⚠️ If column error, check master_hazards table structure');
      hazards = [];
    }
    
    // Get PPE with CORRECTED column names (using 'name' instead of 'ppe_name')
    let ppe = [];
    try {
      const [result] = await pool.query(`
        SELECT 
          pp.id,
          pp.permit_id,
          pp.ppe_id,
          COALESCE(mp.name, 'Unknown PPE') as ppe_name,
          COALESCE(mp.category, mp.ppe_type, 'General') as ppe_type,
          mp.description
        FROM permit_ppe pp
        LEFT JOIN master_ppe mp ON pp.ppe_id = mp.id
        WHERE pp.permit_id = ?
      `, [id]);
      ppe = result || [];
      console.log(`✅ Found ${ppe.length} PPE items`);
    } catch (error) {
      console.error('⚠️ Error fetching PPE:', error.message);
      console.error('⚠️ If column error, check master_ppe table structure');
      ppe = [];
    }
    
    // Get checklist responses (already working correctly)
    let checklist = [];
    try {
      const [result] = await pool.query(`
        SELECT 
          pcr.id,
          pcr.permit_id,
          pcr.question_id,
          pcr.response,
          pcr.remarks,
          COALESCE(mcq.question_text, 'Question not found') as question_text,
          COALESCE(mcq.category, 'General') as category,
          mcq.is_mandatory,
          mcq.permit_type
        FROM permit_checklist_responses pcr
        LEFT JOIN master_checklist_questions mcq ON pcr.question_id = mcq.id
        WHERE pcr.permit_id = ?
        ORDER BY pcr.id
      `, [id]);
      checklist = result || [];
      console.log(`✅ Found ${checklist.length} checklist responses`);
    } catch (error) {
      console.error('⚠️ Error fetching checklist:', error.message);
      checklist = [];
    }
    
    // Get approvals (optional - may not exist in all setups)
    let approvals = [];
    try {
      const [result] = await pool.query(`
        SELECT 
          pa.*,
          u.full_name as approver_name,
          u.email as approver_email
        FROM permit_approvals pa
        LEFT JOIN users u ON pa.approver_user_id = u.id
        WHERE pa.permit_id = ?
        ORDER BY pa.approved_at DESC
      `, [id]);
      approvals = result || [];
      console.log(`✅ Found ${approvals.length} approvals`);
    } catch (error) {
      console.log('ℹ️ Approvals table may not exist (optional)');
      approvals = [];
    }
    
    console.log(`✅ Successfully assembled permit data for ID: ${id}`);
    
    res.json({
      success: true,
      data: {
        ...permit,
        team_members: teamMembers,
        hazards,
        ppe,
        checklist,
        approvals
      }
    });
  } catch (error) {
    console.error('❌ Error fetching permit details:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching permit details',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/permits - Create new permit (COMPLETE VERSION)
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('📥 Creating permit...');
    await connection.beginTransaction();
    
    const {
      site_id,
      permit_types,              // ✅ Array
      work_description,
      work_location,
      start_time,
      end_time,
      receiver_name,
      receiver_contact,
      permit_initiator,          // ✅ NEW
      permit_initiator_contact,  // ✅ NEW
      issue_department,          // ✅ NEW
      team_members = [],
      hazard_ids = [],
      ppe_ids = [],
      control_measures,          // ✅ NEW
      other_hazards,             // ✅ NEW
      checklist_responses = [],
      swms_file_url,
      swms_text,
      area_manager_id,
      safety_officer_id,
      site_leader_id,
      issuer_signature,
      area_manager_signature,
      safety_officer_signature,
      site_leader_signature
    } = req.body;

    // Generate permit number
    const [lastPermit] = await connection.query(
      'SELECT permit_serial FROM permits ORDER BY id DESC LIMIT 1'
    );
    
    let newSerialNumber = 'PTW-0001';
    if (lastPermit.length > 0 && lastPermit[0].permit_serial) {
      const lastNumber = parseInt(lastPermit[0].permit_serial.split('-').pop());
      newSerialNumber = `PTW-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    // Convert array to comma-separated string
    const permit_type_string = Array.isArray(permit_types) ? permit_types.join(',') : (permit_types || 'General');
    
    const created_by_user_id = req.user?.id || 1;

    let status;
    let area_manager_status = null;
    let safety_officer_status = null;
    let site_leader_status = null;

    const hasApprovers = area_manager_id || safety_officer_id || site_leader_id;

    if (hasApprovers) {
      status = 'Pending_Approval';
      if (area_manager_id) area_manager_status = 'Pending';
      if (safety_officer_id) safety_officer_status = 'Pending';
      if (site_leader_id) site_leader_status = 'Pending';
      console.log('✅ PTW: Pending_Approval');
    } else {
      status = 'Active';
      console.log('⚠️ PTW: Active (no approvers)');
    }

    // Insert permit
   const [permitResult] = await connection.query(`
      INSERT INTO permits (
        permit_serial, site_id, created_by_user_id, permit_type,
        work_location, work_description, start_time, end_time,
        receiver_name, receiver_contact, permit_initiator,
        permit_initiator_contact, issue_department, control_measures,
        other_hazards, swms_file_url, swms_text, 
        area_manager_id, safety_officer_id, site_leader_id,
        area_manager_status, safety_officer_status, site_leader_status,  // ← ADD THESE 3
        issuer_signature, area_manager_signature, safety_officer_signature,
        site_leader_signature, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      //                                                                      ↑  ↑  ↑ ADD 3 more ?
    `, [
      newSerialNumber, site_id, created_by_user_id, permit_type_string,
      work_location || '', work_description || '', start_time, end_time,
      receiver_name || '', receiver_contact || '', permit_initiator || '',
      permit_initiator_contact || '', issue_department || '',
      control_measures || '', other_hazards || '', swms_file_url || null,
      swms_text || null, 
      area_manager_id || null, safety_officer_id || null, site_leader_id || null,
      area_manager_status, safety_officer_status, site_leader_status,  
      issuer_signature || null, area_manager_signature || null,
      safety_officer_signature || null, site_leader_signature || null,
      status  // ← CHANGE from 'Active' to status
    ]);

    const permitId = permitResult.insertId;

    // Insert team members
    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        await connection.query(`
          INSERT INTO permit_team_members (permit_id, worker_name, company_name, worker_role, badge_id, phone, email)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          permitId, 
          member.worker_name || '', 
          member.company_name || '', 
          member.worker_role || 'Worker', 
          member.badge_id || '', 
          member.phone || '', 
          member.email || ''
        ]);
      }
    }

    // Insert hazards
    if (hazard_ids && hazard_ids.length > 0) {
      for (const hazardId of hazard_ids) {
        await connection.query(`INSERT INTO permit_hazards (permit_id, hazard_id) VALUES (?, ?)`, [permitId, hazardId]);
      }
    }

    // Insert PPE
    if (ppe_ids && ppe_ids.length > 0) {
      for (const ppeId of ppe_ids) {
        await connection.query(`INSERT INTO permit_ppe (permit_id, ppe_id) VALUES (?, ?)`, [permitId, ppeId]);
      }
    }

    // Insert checklist
    if (checklist_responses && checklist_responses.length > 0) {
      for (const response of checklist_responses) {
        await connection.query(`
          INSERT INTO permit_checklist_responses (permit_id, question_id, response, remarks)
          VALUES (?, ?, ?, ?)
        `, [permitId, response.question_id || 0, response.response || 'N/A', response.remarks || null]);
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      data: { id: permitId, permit_serial: newSerialNumber }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating permit',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// PUT /api/permits/:id - Update permit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      work_description,
      work_location,
      start_time,
      end_time,
      status
    } = req.body;
    
    // Check if permit exists
    const [existingPermit] = await pool.query('SELECT id FROM permits WHERE id = ?', [id]);
    
    if (existingPermit.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (work_description !== undefined) {
      updates.push('work_description = ?');
      params.push(work_description);
    }
    if (work_location !== undefined) {
      updates.push('work_location = ?');
      params.push(work_location);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      params.push(end_time);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    await pool.query(
      `UPDATE permits SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: 'Permit updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permit',
      error: error.message
    });
  }
});

// DELETE /api/permits/:id - Delete permit
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();
    
    // Delete related records first
    await connection.query('DELETE FROM permit_team_members WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_hazards WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_ppe WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_checklist_responses WHERE permit_id = ?', [id]);
    
    // Try to delete from permit_approvals if table exists
    try {
      await connection.query('DELETE FROM permit_approvals WHERE permit_id = ?', [id]);
    } catch (err) {
      console.log('⚠️ permit_approvals table may not exist');
    }
    
    // Delete the permit
    await connection.query('DELETE FROM permits WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Permit deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error deleting permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting permit',
      error: error.message
    });
  } finally {
    connection.release();
  }
});
// ⚡ REPLACE THE PLACEHOLDER ROUTES WITH THIS CODE
// Find these lines in your file and replace them with the code below:

// POST /api/permits/:id/close - Close permit
router.post('/:id/close', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const { id } = req.params;
    const { 
      housekeeping_done, 
      tools_removed, 
      locks_removed, 
      area_restored, 
      remarks 
    } = req.body;
    
    console.log('🔒 Close permit request received');
    console.log('   Permit ID:', id);
    console.log('   Checklist:', { 
      housekeeping_done, 
      tools_removed, 
      locks_removed, 
      area_restored 
    });
    
    // Validate required fields
    if (
      housekeeping_done === undefined || 
      tools_removed === undefined || 
      locks_removed === undefined || 
      area_restored === undefined
    ) {
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
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    console.log('   Current status:', permits[0].status);
    
    // Start transaction
    await connection.beginTransaction();
    
    // Try to insert into permit_closure table (optional)
    try {
      await connection.query(`
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
      `, [
        id, 
        req.user?.id || 1, 
        housekeeping_done ? 1 : 0, 
        tools_removed ? 1 : 0, 
        locks_removed ? 1 : 0, 
        area_restored ? 1 : 0, 
        remarks || null
      ]);
      
      console.log('   ✅ Closure record saved to permit_closure table');
    } catch (tableError) {
      console.log('   ⚠️ permit_closure table not found - skipping (not critical)');
    }
    
    // Update permit status to Closed
    const [updateResult] = await connection.query(`
      UPDATE permits 
      SET status = 'Closed', 
          updated_at = NOW() 
      WHERE id = ?
    `, [id]);
    
    console.log('   ✅ Permit status updated to Closed');
    console.log('   Rows affected:', updateResult.affectedRows);
    
    // Commit transaction
    await connection.commit();
    
    console.log('✅ Permit closed successfully:', id);
    
    res.json({
      success: true,
      message: 'Permit closed successfully',
      data: {
        permit_id: id,
        new_status: 'Closed'
      }
    });
    
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
        console.log('   🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('   ❌ Rollback error:', rollbackError.message);
      }
    }
    
    console.error('❌ Error closing permit:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to close permit',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
  } finally {
    if (connection) {
      connection.release();
      console.log('   🔓 Database connection released');
    }
  }
});

// POST /api/permits/:id/extension - Request extension
router.post('/:id/extension', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    
    console.log('⏱️ Extension request received');
    console.log('   Permit ID:', id);
    console.log('   New end time:', new_end_time);
    console.log('   Reason:', reason);
    
    // Validate required fields
    if (!new_end_time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: new_end_time and reason are required'
      });
    }
    
    // Check if permit exists
    const [permits] = await connection.query(
      'SELECT id, status FROM permits WHERE id = ?',
      [id]
    );
    
    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    console.log('   Current status:', permits[0].status);
    
    // Start transaction
    await connection.beginTransaction();
    
    // Try to insert into permit_extensions table (optional)
    try {
      await connection.query(`
        INSERT INTO permit_extensions (
          permit_id, 
          requested_by_user_id, 
          requested_at,
          new_end_time, 
          reason, 
          status
        ) VALUES (?, ?, NOW(), ?, ?, 'Pending')
      `, [id, req.user?.id || 1, new_end_time, reason]);
      
      console.log('   ✅ Extension record saved to permit_extensions table');
    } catch (tableError) {
      console.log('   ⚠️ permit_extensions table not found - skipping (not critical)');
    }
    
    // Update permit status to Extension_Requested
    const [updateResult] = await connection.query(`
      UPDATE permits 
      SET status = 'Extension_Requested', 
          updated_at = NOW() 
      WHERE id = ?
    `, [id]);
    
    console.log('   ✅ Permit status updated to Extension_Requested');
    console.log('   Rows affected:', updateResult.affectedRows);
    
    // Commit transaction
    await connection.commit();
    
    console.log('✅ Extension requested successfully for permit:', id);
    
    res.json({
      success: true,
      message: 'Extension requested successfully',
      data: {
        permit_id: id,
        new_status: 'Extension_Requested'
      }
    });
    
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
        console.log('   🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('   ❌ Rollback error:', rollbackError.message);
      }
    }
    
    console.error('❌ Error requesting extension:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to request extension',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
  } finally {
    if (connection) {
      connection.release();
      console.log('   🔓 Database connection released');
    }
  }
});

// POST /api/permits/:id/request-extension - Alternative route (compatibility)
router.post('/:id/request-extension', async (req, res) => {
  console.log('📌 Using alternative extension route - redirecting');
  
  // Just call the extension route logic
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    
    console.log('⏱️ Extension request (alt route) for permit:', id);
    
    if (!new_end_time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const [permits] = await connection.query(
      'SELECT id FROM permits WHERE id = ?',
      [id]
    );
    
    if (permits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    await connection.beginTransaction();
    
    try {
      await connection.query(`
        INSERT INTO permit_extensions (
          permit_id, requested_by_user_id, requested_at,
          new_end_time, reason, status
        ) VALUES (?, ?, NOW(), ?, ?, 'Pending')
      `, [id, req.user?.id || 1, new_end_time, reason]);
    } catch (tableError) {
      console.log('⚠️ permit_extensions table not found');
    }
    
    await connection.query(`
      UPDATE permits 
      SET status = 'Extension_Requested', updated_at = NOW() 
      WHERE id = ?
    `, [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Extension requested successfully'
    });
    
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (err) {
        console.error('Rollback error:', err);
      }
    }
    
    console.error('❌ Error requesting extension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request extension',
      error: error.message
    });
    
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
module.exports = router;