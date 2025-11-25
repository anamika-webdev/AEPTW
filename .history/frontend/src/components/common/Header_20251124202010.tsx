import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker';
  department?: string;
}

interface HeaderProps {
  currentUser: User | null;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onMenuClick, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg lg:hidden hover:bg-slate-100"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>

        {/* Page Title - Hidden on mobile */}
        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-slate-900">
            {currentUser?.frontendRole === 'Admin' ? 'Admin Dashboard' : 'Supervisor Dashboard'}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {currentUser?.full_name}
              </p>
              <p className="text-xs text-slate-500">
                {currentUser?.role}
              </p>
            </div>
            
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              <span className="text-sm font-semibold text-white">
                {currentUser?.full_name?.charAt(0) || '?'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-red-600 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}