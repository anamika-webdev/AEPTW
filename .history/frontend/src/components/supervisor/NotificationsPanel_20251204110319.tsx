// frontend/src/components/supervisor/NotificationsPanel.tsx

import { useState, useEffect } from 'react';
import { Bell, Check, X, Eye, Clock } from 'lucide-react';

interface Notification {
  id: number;
  permit_id: number | null;
  permit_serial?: string;
  type: 'APPROVAL' | 'REJECTION' | 'APPROVAL_PROGRESS' | 'EXPIRY_WARNING' | 'EXTENSION_REQUEST' | 'GENERAL';
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

interface NotificationsPanelProps {
  onViewPermit?: (permitId: number) => void;
}

export function NotificationsPanel({ onViewPermit }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'REJECTION':
        return <X className="w-5 h-5 text-red-600" />;
      case 'APPROVAL_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'EXPIRY_WARNING':
        return <Bell className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'APPROVAL':
        return 'bg-green-50 border-green-200';
      case 'REJECTION':
        return 'bg-red-50 border-red-200';
      case 'APPROVAL_PROGRESS':
        return 'bg-blue-50 border-blue-200';
      case 'EXPIRY_WARNING':
        return 'bg-orange-50 border-orange-200';
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
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-600">
                  {unreadCount} unread
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
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
                  <p className="text-sm text-gray-600">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)} h-fit`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          {notification.permit_serial && (
                            <div className="mb-1">
                              <span className="text-xs font-medium text-gray-600">
                                {notification.permit_serial}
                              </span>
                            </div>
                          )}

                          <p className={`text-sm ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>

                          {/* Actions */}
                          <div className="flex gap-2 mt-2">
                            {notification.permit_id && (
                              <button
                                onClick={() => {
                                  onViewPermit?.(notification.permit_id!);
                                  markAsRead(notification.id);
                                  setShowDropdown(false);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 transition-colors rounded hover:bg-blue-100"
                              >
                                <Eye className="w-3 h-3" />
                                View Permit
                              </button>
                            )}

                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="px-2 py-1 text-xs text-gray-600 transition-colors rounded hover:bg-gray-100"
                              >
                                Mark read
                              </button>
                            )}

                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="px-2 py-1 ml-auto text-xs text-red-600 transition-colors rounded hover:bg-red-100"
                            >
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
            {notifications.length > 0 && (
              <div className="px-4 py-3 text-center border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to full notifications page
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}