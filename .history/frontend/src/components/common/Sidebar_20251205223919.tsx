// frontend/src/components/common/Sidebar.tsx
// FIXED SIDEBAR WITH WORKING APPROVER NAVIGATION

import { 
  LayoutDashboard, 
  Users, 
  Plus, 
  LogOut, 
  X, 
  Building2, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  BarChart
} from 'lucide-react';

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
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check BOTH role field AND frontendRole field (case-insensitive)
  const userRole = currentUser.role?.toLowerCase();
  const frontendRole = currentUser.frontendRole?.toLowerCase();
  
  const isAdmin = 
    userRole === 'admin' || 
    userRole === 'administrator' ||
    frontendRole === 'admin';

  // ✅ Check if user is an approver
  const isApprover = 
    userRole === 'approver_areamanager' || 
    userRole === 'approver_safety' || 
    userRole === 'approver_siteleader' ||
    userRole?.includes('approver');

  const getNavigationItems = () => {
    // ✅ ADMIN MENU
    if (isAdmin) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'site-management', label: 'Site Management', icon: Building2 },
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'all-permits', label: 'All Permits', icon: FileText },
        { id: 'reports', label: 'Reports', icon: BarChart },
      ];
    } 
    
    // ✅ APPROVER MENU - Fixed to use special navigation
    else if (isApprover) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pending', label: 'Pending Requests', icon: Clock, isApproverTab: true },
        { id: 'approved', label: 'Approved Requests', icon: CheckCircle, isApproverTab: true },
        { id: 'rejected', label: 'Rejected Requests', icon: XCircle, isApproverTab: true },
      ];
    } 
    
    // ✅ SUPERVISOR MENU
    else {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'worker-list', label: 'Workers', icon: Users },
        { id: 'create-permit', label: 'Create PTW', icon: Plus },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleNavClick = (item: any) => {
    // For approver tabs, navigate with the tab identifier
    if (item.isApproverTab) {
      onNavigate(item.id); // This will be 'pending', 'approved', or 'rejected'
    } else {
      onNavigate(item.id);
    }
    onMobileMenuClose();
  };

  const NavButton = ({ item }: { item: any }) => {
    const Icon = item.icon;
    
    // For approver tabs, check if we're on dashboard AND if this is the active tab
    const isActive = item.isApproverTab 
      ? currentPage === 'dashboard' && false // Will be handled by parent component
      : currentPage === item.id;
    
    return (
      <button
        onClick={() => handleNavClick(item)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all
          ${isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">PTW System</h2>
              <p className="text-xs text-gray-500">
                {isAdmin ? 'Admin Panel' : isApprover ? 'Approver Panel' : 'Supervisor Panel'}
              </p>
            </div>
          </div>
          <button
            onClick={onMobileMenuClose}
            className="text-gray-500 lg:hidden hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser.full_name}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {currentUser.email}
              </p>
              <p className="text-xs font-medium text-blue-600 capitalize">
                {currentUser.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={onLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-600 transition-all rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}