import { Menu, Bell, User, LogOut } from 'lucide-react';
import { User as UserType } from '../../types/auth.types';

interface HeaderProps {
  currentUser: UserType | null;
  onMobileMenuToggle: () => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onMobileMenuToggle, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>

        {/* Logo - visible on mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-slate-900">EPTW</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications */}
          <button className="p-2 hover:bg-slate-100 rounded-lg relative transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-slate-900">
                {currentUser?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500">{currentUser?.role}</p>
            </div>
            <div className="relative group">
              <button className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                <User className="w-5 h-5 text-blue-600" />
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-900">{currentUser?.full_name}</p>
                  <p className="text-xs text-slate-500">{currentUser?.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}