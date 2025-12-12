// backend/src/routes/extension-approvals.routes.js
// ✅ FIXED: Complete approve/reject functionality with proper error handling

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// HELPER FUNCTION - Get approval field names based on user role
// ============================================================================
const getExtensionApprovalFields = (userRole) => {
    console.log('🔍 Getting approval fields for role:', userRole);

    // Normalize role string (case-insensitive, handle variations)
    const normalizedRole = userRole.toLowerCase().trim();

    let fields = null;

    if (normalizedRole.includes('site') && normalizedRole.includes('leader')) {
        fields = {
            idField: 'site_leader_id',
            statusField: 'site_leader_status',
            approvedAtField: 'site_leader_approved_at',
            signatureField: 'site_leader_signature',
            remarksField: 'site_leader_remarks',
            roleName: 'Site Leader'
        };
    } else if (normalizedRole.includes('safety')) {
        fields = {
            idField: 'safety_officer_id',
            statusField: 'safety_officer_status',
            approvedAtField: 'safety_officer_approved_at',
            signatureField: 'safety_officer_signature',
            remarksField: 'safety_officer_remarks',
            roleName: 'Safety Officer'
        };
    }

    // Also check for Approver_SiteLeader and Approver_Safety formats
    if (!fields) {
        if (normalizedRole === 'approver_siteleader') {
            fields = {
                idField: 'site_leader_id',
                statusField: 'site_leader_status',
                approvedAtField: 'site_leader_approved_at',
                signatureField: 'site_leader_signature',
                remarksField: 'site_leader_remarks',
                roleName: 'Site Leader'
            };
        } else if (normalizedRole === 'approver_safety') {
            fields = {
                idField: 'safety_officer_id',
                statusField: 'safety_officer_status',
                approvedAtField: 'safety_officer_approved_at',
                signatureField: 'safety_officer_signature',
                remarksField: 'safety_officer_remarks',
                roleName: 'Safety Officer'
            };
        }
    }

    console.log('📋 Approval fields:', fields);
    return fields;
};

