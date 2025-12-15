// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

/**
 * Email Service for sending notifications
 * Supports both Gmail and custom SMTP configurations
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
        this.initializeTransporter();
    }

    /**
     * Initialize email transporter based on environment configuration
     */
    initializeTransporter() {
        try {
            // Check if email is enabled
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('📧 Email notifications are DISABLED in configuration');
                return;
            }

            const emailConfig = {
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT || '587'),
                secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            };

            // Add TLS configuration for better security
            if (!emailConfig.secure) {
                emailConfig.tls = {
                    rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false'
                };
            }

            this.transporter = nodemailer.createTransport(emailConfig);

            // Verify transporter configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Email transporter verification failed:', error.message);
                    this.initialized = false;
                } else {
                    console.log('✅ Email transporter is ready to send emails');
                    this.initialized = true;
                }
            });

        } catch (error) {
            console.error('❌ Failed to initialize email transporter:', error.message);
            this.initialized = false;
        }
    }

    /**
     * Check if email service is available
     */
    isAvailable() {
        return this.initialized && this.transporter !== null;
    }

    /**
     * Send a single email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email address
     * @param {string} options.subject - Email subject
     * @param {string} options.text - Plain text content
     * @param {string} options.html - HTML content
     * @returns {Promise<Object>} Email send result
     */
    async sendEmail({ to, subject, text, html }) {
        if (!this.isAvailable()) {
            console.warn('⚠️ Email service not available - email not sent');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Amazon EPTW System',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
                },
                to,
                subject,
                text,
                html: html || text,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send PTW approval request notification
     */
    async sendPTWApprovalRequest({ recipientEmail, recipientName, permitSerial, requesterName, role, permitDetails }) {
        const subject = `PTW Approval Required: ${permitSerial}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 PTW Approval Required</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            
            <p>A new Permit to Work requires your approval as <strong>${role}</strong>.</p>
            
            <div class="details">
              <p><span class="label">Permit Serial:</span> ${permitSerial}</p>
              <p><span class="label">Requested By:</span> ${requesterName}</p>
              <p><span class="label">Work Type:</span> ${permitDetails.workType || 'N/A'}</p>
              <p><span class="label">Site:</span> ${permitDetails.site || 'N/A'}</p>
              <p><span class="label">Department:</span> ${permitDetails.department || 'N/A'}</p>
              <p><span class="label">Requested Date:</span> ${permitDetails.requestedDate || new Date().toLocaleDateString()}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Review & Approve Permit</a>
            </p>
            
            <p><strong>Note:</strong> Please review and approve this permit at your earliest convenience.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Amazon EPTW System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      PTW Approval Required
      
      Dear ${recipientName},
      
      A new Permit to Work requires your approval as ${role}.
      
      Permit Details:
      - Permit Serial: ${permitSerial}
      - Requested By: ${requesterName}
      - Work Type: ${permitDetails.workType || 'N/A'}
      - Site: ${permitDetails.site || 'N/A'}
      - Department: ${permitDetails.department || 'N/A'}
      - Requested Date: ${permitDetails.requestedDate || new Date().toLocaleDateString()}
      
      Please log in to the system to review and approve this permit.
      
      Login URL: ${process.env.FRONTEND_URL}/login
      
      ---
      This is an automated notification from Amazon EPTW System
    `;

        return await this.sendEmail({ to: recipientEmail, subject, text, html });
    }

    /**
     * Send PTW approval notification
     */
    async sendPTWApproved({ recipientEmail, recipientName, permitSerial, approverName, role, permitDetails }) {
        const subject = `✅ PTW Approved: ${permitSerial}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ PTW Approved</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            
            <p>Your Permit to Work has been <strong style="color: #10b981;">APPROVED</strong> by ${approverName} (${role}).</p>
            
            <div class="details">
              <p><span class="label">Permit Serial:</span> ${permitSerial}</p>
              <p><span class="label">Approved By:</span> ${approverName} (${role})</p>
              <p><span class="label">Approval Date:</span> ${new Date().toLocaleString()}</p>
              <p><span class="label">Work Type:</span> ${permitDetails.workType || 'N/A'}</p>
              <p><span class="label">Site:</span> ${permitDetails.site || 'N/A'}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">View Permit Details</a>
            </p>
            
            <p><strong>Next Steps:</strong> ${permitDetails.nextSteps || 'You can now proceed with the permitted work.'}</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Amazon EPTW System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      PTW Approved
      
      Dear ${recipientName},
      
      Your Permit to Work has been APPROVED by ${approverName} (${role}).
      
      Permit Details:
      - Permit Serial: ${permitSerial}
      - Approved By: ${approverName} (${role})
      - Approval Date: ${new Date().toLocaleString()}
      - Work Type: ${permitDetails.workType || 'N/A'}
      - Site: ${permitDetails.site || 'N/A'}
      
      You can now proceed with the permitted work.
      
      Login URL: ${process.env.FRONTEND_URL}/login
      
      ---
      This is an automated notification from Amazon EPTW System
    `;

        return await this.sendEmail({ to: recipientEmail, subject, text, html });
    }

    /**
     * Send PTW rejection notification
     */
    async sendPTWRejected({ recipientEmail, recipientName, permitSerial, rejectorName, role, rejectionReason, permitDetails }) {
        const subject = `❌ PTW Rejected: ${permitSerial}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .reason-box { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ PTW Rejected</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            
            <p>Your Permit to Work has been <strong style="color: #ef4444;">REJECTED</strong> by ${rejectorName} (${role}).</p>
            
            <div class="details">
              <p><span class="label">Permit Serial:</span> ${permitSerial}</p>
              <p><span class="label">Rejected By:</span> ${rejectorName} (${role})</p>
              <p><span class="label">Rejection Date:</span> ${new Date().toLocaleString()}</p>
              <p><span class="label">Work Type:</span> ${permitDetails.workType || 'N/A'}</p>
              <p><span class="label">Site:</span> ${permitDetails.site || 'N/A'}</p>
            </div>
            
            <div class="reason-box">
              <p><span class="label">Rejection Reason:</span></p>
              <p>${rejectionReason || 'No reason provided'}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">View & Revise Permit</a>
            </p>
            
            <p><strong>Next Steps:</strong> Please review the rejection reason and submit a revised permit application.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Amazon EPTW System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      PTW Rejected
      
      Dear ${recipientName},
      
      Your Permit to Work has been REJECTED by ${rejectorName} (${role}).
      
      Permit Details:
      - Permit Serial: ${permitSerial}
      - Rejected By: ${rejectorName} (${role})
      - Rejection Date: ${new Date().toLocaleString()}
      - Work Type: ${permitDetails.workType || 'N/A'}
      - Site: ${permitDetails.site || 'N/A'}
      
      Rejection Reason:
      ${rejectionReason || 'No reason provided'}
      
      Please review the rejection reason and submit a revised permit application.
      
      Login URL: ${process.env.FRONTEND_URL}/login
      
      ---
      This is an automated notification from Amazon EPTW System
    `;

        return await this.sendEmail({ to: recipientEmail, subject, text, html });
    }

    /**
     * Send extension request notification
     */
    async sendExtensionRequest({ recipientEmail, recipientName, permitSerial, requesterName, extensionDetails }) {
        const subject = `Extension Request: ${permitSerial}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Extension Request</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            
            <p>A permit extension has been requested for PTW ${permitSerial}.</p>
            
            <div class="details">
              <p><span class="label">Permit Serial:</span> ${permitSerial}</p>
              <p><span class="label">Requested By:</span> ${requesterName}</p>
              <p><span class="label">Current Expiry:</span> ${extensionDetails.currentExpiry || 'N/A'}</p>
              <p><span class="label">New Expiry Requested:</span> ${extensionDetails.newExpiry || 'N/A'}</p>
              <p><span class="label">Reason:</span> ${extensionDetails.reason || 'N/A'}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Review Extension Request</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Amazon EPTW System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      Extension Request
      
      Dear ${recipientName},
      
      A permit extension has been requested for PTW ${permitSerial}.
      
      Details:
      - Permit Serial: ${permitSerial}
      - Requested By: ${requesterName}
      - Current Expiry: ${extensionDetails.currentExpiry || 'N/A'}
      - New Expiry Requested: ${extensionDetails.newExpiry || 'N/A'}
      - Reason: ${extensionDetails.reason || 'N/A'}
      
      Please log in to review this extension request.
      
      Login URL: ${process.env.FRONTEND_URL}/login
      
      ---
      This is an automated notification from Amazon EPTW System
    `;

        return await this.sendEmail({ to: recipientEmail, subject, text, html });
    }

    /**
     * Send PTW closure notification
     */
    async sendPTWClosed({ recipientEmail, recipientName, permitSerial, closedBy, permitDetails }) {
        const subject = `PTW Closed: ${permitSerial}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ PTW Closed</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            
            <p>The Permit to Work ${permitSerial} has been closed.</p>
            
            <div class="details">
              <p><span class="label">Permit Serial:</span> ${permitSerial}</p>
              <p><span class="label">Closed By:</span> ${closedBy}</p>
              <p><span class="label">Closure Date:</span> ${new Date().toLocaleString()}</p>
              <p><span class="label">Work Type:</span> ${permitDetails.workType || 'N/A'}</p>
              <p><span class="label">Site:</span> ${permitDetails.site || 'N/A'}</p>
            </div>
            
            <p>The work associated with this permit has been completed and the permit is now closed.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Amazon EPTW System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      PTW Closed
      
      Dear ${recipientName},
      
      The Permit to Work ${permitSerial} has been closed.
      
      Details:
      - Permit Serial: ${permitSerial}
      - Closed By: ${closedBy}
      - Closure Date: ${new Date().toLocaleString()}
      - Work Type: ${permitDetails.workType || 'N/A'}
      - Site: ${permitDetails.site || 'N/A'}
      
      The work associated with this permit has been completed and the permit is now closed.
      
      ---
      This is an automated notification from Amazon EPTW System
    `;

        return await this.sendEmail({ to: recipientEmail, subject, text, html });
    }

    /**
     * Send bulk emails
     * @param {Array} emails - Array of email configurations
     */
    async sendBulkEmails(emails) {
        const results = [];

        for (const emailConfig of emails) {
            const result = await this.sendEmail(emailConfig);
            results.push({ ...result, to: emailConfig.to });
        }

        return results;
    }
}

// Export singleton instance
module.exports = new EmailService();