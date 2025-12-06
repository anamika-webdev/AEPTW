// frontend/src/pages/admin/AdminDashboard.tsx
// ✅ COMPLETE CORRECTED TYPESCRIPT VERSION WITH PAGINATION

import { useState, useEffect } from 'react';
import { Building2, Users, FileText, RefreshCw, TrendingUp } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface Stats {
  totalSites: number;
  totalWorkers: number;
  totalSupervisors: number;
  activePTW: number;
  pendingPTW: number;
  closedPTW: number;
}

interface User {
  id: number;
  user_id: string;
  name: string;
  email: string;
  contact: string;
  user_type: string;
  domain?: string;
  city?: string;
  state?: string;
}

interface Site {
  id: number;
  site_id: string;
  site_name: string;
  location: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [activeTab, setActiveTab] = useState<'supervisors' | 'workers' | 'sites'>('supervisors');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Fetch stats
      const statsRes = await fetch(`${baseURL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();

      // Fetch users
      const usersRes = await fetch(`${baseURL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();

      // Fetch sites
      const sitesRes = await fetch(`${baseURL}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sitesData = await sitesRes.json();

      setStats(statsData);
      setUsers(usersData.data || usersData || []);
      setSites(sitesData.data || sitesData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboardData();
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const supervisors = users.filter(u => u.user_type === 'supervisor');
  const workers = users.filter(u => u.user_type === 'worker');

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time overview of system operations and statistics
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sites</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalSites}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Workers</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalWorkers}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Supervisors</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalSupervisors}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button 
              onClick={() => onNavigate?.('site-management')} 
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Building2 className="w-4 h-4" />
              Manage Sites
            </button>
            <button 
              onClick={() => onNavigate?.('user-management')} 
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
            <button 
              onClick={() => onNavigate?.('all-permits')}  
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <FileText className="w-4 h-4" />
              View All Permits
            </button>
            <button 
              onClick={() => onNavigate?.('reports')} 
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <TrendingUp className="w-4 h-4" />
              View Reports
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('supervisors')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'supervisors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Supervisors ({supervisors.length})
              </button>
              <button
                onClick={() => setActiveTab('workers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'workers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Workers ({workers.length})
              </button>
              <button
                onClick={() => setActiveTab('sites')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'sites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sites ({sites.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'supervisors' && <UserTable users={supervisors} userType="Supervisor" />}
            {activeTab === 'workers' && <UserTable users={workers} userType="Worker" />}
            {activeTab === 'sites' && <SiteTable sites={sites} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ UserTable Component with Pagination
const UserTable = ({ users, userType }: { users: User[]; userType: string }) => {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    setCurrentPage,
    setItemsPerPage
  } = usePagination<User>({
    data: users,
    initialItemsPerPage: 10
  });

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{userType}s</h3>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Contact</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No {userType.toLowerCase()}s found
                  </td>
                </tr>
              ) : (
                paginatedData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.contact}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.city}, {user.state}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={users.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
};

// ✅ SiteTable Component with Pagination
const SiteTable = ({ sites }: { sites: Site[] }) => {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    setCurrentPage,
    setItemsPerPage
  } = usePagination<Site>({
    data: sites,
    initialItemsPerPage: 10
  });

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sites</h3>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Site ID</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Location</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Coordinates</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">City/State</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No sites found
                  </td>
                </tr>
              ) : (
                paginatedData.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{site.site_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{site.site_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{site.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {site.latitude}, {site.longitude}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {site.city}, {site.state}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sites.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sites.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
};