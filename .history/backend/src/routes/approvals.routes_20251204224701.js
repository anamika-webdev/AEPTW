// backend/src/routes/approvals.routes.js
// APPROVER DASHBOARD - Only show PTWs assigned to this specific approver

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Helper function to get approval fields based on user role
const getApprovalFields = (role) => {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('areamanager') || roleLower === 'approver_areamanager') {
    return {
      idField: 'area_manager_id',
      statusField: 'area_manager_status',
      signatureField: 'area_manager_signature',
      approvedAtField: 'area_manager_approved_at',
      roleName: 'Area Manager'
    };
  } else if (roleLower.includes('safety') || roleLower === 'approver_safety') {
    return {
      idField: 'safety_officer_id',
      statusField: 'safety_officer_status',
      signatureField: 'safety_officer_signature',
      approvedAtField: 'safety_officer_approved_at',
      roleName: 'Safety Officer'
    };
  } else if (roleLower.includes('siteleader') || roleLower === 'approver_siteleader') {
    return {
      idField: 'site_leader_id',
      statusField: 'site_leader_status',
      signatureField: 'site_leader_signature',
      approvedAtField: 'site_leader_approved_at',
      roleName: 'Site Leader'
    };
  }
  
  return null;
};

// ============================================================================
// GET PENDING APPROVALS
// ============================================================================

// GET /api/approvals/pending - Get PTWs awaiting my approval
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

    // Query to get permits where:
    // 1. This specific user is assigned as the approver for their role
    // 2. Their approval status is Pending or NULL
    // 3. Overall permit status is Initiated (waiting for approvals)
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
        COUNT(DISTINCT ptm.id) as team_member_count
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN permit_team_members ptm ON p.id = ptm.permit_id
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

// GET /api/approvals/approved - Get PTWs I have approved
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
        p.work_location,
        p.work_description,
        p.start_time,
        p.end_time,
        p.status as permit_status,
        p.${fields.statusField} as my_approval_status,
        p.${fields.approvedAtField} as approved_at,
        p.${fields.signatureField} as my_signature,
        s.name as site_name,
        u.full_name as created_by_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
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

// GET /api/approvals/rejected - Get PTWs I have rejected
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
        p.work_location,
        p.work_description,
        p.rejection_reason,
        p.${fields.approvedAtField} as rejected_at,
        p.${fields.signatureField} as my_signature,
        s.name as site_name,
        u.full_name as created_by_name
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
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

// POST /api/approvals/:permitId/approve - Approve PTW with signature
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
    
    // Check if already approved
    if (permit[fields.statusField] === 'Approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already approved this PTW'
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
    
    // Check area manager
    if (updated.area_manager_id) {
      if (updated.area_manager_status !== 'Approved') {
        allApproved = false;
      }
    }
    
    // Check safety officer
    if (updated.safety_officer_id) {
      if (updated.safety_officer_status !== 'Approved') {
        allApproved = false;
      }
    }
    
    // Check site leader
    if (updated.site_leader_id) {
      if (updated.site_leader_status !== 'Approved') {
        allApproved = false;
      }
    }

    console.log(`🔍 All approvers approved: ${allApproved}`);

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
        status: allApproved ? 'Approved' : 'Initiated'
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
// REJECT PTW
// ============================================================================

// POST /api/approvals/:permitId/reject - Reject PTW with reason
router.post('/:permitId/reject', async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    const { rejection_reason, signature } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📥 POST /api/approvals/${permitId}/reject - User: ${userId}, Role: ${userRole}`);
    
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    // Validate rejection reason
    if (!rejection_reason) {
      await connection.rollback();
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

    // Update approval status
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Rejected',
           ${fields.approvedAtField} = NOW(),
           ${fields.signatureField} = ?,
           rejection_reason = ?,
           status = 'Rejected',
           updated_at = NOW()
       WHERE id = ?`,
      [signature || null, rejection_reason, permitId]
    );
    
    console.log(`❌ ${fields.roleName} rejected PTW ${permitId}`);

    // Create notification for supervisor
    await connection.query(
      `INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
       VALUES (?, ?, 'PTW_REJECTED', ?, NOW())`,
      [
        permit.created_by_user_id,
        permitId,
        `PTW ${permit.permit_serial} was rejected by ${fields.roleName}. Reason: ${rejection_reason}`
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'PTW rejected successfully',
      data: {
        permit_id: permitId,
        approver_role: fields.roleName,
        status: 'Rejected'
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