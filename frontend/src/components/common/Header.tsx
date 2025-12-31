import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User as UserIcon, Mail, Briefcase, X } from 'lucide-react';
import UserProfile from './UserProfile';
import { User } from '../../types';
import { formatRolesForDisplay } from '../../utils/roleMapper';
import NotificationsPanel from '../supervisor/NotificationsPanel';

interface HeaderProps {
  currentUser: User;
  onMenuToggle: () => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onMenuToggle, onLogout }: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initials for avatar
  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/safetogologo.png"
              alt="Safe to Go"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                console.error('Failed to load Safe to Go logo');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={onMenuToggle}
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
              className="w-64 py-2 pl-4 pr-4 text-sm border border-gray-300 rounded-lg lg:w-96 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationsPanel />

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg hover:bg-gray-100"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">{currentUser.full_name || currentUser.email}</p>
                <p className="text-xs text-gray-500">{formatRolesForDisplay(currentUser.role)}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-gradient-to-br from-orange-600 to-amber-600">
                <span className="text-sm font-bold">{getInitials(currentUser.full_name || currentUser.email)}</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                {/* User Info */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-amber-600">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-16 text-white rounded-full bg-white/20">
                      <span className="text-xl font-bold">{getInitials(currentUser.full_name || currentUser.email)}</span>
                    </div>
                    <div className="flex-1 text-white">
                      <h3 className="font-semibold">{currentUser.full_name || currentUser.email}</h3>
                      <p className="text-sm opacity-90">{formatRolesForDisplay(currentUser.role)}</p>
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
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowProfileModal(true);
                    }}
                    className="flex items-center w-full gap-2 px-4 py-2 text-sm font-medium text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                  >
                    <UserIcon className="w-4 h-4" />
                    View Full Profile
                  </button>
                </div>

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

      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <UserProfile
              user={{
                ...currentUser,
                department: currentUser.department || undefined,
                department_name: currentUser.department_name,
                site_name: currentUser.site_name,
                job_role: currentUser.job_role,
                phone: currentUser.phone,
                full_name: currentUser.full_name || 'User',
                email: currentUser.email || '',
                frontendRole: (currentUser.role.includes('Admin') ? 'Admin' : 'Supervisor') as any
              }}
            />
          </div>
        </div>
      )}
    </header>
  );
}