// frontend/src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, TrendingUp,
  Plus, Search, Filter, Download
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="p-6 bg-white border rounded-xl border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(status)}`}>
      {displayStatus}
    </span>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSites: 0,
    totalUsers: 0,
    totalPermits: 0,
    activePermits: 0,
  });
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'sites' | 'users' | 'permits'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all permits (admin can see all)
      const permitsRes = await axios.get(`${API_URL}/permits`, { headers });
      const allPermits = permitsRes.data;
      
      setPermits(allPermits);

      // Calculate stats
      const activePermits = allPermits.filter((p: any) => 
        p.status === 'Approved' || p.status === 'In_Progress'
      ).length;

      setStats({
        totalSites: 0, // Will be updated when we fetch sites
        totalUsers: 0, // Will be updated when we fetch users
        totalPermits: allPermits.length,
        activePermits,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General Work': 'bg-blue-100 text-blue-800',
      'Work at Height': 'bg-orange-100 text-orange-800',
      'Electrical Work': 'bg-yellow-100 text-yellow-800',
      'Hot Work': 'bg-red-100 text-red-800',
      'Confined Space': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-slate-600">Overview of your EPTW system</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => setCurrentView('sites')} className="cursor-pointer">
          <StatCard
            title="Total Sites"
            value={stats.totalSites}
            icon={Building2}
            color="blue"
            trend="+12%"
          />
        </div>
        <div onClick={() => setCurrentView('users')} className="cursor-pointer">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="green"
            trend="+8%"
          />
        </div>
        <div onClick={() => setCurrentView('permits')} className="cursor-pointer">
          <StatCard
            title="Total Permits"
            value={stats.totalPermits}
            icon={FileText}
            color="orange"
            trend="+23%"
          />
        </div>
        <StatCard
          title="Active Permits"
          value={stats.activePermits}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* PTW by Category Chart */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">PTW by Category</h3>
        <div className="flex items-center justify-center h-64 text-slate-500">
          <p>Chart visualization will be implemented here</p>
        </div>
      </div>

      {/* Recent Permits */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Permits</h3>
          <button
            onClick={() => setCurrentView('permits')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        <PermitTable 
          permits={permits.slice(0, 5)} 
          emptyMessage="No permits found"
        />
      </div>
    </div>
  );

  const renderSiteManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Management</h1>
          <p className="mt-1 text-slate-600">Manage all site locations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 transition-colors text-slate-600 hover:text-slate-900"
          >
            ← Back
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Site
          </button>
        </div>
      </div>

      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sites..."
              className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 transition-colors border rounded-lg border-slate-300 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <p className="py-8 text-center text-slate-500">Site management features coming soon</p>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-slate-600">Manage supervisors and workers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 transition-colors text-slate-600 hover:text-slate-900"
          >
            ← Back
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl border-slate-200">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex">
            <button className="px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              Supervisors
            </button>
            <button className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900">
              Workers
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 transition-colors border rounded-lg border-slate-300 hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <p className="py-8 text-center text-slate-500">User management features coming soon</p>
        </div>
      </div>
    </div>
  );

  const renderAllPermits = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Permits</h1>
          <p className="mt-1 text-slate-600">View and manage all work permits</p>
        </div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 transition-colors text-slate-600 hover:text-slate-900"
        >
          ← Back
        </button>
      </div>

      <div className="p-6 bg-white border rounded-xl border-slate-200">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search permits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Initiated">Initiated</option>
            <option value="Approved">Approved</option>
            <option value="In_Progress">In Progress</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select className="px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>All Categories</option>
            <option>General Work</option>
            <option>Work at Height</option>
            <option>Electrical Work</option>
            <option>Hot Work</option>
            <option>Confined Space</option>
          </select>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>

        {/* Permits Table */}
        <PermitTable 
          permits={permits.filter(p => 
            (filterStatus === 'all' || p.status === filterStatus) &&
            (searchTerm === '' || 
              p.permit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.work_location?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )} 
          emptyMessage="No permits found"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'sites' && renderSiteManagement()}
        {currentView === 'users' && renderUserManagement()}
        {currentView === 'permits' && renderAllPermits()}
      </div>
    </div>
  );
}

// Permit Table Component
interface PermitTableProps {
  permits: any[];
  emptyMessage: string;
}

const PermitTable: React.FC<PermitTableProps> = ({ permits, emptyMessage }) => {
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General Work': 'bg-blue-100 text-blue-800',
      'Work at Height': 'bg-orange-100 text-orange-800',
      'Electrical Work': 'bg-yellow-100 text-yellow-800',
      'Hot Work': 'bg-red-100 text-red-800',
      'Confined Space': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  if (permits.length === 0) {
    return <p className="py-8 text-center text-slate-500">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b bg-slate-50 border-slate-200">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">PTW Number</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Category</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Location</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Requester</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Start Date</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {permits.map((permit) => (
              <tr key={permit.permit_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {permit.permit_number}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(permit.work_category)}`}>
                    {permit.work_category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {permit.work_location}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {permit.requester_name || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(permit.start_datetime).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={permit.status} />
                </td>
                <td className="px-4 py-3">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {permits.map((permit) => (
          <div
            key={permit.permit_id}
            className="p-4 rounded-lg bg-slate-50"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-medium text-slate-900">{permit.permit_number}</p>
              <StatusBadge status={permit.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(permit.work_category)}`}>
                  {permit.work_category}
                </span>
              </div>
              <p className="text-slate-600">📍 {permit.work_location}</p>
              <p className="text-slate-600">👤 {permit.requester_name || 'N/A'}</p>
              <p className="text-slate-600">📅 {new Date(permit.start_datetime).toLocaleDateString()}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200">
              <button className="w-full text-sm font-medium text-center text-blue-600 hover:text-blue-700">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};