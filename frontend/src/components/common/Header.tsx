// frontend/src/components/common/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, LogOut, User as UserIcon, Mail, Briefcase } from 'lucide-react';
import { notificationsAPI } from '../../services/api';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
}

interface HeaderProps {
  currentUser: User;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onMenuClick, onLogout }: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; time: string; unread: boolean; type?: string; created_at?: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      console.log('🔔 Notifications API Response:', response);
      if (response.success) {
        const mapped = response.data.map((n: any) => ({
          id: n.id,
          message: n.message,
          time: new Date(n.created_at).toLocaleString(), // Simple formatting
          unread: n.is_read === 0 || n.is_read === false,
          type: n.notification_type,
          created_at: n.created_at
        }));
        setNotifications(mapped);
        setUnreadCount((response as any).unread_count || mapped.filter((n: any) => n.unread).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read', error);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search permits, sites, users..."
              className="w-64 py-2 pl-4 pr-4 text-sm border border-gray-300 rounded-lg lg:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-96">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => notif.unread && handleMarkAsRead(notif.id)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notif.unread ? 'bg-blue-50' : ''
                          }`}
                      >
                        <p className="text-sm text-gray-900">{notif.message}</p>
                        <p className="mt-1 text-xs text-gray-500">{notif.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-900">No notifications</p>
                      <p className="mt-1 text-xs text-gray-500">You're all caught up!</p>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-gray-200">
                  <button className="w-full py-2 text-sm font-medium text-center text-blue-600 rounded hover:bg-blue-50">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg hover:bg-gray-100"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-sm font-bold">{getInitials(currentUser.full_name)}</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                {/* User Info */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-16 text-white rounded-full bg-white/20">
                      <span className="text-xl font-bold">{getInitials(currentUser.full_name)}</span>
                    </div>
                    <div className="flex-1 text-white">
                      <h3 className="font-semibold">{currentUser.full_name}</h3>
                      <p className="text-sm opacity-90">{currentUser.role}</p>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium text-gray-900">{currentUser.login_id}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{currentUser.email}</span>
                  </div>

                  {currentUser.department && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{currentUser.department}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="flex items-center w-full gap-2 px-4 py-2 text-sm font-medium text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}