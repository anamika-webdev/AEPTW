// backend/src/routes/approvals.routes.js
// ✅ UPDATED: Added Site Leader, Area Manager, and Safety Officer names to all queries
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// HELPER FUNCTION - Get approval field names based on user role
// ============================================================================
const getApprovalFields = (userRole) => {
  const roleMap = {
    'Approver_AreaManager': {
      idField: 'area_manager_id',
      statusField: 'area_manager_status',
      approvedAtField: 'area_manager_approved_at',
      signatureField: 'area_manager_signature',
      roleName: 'Area Manager'
    },
    'Approver_Safety': {
      idField: 'safety_officer_id',
      statusField: 'safety_officer_status',
      approvedAtField: 'safety_officer_approved_at',
      signatureField: 'safety_officer_signature',
      roleName: 'Safety Officer'
    },
    'Approver_SiteLeader': {
      idField: 'site_leader_id',
      statusField: 'site_leader_status',
      approvedAtField: 'site_leader_approved_at',
      signatureField: 'site_leader_signature',
      roleName: 'Site Leader'
    }
  };

  return roleMap[userRole] || null;
};

// ============================================================================
// GET PENDING APPROVALS
// ✅ UPDATED: Added approver names (area_manager_name, safety_officer_name, site_leader_name)
// ============================================================================
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📥 GET /api/approvals/pending - User: ${userId}, Role: ${userRole}`);
    
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    // Get PTWs where:
    // 1. This specific user is assigned as the approver for their role
    // 2. Their approval status is Pending or NULL
    // 3. Overall permit status is Initiated (waiting for approvals)
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.permit_types,
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status as permit_status,
        p.${fields.statusField} as my_approval_status,
        p.created_at,
        s.name as site_name,
        u.full_name as created_by_name,
        u.email as created_by_email,
        COUNT(DISTINCT ptm.id) as team_member_count,
        p.area_manager_status,
        p.safety_officer_status,
        p.site_leader_status,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.${fields.idField} = ?
      AND (p.${fields.statusField} IS NULL OR p.${fields.statusField} = 'Pending')
      AND p.status = 'Initiated'
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} pending approvals for ${fields.roleName}`);
    
    // Debug log for approver names
    permits.forEach(permit => {
      console.log(`  PTW ${permit.permit_serial}:`, {
        area_manager: permit.area_manager_name || 'Not assigned',
        safety_officer: permit.safety_officer_name || 'Not assigned',
        site_leader: permit.site_leader_name || 'Not assigned'
      });
    });

    res.json({
      success: true,
      count: permits.length,
      data: permits,
      approver_role: fields.roleName
    });

  } catch (error) {
    console.error('❌ Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
});

