// frontend/src/components/common/Sidebar.tsx
import { useState } from 'react';
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
  BarChart,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { formatRolesForDisplay } from '../../utils/roleMapper';

import { User } from '../../types';

interface SidebarProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  approverTab?: string;
}

export default function Sidebar({
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  isMobileMenuOpen,
  onMobileMenuClose,
  approverTab
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'admin': true,
    'approver': true,
    'supervisor': true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine roles
  const roles = (currentUser.role || '').toLowerCase();
  const hasAdmin = roles.includes('admin') || roles.includes('administrator');
  const hasApprover = roles.includes('approver');
  const hasSupervisor = roles.includes('supervisor') || roles.includes('requester');

  const getNavigationItems = () => {
    let sections: any[] = [];

    // ✅ ADMIN SECTION
    if (hasAdmin) {
      sections.push({
        type: 'section',
        id: 'admin',
        label: 'Admin Tools',
        items: [
          { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { id: 'site-management', label: 'Site Management', icon: Building2 },
          { id: 'user-management', label: 'User Management', icon: Users },
          { id: 'all-permits', label: 'All Permits', icon: FileText },
          { id: 'reports', label: 'Reports', icon: BarChart },
        ]
      });
    }

    // ✅ APPROVER SECTION
    if (hasApprover) {
      sections.push({
        type: 'section',
        id: 'approver',
        label: 'Approver Tools',
        items: [
          { id: 'approver-dashboard', label: 'Approver Dashboard', icon: LayoutDashboard },
          { id: 'pending', label: 'Pending Requests', icon: Clock, isApproverTab: true },
          { id: 'approved', label: 'Approved Requests', icon: CheckCircle, isApproverTab: true },
          { id: 'rejected', label: 'Rejected Requests', icon: XCircle, isApproverTab: true },
          { id: 'extension-approvals', label: 'Extension Approvals', icon: Calendar },
        ]
      });
    }

    // ✅ SUPERVISOR SECTION
    if (hasSupervisor) {
      sections.push({
        type: 'section',
        id: 'supervisor',
        label: 'Supervisor Tools',
        items: [
          { id: 'supervisor-dashboard', label: 'Supervisor Dashboard', icon: LayoutDashboard },
          { id: 'worker-list', label: 'Workers', icon: Users },
          { id: 'create-permit', label: 'Create PTW', icon: Plus },
        ]
      });
    }

    // Default if no roles
    if (sections.length === 0) {
      sections.push({
        type: 'section',
        id: 'user',
        label: 'User Tools',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
      });
    }

    return sections;
  };

  const navSections = getNavigationItems();

  const handleNavClick = (item: any) => {
    onNavigate(item.id);
    onMobileMenuClose();
  };

  const NavSection = ({ section }: { section: any }) => {
    const isExpanded = expandedSections[section.id];

    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-orange-600 transition-colors"
        >
          <span>{section.label}</span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-1 px-2">
            {section.items.map((item: any) => {
              const Icon = item.icon;
              const isActive = item.isApproverTab
                ? (currentPage === 'approver-dashboard' && approverTab === item.id)
                : currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all
                    ${isActive
                      ? 'bg-orange-100 text-orange-600 border border-orange-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
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
        <div className="relative p-4 border-b">
          <div className="flex flex-col items-center gap-2">
            <img
              src="/logo.jpg"
              alt="PTW System Logo"
              className="w-50 h-50 object-contain rounded-lg"
            />
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">PTW System</h2>
              <p className="text-xs text-gray-500 font-medium">
                Internal Portal
              </p>
            </div>
          </div>
          <button
            onClick={onMobileMenuClose}
            className="absolute top-4 right-4 text-gray-500 lg:hidden hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
              {getInitials(currentUser.full_name || currentUser.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser.full_name || currentUser.email}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {currentUser.email}
              </p>
              <p className="text-xs font-medium text-orange-600">
                {formatRolesForDisplay(currentUser.role)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navSections.map((section) => (
            <NavSection key={section.id} section={section} />
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