// ============================================================================
// GET PENDING EXTENSION APPROVALS
// ============================================================================
router.get('/pending', async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📥 GET /api/extension-approvals/pending - User: ${userId}, Role: ${userRole}`);

        const fields = getExtensionApprovalFields(userRole);

        if (!fields) {
            return res.status(400).json({
                success: false,
                message: 'User is not an extension approver'
            });
        }

        const [extensions] = await pool.query(`
            SELECT 
                pe.id,
                pe.permit_id,
                pe.requested_at,
                pe.original_end_time,
                pe.new_end_time,
                pe.reason,
                pe.status as extension_status,
                pe.${fields.statusField} as my_approval_status,
                pe.site_leader_status,
                pe.safety_officer_status,
                p.permit_serial,
                p.permit_type,
                p.work_location,
                p.work_description,
                p.status as permit_status,
                s.name as site_name,
                supervisor.full_name as requested_by_name,
                sl.full_name as site_leader_name,
                so.full_name as safety_officer_name
            FROM permit_extensions pe
            JOIN permits p ON pe.permit_id = p.id
            JOIN sites s ON p.site_id = s.id
            JOIN users supervisor ON pe.requested_by_user_id = supervisor.id
            LEFT JOIN users sl ON pe.site_leader_id = sl.id
            LEFT JOIN users so ON pe.safety_officer_id = so.id
            WHERE pe.${fields.idField} = ?
            AND pe.${fields.statusField} = 'Pending'
            AND pe.status IN ('Pending', 'Extension_Requested')
            ORDER BY pe.requested_at DESC
        `, [userId]);

        console.log(`✅ Found ${extensions.length} pending extension approvals for ${fields.roleName}`);

        res.json({
            success: true,
            count: extensions.length,
            data: extensions,
            approver_role: fields.roleName
        });

    } catch (error) {
        console.error('❌ Error fetching pending extension approvals:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending extension approvals',
            error: error.message
        });
    }
});

// ============================================================================
// GET APPROVED EXTENSION REQUESTS
// ============================================================================
router.get('/approved', async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📥 GET /api/extension-approvals/approved - User: ${userId}, Role: ${userRole}`);

        const fields = getExtensionApprovalFields(userRole);

        if (!fields) {
            return res.status(400).json({
                success: false,
                message: 'User is not an extension approver'
            });
        }

        const [extensions] = await pool.query(`
            SELECT 
                pe.id,
                pe.permit_id,
                pe.requested_at,
                pe.original_end_time,
                pe.new_end_time,
                pe.reason,
                pe.status as extension_status,
                pe.${fields.statusField} as my_approval_status,
                pe.${fields.approvedAtField} as my_approved_at,
                pe.${fields.remarksField} as my_remarks,
                pe.site_leader_status,
                pe.safety_officer_status,
                p.permit_serial,
                p.permit_type,
                p.work_location,
                p.work_description,
                p.status as permit_status,
                s.name as site_name,
                supervisor.full_name as requested_by_name,
                sl.full_name as site_leader_name,
                so.full_name as safety_officer_name
            FROM permit_extensions pe
            JOIN permits p ON pe.permit_id = p.id
            JOIN sites s ON p.site_id = s.id
            JOIN users supervisor ON pe.requested_by_user_id = supervisor.id
            LEFT JOIN users sl ON pe.site_leader_id = sl.id
            LEFT JOIN users so ON pe.safety_officer_id = so.id
            WHERE pe.${fields.idField} = ?
            AND pe.${fields.statusField} = 'Approved'
            ORDER BY pe.${fields.approvedAtField} DESC
        `, [userId]);

        console.log(`✅ Found ${extensions.length} approved extensions`);

        res.json({
            success: true,
            count: extensions.length,
            data: extensions,
            approver_role: fields.roleName
        });

    } catch (error) {
        console.error('❌ Error fetching approved extensions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approved extensions',
            error: error.message
        });
    }
});

