// backend/src/routes/approvals.routes.js - COMPLETE CORRECT WORKFLOW

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Helper to get approval field names
function getApprovalFields(role) {
  const roleMap = {
    'approver_areamanager': {
      idField: 'area_manager_id',
      statusField: 'area_manager_status',
      signatureField: 'area_manager_signature',
      approvedAtField: 'area_manager_approved_at',
      name: 'Area Manager'
    },
    'approver_safety': {
      idField: 'safety_officer_id',
      statusField: 'safety_officer_status',
      signatureField: 'safety_officer_signature',
      approvedAtField: 'safety_officer_approved_at',
      name: 'Safety Officer'
    },
    'approver_siteleader': {
      idField: 'site_leader_id',
      statusField: 'site_leader_status',
      signatureField: 'site_leader_signature',
      approvedAtField: 'site_leader_approved_at',
      name: 'Site Leader'
    }
  };
  
  return roleMap[role.toLowerCase()] || null;
}

// GET /api/approvals/pending - Get PTWs pending my approval
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
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
        p.status,
        p.created_at,
        s.name as site_name,
        u.full_name as created_by_name,
        p.${fields.statusField} as my_approval_status
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.${fields.idField} = ?
      AND (p.${fields.statusField} IS NULL OR p.${fields.statusField} = 'Pending')
      AND p.status = 'Initiated'
      ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: permits.length,
      data: permits
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

// GET /api/approvals/approved - Get PTWs I have approved
router.get('/approved', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
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
        p.status,
        p.${fields.approvedAtField} as approved_at,
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

// GET /api/approvals/rejected - Get PTWs I have rejected
router.get('/rejected', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
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

// POST /api/approvals/:permitId/approve - Approve a PTW with signature
router.post('/:permitId/approve', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    const { signature } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    if (!signature) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Digital signature is required'
      });
    }

    // Verify assigned
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ? AND ${fields.idField} = ?`,
      [permitId, userId]
    );

    if (permits.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this PTW'
      });
    }

    const permit = permits[0];

    // Check if already approved
    if (permit[fields.statusField] === 'Approved') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already approved this PTW'
      });
    }

    // Update approval with signature
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Approved',
           ${fields.approvedAtField} = NOW(),
           ${fields.signatureField} = ?
       WHERE id = ?`,
      [signature, permitId]
    );

    console.log(`✅ ${fields.name} approved PTW ${permitId}`);

    // Check if ALL assigned approvers have approved
    const [updated] = await connection.query(
      'SELECT * FROM permits WHERE id = ?',
      [permitId]
    );

    const p = updated[0];
    let allApproved = true;

    if (p.area_manager_id && p.area_manager_status !== 'Approved') allApproved = false;
    if (p.safety_officer_id && p.safety_officer_status !== 'Approved') allApproved = false;
    if (p.site_leader_id && p.site_leader_status !== 'Approved') allApproved = false;

    // If all approved, change status to Approved and notify supervisor
    if (allApproved) {
      await connection.query(
        `UPDATE permits SET status = 'Approved' WHERE id = ?`,
        [permitId]
      );

      // Notify supervisor that PTW is approved
      await connection.query(`
        INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
        VALUES (?, ?, 'PTW_APPROVED', ?, NOW())
      `, [p.created_by_user_id, permitId, `PTW ${p.permit_serial} has been approved by all approvers. Click to do final submit.`]);

      console.log(`🎉 All approvers approved! PTW ${permitId} → Approved (waiting for final submit)`);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'PTW approved successfully',
      data: {
        all_approved: allApproved,
        status: allApproved ? 'Approved' : 'Initiated'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error approving PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving PTW',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/approvals/:permitId/reject - Reject a PTW
router.post('/:permitId/reject', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    const { rejection_reason, signature } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is not an approver'
      });
    }

    if (!rejection_reason) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Verify assigned
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ? AND ${fields.idField} = ?`,
      [permitId, userId]
    );

    if (permits.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this PTW'
      });
    }

    const permit = permits[0];

    // Reject PTW
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Rejected',
           ${fields.approvedAtField} = NOW(),
           ${fields.signatureField} = ?,
           rejection_reason = ?,
           status = 'Rejected'
       WHERE id = ?`,
      [signature || null, rejection_reason, permitId]
    );

    // Notify supervisor
    await connection.query(`
      INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
      VALUES (?, ?, 'PTW_REJECTED', ?, NOW())
    `, [permit.created_by_user_id, permitId, `PTW ${permit.permit_serial} was rejected by ${fields.name}. Reason: ${rejection_reason}`]);

    console.log(`❌ ${fields.name} rejected PTW ${permitId}`);

    await connection.commit();

    res.json({
      success: true,
      message: 'PTW rejected successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error rejecting PTW:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting PTW',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;