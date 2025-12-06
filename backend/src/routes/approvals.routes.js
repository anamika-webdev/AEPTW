// backend/src/routes/approvals.routes.js
// ✅ FIXED: Added JOINs to fetch approver names (area_manager_name, safety_officer_name, site_leader_name)
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { createNotification } = require('../utils/notificationUtils');

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

    // ✅ FIXED: Added JOINs for all three approver names
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
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

    // ✅ FIXED: Added JOINs for all three approver names
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
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

    // ✅ FIXED: Added JOINs for all three approver names
    const [permits] = await pool.query(
      `SELECT 
        p.id,
        p.permit_serial,
        p.permit_type,
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
router.post('/:ptwId/approve', async (req, res) => {
  try {
    const { ptwId } = req.params;
    const { signature } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`📥 POST /api/approvals/${ptwId}/approve - User: ${userId}, Role: ${userRole}`);

    const fields = getApprovalFields(userRole);
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    // Check if this user is the assigned approver for this permit
    const [permit] = await pool.query(
      `SELECT ${fields.idField} as assigned_approver_id FROM permits WHERE id = ?`,
      [ptwId]
    );

    if (permit.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    if (permit[0].assigned_approver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as the approver for this permit'
      });
    }

    // Update approval status
    const updateQuery = `
      UPDATE permits 
      SET ${fields.statusField} = 'Approved',
          ${fields.approvedAtField} = NOW(),
          ${fields.signatureField} = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [signature, ptwId]);

    // Check if all required approvals are done, then update overall status
    const [updatedPermit] = await pool.query(
      `SELECT 
        area_manager_status, 
        safety_officer_status, 
        site_leader_status,
        site_leader_id,
        created_by_user_id,
        permit_serial
      FROM permits WHERE id = ?`,
      [ptwId]
    );

    const p = updatedPermit[0];
    let allApproved = false;

    // If site leader is assigned (high-risk), need all three
    if (p.site_leader_id) {
      allApproved =
        p.area_manager_status === 'Approved' &&
        p.safety_officer_status === 'Approved' &&
        p.site_leader_status === 'Approved';
    } else {
      // Only need area manager and safety officer
      allApproved =
        p.area_manager_status === 'Approved' &&
        p.safety_officer_status === 'Approved';
    }

    if (allApproved) {
      await pool.query(
        `UPDATE permits SET status = 'Approved' WHERE id = ?`,
        [ptwId]
      );
      console.log(`✅ PTW ${ptwId} fully approved`);

      // Notify Creator - FULL APPROVAL
      if (p.created_by_user_id) {
        await createNotification(
          p.created_by_user_id,
          'Permit Approved',
          `Your PTW ${p.permit_serial} has been FULLY APPROVED and is ready to start.`,
          'success',
          ptwId
        );
      }
    } else {
      console.log(`⏳ PTW ${ptwId} partially approved, waiting for other approvers`);

      // Notify Creator - PARTIAL APPROVAL
      if (p.created_by_user_id) {
        await createNotification(
          p.created_by_user_id,
          'Permit Update',
          `Your PTW ${p.permit_serial} has been approved by ${fields.roleName}. Pending other approvals.`,
          'info',
          ptwId
        );
      }
    }

    res.json({
      success: true,
      message: 'PTW approved successfully',
      fully_approved: allApproved
    });

  } catch (error) {
    console.error('❌ Error approving PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving PTW',
      error: error.message
    });
  }
});

// ============================================================================
// REJECT PTW
// ============================================================================
router.post('/:ptwId/reject', async (req, res) => {
  try {
    const { ptwId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`📥 POST /api/approvals/${ptwId}/reject - User: ${userId}, Role: ${userRole}`);

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const fields = getApprovalFields(userRole);
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    // Check if this user is the assigned approver
    const [permit] = await pool.query(
      `SELECT ${fields.idField} as assigned_approver_id, created_by_user_id, permit_serial FROM permits WHERE id = ?`,
      [ptwId]
    );

    if (permit.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      });
    }

    if (permit[0].assigned_approver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as the approver for this permit'
      });
    }

    // Update approval status and overall permit status to Rejected
    const updateQuery = `
      UPDATE permits 
      SET ${fields.statusField} = 'Rejected',
          ${fields.approvedAtField} = NOW(),
          status = 'Rejected',
          rejection_reason = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [reason, ptwId]);

    console.log(`❌ PTW ${ptwId} rejected by ${fields.roleName}`);

    // Notify Creator
    if (permit[0].created_by_user_id) {
      await createNotification(
        permit[0].created_by_user_id,
        'Permit Rejected',
        `Your PTW ${permit[0].permit_serial} has been REJECTED by ${fields.roleName}. Reason: ${reason}`,
        'error',
        ptwId
      );
    }

    res.json({
      success: true,
      message: 'PTW rejected successfully'
    });

  } catch (error) {
    console.error('❌ Error rejecting PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting PTW',
      error: error.message
    });
  }
});

module.exports = router;