// ============================================================================
// GET APPROVED BY ME
// ✅ UPDATED: Added approver names (area_manager_name, safety_officer_name, site_leader_name)
// ============================================================================
router.get('/approved', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📥 GET /api/approvals/approved - User: ${userId}, Role: ${userRole}`);
    
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.permit_types,
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status as permit_status,
        p.${fields.statusField} as my_approval_status,
        p.${fields.approvedAtField} as approved_at,
        p.${fields.signatureField} as my_signature,
        s.name as site_name,
        u.full_name as created_by_name,
        p.area_manager_status,
        p.safety_officer_status,
        p.site_leader_status,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.${fields.idField} = ?
      AND p.${fields.statusField} = 'Approved'
      ORDER BY p.${fields.approvedAtField} DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} approved PTWs for ${fields.roleName}`);

    res.json({
      success: true,
      count: permits.length,
      data: permits,
      approver_role: fields.roleName
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

// ============================================================================
// GET REJECTED BY ME
// ✅ UPDATED: Added approver names (area_manager_name, safety_officer_name, site_leader_name)
// ============================================================================
router.get('/rejected', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📥 GET /api/approvals/rejected - User: ${userId}, Role: ${userRole}`);
    
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
        p.permit_types,
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status as permit_status,
        p.${fields.statusField} as my_approval_status,
        p.${fields.approvedAtField} as rejected_at,
        p.rejection_reason,
        s.name as site_name,
        u.full_name as created_by_name,
        p.area_manager_status,
        p.safety_officer_status,
        p.site_leader_status,
        am.full_name as area_manager_name,
        so.full_name as safety_officer_name,
        sl.full_name as site_leader_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN users am ON p.area_manager_id = am.id
      LEFT JOIN users so ON p.safety_officer_id = so.id
      LEFT JOIN users sl ON p.site_leader_id = sl.id
      WHERE p.${fields.idField} = ?
      AND p.${fields.statusField} = 'Rejected'
      ORDER BY p.${fields.approvedAtField} DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} rejected PTWs for ${fields.roleName}`);

    res.json({
      success: true,
      count: permits.length,
      data: permits,
      approver_role: fields.roleName
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
// APPROVE PTW
// ============================================================================
router.post('/:permitId/approve', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    const { signature } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📥 POST /api/approvals/${permitId}/approve - User: ${userId}, Role: ${userRole}`);
    
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    // Validate signature
    if (!signature) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Signature is required'
      });
    }

    // Get permit
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ?`,
      [permitId]
    );
    
    if (permits.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    const permit = permits[0];
    
    // Verify user is assigned as approver
    if (permit[fields.idField] !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as approver for this PTW'
      });
    }
    
    // Check if already approved or rejected
    if (permit[fields.statusField] === 'Approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already approved this PTW'
      });
    }

    if (permit[fields.statusField] === 'Rejected') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already rejected this PTW'
      });
    }

    // Check if permit is already rejected by someone else
    if (permit.status === 'Rejected') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'This PTW has been rejected by another approver'
      });
    }

    // Update approval status and signature
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Approved',
           ${fields.approvedAtField} = NOW(),
           ${fields.signatureField} = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [signature, permitId]
    );
    
    console.log(`✅ ${fields.roleName} approved PTW ${permitId}`);

    // Check if ALL assigned approvers have approved
    const [updatedPermit] = await connection.query(
      `SELECT * FROM permits WHERE id = ?`,
      [permitId]
    );
    
    const updated = updatedPermit[0];
    let allApproved = true;
    const pendingApprovers = [];
    
    // Check area manager
    if (updated.area_manager_id) {
      if (updated.area_manager_status !== 'Approved') {
        allApproved = false;
        pendingApprovers.push('Area Manager');
      }
    }
    
    // Check safety officer
    if (updated.safety_officer_id) {
      if (updated.safety_officer_status !== 'Approved') {
        allApproved = false;
        pendingApprovers.push('Safety Officer');
      }
    }
    
    // Check site leader
    if (updated.site_leader_id) {
      if (updated.site_leader_status !== 'Approved') {
        allApproved = false;
        pendingApprovers.push('Site Leader');
      }
    }

    console.log(`🔍 All approvers approved: ${allApproved}`);
    if (!allApproved) {
      console.log(`⏳ Still waiting for: ${pendingApprovers.join(', ')}`);
    }

    // If all approved, update permit status to Approved
    if (allApproved) {
      await connection.query(
        `UPDATE permits SET status = 'Approved', updated_at = NOW() WHERE id = ?`,
        [permitId]
      );
      
      // Create notification for supervisor
      await connection.query(
        `INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
         VALUES (?, ?, 'PTW_APPROVED', ?, NOW())`,
        [
          updated.created_by_user_id,
          permitId,
          `PTW ${updated.permit_serial} has been approved by all approvers. You can now do final submit.`
        ]
      );
      
      console.log(`✅ PTW ${permitId} fully approved - Status changed to 'Approved'`);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'PTW approved successfully',
      data: {
        permit_id: permitId,
        approver_role: fields.roleName,
        all_approved: allApproved,
        status: allApproved ? 'Approved' : 'Initiated',
        pending_approvers: pendingApprovers
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error approving PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving PTW',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// ============================================================================
// REJECT PTW - ✅ FIXED
// ============================================================================
router.post('/:permitId/reject', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    // ✅ Accept both 'rejection_reason' and 'reason' for compatibility
    const { rejection_reason, reason, signature } = req.body;
    const actualReason = rejection_reason || reason;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📥 POST /api/approvals/${permitId}/reject - User: ${userId}, Role: ${userRole}`);
    console.log('Rejection data:', { rejection_reason, reason, actualReason });
    
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    // ✅ Validate actualReason (not just 'reason')
    if (!actualReason || actualReason.trim().length === 0) {
      await connection.rollback();
      console.log('❌ Rejection reason is missing or empty');
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Get permit
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ?`,
      [permitId]
    );
    
    if (permits.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }
    
    const permit = permits[0];
    
    // Verify user is assigned as approver
    if (permit[fields.idField] !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as approver for this PTW'
      });
    }
    
    // Check if already approved or rejected
    if (permit[fields.statusField] === 'Approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already approved this PTW'
      });
    }

    if (permit[fields.statusField] === 'Rejected') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already rejected this PTW'
      });
    }

    // Update this approver's status to Rejected with signature
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Rejected',
           ${fields.approvedAtField} = NOW(),
           ${fields.signatureField} = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [signature || null, permitId]
    );
    
    // Update overall permit status to Rejected with reason
    // ✅ Use actualReason instead of reason
    await connection.query(
      `UPDATE permits 
       SET status = 'Rejected',
           rejection_reason = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [actualReason, permitId]
    );
    
    console.log(`❌ ${fields.roleName} rejected PTW ${permitId}`);
    console.log(`   Reason: ${actualReason}`);

    // Create notification for supervisor
    await connection.query(
      `INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
       VALUES (?, ?, 'PTW_REJECTED', ?, NOW())`,
      [
        permit.created_by_user_id,
        permitId,
        `PTW ${permit.permit_serial} has been rejected by ${fields.roleName}. Reason: ${actualReason}`
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'PTW rejected successfully',
      data: {
        permit_id: permitId,
        approver_role: fields.roleName,
        status: 'Rejected',
        reason: actualReason
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error rejecting PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting PTW',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;