// frontend/src/components/common/Sidebar.tsx
import { X, LayoutDashboard, FileText, Users, Building2, Plus } from 'lucide-react';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker';
  department?: string;
}

interface SidebarProps {
  currentUser: User | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export default function Sidebar({
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  isMobileMenuOpen,
  onMobileMenuClose,
}: SidebarProps) {
  const role = currentUser?.frontendRole || 'Supervisor';

  // Admin menu items matching Figma design
  const adminMenuItems = [
    { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'site-management', icon: Building2, label: 'Site Management' },
    { id: 'user-management', icon: Users, label: 'User Management' },
    { id: 'all-permits', icon: FileText, label: 'All Permits' },
  ];

  // Supervisor menu items matching Figma design
  const supervisorMenuItems = [
    { id: 'supervisor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'worker-list', icon: Users, label: 'Workers List' },
    { id: 'create-permit', icon: Plus, label: 'Create PTW' },
  ];

  const menuItems = role === 'Admin' ? adminMenuItems : supervisorMenuItems;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-lg">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">EPTW</h1>
              <p className="text-xs text-slate-400">Amazon Safety</p>
            </div>
          </div>
          <button
            onClick={onMobileMenuClose}
            className="p-2 transition-colors rounded-lg lg:hidden hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              <span className="text-sm font-semibold">
                {currentUser?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-400">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onMobileMenuClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="flex-shrink-0 w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center w-full gap-3 px-4 py-3 transition-all rounded-lg text-slate-300 hover:bg-red-600 hover:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}