const db = require('../config/database');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notifications] = await db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        const [[{ count }]] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({ success: true, data: notifications, unreadCount: count });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        if (notificationId === 'all') {
            await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        } else {
            await db.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);
        }

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
};
