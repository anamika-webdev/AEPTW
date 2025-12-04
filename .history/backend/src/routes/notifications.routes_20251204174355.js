// backend/src/routes/notifications.routes.js - CREATE THIS NEW FILE

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET /api/notifications - Get notifications for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let query = `
      SELECT 
        n.id,
        n.permit_id,
        n.notification_type,
        n.message,
        n.is_read,
        n.created_at,
        p.permit_serial
      FROM notifications n
      LEFT JOIN permits p ON n.permit_id = p.id
      WHERE n.user_id = ?
    `;

    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT 50';

    const [notifications] = await pool.query(query, params);

    // Get unread count
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      count: notifications.length,
      unread_count: unreadCount[0].count,
      data: notifications
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// POST /api/notifications/:id/mark-read
router.post('/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [notifications] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

module.exports = router;