import { X, LayoutDashboard, FileText, Users, Building2 } from 'lucide-react';
import { User } from '../../types/auth.types';

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
  isMobileMenuOpen,
  onMobileMenuClose,
}: SidebarProps) {
  const role = currentUser?.role;

  const adminMenuItems = [
    { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'all-permits', icon: FileText, label: 'All Permits' },
    { id: 'site-management', icon: Building2, label: 'Site Management' },
    { id: 'user-management', icon: Users, label: 'User Management' },
  ];

  const supervisorMenuItems = [
    { id: 'supervisor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'create-permit', icon: FileText, label: 'Create Permit' },
    { id: 'worker-list', icon: Users, label: 'Workers' },
  ];

  const workerMenuItems = [
    { id: 'worker-dashboard', icon: LayoutDashboard, label: 'My Permits' },
  ];

  const menuItems = 
    role === 'Admin' ? adminMenuItems :
    role === 'Supervisor' ? supervisorMenuItems :
    workerMenuItems;

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
              <span className="font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">EPTW</h1>
              <p className="text-xs text-slate-400">Amazon Safety</p>
            </div>
          </div>
          <button
            onClick={onMobileMenuClose}
            className="p-2 rounded-lg lg:hidden hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onMobileMenuClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              <span className="text-sm font-semibold text-white">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.full_name}
              </p>
              <p className="text-xs text-slate-400">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}