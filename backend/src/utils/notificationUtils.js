const db = require('../config/database');

const createNotification = async (userId, title, message, type = 'info', relatedPermitId = null) => {
    try {
        console.log(`🔔 Creating notification for User ${userId}: ${title}`);
        const [result] = await db.execute(
            'INSERT INTO notifications (user_id, title, message, type, related_permit_id) VALUES (?, ?, ?, ?, ?)',
            [userId, title, message, type, relatedPermitId]
        );
        console.log(`✅ Notification created with ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = { createNotification };
