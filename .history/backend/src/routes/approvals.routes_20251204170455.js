// backend/src/routes/approvals.routes.js - COMPLETE FILE
// Save this as: backend/src/routes/approvals.routes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Helper function to get approval field names based on role
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

// GET /api/approvals/pending
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
      AND p.status = 'Pending_Approval'
      ORDER BY p.created_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${permits.length} pending approvals for user ${userId}`);

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

// POST /api/approvals/:permitId/approve
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

    // Verify assigned
    const [permits] = await connection.query(
      `SELECT * FROM permits WHERE id = ? AND ${fields.idField} = ?`,
      [permitId, userId]
    );

    if (permits.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not assigned to this permit'
      });
    }

    // Update approval
    await connection.query(
      `UPDATE permits 
       SET ${fields.statusField} = 'Approved',
           ${fields.approvedAtField} = NOW(),
           ${fields.signatureField} = ?
       WHERE id = ?`,
      [signature, permitId]
    );

    // Check if all approved
    const [updated] = await connection.query(
      'SELECT * FROM permits WHERE id = ?',
      [permitId]
    );

    const p = updated[0];
    let allApproved = true;

    if (p.area_manager_id && p.area_manager_status !== 'Approved') allApproved = false;
    if (p.safety_officer_id && p.safety_officer_status !== 'Approved') allApproved = false;
    if (p.site_leader_id && p.site_leader_status !== 'Approved') allApproved = false;

    // If all approved, make Active
    if (allApproved) {
      await connection.query(
        `UPDATE permits SET status = 'Active' WHERE id = ?`,
        [permitId]
      );
      console.log(`🎉 All approved! Permit ${permitId} → Active`);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Permit approved',
      permit_status: allApproved ? 'Active' : 'Pending_Approval'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error approving:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving permit',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// POST /api/approvals/:permitId/reject
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
        message: 'Rejection reason required'
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
        message: 'Not assigned to this permit'
      });
    }

    // Reject permit
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

    console.log(`❌ Permit ${permitId} rejected`);

    await connection.commit();

    res.json({
      success: true,
      message: 'Permit rejected'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error rejecting:', error);
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