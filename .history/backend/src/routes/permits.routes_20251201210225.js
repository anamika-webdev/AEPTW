// backend/src/routes/permits.routes.js
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
    console.error('Error fetching permits:', error);
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
    console.error('Error fetching supervisor permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supervisor permits',
      error: error.message
    });
  }
});

// GET /api/permits/:id - Get permit by ID with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    const permit = permits[0];
    
    // Get team members
    const [teamMembers] = await pool.query(`
      SELECT * FROM permit_team_members WHERE permit_id = ?
    `, [id]);
    
    // Get hazards
    const [hazards] = await pool.query(`
      SELECT ph.*, mh.hazard_name, mh.risk_level
      FROM permit_hazards ph
      LEFT JOIN master_hazards mh ON ph.hazard_id = mh.id
      WHERE ph.permit_id = ?
    `, [id]);
    
    // Get PPE
    const [ppe] = await pool.query(`
      SELECT pp.*, mp.ppe_name, mp.ppe_type
      FROM permit_ppe pp
      LEFT JOIN master_ppe mp ON pp.ppe_id = mp.id
      WHERE pp.permit_id = ?
    `, [id]);
    
    // Get checklist responses
    const [checklist] = await pool.query(`
      SELECT pcr.*, mcq.question_text, mcq.category
      FROM permit_checklist_responses pcr
      LEFT JOIN master_checklist_questions mcq ON pcr.question_id = mcq.id
      WHERE pcr.permit_id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...permit,
        team_members: teamMembers,
        hazards,
        ppe,
        checklist
      }
    });
  } catch (error) {
    console.error('Error fetching permit details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permit details',
      error: error.message
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
    const permit_type_string = permit_types.join(',');
    
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
    for (const member of team_members) {
      await connection.query(`
        INSERT INTO permit_team_members (permit_id, worker_name, company_name, worker_role, badge_id, phone, email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [permitId, member.worker_name, member.company_name, member.worker_role, member.badge_id, member.phone, member.email]);
    }

    // Insert hazards
    for (const hazardId of hazard_ids) {
      await connection.query(`INSERT INTO permit_hazards (permit_id, hazard_id) VALUES (?, ?)`, [permitId, hazardId]);
    }

    // Insert PPE
    for (const ppeId of ppe_ids) {
      await connection.query(`INSERT INTO permit_ppe (permit_id, ppe_id) VALUES (?, ?)`, [permitId, ppeId]);
    }

    // Insert checklist
    for (const response of checklist_responses) {
      await connection.query(`
        INSERT INTO permit_checklist_responses (permit_id, question_id, response, remarks)
        VALUES (?, ?, ?, ?)
      `, [permitId, response.question_id, response.response, response.remarks]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      data: { id: permitId, permit_serial: newSerialNumber }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
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
    
    // Update permit
    await pool.query(`
      UPDATE permits 
      SET work_description = ?, work_location = ?, start_time = ?, end_time = ?, status = ?
      WHERE id = ?
    `, [work_description, work_location, start_time, end_time, status, id]);
    
    res.json({
      success: true,
      message: 'Permit updated successfully'
    });
  } catch (error) {
    console.error('Error updating permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permit',
      error: error.message
    });
  }
});

// PUT /api/permits/:id/status - Update permit status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Draft', 'Pending_AM_Approval', 'Pending_Safety_Approval', 'Active', 'Extension_Requested', 'Closed', 'Rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    await pool.query('UPDATE permits SET status = ? WHERE id = ?', [status, id]);
    
    res.json({
      success: true,
      message: 'Permit status updated successfully'
    });
  } catch (error) {
    console.error('Error updating permit status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permit status',
      error: error.message
    });
  }
});
// POST /api/permits/:id/request-extension
router.post('/:id/request-extension', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    
    await pool.query(
      `UPDATE permits SET status = 'Extension_Requested', end_time = ? WHERE id = ?`,
      [new_end_time, id]
    );
    
    // Optionally log extension request
    await pool.query(
      `INSERT INTO permit_extensions (permit_id, new_end_time, reason, requested_at) 
       VALUES (?, ?, ?, NOW())`,
      [id, new_end_time, reason]
    );
    
    res.json({ success: true, message: 'Extension requested successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/permits/:id/close
router.post('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const { housekeeping_done, tools_removed, locks_removed, area_restored, remarks } = req.body;
    
    await pool.query(
      `UPDATE permits SET status = 'Closed', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    
    // Log closure details
    await pool.query(
      `INSERT INTO permit_closure (
        permit_id, housekeeping_done, tools_removed, 
        locks_removed, area_restored, remarks, closed_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, housekeeping_done, tools_removed, locks_removed, area_restored, remarks]
    );
    
    res.json({ success: true, message: 'Permit closed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// DELETE /api/permits/:id - Delete permit
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Delete related records first
    await connection.query('DELETE FROM permit_team_members WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_hazards WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_ppe WHERE permit_id = ?', [id]);
    await connection.query('DELETE FROM permit_checklist_responses WHERE permit_id = ?', [id]);
    
    // Delete permit
    const [result] = await connection.query('DELETE FROM permits WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Permit deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting permit:', error);
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