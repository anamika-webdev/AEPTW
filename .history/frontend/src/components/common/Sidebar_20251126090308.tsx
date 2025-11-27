// frontend/src/components/common/Sidebar.tsx
import { LayoutDashboard, Users, Plus, LogOut, X } from 'lucide-react';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
}

interface SidebarProps {
  currentUser: User;
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
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine role-based navigation items
  const getNavigationItems = () => {
    if (currentUser.role === 'Admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'site-management', label: 'Site Management', icon: LayoutDashboard },
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'all-permits', label: 'All Permits', icon: LayoutDashboard },
      ];
    } else {
      // Supervisor
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'worker-list', label: 'Workers', icon: Users },
        { id: 'create-permit', label: 'Create PTW', icon: Plus },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleNavClick = (pageId: string) => {
    console.log('📌 Sidebar navigation clicked:', pageId);
    onNavigate(pageId);
    onMobileMenuClose();
  };

  const NavButton = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    
    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all
          ${isActive 
            ? 'bg-green-600 text-white' 
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex items-center justify-center h-20 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded">
            <div className="text-white">
              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 15 L65 40 L50 50 L35 40 Z M25 45 L40 70 L50 60 L35 50 Z M75 45 L60 50 L50 60 L65 70 Z M50 65 L40 75 L50 85 L60 75 Z"/>
                <path d="M45 42 Q50 45 55 42" stroke="white" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">amazon</div>
            <div className="text-xs font-medium text-gray-600">EPTW</div>
            <div className="text-[10px] text-gray-500">Permit System</div>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="p-4 mx-4 mt-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
            <span className="text-sm font-bold">{getInitials(currentUser.full_name)}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{currentUser.role}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-6 space-y-1">
        {navigationItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 bottom-0 left-0 z-30 flex-col hidden w-56 bg-white border-r border-gray-200 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Amazon EPTW</span>
          <button 
            onClick={onMobileMenuClose}
            className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col h-[calc(100%-4rem)]">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}