// ============================================================================
// GET REJECTED EXTENSION REQUESTS
// ============================================================================
router.get('/rejected', async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📥 GET /api/extension-approvals/rejected - User: ${userId}, Role: ${userRole}`);

        const fields = getExtensionApprovalFields(userRole);

        if (!fields) {
            return res.status(400).json({
                success: false,
                message: 'User is not an extension approver'
            });
        }

        const [extensions] = await pool.query(`
            SELECT 
                pe.id,
                pe.permit_id,
                pe.requested_at,
                pe.original_end_time,
                pe.new_end_time,
                pe.reason,
                pe.status as extension_status,
                pe.${fields.statusField} as my_approval_status,
                pe.${fields.approvedAtField} as my_approved_at,
                pe.${fields.remarksField} as my_remarks,
                pe.site_leader_status,
                pe.safety_officer_status,
                p.permit_serial,
                p.permit_type,
                p.work_location,
                p.work_description,
                p.status as permit_status,
                s.name as site_name,
                supervisor.full_name as requested_by_name,
                sl.full_name as site_leader_name,
                so.full_name as safety_officer_name
            FROM permit_extensions pe
            JOIN permits p ON pe.permit_id = p.id
            JOIN sites s ON p.site_id = s.id
            JOIN users supervisor ON pe.requested_by_user_id = supervisor.id
            LEFT JOIN users sl ON pe.site_leader_id = sl.id
            LEFT JOIN users so ON pe.safety_officer_id = so.id
            WHERE pe.${fields.idField} = ?
            AND pe.${fields.statusField} = 'Rejected'
            ORDER BY pe.${fields.approvedAtField} DESC
        `, [userId]);

        console.log(`✅ Found ${extensions.length} rejected extensions`);

        res.json({
            success: true,
            count: extensions.length,
            data: extensions,
            approver_role: fields.roleName
        });

    } catch (error) {
        console.error('❌ Error fetching rejected extensions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rejected extensions',
            error: error.message
        });
    }
});

// ============================================================================
// APPROVE EXTENSION REQUEST - COMPLETE WORKFLOW
// ============================================================================
router.post('/:extensionId/approve', async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { extensionId } = req.params;
        const { signature, remarks } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📥 POST /api/extension-approvals/${extensionId}/approve`);
        console.log(`   User ID: ${userId}, Role: ${userRole}`);
        console.log(`   Has signature: ${!!signature}, Has remarks: ${!!remarks}`);

        // Validate signature
        if (!signature) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Digital signature is required for approval'
            });
        }

        // Get field mappings for user role
        const fields = getExtensionApprovalFields(userRole);
        if (!fields) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `User role '${userRole}' is not authorized to approve extensions`
            });
        }

        console.log(`   Approving as: ${fields.roleName}`);

        // Get extension details
        const [extension] = await connection.query(
            `SELECT 
                pe.*,
                p.permit_serial,
                p.created_by_user_id
            FROM permit_extensions pe
            JOIN permits p ON pe.permit_id = p.id
            WHERE pe.id = ?`,
            [extensionId]
        );

        if (extension.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Extension request not found'
            });
        }

        const ext = extension[0];
        console.log(`   Extension found: PTW ${ext.permit_serial}, Status: ${ext.status}`);

        // Verify user is the assigned approver
        if (ext[fields.idField] !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: `You are not assigned as ${fields.roleName} for this extension request`
            });
        }

        // Verify status is still Pending
        if (ext[fields.statusField] !== 'Pending') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Extension already ${ext[fields.statusField]} by you`
            });
        }

        // Update this approver's approval status
        const updateQuery = `
            UPDATE permit_extensions 
            SET ${fields.statusField} = 'Approved',
                ${fields.approvedAtField} = NOW(),
                ${fields.signatureField} = ?,
                ${fields.remarksField} = ?
            WHERE id = ?
        `;

        await connection.query(updateQuery, [signature, remarks || null, extensionId]);
        console.log(`   ✅ Updated ${fields.roleName} approval status to Approved`);

        // Get updated extension to check if all approvers have approved
        const [updatedExt] = await connection.query(
            'SELECT * FROM permit_extensions WHERE id = ?',
            [extensionId]
        );
        const ue = updatedExt[0];

        // Check if both approvers have approved
        const siteLeaderApproved = ue.site_leader_status === 'Approved';
        const safetyOfficerApproved = ue.safety_officer_status === 'Approved';

        console.log(`   Site Leader: ${ue.site_leader_status}, Safety Officer: ${ue.safety_officer_status}`);

        if (siteLeaderApproved && safetyOfficerApproved) {
            // Both approved - grant extension
            console.log('   🎉 Both approvers approved! Granting extension...');

            await connection.query(
                `UPDATE permit_extensions 
                 SET status = 'Approved' 
                 WHERE id = ?`,
                [extensionId]
            );

            await connection.query(
                `UPDATE permits 
                 SET end_time = ?, 
                     status = 'Active',
                     updated_at = NOW() 
                 WHERE id = ?`,
                [ue.new_end_time, ext.permit_id]
            );

            // Notify supervisor - EXTENSION APPROVED
            await connection.query(`
                INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
                VALUES (?, ?, 'EXTENSION_APPROVED', ?, NOW())
            `, [
                ext.created_by_user_id,
                ext.permit_id,
                `✅ Extension APPROVED for PTW ${ext.permit_serial}. New end time: ${new Date(ue.new_end_time).toLocaleString()}`
            ]);

            await connection.commit();

            res.json({
                success: true,
                message: '✅ Extension fully approved! PTW end time has been extended.',
                fully_approved: true,
                data: {
                    extension_id: extensionId,
                    permit_id: ext.permit_id,
                    new_end_time: ue.new_end_time,
                    approved_by: fields.roleName
                }
            });
        } else {
            // Partial approval - waiting for other approver
            console.log('   ⏳ Waiting for other approver...');

            // Notify supervisor - PARTIAL APPROVAL
            await connection.query(`
                INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
                VALUES (?, ?, 'EXTENSION_PARTIAL_APPROVAL', ?, NOW())
            `, [
                ext.created_by_user_id,
                ext.permit_id,
                `⏳ Extension approved by ${fields.roleName} for PTW ${ext.permit_serial}. Waiting for other approvers.`
            ]);

            await connection.commit();

            res.json({
                success: true,
                message: `✅ Extension approved by ${fields.roleName}. Waiting for other approvers.`,
                fully_approved: false,
                data: {
                    extension_id: extensionId,
                    permit_id: ext.permit_id,
                    approved_by: fields.roleName,
                    extension_status: 'Extension_Requested',
                    site_leader_status: ue.site_leader_status,
                    safety_officer_status: ue.safety_officer_status
                }
            });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error approving extension:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error approving extension',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// ============================================================================
// REJECT EXTENSION REQUEST - COMPLETE WORKFLOW
// ============================================================================
router.post('/:extensionId/reject', async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { extensionId } = req.params;
        const { remarks } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📥 POST /api/extension-approvals/${extensionId}/reject`);
        console.log(`   User ID: ${userId}, Role: ${userRole}`);
        console.log(`   Remarks: ${remarks}`);

        // Validate remarks
        if (!remarks || remarks.trim() === '') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        // Get field mappings for user role
        const fields = getExtensionApprovalFields(userRole);
        if (!fields) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `User role '${userRole}' is not authorized to reject extensions`
            });
        }

        console.log(`   Rejecting as: ${fields.roleName}`);

        // Get extension details
        const [extension] = await connection.query(
            `SELECT 
                pe.*,
                p.permit_serial,
                p.created_by_user_id
            FROM permit_extensions pe
            JOIN permits p ON pe.permit_id = p.id
            WHERE pe.id = ?`,
            [extensionId]
        );

        if (extension.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Extension request not found'
            });
        }

        const ext = extension[0];
        console.log(`   Extension found: PTW ${ext.permit_serial}, Status: ${ext.status}`);

        // Verify user is the assigned approver
        if (ext[fields.idField] !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: `You are not assigned as ${fields.roleName} for this extension request`
            });
        }

        // Update this approver's status to Rejected
        const updateQuery = `
            UPDATE permit_extensions 
            SET ${fields.statusField} = 'Rejected',
                ${fields.approvedAtField} = NOW(),
                ${fields.remarksField} = ?,
                status = 'Extension_Rejected'
            WHERE id = ?
        `;

        await connection.query(updateQuery, [remarks, extensionId]);
        console.log(`   ❌ Updated ${fields.roleName} status to Rejected`);

        // Update permit status back to Active (rejection means work continues with original time)
        await connection.query(
            `UPDATE permits 
             SET status = 'Active', 
                 updated_at = NOW() 
             WHERE id = ?`,
            [ext.permit_id]
        );

        console.log(`   ✅ Permit ${ext.permit_serial} status reset to Active`);

        // Notify supervisor - EXTENSION REJECTED
        await connection.query(`
            INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
            VALUES (?, ?, 'EXTENSION_REJECTED', ?, NOW())
        `, [
            ext.created_by_user_id,
            ext.permit_id,
            `❌ Extension REJECTED for PTW ${ext.permit_serial} by ${fields.roleName}. Reason: ${remarks}`
        ]);

        await connection.commit();

        res.json({
            success: true,
            message: `❌ Extension rejected by ${fields.roleName}`,
            data: {
                extension_id: extensionId,
                permit_id: ext.permit_id,
                rejected_by: fields.roleName,
                rejection_reason: remarks
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error rejecting extension:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error rejecting extension',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;