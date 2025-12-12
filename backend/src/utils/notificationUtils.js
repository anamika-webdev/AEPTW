// backend/src/utils/notificationUtils.js - FIXED FOR YOUR SCHEMA

const db = require('../config/database');

/**
 * Create a notification for a user
 * @param {number} userId - The ID of the user to notify
 * @param {string} notificationType - Type of notification (ENUM: APPROVAL_REQUEST, PTW_APPROVED, PTW_REJECTED, EXTENSION_REQUEST, PTW_CLOSED)
 * @param {string} message - The notification message
 * @param {number} permitId - The permit ID related to this notification
 * @returns {Promise<number|null>} The notification ID or null if failed
 */
const createNotification = async (userId, notificationType, message, permitId = null) => {
    try {
        console.log(`🔔 Creating notification for User ${userId}: ${notificationType}`);

        // Validate notification type
        const validTypes = [
            'APPROVAL_REQUEST', 'PTW_APPROVED', 'PTW_REJECTED', 'EXTENSION_REQUEST', 'PTW_CLOSED',
            'extension_approved', 'extension_partial', 'extension_rejected'
        ];
        if (!validTypes.includes(notificationType)) {
            console.error(`❌ Invalid notification type: ${notificationType}`);
            return null;
        }

        const [result] = await db.execute(
            'INSERT INTO notifications (user_id, permit_id, notification_type, message) VALUES (?, ?, ?, ?)',
            [userId, permitId, notificationType, message]
        );

        console.log(`✅ Notification created with ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return null;
    }
};

/**
 * Create notifications for multiple users
 * @param {Array<number>} userIds - Array of user IDs to notify
 * @param {string} notificationType - Type of notification
 * @param {string} message - The notification message
 * @param {number} permitId - The permit ID related to this notification
 * @returns {Promise<Array<number>>} Array of created notification IDs
 */
const createBulkNotifications = async (userIds, notificationType, message, permitId = null) => {
    const notificationIds = [];

    for (const userId of userIds) {
        const notificationId = await createNotification(userId, notificationType, message, permitId);
        if (notificationId) {
            notificationIds.push(notificationId);
        }
    }

    console.log(`✅ Created ${notificationIds.length} notifications`);
    return notificationIds;
};

/**
 * Mark a notification as read
 * @param {number} notificationId - The notification ID
 * @param {number} userId - The user ID (for security check)
 * @returns {Promise<boolean>} True if successful
 */
const markAsRead = async (notificationId, userId) => {
    try {
        const [result] = await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        return false;
    }
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - The user ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
const markAllAsRead = async (userId) => {
    try {
        const [result] = await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        console.log(`✅ Marked ${result.affectedRows} notifications as read for user ${userId}`);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return 0;
    }
};

/**
 * Get unread count for a user
 * @param {number} userId - The user ID
 * @returns {Promise<number>} Number of unread notifications
 */
const getUnreadCount = async (userId) => {
    try {
        const [[{ count }]] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        return count;
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        return 0;
    }
};

/**
 * Delete old read notifications (cleanup utility)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>} Number of deleted notifications
 */
const deleteOldNotifications = async (daysOld = 30) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM notifications WHERE is_read = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [daysOld]
        );

        console.log(`🗑️ Deleted ${result.affectedRows} old notifications`);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Error deleting old notifications:', error);
        return 0;
    }
};

module.exports = {
    createNotification,
    createBulkNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteOldNotifications
};