// backend/src/routes/approvals.routes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is an approver
const authorizeApprover = async (req, res, next) => {
  const userRole = req.user.role.toLowerCase();
  
  const approverRoles = ['approver_safety', 'approver_manager', 'approver_areamanager', 'approver_siteleader'];
  
  if (!approverRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only approvers can access this resource.'
    });
  }
  
  next();
};

// Helper function to get approval field names based on role
function getApprovalFields(role) {
  const roleMap = {
    'approver_areamanager': {
      idField: 'area_manager_id',
      statusField: 'area_manager_status',
      signatureField: 'area_manager_signature',
      approvedAtField: 'area_manager_approved_at',
      name: 'Area_Manager'
    },
    'approver_safety': {
      idField: 'safety_officer_id',
      statusField: 'safety_officer_status',
      signatureField: 'safety_officer_signature',
      approvedAtField: 'safety_officer_approved_at',
      name: 'Safety_Officer'
    },
    'approver_siteleader': {
      idField: 'site_leader_id',
      statusField: 'site_leader_status',
      signatureField: 'site_leader_signature',
      approvedAtField: 'site_leader_approved_at',
      name: 'Site_Leader'
    }
  };
  
  return roleMap[role.toLowerCase()] || null;
}

// GET /api/approvals/stats - Get approval statistics for logged-in approver
router.get('/stats', authenticate, authorizeApprover, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approver role'
      });
    }

    // Pending approvals (where I'm assigned and status is NULL or 'Pending')
    const [pending] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM permits 
       WHERE ${fields.idField} = ? 
       AND (${fields.statusField} IS NULL OR ${fields.statusField} = 'Pending')
       AND status != 'Cancelled'`,
      [userId]
    );

    // Approved today
    const [approvedToday] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM permits 
       WHERE ${fields.idField} = ? 
       AND ${fields.statusField} = 'Approved'
       AND DATE(${fields.approvedAtField}) = CURDATE()`,
      [userId]
    );

    // Total approved
    const [totalApproved] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM permits 
       WHERE ${fields.idField} = ? 
       AND ${fields.statusField} = 'Approved'`,
      [userId]
    );

    // Total rejected
    const [totalRejected] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM permits 
       WHERE ${fields.idField} = ? 
       AND ${fields.statusField} = 'Rejected'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        pending_approvals: pending[0].count,
        approved_today: approvedToday[0].count,
        total_approved: totalApproved[0].count,
        total_rejected: totalRejected[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approval statistics',
      error: error.message
    });
  }
});

// GET /api/approvals/pending - Get pending approvals for logged-in approver
router.get('/pending', authenticate, authorizeApprover, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approver role'
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
        ${fields.statusField} as my_approval_status,
        '${fields.name}' as approval_role
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.${fields.idField} = ?
      AND (p.${fields.statusField} IS NULL OR p.${fields.statusField} = 'Pending')
      AND p.status != 'Cancelled'
      ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
});

// GET /api/approvals/approved - Get approved/rejected permits for logged-in approver
router.get('/approved', authenticate, authorizeApprover, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approver role'
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
        p.${fields.approvedAtField} as approved_at,
        s.name as site_name,
        u.full_name as created_by_name,
        p.${fields.statusField} as my_approval_status,
        '${fields.name}' as approval_role
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.${fields.idField} = ?
      AND p.${fields.statusField} IN ('Approved', 'Rejected')
      ORDER BY p.${fields.approvedAtField} DESC
      LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      count: permits.length,
      data: permits
    });

  } catch (error) {
    console.error('Error fetching approved permits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved permits',
      error: error.message
    });
  }
});

// POST /api/approvals/:permitId/approve - Approve a permit
router.post('/:permitId/approve', authenticate, authorizeApprover, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    const { signature, approval_role } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid approver role'
      });
    }

    if (!signature) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Signature is required'
      });
    }

    // Verify this approver is assigned to this permit
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ? AND ${fields.idField} = ?`,
      [permitId, userId]
    );

    if (permits.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this permit'
      });
    }

    const permit = permits[0];

    // Update approval status and signature
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Approved',
           ${fields.signatureField} = ?,
           ${fields.approvedAtField} = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [signature, permitId]
    );

    // Check if all required approvals are complete
    const [updatedPermit] = await connection.query(
      'SELECT * FROM permits WHERE id = ?',
      [permitId]
    );

    const p = updatedPermit[0];
    let allApproved = true;

    // Check Area Manager
    if (p.area_manager_id && p.area_manager_status !== 'Approved') {
      allApproved = false;
    }

    // Check Safety Officer
    if (p.safety_officer_id && p.safety_officer_status !== 'Approved') {
      allApproved = false;
    }

    // Check Site Leader (if required)
    if (p.site_leader_id && p.site_leader_status !== 'Approved') {
      allApproved = false;
    }

    // If all approved, change permit status to Active
    if (allApproved) {
      await connection.query(
        `UPDATE permits 
         SET status = 'Active',
             updated_at = NOW()
         WHERE id = ?`,
        [permitId]
      );

      // Create notification for supervisor
      await connection.query(
        `INSERT INTO notifications (user_id, permit_id, type, message, created_at)
         VALUES (?, ?, 'APPROVAL', 'Your permit has been fully approved and is now Active', NOW())`,
        [permit.created_by_user_id, permitId]
      );
    } else {
      // Partially approved - notify supervisor of progress
      await connection.query(
        `INSERT INTO notifications (user_id, permit_id, type, message, created_at)
         VALUES (?, ?, 'APPROVAL_PROGRESS', ?, NOW())`,
        [permit.created_by_user_id, permitId, `${fields.name.replace('_', ' ')} has approved your permit`]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Permit approved successfully',
      data: {
        permit_id: permitId,
        all_approved: allApproved,
        new_status: allApproved ? 'Active' : 'Pending_Approval'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error approving permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving permit',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/approvals/:permitId/reject - Reject a permit
router.post('/:permitId/reject', authenticate, authorizeApprover, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { permitId } = req.params;
    const { rejection_reason, approval_role } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const fields = getApprovalFields(userRole);
    
    if (!fields) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid approver role'
      });
    }

    if (!rejection_reason || !rejection_reason.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Verify this approver is assigned to this permit
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ? AND ${fields.idField} = ?`,
      [permitId, userId]
    );

    if (permits.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this permit'
      });
    }

    const permit = permits[0];

    // Update approval status to Rejected
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Rejected',
           ${fields.approvedAtField} = NOW(),
           status = 'Rejected',
           rejection_reason = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [rejection_reason, permitId]
    );

    // Create notification for supervisor
    await connection.query(
      `INSERT INTO notifications (user_id, permit_id, type, message, created_at)
       VALUES (?, ?, 'REJECTION', ?, NOW())`,
      [permit.created_by_user_id, permitId, `Your permit was rejected by ${fields.name.replace('_', ' ')}: ${rejection_reason}`]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Permit rejected successfully',
      data: {
        permit_id: permitId,
        rejection_reason
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting permit:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting permit',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;