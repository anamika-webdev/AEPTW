// frontend/src/pages/admin/AdminDashboard.tsx - FIXED
import { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileText,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
interface Stats {
  totalSites: number;
  totalWorkers: number;
  totalSupervisors: number;
  totalPTW: number;
  activePTW: number;
  pendingPTW: number;
  closedPTW: number;
}
interface UserManagementProps {
  users: any[];
  userType: string;
  onEdit: (user: any) => void;
  onDelete: (id: any, name: string) => void;
  onAdd: () => void;
  title: string;
}

const UserManagement = ({ users, userType, onEdit, onDelete, onAdd, title }: UserManagementProps) => {
  // ADD PAGINATION HOOK
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    setCurrentPage,
    setItemsPerPage
  } = usePagination({
    data: users,
    initialItemsPerPage: 10
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 font-medium text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Add New {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </button>
      </div>
      
      {/* WRAP TABLE IN A CONTAINER */}
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">User ID</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Email</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Contact</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Location</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* CHANGE: Map paginatedData instead of users */}
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No {userType}s found
                  </td>
                </tr>
              ) : (
                paginatedData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium border border-gray-200">{user.user_id}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{user.name}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{user.email}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{user.contact}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{user.city}, {user.state}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 transition-colors duration-200 bg-blue-100 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(user.id, user.name)}
                          className="px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-200 bg-red-100 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* ADD PAGINATION COMPONENT */}
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
interface SiteManagementProps {
  sites: any[];
  onEdit: (site: any) => void;
  onDelete: (id: any, name: string) => void;
  onAdd: () => void;
}

const SiteManagement = ({ sites, onEdit, onDelete, onAdd }: SiteManagementProps) => {
  // ADD PAGINATION HOOK
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    setCurrentPage,
    setItemsPerPage
  } = usePagination({
    data: sites,
    initialItemsPerPage: 10
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Sites Management</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 font-medium text-white transition-colors duration-200 bg-green-600 rounded-lg hover:bg-green-700"
        >
          + Add New Site
        </button>
      </div>
      
      {/* WRAP TABLE IN A CONTAINER */}
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Site ID</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Location</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Coordinates</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">City/State</th>
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 border border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* CHANGE: Map paginatedData instead of sites */}
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No sites found
                  </td>
                </tr>
              ) : (
                paginatedData.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium border border-gray-200">{site.site_id}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{site.site_name}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{site.location}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{site.latitude}, {site.longitude}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">{site.city}, {site.state}</td>
                    <td className="px-4 py-3 text-sm border border-gray-200">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(site)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 transition-colors duration-200 bg-blue-100 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(site.id, site.site_name)}
                          className="px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-200 bg-red-100 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* ADD PAGINATION COMPONENT */}
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
interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized - Please log in again');
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      console.log('📊 Admin Dashboard Data:', result);
      
      // Backend returns: { success: true, data: { totalSites, totalWorkers, ... } }
      if (result.success && result.data) {
        setStats(result.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading dashboard...</p>
          <p className="text-sm text-gray-500">Fetching data from database</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 text-red-600">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Failed to Load Dashboard</h3>
          <p className="mb-4 text-sm text-gray-600">{error}</p>
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Sites */}
          <div className="p-6 transition-shadow bg-white rounded-lg shadow-md hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalSites}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Workers */}
          <div className="p-6 transition-shadow bg-white rounded-lg shadow-md hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalWorkers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Supervisors */}
          <div className="p-6 transition-shadow bg-white rounded-lg shadow-md hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Supervisors</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalSupervisors}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Approvers & Safety Officers
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total PTW */}
          <div className="p-6 transition-shadow bg-white rounded-lg shadow-md hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total PTW Issued</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalPTW}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* PTW Status Overview */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          {/* Active PTW */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active PTW</h3>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.activePTW}</p>
            <p className="mt-2 text-sm text-gray-500">Currently in progress</p>
          </div>

          {/* Pending Approval */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Approval</h3>
              <RefreshCw className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingPTW}</p>
            <p className="mt-2 text-sm text-gray-500">Awaiting approval</p>
          </div>

          {/* Closed PTW */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Closed PTW</h3>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.closedPTW}</p>
            <p className="mt-2 text-sm text-gray-500">Completed permits</p>
          </div>
        </div>

        {/* Quick Actions */}
        {/* Quick Actions */}
<div className="p-6 bg-white rounded-lg shadow-md">
  <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    
    {/* Button 1 */}
    <button 
      onClick={() => onNavigate?.('site-management')} 
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
    >
      <Building2 className="w-4 h-4" />
      Manage Sites
    </button>
    
    {/* Button 2 */}
    <button 
      onClick={() => onNavigate?.('user-management')} 
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
    >
      <Users className="w-4 h-4" />
      Manage Users
    </button>
    
    {/* Button 3 */}
    <button 
      onClick={() => onNavigate?.('all-permits')}  
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
    >
      <FileText className="w-4 h-4" />
      View All Permits
    </button>
    
    {/* Button 4 */}
    <button 
      onClick={() => onNavigate?.('reports')} 
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
    >
      <TrendingUp className="w-4 h-4" />
      View Reports
    </button>
    
  </div>
</div>
      </div>
    </div>
  );
}