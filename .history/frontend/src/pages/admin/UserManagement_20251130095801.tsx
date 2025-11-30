// frontend/src/pages/admin/UserManagement.tsx - FIXED
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Mail, User as UserIcon, RefreshCw, Search } from 'lucide-react';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
  created_at: string;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'admins' | 'supervisors' | 'workers'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchUsers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized - Please log in again');
        }
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      console.log('📊 Users data:', result);

      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        throw new Error('Invalid response format');
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      setError(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await fetchUsers(true);
      alert('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user');
    }
  };

  const getRoleDisplay = (role: string): string => {
    const roleMap: Record<string, string> = {
      'Admin': 'Administrator',
      'Administrator': 'Administrator',
      'Approver_Safety': 'Safety Officer',
      'Approver_AreaManager': 'Area Manager',
      'Approver_SiteLeader': 'Site Leader',
      'Requester': 'Worker',
      'Supervisor': 'Supervisor',
      'Worker': 'Worker'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string): string => {
    if (role === 'Admin' || role === 'Administrator') return 'bg-red-100 text-red-800 border-red-200';
    if (role.includes('Approver') || role === 'Supervisor') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Filter users based on active tab and search
  const filteredUsers = users.filter(user => {
    // Filter by tab
    if (activeTab === 'admins' && user.role !== 'Admin' && user.role !== 'Administrator') return false;
    if (activeTab === 'supervisors' && !['Approver_Safety', 'Approver_AreaManager', 'Approver_SiteLeader', 'Supervisor'].includes(user.role)) return false;
    if (activeTab === 'workers' && user.role !== 'Requester' && user.role !== 'Worker') return false;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.login_id.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Failed to Load Users</h3>
          <p className="mb-4 text-sm text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchUsers();
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage system users and their roles
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            {[
              { key: 'all', label: 'All Users', count: users.length },
              { key: 'admins', label: 'Administrators', count: users.filter(u => u.role === 'Admin' || u.role === 'Administrator').length },
              { key: 'supervisors', label: 'Supervisors', count: users.filter(u => ['Approver_Safety', 'Approver_AreaManager', 'Approver_SiteLeader', 'Supervisor'].includes(u.role)).length },
              { key: 'workers', label: 'Workers', count: users.filter(u => u.role === 'Requester' || u.role === 'Worker').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="px-2 py-1 ml-2 text-xs bg-gray-100 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, login ID, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Login ID
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.login_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          className="ml-3 text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="mt-1 text-sm">
                          {searchTerm ? 'Try adjusting your search' : 'No users in this category'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}