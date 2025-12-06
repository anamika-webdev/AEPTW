// backend/src/controllers/permit.controller.js
const db = require('../config/database');
const logger = require('../utils/logger');
const moment = require('moment');
const { createNotification } = require('../utils/notificationUtils');

// Generate permit serial number
const generatePermitSerial = async (siteCode, permitType) => {
  const year = new Date().getFullYear();
  const typeCode = permitType.substring(0, 2).toUpperCase();

  const [count] = await db.query(`
    SELECT COUNT(*) as count FROM permits 
    WHERE permit_type = ? AND YEAR(created_at) = ?
  `, [permitType, year]);

  const sequence = String(count[0].count + 1).padStart(4, '0');
  return `${siteCode}-${typeCode}-${year}-${sequence}`;
};

// Get all permits with filters
exports.getAllPermits = async (req, res) => {
  try {
    const { site_id, status, permit_type, start_date, end_date } = req.query;

    let query = `
      SELECT p.*, s.name as site_name, s.site_code,
             u.full_name as created_by_name, u.email as created_by_email,
             v.company_name as vendor_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
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

    if (start_date) {
      query += ' AND p.start_time >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND p.end_time <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY p.created_at DESC';

    const [permits] = await db.query(query, params);

    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    logger.error('Get all permits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permits'
    });
  }
};

// Get permit by ID with full details
exports.getPermitById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get permit details
    const [permits] = await db.query(`
      SELECT p.*, s.name as site_name, s.site_code,
             u.full_name as created_by_name, u.email as created_by_email,
             v.company_name as vendor_name, v.contact_person as vendor_contact
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
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

    // Get team members WITH COMPANY NAME
    const [teamMembers] = await db.query(`
      SELECT * FROM permit_team_members WHERE permit_id = ?
    `, [id]);

    // Get hazards
    const [hazards] = await db.query(`
      SELECT ph.*, mh.name, mh.category, mh.icon_url
      FROM permit_hazards ph
      JOIN master_hazards mh ON ph.hazard_id = mh.id
      WHERE ph.permit_id = ?
    `, [id]);

    // Get PPE
    const [ppe] = await db.query(`
      SELECT pp.*, mp.name, mp.icon_url
      FROM permit_ppe pp
      JOIN master_ppe mp ON pp.ppe_id = mp.id
      WHERE pp.permit_id = ?
    `, [id]);

    // Get checklist responses (ALL questions)
    const [checklist] = await db.query(`
      SELECT pcr.*, mcq.question_text, mcq.is_mandatory, mcq.permit_type
      FROM permit_checklist_responses pcr
      JOIN master_checklist_questions mcq ON pcr.question_id = mcq.id
      WHERE pcr.permit_id = ?
      ORDER BY mcq.permit_type, mcq.id
    `, [id]);

    // Get approvals
    const [approvals] = await db.query(`
      SELECT pa.*, u.full_name as approver_name, u.email as approver_email
      FROM permit_approvals pa
      JOIN users u ON pa.approver_user_id = u.id
      WHERE pa.permit_id = ?
    `, [id]);

    // Get extensions
    const [extensions] = await db.query(`
      SELECT pe.*, u.full_name as requested_by_name,
             au.full_name as approved_by_name
      FROM permit_extensions pe
      LEFT JOIN users u ON pe.requested_by_user_id = u.id
      LEFT JOIN users au ON pe.approved_by_user_id = au.id
      WHERE pe.permit_id = ?
      ORDER BY pe.requested_at DESC
    `, [id]);

    // Get closure details
    const [closure] = await db.query(`
      SELECT pc.*, u.full_name as closed_by_name
      FROM permit_closure pc
      JOIN users u ON pc.closed_by_user_id = u.id
      WHERE pc.permit_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...permit,
        team_members: teamMembers,
        hazards: hazards,
        ppe: ppe,
        checklist: checklist,
        approvals: approvals,
        extensions: extensions,
        closure: closure.length > 0 ? closure[0] : null
      }
    });
  } catch (error) {
    logger.error('Get permit by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permit'
    });
  }
};

// Create new permit WITH COMPANY NAME SUPPORT
exports.createPermit = async (req, res) => {
  const connection = await db.getConnection();

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
      team_members = [],
      hazards = [],
      other_hazards = '',
      control_measures = '',
      ppe = [],
      checklist_responses = [],

      issuer_signature = '',
      area_manager_id,
      safety_officer_id,
      site_leader_id
    } = req.body;

    // Validate required fields
    if (!site_id || !permit_type || !work_location || !work_description || !start_time || !end_time) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get site code
    const [sites] = await connection.query('SELECT site_code FROM sites WHERE id = ?', [site_id]);

    if (sites.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Generate permit serial
    const permit_serial = await generatePermitSerial(sites[0].site_code, permit_type);

    // Get current user ID (from auth middleware)
    const created_by_user_id = req.user?.id || 1; // Default to 1 for testing

    // Insert permit
    const [permitResult] = await connection.query(`
      INSERT INTO permits (
        permit_serial, site_id, created_by_user_id, vendor_id,
        permit_type, work_location, work_description,
        start_time, end_time, receiver_name, receiver_signature_path,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending_Approval')
    `, [
      permit_serial, site_id, created_by_user_id, vendor_id || null,
      permit_type, work_location, work_description,
      start_time, end_time, receiver_name, issuer_signature
    ]);

    const permit_id = permitResult.insertId;

    // Insert team members WITH COMPANY NAME
    if (team_members.length > 0) {
      const teamMemberValues = team_members.map(tm => [
        permit_id,
        tm.worker_name,
        tm.company_name || '', // NEW: Company name field
        tm.contact_number || '',
        tm.worker_role || 'Worker',
        tm.badge_id || '',
        tm.is_qualified !== false ? 1 : 0
      ]);

      await connection.query(`
        INSERT INTO permit_team_members (
          permit_id, worker_name, company_name, contact_number,
          worker_role, badge_id, is_qualified
        ) VALUES ?
      `, [teamMemberValues]);
    }

    // Insert hazards
    if (hazards.length > 0) {
      const hazardValues = hazards.map(hazard_id => [permit_id, hazard_id]);
      await connection.query(`
        INSERT INTO permit_hazards (permit_id, hazard_id) VALUES ?
      `, [hazardValues]);
    }

    // Store other hazards and control measures in permit_hazards table
    if (other_hazards || control_measures) {
      await connection.query(`
        UPDATE permits 
        SET work_description = CONCAT(work_description, 
          '\n\n--- Other Hazards ---\n', ?,
          '\n\n--- Control Measures ---\n', ?)
        WHERE id = ?
      `, [other_hazards, control_measures, permit_id]);
    }

    // Insert PPE
    if (ppe.length > 0) {
      const ppeValues = ppe.map(ppe_id => [permit_id, ppe_id]);
      await connection.query(`
        INSERT INTO permit_ppe (permit_id, ppe_id) VALUES ?
      `, [ppeValues]);
    }

    // Insert checklist responses (ALL questions regardless of permit type)
    if (checklist_responses.length > 0) {
      const checklistValues = checklist_responses.map(cr => [
        permit_id,
        cr.question_id,
        cr.response,
        cr.remarks || null
      ]);

      await connection.query(`
        INSERT INTO permit_checklist_responses (
          permit_id, question_id, response, remarks
        ) VALUES ?
      `, [checklistValues]);
    }

    // Insert Approvers (Pending)
    const approvers = [];
    if (area_manager_id) approvers.push({ id: area_manager_id, role: 'Approver_AreaManager' });
    if (safety_officer_id) approvers.push({ id: safety_officer_id, role: 'Approver_Safety' });
    if (site_leader_id) approvers.push({ id: site_leader_id, role: 'Approver_SiteLeader' });

    if (approvers.length > 0) {
      const approverValues = approvers.map(a => [
        permit_id, a.id, a.role, 'Pending', null, null, null
      ]);

      await connection.query(`
        INSERT INTO permit_approvals (
          permit_id, approver_user_id, role, status, comments, signature_path, approved_at
        ) VALUES ?
      `, [approverValues]);

      // Notify Approvers
      for (const approver of approvers) {
        await createNotification(
          approver.id,
          'New Permit Request',
          `You have a new PTW request (${permit_serial}) awaiting your approval.`,
          'info',
          permit_id
        );
      }
    }

    await connection.commit();

    // Fetch the created permit with details
    const [createdPermit] = await connection.query(`
      SELECT p.*, s.name as site_name, s.site_code
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      WHERE p.id = ?
    `, [permit_id]);

    res.status(201).json({
      success: true,
      message: 'Permit created successfully',
      data: createdPermit[0]
    });

  } catch (error) {
    await connection.rollback();
    logger.error('Create permit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create permit: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// Update permit status
exports.updatePermitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Draft', 'Pending_Approval', 'Active', 'Extension_Requested', 'Suspended', 'Closed', 'Cancelled', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await db.query(`
      UPDATE permits SET status = ?, updated_at = NOW() WHERE id = ?
    `, [status, id]);

    res.json({
      success: true,
      message: 'Permit status updated successfully'
    });
  } catch (error) {
    logger.error('Update permit status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permit status'
    });
  }
};

// Add approval
exports.addApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, comments, signature } = req.body;

    const approver_user_id = req.user?.id || 1;

    // Check if pending approval exists
    const [existing] = await db.query(
      'SELECT id FROM permit_approvals WHERE permit_id = ? AND approver_user_id = ? AND status = "Pending"',
      [id, approver_user_id]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(`
         UPDATE permit_approvals 
         SET status = ?, comments = ?, signature_path = ?, approved_at = NOW()
         WHERE id = ?
       `, [status, comments || null, signature, existing[0].id]);
    } else {
      // Insert new (Fallback)
      await db.query(`
         INSERT INTO permit_approvals (
           permit_id, approver_user_id, role, status, comments,
           signature_path, approved_at
         ) VALUES (?, ?, ?, ?, ?, ?, NOW())
       `, [id, approver_user_id, role, status, comments || null, signature]);
    }

    // Helper to get creator ID
    const [permitInfo] = await db.query('SELECT created_by_user_id, permit_serial FROM permits WHERE id = ?', [id]);
    const creatorId = permitInfo[0]?.created_by_user_id;

    if (creatorId) {
      await createNotification(
        creatorId,
        `Permit ${status}`,
        `Your permit ${permitInfo[0].permit_serial} has been ${status} by an approver.`,
        status === 'Approved' ? 'success' : (status === 'Rejected' ? 'error' : 'info'),
        id
      );
    }

    // Check if all approvals are done
    const [approvals] = await db.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
             SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM permit_approvals WHERE permit_id = ?
    `, [id]);

    const approvalsData = approvals[0];

    // Update permit status based on approvals
    if (approvalsData.rejected > 0) {
      await db.query(`UPDATE permits SET status = 'Rejected' WHERE id = ?`, [id]);
    } else if (approvalsData.approved >= 3) { // Assuming 3 required approvals
      await db.query(`UPDATE permits SET status = 'Active' WHERE id = ?`, [id]);
    }

    res.json({
      success: true,
      message: 'Approval added successfully'
    });
  } catch (error) {
    logger.error('Add approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add approval'
    });
  }
};

