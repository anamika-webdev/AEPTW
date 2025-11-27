// frontend/src/components/common/Sidebar.tsx
import React from 'react';
import { 
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  ClipboardList,
  UserPlus,
  LogOut,
  X,
  Shield,
  HardHat
} from 'lucide-react';

interface SidebarProps {
  currentUser: {
    id: number;
    login_id: string;
    full_name: string;
    email: string;
    role: string;
    department?: string;
  };
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
  onMobileMenuClose
}: SidebarProps) {
  const isAdmin = currentUser.role === 'Admin';
  const isSupervisor = !isAdmin;

  // Navigation items for Admin
  const adminNavItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'System overview'
    },
    { 
      id: 'site-management', 
      label: 'Site Management', 
      icon: Building2,
      description: 'Manage sites'
    },
    { 
      id: 'user-management', 
      label: 'User Management', 
      icon: Users,
      description: 'Manage users'
    },
    { 
      id: 'all-permits', 
      label: 'All Permits', 
      icon: FileText,
      description: 'View all PTWs'
    },
  ];

  // Navigation items for Supervisor
  const supervisorNavItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'My overview'
    },
    { 
      id: 'create-ptw', 
      label: 'Create Permit', 
      icon: ClipboardList,
      description: 'New PTW'
    },
    { 
      id: 'worker-list', 
      label: 'Worker List', 
      icon: UserPlus,
      description: 'Manage workers'
    },
  ];

  const navItems = isAdmin ? adminNavItems : supervisorNavItems;

  const handleNavClick = (pageId: string) => {
    console.log('Sidebar: Navigating to', pageId);
    onNavigate(pageId);
    onMobileMenuClose(); // Close mobile menu after navigation
  };

  const NavButton = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = currentPage === item.id;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg
          transition-all duration-200
          ${isActive 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
        <div className="flex-1 text-left">
          <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
            {item.label}
          </div>
          <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
            {item.description}
          </div>
        </div>
        {isActive && (
          <div className="w-1 h-8 bg-white rounded-full"></div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-white rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">EPTW System</h2>
              <p className="text-xs text-gray-500">Safety First</p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onMobileMenuClose}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Card */}
        <div className="p-4 m-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full text-white font-bold
              ${isAdmin ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'}
            `}>
              {isAdmin ? <Shield className="w-6 h-6" /> : <HardHat className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {currentUser.full_name}
              </h3>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${isAdmin 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                  }
                `}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase">
              {isAdmin ? 'Admin Menu' : 'Supervisor Menu'}
            </p>
          </div>
          
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-red-600 transition-colors rounded-lg bg-red-50 hover:bg-red-100"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            © 2024 Amazon EPTW
          </p>
          <p className="text-xs text-gray-400">
            Version 1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}