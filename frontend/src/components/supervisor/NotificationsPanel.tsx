import { useState, useEffect } from 'react';
import { Bell, Check, X, Eye, Clock, Trash2 } from 'lucide-react';
import AllNotificationsModal from './AllNotificationsModal';

interface Notification {
  id: number;
  permit_id: number | null;
  related_permit_id?: number | null;
  permit_serial?: string;
  notification_type: 'PTW_APPROVED' | 'PTW_REJECTED' | 'APPROVAL_REQUEST' | 'EXTENSION_REQUEST' | 'PTW_CLOSED';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  onViewPermit?: (permitId: number) => void;
}

export function NotificationsPanel({ onViewPermit }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch ONLY unread notifications for the dropdown (Inbox style)
      const response = await fetch('/api/notifications?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove notification from list (auto-disappear)
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleReadStatus = async (notificationId: number, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        // Mark as read and remove from list
        await markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Clear all notifications
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PTW_APPROVED':
      case 'APPROVAL_REQUEST':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'PTW_REJECTED':
        return <X className="w-5 h-5 text-red-600" />;
      case 'EXTENSION_REQUEST':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'PTW_CLOSED':
        return <Check className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PTW_APPROVED':
        return 'bg-green-50 border-green-200';
      case 'PTW_REJECTED':
        return 'bg-red-50 border-red-200';
      case 'APPROVAL_REQUEST':
        return 'bg-blue-50 border-blue-200';
      case 'EXTENSION_REQUEST':
        return 'bg-yellow-50 border-yellow-200';
      case 'PTW_CLOSED':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Notifications Dropdown */}
          <div className="absolute right-0 z-50 w-96 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-600">
                  {unreadCount} unread
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAllModal(true);
                    setShowDropdown(false);
                  }}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  History
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    title="Mark all as read"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No new notifications</p>
                  <p className="text-xs text-gray-500 mt-1">Check History for older items</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-all ${!notification.is_read ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex gap-3">
                        {/* Checkbox to mark as read */}
                        <div className="flex-shrink-0 pt-1">
                          <input
                            type="checkbox"
                            checked={notification.is_read}
                            onChange={() => toggleReadStatus(notification.id, notification.is_read)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all"
                            title={notification.is_read ? "Already read" : "Mark as read"}
                          />
                        </div>

                        {/* Icon */}
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.notification_type)} h-fit flex-shrink-0`}>
                          {getNotificationIcon(notification.notification_type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {notification.permit_serial && (
                            <div className="mb-1">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                {notification.permit_serial}
                              </span>
                            </div>
                          )}

                          <p className={`text-sm ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>

                          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notification.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            {(notification.permit_id || notification.related_permit_id) && onViewPermit && (
                              <button
                                onClick={() => {
                                  const permitId = notification.related_permit_id || notification.permit_id;
                                  if (permitId) {
                                    onViewPermit(permitId);
                                    markAsRead(notification.id);
                                    setShowDropdown(false);
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 transition-colors rounded hover:bg-blue-100"
                              >
                                <Eye className="w-3 h-3" />
                                View Permit
                              </button>
                            )}

                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="flex items-center gap-1 px-3 py-1.5 ml-auto text-xs font-medium text-red-600 bg-red-50 border border-red-200 transition-colors rounded hover:bg-red-100"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Check box to finish
              </p>
              <button
                onClick={() => {
                  setShowAllModal(true);
                  setShowDropdown(false);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}

      {/* Full Notifications Modal */}
      <AllNotificationsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        onViewPermit={onViewPermit}
      />
    </div>
  );
}

export default NotificationsPanel;