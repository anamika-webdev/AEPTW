// backend/src/routes/notifications.routes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications - Get all notifications for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [notifications] = await pool.query(
      `SELECT 
        n.*,
        p.permit_serial
      FROM notifications n
      LEFT JOIN permits p ON n.permit_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: {
        unread_count: result[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
});

// POST /api/notifications/:notificationId/read - Mark notification as read
router.post('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:notificationId - Delete a notification
router.delete('/:notificationId', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await pool.query(
      'DELETE FROM notifications WHERE id = ?',
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// DELETE /api/notifications/clear-all - Delete all notifications
router.delete('/clear-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications cleared'
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message
    });
  }
});

// POST /api/notifications/create - Create a notification (system use)
router.post('/create', authenticate, async (req, res) => {
  try {
    const { user_id, permit_id, type, message } = req.body;

    if (!user_id || !type || !message) {
      return res.status(400).json({
        success: false,
        message: 'user_id, type, and message are required'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, permit_id, type, message, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id, permit_id || null, type, message]
    );

    res.json({
      success: true,
      message: 'Notification created',
      data: {
        notification_id: result.insertId
      }
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
});

module.exports = router;