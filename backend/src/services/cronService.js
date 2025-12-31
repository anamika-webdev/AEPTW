// backend/src/services/cronService.js
// Updated to ensure 30-minute notifications for start and end times

const cron = require('node-cron');
const db = require('../config/database');
const { createNotification } = require('../utils/notificationUtils');
const emailService = require('./emailService');

const initScheduler = () => {
    console.log('⏰ Initializing Cron Scheduler for PTW Notifications...');
    console.log('📅 Checking for notifications every minute');

    // Run every minute to check for upcoming and expiring permits
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            console.log(`🔍 [${now.toISOString()}] Checking for notifications...`);

            // --- 1. UPCOMING PERMITS (30 mins before start) ---
            // Find permits starting in 29-31 minutes
            const upcomingQuery = `
                SELECT 
                    p.id, 
                    p.permit_serial, 
                    p.start_time, 
                    p.created_by_user_id,
                    p.work_location,
                    u.full_name as user_name,
                    u.email as user_email,
                    TIMESTAMPDIFF(MINUTE, NOW(), p.start_time) as minutes_until_start
                FROM permits p
                JOIN users u ON p.created_by_user_id = u.id
                WHERE p.status IN ('Approved', 'Active')
                AND p.start_time BETWEEN DATE_ADD(NOW(), INTERVAL 29 MINUTE) 
                                     AND DATE_ADD(NOW(), INTERVAL 31 MINUTE)
            `;

            const [upcomingPermits] = await db.query(upcomingQuery);

            if (upcomingPermits.length > 0) {
                console.log(`📢 Found ${upcomingPermits.length} permit(s) starting soon`);
            }

            for (const permit of upcomingPermits) {
                // Check if we already sent this notification
                const [existing] = await db.query(
                    `SELECT id FROM notifications 
                     WHERE permit_id = ? 
                     AND notification_type = 'APPROVAL_REQUEST'
                     AND message LIKE '%starting in 30 minutes%'`,
                    [permit.id]
                );

                if (existing.length === 0) {
                    const message = `⏰ Permit ${permit.permit_serial} is starting in 30 minutes at ${permit.work_location}. Please ensure all preparations are complete.`;

                    await createNotification(
                        permit.created_by_user_id,
                        'APPROVAL_REQUEST',
                        message,
                        permit.id
                    );

                    // Send Email Reminder
                    if (permit.user_email) {
                        await emailService.sendPTWStartReminder({
                            recipientEmail: permit.user_email,
                            recipientName: permit.user_name || 'Supervisor',
                            permitSerial: permit.permit_serial,
                            startTime: permit.start_time,
                            location: permit.work_location
                        });
                    }

                    console.log(`✅ Sent START reminder and EMAIL for ${permit.permit_serial} (${permit.minutes_until_start} mins away)`);
                }
            }

            // --- 2. EXPIRING PERMITS (30 mins before end) ---
            // Find permits ending in 29-31 minutes
            const expiringQuery = `
                SELECT 
                    p.id, 
                    p.permit_serial, 
                    p.end_time, 
                    p.created_by_user_id,
                    p.work_location,
                    u.full_name as user_name,
                    u.email as user_email,
                    TIMESTAMPDIFF(MINUTE, NOW(), p.end_time) as minutes_until_end
                FROM permits p
                JOIN users u ON p.created_by_user_id = u.id
                WHERE p.status = 'Active' 
                AND p.end_time BETWEEN DATE_ADD(NOW(), INTERVAL 29 MINUTE) 
                                   AND DATE_ADD(NOW(), INTERVAL 31 MINUTE)
            `;

            const [expiringPermits] = await db.query(expiringQuery);

            if (expiringPermits.length > 0) {
                console.log(`⚠️  Found ${expiringPermits.length} permit(s) expiring soon`);
            }

            for (const permit of expiringPermits) {
                // Check if we already sent this notification
                const [existing] = await db.query(
                    `SELECT id FROM notifications 
                     WHERE permit_id = ? 
                     AND notification_type = 'EXTENSION_REQUEST'
                     AND message LIKE '%expiring in 30 minutes%'`,
                    [permit.id]
                );

                if (existing.length === 0) {
                    const message = `⏰ URGENT: Permit ${permit.permit_serial} is expiring in 30 minutes! Please extend or close the permit immediately.`;

                    await createNotification(
                        permit.created_by_user_id,
                        'EXTENSION_REQUEST',
                        message,
                        permit.id
                    );

                    // Send Email Reminder
                    if (permit.user_email) {
                        await emailService.sendPTWExpiryReminder({
                            recipientEmail: permit.user_email,
                            recipientName: permit.user_name || 'Supervisor',
                            permitSerial: permit.permit_serial,
                            endTime: permit.end_time,
                            isCritical: false
                        });
                    }

                    console.log(`⚠️  Sent EXPIRY reminder and EMAIL for ${permit.permit_serial} (${permit.minutes_until_end} mins remaining)`);
                }
            }

            // --- 3. CRITICAL EXPIRING PERMITS (10 mins before end) ---
            // Find permits ending in 9-11 minutes (final warning)
            const criticalQuery = `
                SELECT 
                    p.id, 
                    p.permit_serial, 
                    p.end_time, 
                    p.created_by_user_id,
                    p.work_location,
                    u.full_name as user_name,
                    u.email as user_email,
                    TIMESTAMPDIFF(MINUTE, NOW(), p.end_time) as minutes_until_end
                FROM permits p
                JOIN users u ON p.created_by_user_id = u.id
                WHERE p.status = 'Active' 
                AND p.end_time BETWEEN DATE_ADD(NOW(), INTERVAL 9 MINUTE) 
                                   AND DATE_ADD(NOW(), INTERVAL 11 MINUTE)
            `;

            const [criticalPermits] = await db.query(criticalQuery);

            if (criticalPermits.length > 0) {
                console.log(`🚨 Found ${criticalPermits.length} permit(s) expiring VERY SOON`);
            }

            for (const permit of criticalPermits) {
                // Check if we already sent this notification
                const [existing] = await db.query(
                    `SELECT id FROM notifications 
                     WHERE permit_id = ? 
                     AND notification_type = 'EXTENSION_REQUEST'
                     AND message LIKE '%expiring in 10 minutes%'`,
                    [permit.id]
                );

                if (existing.length === 0) {
                    const message = `🚨 CRITICAL: Permit ${permit.permit_serial} is expiring in 10 minutes! Take immediate action to extend or close.`;

                    await createNotification(
                        permit.created_by_user_id,
                        'EXTENSION_REQUEST',
                        message,
                        permit.id
                    );

                    // Send Email Reminder
                    if (permit.user_email) {
                        await emailService.sendPTWExpiryReminder({
                            recipientEmail: permit.user_email,
                            recipientName: permit.user_name || 'Supervisor',
                            permitSerial: permit.permit_serial,
                            endTime: permit.end_time,
                            isCritical: true
                        });
                    }

                    console.log(`🚨 Sent CRITICAL EXPIRY reminder and EMAIL for ${permit.permit_serial} (${permit.minutes_until_end} mins remaining)`);
                }
            }

            // --- 4. AUTO-CLOSE EXPIRED PERMITS ---
            // Find permits that have expired (past end_time)
            const expiredQuery = `
                SELECT 
                    p.id, 
                    p.permit_serial, 
                    p.end_time, 
                    p.created_by_user_id,
                    u.full_name as user_name,
                    u.email as user_email,
                    TIMESTAMPDIFF(MINUTE, p.end_time, NOW()) as minutes_expired
                FROM permits p
                JOIN users u ON p.created_by_user_id = u.id
                WHERE p.status = 'Active' 
                AND p.end_time < NOW()
            `;

            const [expiredPermits] = await db.query(expiredQuery);

            if (expiredPermits.length > 0) {
                console.log(`🔴 Found ${expiredPermits.length} expired permit(s) - auto - closing`);
            }

            for (const permit of expiredPermits) {
                // Update permit status to Closed
                await db.query(
                    'UPDATE permits SET status = ?, closed_at = NOW() WHERE id = ?',
                    ['Closed', permit.id]
                );

                // Notify user
                const message = `⛔ Permit ${permit.permit_serial} has been automatically closed as it expired ${permit.minutes_expired} minute(s) ago.`;

                await createNotification(
                    permit.created_by_user_id,
                    'PTW_CLOSED',
                    message,
                    permit.id
                );

                // Send Email Notification
                if (permit.user_email) {
                    await emailService.sendPTWClosed({
                        recipientEmail: permit.user_email,
                        recipientName: permit.user_name || 'Supervisor',
                        permitSerial: permit.permit_serial,
                        closedBy: 'System (Auto-close)',
                        permitDetails: {
                            workType: 'Expired',
                            site: 'Check dashboard'
                        }
                    });
                }

                console.log(`⛔ Auto - closed expired permit ${permit.permit_serial} and sent EMAIL`);
            }

            // Log summary if no notifications sent
            if (upcomingPermits.length === 0 && expiringPermits.length === 0 &&
                criticalPermits.length === 0 && expiredPermits.length === 0) {
                console.log('✅ No notifications needed at this time');
            }

        } catch (error) {
            console.error('❌ Cron Job Error:', error);
            console.error('Stack:', error.stack);
        }
    });

    console.log('✅ Cron Scheduler initialized successfully');
    console.log('📋 Monitoring for:');
    console.log('   - Permits starting in 30 minutes');
    console.log('   - Permits expiring in 30 minutes');
    console.log('   - Permits expiring in 10 minutes (critical)');
    console.log('   - Expired permits (auto-close)');
};

module.exports = { initScheduler };