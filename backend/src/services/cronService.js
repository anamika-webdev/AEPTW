const cron = require('node-cron');
const db = require('../config/database');
const { createNotification } = require('../utils/notificationUtils');

const initScheduler = () => {
    console.log('⏰ Initializing Cron Scheduler...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // --- 1. Upcoming Permits (30 mins before start) ---
            // Look for ACTIVE permits starting in ~30 mins
            const upcomingQuery = `
        SELECT p.id, p.permit_serial, p.start_time, p.created_by_user_id
        FROM permits p
        WHERE (p.status = 'Approved' OR p.status = 'Active')
        AND p.start_time BETWEEN DATE_ADD(NOW(), INTERVAL 29 MINUTE) AND DATE_ADD(NOW(), INTERVAL 31 MINUTE)
      `;

            const [upcomingPermits] = await db.query(upcomingQuery);

            for (const permit of upcomingPermits) {
                const [existing] = await db.query(
                    'SELECT id FROM notifications WHERE related_permit_id = ? AND type = "REMINDER_START"',
                    [permit.id]
                );

                if (existing.length === 0) {
                    await createNotification(
                        permit.created_by_user_id,
                        'Permit Starting Soon',
                        `Your permit ${permit.permit_serial} is scheduled to start in 30 minutes.`,
                        'REMINDER_START',
                        permit.id
                    );
                    console.log(`🔔 Sent START reminder for ${permit.permit_serial}`);
                }
            }

            // --- 2. Expiring Permits (30 mins before end) ---
            const expiringQuery = `
        SELECT p.id, p.permit_serial, p.end_time, p.created_by_user_id
        FROM permits p
        WHERE p.status = 'Active' 
        AND p.end_time BETWEEN DATE_ADD(NOW(), INTERVAL 29 MINUTE) AND DATE_ADD(NOW(), INTERVAL 31 MINUTE)
      `;

            const [expiringPermits] = await db.query(expiringQuery);

            for (const permit of expiringPermits) {
                const [existing] = await db.query(
                    'SELECT id FROM notifications WHERE related_permit_id = ? AND type = "REMINDER_END"',
                    [permit.id]
                );

                if (existing.length === 0) {
                    await createNotification(
                        permit.created_by_user_id,
                        'Permit Expiring Soon',
                        `Your permit ${permit.permit_serial} will expire in 30 minutes. Please extend or close it.`,
                        'REMINDER_END',
                        permit.id
                    );
                    console.log(`🔔 Sent END reminder for ${permit.permit_serial}`);
                }
            }

        } catch (error) {
            console.error('❌ Cron Job Error:', error);
        }
    });
};

module.exports = { initScheduler };
