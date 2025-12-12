// backend/src/routes/extension-approvals.routes.js
// COMPLETE EXTENSION APPROVAL WORKFLOW - FIXED VERSION

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
                message: 'User is not authorized to approve extensions (Site Leader or Safety Officer only)'
            });
        }

        // Get extension requests pending this user's approval
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
                s.site_code,
                supervisor.full_name as requested_by_name,
                supervisor.email as requested_by_email,
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
                pe.site_leader_status,
                pe.safety_officer_status,
                p.permit_serial,
                p.permit_type,
                p.work_location,
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

        console.log(`📥 POST /api/extension-approvals/${extensionId}/approve - User: ${userId}, Role: ${userRole}`);

        if (!signature) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Digital signature is required for approval'
            });
        }

        const fields = getExtensionApprovalFields(userRole);
        if (!fields) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'User is not authorized to approve extensions'
            });
        }

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

        // Verify user is assigned approver
        if (ext[fields.idField] !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'You are not assigned as the approver for this extension request'
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

        console.log(`✅ Extension ${extensionId} approved by ${fields.roleName}`);

        // Check if all required approvals are done
        const [updatedExtension] = await connection.query(
            `SELECT 
                site_leader_status, 
                safety_officer_status,
                site_leader_id,
                safety_officer_id,
                permit_id,
                new_end_time,
                original_end_time
            FROM permit_extensions WHERE id = ?`,
            [extensionId]
        );

        const ue = updatedExtension[0];

        console.log(`🔍 Checking extension approval status:`, {
            site_leader_id: ue.site_leader_id,
            site_leader_status: ue.site_leader_status,
            safety_officer_id: ue.safety_officer_id,
            safety_officer_status: ue.safety_officer_status
        });

        let allApproved = true;

        // Check Site Leader (if assigned)
        if (ue.site_leader_id && ue.site_leader_status !== 'Approved') {
            console.log(`⏳ Site Leader not approved yet: ${ue.site_leader_status}`);
            allApproved = false;
        } else if (ue.site_leader_id) {
            console.log(`✅ Site Leader approved`);
        }

        // Check Safety Officer (if assigned)
        if (ue.safety_officer_id && ue.safety_officer_status !== 'Approved') {
            console.log(`⏳ Safety Officer not approved yet: ${ue.safety_officer_status}`);
            allApproved = false;
        } else if (ue.safety_officer_id) {
            console.log(`✅ Safety Officer approved`);
        }

        console.log(`🎯 Final extension approval decision: ${allApproved ? 'FULLY APPROVED' : 'PARTIALLY APPROVED'}`);

        if (allApproved) {
            // ✅ ALL APPROVERS APPROVED - EXTENSION IS GRANTED

            // 1. Update extension status to 'Extended'
            await connection.query(
                `UPDATE permit_extensions SET status = 'Extended' WHERE id = ?`,
                [extensionId]
            );

            // 2. Update permit end time and status to 'Extended'
            await connection.query(
                `UPDATE permits 
                 SET end_time = ?, 
                     status = 'Extended', 
                     updated_at = NOW() 
                 WHERE id = ?`,
                [ue.new_end_time, ue.permit_id]
            );

            console.log(`✅✅ Extension ${extensionId} FULLY APPROVED`);
            console.log(`📅 Permit ${ue.permit_id} end time extended to: ${ue.new_end_time}`);
            console.log(`📊 Permit status changed to: Extended`);

            // 3. Notify supervisor - EXTENSION APPROVED
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
                message: `Extension FULLY APPROVED by all approvers. Permit extended successfully.`,
                fully_approved: true,
                data: {
                    extension_id: extensionId,
                    permit_id: ext.permit_id,
                    original_end_time: ue.original_end_time,
                    new_end_time: ue.new_end_time,
                    extension_status: 'Extended',
                    permit_status: 'Extended'
                }
            });

        } else {
            // ⏳ PARTIAL APPROVAL - Waiting for other approvers

            // Update extension status to 'Extension_Requested' (still pending)
            await connection.query(
                `UPDATE permit_extensions SET status = 'Extension_Requested' WHERE id = ?`,
                [extensionId]
            );

            console.log(`⏳ Extension ${extensionId} partially approved, waiting for other approvers`);

            // Notify supervisor - PARTIAL APPROVAL
            await connection.query(`
                INSERT INTO notifications (user_id, permit_id, notification_type, message, created_at)
                VALUES (?, ?, 'EXTENSION_PARTIAL', ?, NOW())
            `, [
                ext.created_by_user_id,
                ext.permit_id,
                `Extension request for PTW ${ext.permit_serial} has been approved by ${fields.roleName}. Waiting for other approvers.`
            ]);

            await connection.commit();

            res.json({
                success: true,
                message: `Extension approved by ${fields.roleName}. Waiting for other approvers.`,
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

        console.log(`📥 POST /api/extension-approvals/${extensionId}/reject - User: ${userId}, Role: ${userRole}`);

        if (!remarks || remarks.trim() === '') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const fields = getExtensionApprovalFields(userRole);
        if (!fields) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'User is not authorized to reject extensions'
            });
        }

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

        // Verify user is assigned approver
        if (ext[fields.idField] !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'You are not assigned as the approver for this extension request'
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

        // Update permit status back to Active (rejection means work continues with original time)
        await connection.query(
            `UPDATE permits SET status = 'Active', updated_at = NOW() WHERE id = ?`,
            [ext.permit_id]
        );

        console.log(`❌ Extension ${extensionId} REJECTED by ${fields.roleName}`);

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
            message: `Extension request rejected by ${fields.roleName}`,
            data: {
                extension_id: extensionId,
                permit_id: ext.permit_id,
                rejected_by: fields.roleName,
                rejection_reason: remarks,
                extension_status: 'Extension_Rejected',
                permit_status: 'Active'
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error rejecting extension:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting extension',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// ============================================================================
// GET EXTENSION DETAILS BY ID
// ============================================================================
router.get('/:extensionId', async (req, res) => {
    try {
        const { extensionId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📥 GET /api/extension-approvals/${extensionId} - User: ${userId}`);

        const [extensions] = await pool.query(`
            SELECT 
                pe.*,
                p.permit_serial,
                p.permit_type,
                p.work_location,
                p.work_description,
                p.status as permit_status,
                s.name as site_name,
                s.site_code,
                supervisor.full_name as requested_by_name,
                supervisor.email as requested_by_email,
                sl.full_name as site_leader_name,
                sl.email as site_leader_email,
                so.full_name as safety_officer_name,
                so.email as safety_officer_email
            FROM permit_extensions pe
            JOIN permits p ON pe.permit_id = p.id
            JOIN sites s ON p.site_id = s.id
            JOIN users supervisor ON pe.requested_by_user_id = supervisor.id
            LEFT JOIN users sl ON pe.site_leader_id = sl.id
            LEFT JOIN users so ON pe.safety_officer_id = so.id
            WHERE pe.id = ?
        `, [extensionId]);

        if (extensions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Extension request not found'
            });
        }

        const extension = extensions[0];

        // Check if user has permission to view this extension
        const isApprover = extension.site_leader_id === userId || extension.safety_officer_id === userId;
        const isCreator = extension.requested_by_user_id === userId;
        const isAdmin = userRole === 'Admin';

        if (!isApprover && !isCreator && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this extension request'
            });
        }

        console.log(`✅ Extension details retrieved`);

        res.json({
            success: true,
            data: extension
        });

    } catch (error) {
        console.error('❌ Error fetching extension details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching extension details',
            error: error.message
        });
    }
});

module.exports = router;