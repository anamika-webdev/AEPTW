// backend/src/routes/permits.routes.js - CORRECTED FOR ACTUAL DATABASE SCHEMA
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// GET /api/permits - Get all permits
router.get('/', async (req, res) => {
  try {
    const { site_id, status, permit_type } = req.query;
    
    let query = `
      SELECT 
        p.*,
        s.name as site_name,
        s.site_code,
        u.full_name as created_by_name,
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (site_id) {
      query += ' AND p.site_id = ?';
      params.push(site_id);
    }
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    if (permit_type) {
      query += ' AND p.permit_type = ?';
      params.push(permit_type);
    }
    
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const [permits] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    console.error('❌ Error fetching permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permits',
      error: error.message
    });
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
        u.contact as created_by_contact
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

    // Insert permit
    const [permitResult] = await connection.query(`
      INSERT INTO permits (
        permit_serial, site_id, created_by_user_id, permit_type,
        work_location, work_description, start_time, end_time,
        receiver_name, receiver_contact, permit_initiator,
        permit_initiator_contact, issue_department, control_measures,
        other_hazards, swms_file_url, swms_text, area_manager_id,
        safety_officer_id, site_leader_id, issuer_signature,
        area_manager_signature, safety_officer_signature,
        site_leader_signature, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW())
    `, [
      newSerialNumber, site_id, created_by_user_id, permit_type_string,
      work_location || '', work_description || '', start_time, end_time,
      receiver_name || '', receiver_contact || '', permit_initiator || '',
      permit_initiator_contact || '', issue_department || '',
      control_measures || '', other_hazards || '', swms_file_url || null,
      swms_text || null, area_manager_id || null, safety_officer_id || null,
      site_leader_id || null, issuer_signature || null,
      area_manager_signature || null, safety_officer_signature || null,
      site_leader_signature || null
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

module.exports = router;