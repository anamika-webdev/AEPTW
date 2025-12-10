// backend/src/routes/approvals.routes.js
// ✅ UPDATED: Added signature for reject and comments for approve
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
// APPROVE PTW - ✅ UPDATED: Now accepts optional comments
// ============================================================================
router.post('/:ptwId/approve', async (req, res) => {
  try {
    const { ptwId } = req.params;
    const { signature, comments } = req.body;  // ✅ Added comments parameter
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

    // Update approval status with signature
    const updateQuery = `
      UPDATE permits 
      SET ${fields.statusField} = 'Approved',
          ${fields.approvedAtField} = NOW(),
          ${fields.signatureField} = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [signature, ptwId]);

    // ✅ NEW: Store comments if provided (optional)
    if (comments && comments.trim()) {
      const commentsField = fields.statusField.replace('_status', '_comments');
      try {
        await pool.query(
          `UPDATE permits SET ${commentsField} = ? WHERE id = ?`,
          [comments.trim(), ptwId]
        );
        console.log(`✅ Comments stored in ${commentsField}`);
      } catch (err) {
        console.log(`⚠️ Comments field ${commentsField} may not exist:`, err.message);
        // Continue anyway - comments are optional and column may not exist
      }
    }

    // Check if all required approvals are done, then update overall status
    const [updatedPermit] = await pool.query(
      `SELECT 
        area_manager_status, 
        safety_officer_status, 
        site_leader_status,
        area_manager_id,
        safety_officer_id,
        site_leader_id,
        created_by_user_id,
        permit_serial
      FROM permits WHERE id = ?`,
      [ptwId]
    );

    const p = updatedPermit[0];

    console.log(`🔍 Checking approval status for PTW ${ptwId}:`, {
      area_manager_id: p.area_manager_id,
      area_manager_status: p.area_manager_status,
      safety_officer_id: p.safety_officer_id,
      safety_officer_status: p.safety_officer_status,
      site_leader_id: p.site_leader_id,
      site_leader_status: p.site_leader_status
    });

    let allApproved = true;

    // Check Area Manager (Always required, but safe to check ID)
    if (p.area_manager_id && p.area_manager_status !== 'Approved') {
      console.log(`❌ Area Manager not approved: ${p.area_manager_status}`);
      allApproved = false;
    } else if (p.area_manager_id) {
      console.log(`✅ Area Manager approved`);
    }

    // Check Safety Officer (Optional)
    if (p.safety_officer_id && p.safety_officer_status !== 'Approved') {
      console.log(`❌ Safety Officer not approved: ${p.safety_officer_status}`);
      allApproved = false;
    } else if (p.safety_officer_id) {
      console.log(`✅ Safety Officer approved`);
    } else {
      console.log(`ℹ️ No Safety Officer assigned`);
    }

    // Check Site Leader (Optional)
    if (p.site_leader_id && p.site_leader_status !== 'Approved') {
      console.log(`❌ Site Leader not approved: ${p.site_leader_status}`);
      allApproved = false;
    } else if (p.site_leader_id) {
      console.log(`✅ Site Leader approved`);
    } else {
      console.log(`ℹ️ No Site Leader assigned`);
    }

    console.log(`🎯 Final approval decision: ${allApproved ? 'FULLY APPROVED' : 'PARTIALLY APPROVED'}`);

    if (allApproved) {
      try {
        const [updateResult] = await pool.query(
          `UPDATE permits SET status = 'Approved', updated_at = NOW() WHERE id = ?`,
          [ptwId]
        );
        console.log(`✅ PTW ${ptwId} fully approved - Status updated to 'Approved'`);
        console.log(`📝 UPDATE result:`, {
          affectedRows: updateResult.affectedRows,
          changedRows: updateResult.changedRows,
          warningCount: updateResult.warningCount
        });

        if (updateResult.affectedRows === 0) {
          console.error(`⚠️  WARNING: UPDATE affected 0 rows for PTW ${ptwId}!`);
        }
      } catch (updateError) {
        console.error(`❌ Error updating permit status:`, updateError);
        throw updateError;
      }

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
// REJECT PTW - ✅ UPDATED: Now requires signature
// ============================================================================
router.post('/:ptwId/reject', async (req, res) => {
  try {
    const { ptwId } = req.params;
    const { reason, signature } = req.body;  // ✅ Added signature parameter
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`📥 POST /api/approvals/${ptwId}/reject - User: ${userId}, Role: ${userRole}`);

    // ✅ Validate rejection reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // ✅ NEW: Validate signature
    if (!signature || signature.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Digital signature is required for rejection'
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

    // ✅ UPDATED: Update with BOTH signature and reason
    const updateQuery = `
      UPDATE permits 
      SET ${fields.statusField} = 'Rejected',
          ${fields.approvedAtField} = NOW(),
          ${fields.signatureField} = ?,
          status = 'Rejected',
          rejection_reason = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [signature, reason, ptwId]);

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