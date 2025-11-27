// frontend/src/components/common/Sidebar.tsx
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
  
  // Determine role-based navigation items
  const getNavigationItems = () => {
    if (currentUser.role === 'Admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & analytics' },
        { id: 'site-management', label: 'Site Management', icon: Building2, description: 'Manage sites' },
        { id: 'user-management', label: 'User Management', icon: Users, description: 'Manage users' },
        { id: 'all-permits', label: 'All Permits', icon: FileText, description: 'View all permits' },
      ];
    } else {
      // Supervisor, Requester, Approver_Safety, Approver_AreaManager
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Your overview' },
        { id: 'create-permit', label: 'Create Permit', icon: ClipboardList, description: 'New permit' }, // ← Changed from 'create-ptw'
        { id: 'worker-list', label: 'Worker List', icon: UserPlus, description: 'Manage workers' },
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
          w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
          ${isActive 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        <div className="flex-1 text-left">
          <div className="font-medium">{item.label}</div>
          <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
            {item.description}
          </div>
        </div>
        {isActive && (
          <div className="w-1 h-8 bg-white rounded-full" />
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <>
      {/* User Info Card */}
      <div className={`
        p-4 mb-6 rounded-lg bg-gradient-to-r
        ${currentUser.role === 'Admin' 
          ? 'from-red-500 to-pink-600' 
          : 'from-green-500 to-emerald-600'
        }
      `}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full">
            {currentUser.role === 'Admin' 
              ? <Shield className="w-6 h-6 text-red-600" />
              : <HardHat className="w-6 h-6 text-green-600" />
            }
          </div>
          <div className="flex-1 text-white">
            <div className="text-sm font-semibold">{currentUser.full_name}</div>
            <div className="text-xs opacity-90">{currentUser.email}</div>
            <div className="inline-block px-2 py-0.5 mt-1 text-xs font-medium bg-white/20 rounded">
              {currentUser.role}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="pt-6 mt-auto border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center w-full gap-3 px-4 py-3 text-red-600 transition-colors rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 text-xs text-center text-gray-500 border-t border-gray-200">
        <div>© 2024 Amazon EPTW</div>
        <div className="mt-1">v1.0.0</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 bottom-0 left-0 z-30 flex-col hidden w-64 bg-white border-r border-gray-200 lg:flex">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h1 className="text-xl font-bold text-white">Amazon EPTW</h1>
        </div>
        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          <SidebarContent />
        </div>
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
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h1 className="text-xl font-bold text-white">Amazon EPTW</h1>
          <button 
            onClick={onMobileMenuClose}
            className="p-1 text-white transition-colors rounded hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}