// Get permits by user
exports.getMyPermits = async (req, res) => {
  try {
    const { userId } = req.params;

    const [permits] = await db.query(`
      SELECT p.*, s.name as site_name, s.site_code
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      WHERE p.created_by_user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    logger.error('Get my permits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permits'
    });
  }
};

// Get worker permits
exports.getWorkerPermits = async (req, res) => {
  try {
    const { workerId } = req.params;

    const [permits] = await db.query(`
      SELECT DISTINCT p.*, s.name as site_name, s.site_code
      FROM permits p
      JOIN sites s ON p.site_id = s.id
      JOIN permit_team_members ptm ON p.id = ptm.permit_id
      JOIN users u ON ptm.worker_name = u.full_name
      WHERE u.id = ?
      ORDER BY p.created_at DESC
    `, [workerId]);

    res.json({
      success: true,
      data: permits
    });
  } catch (error) {
    logger.error('Get worker permits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker permits'
    });
  }
};

// Close permit
exports.closePermit = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { housekeeping_done, tools_removed, locks_removed, area_restored, remarks } = req.body;
    const closed_by_user_id = req.user?.id || 1;

    // Insert closure record
    await connection.query(`
      INSERT INTO permit_closure (
        permit_id, closed_at, closed_by_user_id,
        housekeeping_done, tools_removed, locks_removed, area_restored, remarks
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)
    `, [id, closed_by_user_id, housekeeping_done, tools_removed, locks_removed, area_restored, remarks || null]);

    // Update permit status
    await connection.query(`
      UPDATE permits SET status = 'Closed', updated_at = NOW() WHERE id = ?
    `, [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Permit closed successfully'
    });
  } catch (error) {
    await connection.rollback();
    logger.error('Close permit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close permit'
    });
  } finally {
    connection.release();
  }
};

// Request extension
exports.requestExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_end_time, reason } = req.body;
    const requested_by_user_id = req.user?.id || 1;

    await db.query(`
      INSERT INTO permit_extensions (
        permit_id, requested_by_user_id, requested_at,
        new_end_time, reason, status
      ) VALUES (?, ?, NOW(), ?, ?, 'Pending')
    `, [id, requested_by_user_id, new_end_time, reason]);

    // Update permit status
    await db.query(`
      UPDATE permits SET status = 'Extension_Requested' WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Extension requested successfully'
    });
  } catch (error) {
    logger.error('Request extension error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request extension'
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = 'SELECT status, COUNT(*) as count FROM permits';
    const params = [];

    if (user_id) {
      query += ' WHERE created_by_user_id = ?';
      params.push(user_id);
    }

    query += ' GROUP BY status';

    const [stats] = await db.query(query, params);

    // Get permit type distribution
    const [typeStats] = await db.query(`
      SELECT permit_type, COUNT(*) as count FROM permits
      ${user_id ? 'WHERE created_by_user_id = ?' : ''}
      GROUP BY permit_type
    `, user_id ? [user_id] : []);

    res.json({
      success: true,
      data: {
        by_status: stats,
        by_type: typeStats
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

module.exports = exports;