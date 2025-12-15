// backend/src/utils/emailNotifications.js
const emailService = require('../services/emailService');
const db = require('../config/database');

/**
 * Get user email by user ID
 */
async function getUserEmail(userId) {
    try {
        const [users] = await db.query(
            'SELECT email, full_name FROM users WHERE id = ?',
            [userId]
        );
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Error fetching user email:', error);
        return null;
    }
}

/**
 * Get permit details for email
 */
async function getPermitDetails(permitId) {
    try {
        const [permits] = await db.query(`
      SELECT 
        p.*,
        s.site_name,
        d.department_name,
        wt.work_type_name,
        req.full_name as requester_name,
        req.email as requester_email
      FROM permits p
      LEFT JOIN sites s ON p.site_id = s.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN work_types wt ON p.work_type_id = wt.id
      LEFT JOIN users req ON p.requester_id = req.id
      WHERE p.id = ?
    `, [permitId]);

        return permits.length > 0 ? permits[0] : null;
    } catch (error) {
        console.error('Error fetching permit details:', error);
        return null;
    }
}

/**
 * Send approval request email to approver
 */
async function sendApprovalRequestEmail(approverId, permitId, role) {
    try {
        // Get approver details
        const approver = await getUserEmail(approverId);
        if (!approver || !approver.email) {
            console.warn(`No email found for approver ${approverId}`);
            return { success: false, error: 'No email found' };
        }

        // Get permit details
        const permit = await getPermitDetails(permitId);
        if (!permit) {
            console.warn(`Permit ${permitId} not found`);
            return { success: false, error: 'Permit not found' };
        }

        // Send email
        return await emailService.sendPTWApprovalRequest({
            recipientEmail: approver.email,
            recipientName: approver.full_name,
            permitSerial: permit.permit_serial,
            requesterName: permit.requester_name,
            role: role,
            permitDetails: {
                workType: permit.work_type_name,
                site: permit.site_name,
                department: permit.department_name,
                requestedDate: new Date(permit.created_at).toLocaleDateString(),
            }
        });
    } catch (error) {
        console.error('Error sending approval request email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send approval notification email to requester
 */
async function sendApprovedEmail(requesterId, permitId, approverName, approverRole) {
    try {
        // Get requester details
        const requester = await getUserEmail(requesterId);
        if (!requester || !requester.email) {
            console.warn(`No email found for requester ${requesterId}`);
            return { success: false, error: 'No email found' };
        }

        // Get permit details
        const permit = await getPermitDetails(permitId);
        if (!permit) {
            console.warn(`Permit ${permitId} not found`);
            return { success: false, error: 'Permit not found' };
        }

        // Determine next steps based on status
        let nextSteps = 'You can now proceed with the permitted work.';
        if (permit.status === 'Pending_Area_Manager') {
            nextSteps = 'Waiting for Area Manager approval.';
        } else if (permit.status === 'Pending_Safety_Officer') {
            nextSteps = 'Waiting for Safety Officer approval.';
        } else if (permit.status === 'Pending_Site_Leader') {
            nextSteps = 'Waiting for Site Leader approval.';
        } else if (permit.status === 'Approved') {
            nextSteps = 'All approvals complete. You can now proceed with the work.';
        }

        // Send email
        return await emailService.sendPTWApproved({
            recipientEmail: requester.email,
            recipientName: requester.full_name,
            permitSerial: permit.permit_serial,
            approverName: approverName,
            role: approverRole,
            permitDetails: {
                workType: permit.work_type_name,
                site: permit.site_name,
                department: permit.department_name,
                nextSteps: nextSteps,
            }
        });
    } catch (error) {
        console.error('Error sending approved email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send rejection notification email to requester
 */
async function sendRejectedEmail(requesterId, permitId, rejectorName, rejectorRole, rejectionReason) {
    try {
        // Get requester details
        const requester = await getUserEmail(requesterId);
        if (!requester || !requester.email) {
            console.warn(`No email found for requester ${requesterId}`);
            return { success: false, error: 'No email found' };
        }

        // Get permit details
        const permit = await getPermitDetails(permitId);
        if (!permit) {
            console.warn(`Permit ${permitId} not found`);
            return { success: false, error: 'Permit not found' };
        }

        // Send email
        return await emailService.sendPTWRejected({
            recipientEmail: requester.email,
            recipientName: requester.full_name,
            permitSerial: permit.permit_serial,
            rejectorName: rejectorName,
            role: rejectorRole,
            rejectionReason: rejectionReason,
            permitDetails: {
                workType: permit.work_type_name,
                site: permit.site_name,
                department: permit.department_name,
            }
        });
    } catch (error) {
        console.error('Error sending rejected email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send extension request email to approvers
 */
async function sendExtensionRequestEmail(approverId, permitId, requesterName, extensionDetails) {
    try {
        // Get approver details
        const approver = await getUserEmail(approverId);
        if (!approver || !approver.email) {
            console.warn(`No email found for approver ${approverId}`);
            return { success: false, error: 'No email found' };
        }

        // Get permit details
        const permit = await getPermitDetails(permitId);
        if (!permit) {
            console.warn(`Permit ${permitId} not found`);
            return { success: false, error: 'Permit not found' };
        }

        // Send email
        return await emailService.sendExtensionRequest({
            recipientEmail: approver.email,
            recipientName: approver.full_name,
            permitSerial: permit.permit_serial,
            requesterName: requesterName,
            extensionDetails: extensionDetails
        });
    } catch (error) {
        console.error('Error sending extension request email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send PTW closure notification
 */
async function sendClosureEmail(userId, permitId, closedByName) {
    try {
        // Get user details
        const user = await getUserEmail(userId);
        if (!user || !user.email) {
            console.warn(`No email found for user ${userId}`);
            return { success: false, error: 'No email found' };
        }

        // Get permit details
        const permit = await getPermitDetails(permitId);
        if (!permit) {
            console.warn(`Permit ${permitId} not found`);
            return { success: false, error: 'Permit not found' };
        }

        // Send email
        return await emailService.sendPTWClosed({
            recipientEmail: user.email,
            recipientName: user.full_name,
            permitSerial: permit.permit_serial,
            closedBy: closedByName,
            permitDetails: {
                workType: permit.work_type_name,
                site: permit.site_name,
                department: permit.department_name,
            }
        });
    } catch (error) {
        console.error('Error sending closure email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send emails to all approvers for a new permit
 */
async function notifyApprovers(permitId) {
    try {
        const permit = await getPermitDetails(permitId);
        if (!permit) {
            console.warn(`Permit ${permitId} not found`);
            return [];
        }

        const emailResults = [];

        // Send to Area Manager
        if (permit.area_manager_id) {
            const result = await sendApprovalRequestEmail(
                permit.area_manager_id,
                permitId,
                'Area Manager'
            );
            emailResults.push({ role: 'Area Manager', ...result });
        }

        // Send to Safety Officer
        if (permit.safety_officer_id) {
            const result = await sendApprovalRequestEmail(
                permit.safety_officer_id,
                permitId,
                'Safety Officer'
            );
            emailResults.push({ role: 'Safety Officer', ...result });
        }

        // Send to Site Leader
        if (permit.site_leader_id) {
            const result = await sendApprovalRequestEmail(
                permit.site_leader_id,
                permitId,
                'Site Leader'
            );
            emailResults.push({ role: 'Site Leader', ...result });
        }

        return emailResults;
    } catch (error) {
        console.error('Error notifying approvers:', error);
        return [];
    }
}

module.exports = {
    sendApprovalRequestEmail,
    sendApprovedEmail,
    sendRejectedEmail,
    sendExtensionRequestEmail,
    sendClosureEmail,
    notifyApprovers,
    getUserEmail,
    getPermitDetails,
};