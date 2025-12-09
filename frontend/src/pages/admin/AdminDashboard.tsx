// frontend/src/pages/admin/AdminDashboard.tsx
// ✅ CLEAN VERSION: Only stats and quick actions, no tables

import { useState, useEffect } from 'react';
import { Users, Building2, FileText, BarChart3, RefreshCw } from 'lucide-react';

interface Stats {
  totalUsers?: number;
  totalSupervisors?: number;
  totalWorkers?: number;
  totalSites?: number;
  totalTasks?: number;
  activeTasks?: number;
  completedTasks?: number;
  totalPermits?: number;
  activePermits?: number;
}

interface AdminDashboardProps {
  onNavigate?: (view: string, data?: any) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      console.log('📡 Fetching stats from:', `${baseURL}/dashboard/stats`);

      const response = await fetch(`${baseURL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      console.log('📥 Stats response:', data);

      setStats(data);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSites = () => {
    if (onNavigate) {
      onNavigate('site-management');
    } else {
      console.log('Navigate to: Site Management');
    }
  };

  const handleManageUsers = () => {
    if (onNavigate) {
      onNavigate('user-management');
    } else {
      console.log('Navigate to: User Management');
    }
  };

  const handleViewPermits = () => {
    if (onNavigate) {
      onNavigate('all-permits');
    } else {
      console.log('Navigate to: All Permits');
    }
  };

  const handleViewReports = () => {
    if (onNavigate) {
      onNavigate('reports');
    } else {
      console.log('Navigate to: Reports');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Real-time overview of system operations and statistics</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          {/* Total Sites */}
          <div className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalSites || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Total Workers */}
          <div className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalWorkers || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Supervisors */}
          <div className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Supervisors</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalSupervisors || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Manage Sites */}
            <button
              onClick={handleManageSites}
              className="flex items-center justify-center gap-3 px-6 py-4 text-white transition-all bg-orange-600 rounded-lg hover:bg-orange-700 hover:shadow-lg"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Manage Sites</span>
            </button>

            {/* Manage Users */}
            <button
              onClick={handleManageUsers}
              className="flex items-center justify-center gap-3 px-6 py-4 text-white transition-all bg-amber-600 rounded-lg hover:bg-amber-700 hover:shadow-lg"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Manage Users</span>
            </button>

            {/* View All Permits */}
            <button
              onClick={handleViewPermits}
              className="flex items-center justify-center gap-3 px-6 py-4 text-white transition-all bg-orange-500 rounded-lg hover:bg-orange-600 hover:shadow-lg"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">View All Permits</span>
            </button>

            {/* View Reports */}
            <button
              onClick={handleViewReports}
              className="flex items-center justify-center gap-3 px-6 py-4 text-white transition-all bg-amber-700 rounded-lg hover:bg-amber-800 hover:shadow-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">View Reports</span>
            </button>
          </div>
        </div>

        {/* Additional Stats Section (Optional) */}
        {(stats.totalPermits || stats.activeTasks || stats.completedTasks) && (
          <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3">
            {stats.totalPermits !== undefined && (
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Permits</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPermits}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            )}

            {stats.activeTasks !== undefined && (
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeTasks}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            )}

            {stats.completedTasks !== undefined && (
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.completedTasks}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}