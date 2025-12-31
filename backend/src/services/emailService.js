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
    this.isTestAccount = false;
    this.initializationPromise = this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  async initializeTransporter() {
    try {
      // 1. Try to use real credentials from .env
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        const emailConfig = {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        };

        if (!emailConfig.secure) {
          emailConfig.tls = {
            rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false'
          };
        }

        this.transporter = nodemailer.createTransport(emailConfig);
        this.initialized = true;
        console.log('✅ Email service initialized with real credentials');
        return;
      }

      // 2. Fallback: Create dynamic test account (Zero Config Mode)
      console.log('ℹ️ No email config found in .env. Setting up Auto-Test account (Ethereal)...');

      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      this.initialized = true;
      this.isTestAccount = true;
      console.log('🚀 Zero-Config Email Enabled (TEST MODE)');
      console.log('📅 Use credentials:', { user: testAccount.user, pass: testAccount.pass });
      console.log('🔗 You can view sent emails at: https://ethereal.email');

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
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
    // Wait for initialization to complete
    await this.initializationPromise;

    if (!this.isAvailable()) {
      console.warn('⚠️ Email service not available - email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Amazon EPTW System',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || (this.isTestAccount ? this.transporter.options.auth.user : 'system@eptw.local')
        },
        to,
        subject,
        text,
        html: html || text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);

      // If using test account, log the preview URL
      if (this.isTestAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`📧 [TEST MODE] View this email at: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        previewUrl: this.isTestAccount ? nodemailer.getTestMessageUrl(info) : null
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
   * Send PTW Start Reminder (30 mins before)
   */
  async sendPTWStartReminder({ recipientEmail, recipientName, permitSerial, startTime, location }) {
    const subject = `⏰ Reminder: PTW ${permitSerial} starts in 30 minutes`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #eff6ff; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ Work Starting Soon</h2>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <p>This is a reminder that your Permit to Work <strong>${permitSerial}</strong> is scheduled to start in 30 minutes.</p>
            
            <div class="details">
              <p><strong>Permit:</strong> ${permitSerial}</p>
              <p><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
              <p><strong>Location:</strong> ${location}</p>
            </div>
            
            <p>Please ensure all safety preparations are complete before commencing work.</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from Amazon EPTW System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Reminder: PTW ${permitSerial} starts in 30 minutes at ${location}. Start Time: ${new Date(startTime).toLocaleString()}`;

    return await this.sendEmail({ to: recipientEmail, subject, text, html });
  }

  /**
   * Send PTW Expiry Reminder (30 mins before end)
   */
  async sendPTWExpiryReminder({ recipientEmail, recipientName, permitSerial, endTime, isCritical = false }) {
    const timeRemaining = isCritical ? '10 minutes' : '30 minutes';
    const color = isCritical ? '#ef4444' : '#f59e0b';
    const subject = `${isCritical ? '🚨 CRITICAL' : '⚠️ Warning'}: PTW ${permitSerial} expires in ${timeRemaining}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color}; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${isCritical ? '🚨 CRITICAL EXPIRY' : '⚠️ EXPIRY WARNING'}</h2>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <p>Your Permit to Work <strong>${permitSerial}</strong> is set to expire in <strong style="color: ${color};">${timeRemaining}</strong>.</p>
            
            <div class="details">
              <p><strong>Permit:</strong> ${permitSerial}</p>
              <p><strong>End Time:</strong> ${new Date(endTime).toLocaleString()}</p>
            </div>
            
            <p><strong>Action Required:</strong> Please take immediate action to either <strong>EXTEND</strong> or <strong>CLOSE</strong> the permit before it expires.</p>
            <p>Expired permits will be automatically closed by the system.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Amazon EPTW System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `URGENT: PTW ${permitSerial} expires in ${timeRemaining} at ${new Date(endTime).toLocaleString()}. Please extend or close it immediately.`;

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