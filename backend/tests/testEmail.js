// backend/tests/testEmail.js
// Run this file to test your email configuration
// Usage: node tests/testEmail.js

require('dotenv').config();
const emailService = require('../src/services/emailService');

async function testEmailConfiguration() {
    console.log('\n============================================');
    console.log('📧 Email Configuration Test');
    console.log('============================================\n');

    // Check configuration
    console.log('Configuration:');
    console.log('- EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
    console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('- EMAIL_USER:', process.env.EMAIL_USER);
    console.log('- EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
    console.log('\n');

    // Check if service is available
    if (!emailService.isAvailable()) {
        console.error('❌ Email service is NOT available!');
        console.log('\nPossible reasons:');
        console.log('1. EMAIL_ENABLED is not set to "true"');
        console.log('2. Missing email configuration in .env file');
        console.log('3. Invalid SMTP credentials');
        console.log('4. Network connectivity issues');
        return;
    }

    console.log('✅ Email service is available!\n');

    // Test 1: Simple test email
    console.log('Test 1: Sending simple test email...');
    const testResult = await emailService.sendEmail({
        to: process.env.EMAIL_USER, // Send to yourself
        subject: 'Amazon EPTW - Email Test',
        text: 'This is a test email from Amazon EPTW system. If you receive this, email configuration is working correctly!',
        html: `
      <h2>Amazon EPTW Email Test</h2>
      <p>This is a test email from Amazon EPTW system.</p>
      <p>✅ If you receive this, your email configuration is working correctly!</p>
      <hr>
      <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
    `
    });

    if (testResult.success) {
        console.log('✅ Test email sent successfully!');
        console.log('   Message ID:', testResult.messageId);
    } else {
        console.error('❌ Failed to send test email');
        console.error('   Error:', testResult.error);
        return;
    }

    console.log('\n');

    // Test 2: PTW Approval Request Email
    console.log('Test 2: Sending PTW Approval Request sample...');
    const approvalRequestResult = await emailService.sendPTWApprovalRequest({
        recipientEmail: process.env.EMAIL_USER,
        recipientName: 'Test User',
        permitSerial: 'PTW-2024-001',
        requesterName: 'John Doe',
        role: 'Area Manager',
        permitDetails: {
            workType: 'Electrical Work',
            site: 'Site A - Building 1',
            department: 'Maintenance',
            requestedDate: new Date().toLocaleDateString(),
        }
    });

    if (approvalRequestResult.success) {
        console.log('✅ Approval request email sent!');
    } else {
        console.error('❌ Failed to send approval request email');
        console.error('   Error:', approvalRequestResult.error);
    }

    console.log('\n');

    // Test 3: PTW Approved Email
    console.log('Test 3: Sending PTW Approved sample...');
    const approvedResult = await emailService.sendPTWApproved({
        recipientEmail: process.env.EMAIL_USER,
        recipientName: 'Test User',
        permitSerial: 'PTW-2024-001',
        approverName: 'Manager Smith',
        role: 'Area Manager',
        permitDetails: {
            workType: 'Electrical Work',
            site: 'Site A - Building 1',
            nextSteps: 'You can now proceed with the work.',
        }
    });

    if (approvedResult.success) {
        console.log('✅ Approval email sent!');
    } else {
        console.error('❌ Failed to send approval email');
        console.error('   Error:', approvedResult.error);
    }

    console.log('\n');

    // Test 4: PTW Rejected Email
    console.log('Test 4: Sending PTW Rejected sample...');
    const rejectedResult = await emailService.sendPTWRejected({
        recipientEmail: process.env.EMAIL_USER,
        recipientName: 'Test User',
        permitSerial: 'PTW-2024-001',
        rejectorName: 'Safety Officer Johnson',
        role: 'Safety Officer',
        rejectionReason: 'Incomplete safety documentation. Please provide updated risk assessment.',
        permitDetails: {
            workType: 'Electrical Work',
            site: 'Site A - Building 1',
        }
    });

    if (rejectedResult.success) {
        console.log('✅ Rejection email sent!');
    } else {
        console.error('❌ Failed to send rejection email');
        console.error('   Error:', rejectedResult.error);
    }

    console.log('\n============================================');
    console.log('📧 Email Test Complete!');
    console.log('============================================\n');
    console.log('Check your inbox at:', process.env.EMAIL_USER);
    console.log('You should receive 4 test emails if all tests passed.\n');
}

// Run the test
testEmailConfiguration()
    .then(() => {
        console.log('✅ Test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });