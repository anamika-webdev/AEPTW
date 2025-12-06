// frontend/src/pages/admin/AdminDashboard.tsx
// ✅ FIXED: Proper array initialization and API response handling

import { useState, useEffect } from 'react';
import { Users, Building2, Activity, CheckCircle2 } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface User {
  id: number;
  user_id: string;
  name: string;
  email: string;
  contact: string;
  user_type: string;
  domain?: string;
  location?: string;
  city?: string;
  state?: string;
}

interface Site {
  id: number;
  site_id: string;
  site_name: string;
  location: string;
  latitude?: string;
  longitude?: string;
  city?: string;
  state?: string;
}

interface Stats {
  totalUsers: number;
  totalSupervisors: number;
  totalWorkers: number;
  totalSites: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
}

interface AdminDashboardProps {
  onNavigate?: (view: string, data?: any) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'supervisors' | 'workers' | 'sites'>('supervisors');
  const [users, setUsers] = useState<User[]>([]); // ✅ Initialize as empty array
  const [sites, setSites] = useState<Site[]>([]); // ✅ Initialize as empty array
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadSites(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      console.log('📡 Fetching users from:', `${baseURL}/users`);
      
      const response = await fetch(`${baseURL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      console.log('📥 Users response:', data);
      
      // ✅ Handle both array and object responses
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        console.warn('⚠️ Unexpected users response format:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]); // ✅ Set empty array on error
    }
  };

  const loadSites = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      console.log('📡 Fetching sites from:', `${baseURL}/sites`);
      
      const response = await fetch(`${baseURL}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      console.log('📥 Sites response:', data);
      
      // ✅ Handle both array and object responses
      if (Array.isArray(data)) {
        setSites(data);
      } else if (data.sites && Array.isArray(data.sites)) {
        setSites(data.sites);
      } else if (data.data && Array.isArray(data.data)) {
        setSites(data.data);
      } else {
        console.warn('⚠️ Unexpected sites response format:', data);
        setSites([]);
      }
    } catch (error) {
      console.error('❌ Error loading sites:', error);
      setSites([]); // ✅ Set empty array on error
    }
  };

  const loadStats = async () => {
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
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${baseURL}/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          alert('✅ User deleted successfully!');
          loadUsers();
          loadStats();
        } else {
          alert('❌ Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('❌ Error deleting user');
      }
    }
  };

  const handleDeleteSite = async (siteId: number, siteName: string) => {
    if (window.confirm(`Are you sure you want to delete site "${siteName}"?`)) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${baseURL}/sites/${siteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          alert('✅ Site deleted successfully!');
          loadSites();
          loadStats();
        } else {
          alert('❌ Failed to delete site');
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        alert('❌ Error deleting site');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  // ✅ Safe filtering with fallback
  const supervisors = Array.isArray(users) ? users.filter(u => u.user_type === 'supervisor') : [];
  const workers = Array.isArray(users) ? users.filter(u => u.user_type === 'worker') : [];

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers || 0}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sites</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalSites || 0}</p>
                </div>
                <Building2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.activeTasks || 0}</p>
                </div>
                <Activity className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Tasks</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.completedTasks || 0}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('supervisors')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'supervisors'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Supervisors ({supervisors.length})
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'workers'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Workers ({workers.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'sites'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sites ({sites.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'supervisors' && (
              <UserManagement
                users={supervisors}
                userType="supervisor"
                onEdit={setEditingUser}
                onDelete={handleDeleteUser}
                onAdd={() => setShowAddUser(true)}
                title="Supervisors"
              />
            )}

            {activeTab === 'workers' && (
              <UserManagement
                users={workers}
                userType="worker"
                onEdit={setEditingUser}
                onDelete={handleDeleteUser}
                onAdd={() => setShowAddUser(true)}
                title="Workers"
              />
            )}

            {activeTab === 'sites' && (
              <SiteManagement
                sites={sites}
                onEdit={setEditingSite}
                onDelete={handleDeleteSite}
                onAdd={() => setShowAddSite(true)}
              />
            )}
          </div>
        </div>

        {/* TODO: Add modals for Add/Edit User and Site */}
      </div>
    </div>
  );
}

// ✅ UserManagement Component with Pagination
interface UserManagementProps {
  users: User[];
  userType: string;
  onEdit: (user: User) => void;
  onDelete: (id: number, name: string) => void;
  onAdd: () => void;
  title: string;
}

const UserManagement = ({ users, userType, onEdit, onDelete, onAdd, title }: UserManagementProps) => {
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">{title} Management</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Add {userType === 'supervisor' ? 'Supervisor' : 'Worker'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">NAME</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">EMAIL</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">CONTACT</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">LOCATION</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 border">
                    No {userType}s found
                  </td>
                </tr>
              ) : (
                paginatedData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium border">{user.user_id}</td>
                    <td className="px-4 py-3 text-sm border">{user.name}</td>
                    <td className="px-4 py-3 text-sm border">{user.email}</td>
                    <td className="px-4 py-3 text-sm border">{user.contact || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border">
                      {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm border">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(user.id, user.name)}
                          className="px-3 py-1 text-xs font-medium text-red-600 transition-colors bg-red-100 rounded hover:bg-red-200"
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

        {/* ✅ Pagination */}
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

// ✅ SiteManagement Component with Pagination
interface SiteManagementProps {
  sites: Site[];
  onEdit: (site: Site) => void;
  onDelete: (id: number, name: string) => void;
  onAdd: () => void;
}

const SiteManagement = ({ sites, onEdit, onDelete, onAdd }: SiteManagementProps) => {
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Sites Management</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Add Site
        </button>
      </div>

      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">SITE ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">NAME</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">LOCATION</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">COORDINATES</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">CITY/STATE</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 border">
                    No sites found
                  </td>
                </tr>
              ) : (
                paginatedData.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium border">{site.site_id}</td>
                    <td className="px-4 py-3 text-sm border">{site.site_name}</td>
                    <td className="px-4 py-3 text-sm border">{site.location || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border">
                      {site.latitude && site.longitude ? `${site.latitude}, ${site.longitude}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm border">
                      {site.city && site.state ? `${site.city}, ${site.state}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm border">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(site)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(site.id, site.site_name)}
                          className="px-3 py-1 text-xs font-medium text-red-600 transition-colors bg-red-100 rounded hover:bg-red-200"
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

        {/* ✅ Pagination */}
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