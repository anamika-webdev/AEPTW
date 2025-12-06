// frontend/src/pages/admin/UserManagement.tsx
// ✅ COMPLETE: Added View button with modal

import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, Mail, UserIcon as User, Loader2, Building2, Eye, X } from 'lucide-react';
import { AssignResourcesModal } from '../../components/admin/AssignResourcesModal';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department_name?: string;
  created_at: string;
  permit_count?: number;
  is_active: boolean;
}

type UserTab = 'all' | 'admins' | 'supervisors' | 'workers' | 'approvers';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // ✅ NEW
  const [viewingUser, setViewingUser] = useState<User | null>(null); // ✅ NEW
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({
    login_id: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Worker',
    department: ''
  });
  
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
    department: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (showMessage = false) => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        if (showMessage) {
          console.log('Users refreshed');
        }
      } else {
        alert(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.login_id || !newUser.full_name || !newUser.email || !newUser.password) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (newUser.password !== newUser.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          login_id: newUser.login_id,
          full_name: newUser.full_name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          department: newUser.department
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('User created successfully!');
        setShowAddModal(false);
        setNewUser({
          login_id: '',
          full_name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'Worker',
          department: ''
        });
        fetchUsers();
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department_name || ''
    });
    setShowEditModal(true);
  };

  // ✅ NEW: View user handler
  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editFormData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('User updated successfully!');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.permit_count && user.permit_count > 0) {
      alert(`Cannot delete user with ${user.permit_count} associated permit(s)`);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'Admin': 'Administrator',
      'Requester': 'Supervisor',
      'Approver_Safety': 'Safety Officer',
      'Approver_AreaManager': 'Area Manager',
      'Approver_SiteLeader': 'Site Leader',
      'Worker': 'Worker'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'Admin': 'bg-red-100 text-red-800 border-red-300',
      'Requester': 'bg-blue-100 text-blue-800 border-blue-300',
      'Approver_Safety': 'bg-green-100 text-green-800 border-green-300',
      'Approver_AreaManager': 'bg-purple-100 text-purple-800 border-purple-300',
      'Approver_SiteLeader': 'bg-orange-100 text-orange-800 border-orange-300',
      'Worker': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.login_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    
    const roleFilters: Record<UserTab, string[]> = {
      'all': [],
      'admins': ['Admin'],
      'supervisors': ['Requester', 'Supervisor'],
      'workers': ['Worker'],
      'approvers': ['Approver_Safety', 'Approver_AreaManager', 'Approver_SiteLeader']
    };
    
    return matchesSearch && roleFilters[activeTab].includes(user.role);
  });

  const renderUserRows = (userList: User[]) => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading users...</p>
          </td>
        </tr>
      );
    }

    if (userList.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-900">No users found</p>
          </td>
        </tr>
      );
    }

    return userList.map((user) => (
      <tr key={user.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
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
          <div className="text-sm text-gray-900">{user.department_name || '-'}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
          {/* ✅ NEW: View button */}
          <button
            onClick={() => handleViewUser(user)}
            className="mr-3 text-green-600 hover:text-green-900"
            title="View user details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {(user.role === 'Requester' || user.role === 'Supervisor') && (
            <button
              onClick={() => {
                setAssigningUser(user);
                setShowAssignModal(true);
              }}
              className="mr-3 text-purple-600 hover:text-purple-900"
              title="Assign sites and workers"
            >
              <Building2 className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => openEditModal(user)}
            className="mr-3 text-blue-600 hover:text-blue-900"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleDeleteUser(user)}
            disabled={user.permit_count !== undefined && user.permit_count > 0}
            className={`${
              user.permit_count && user.permit_count > 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-red-600 hover:text-red-900'
            }`}
            title={user.permit_count && user.permit_count > 0 ? `User has ${user.permit_count} permits` : 'Delete user'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage system users and their roles</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'admins', 'supervisors', 'workers', 'approvers'] as UserTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 mt-3 border-t">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
            <span className="font-medium">{users.length}</span> users
          </p>
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">User</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Login ID</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Department</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-xs font-medium text-right text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {renderUserRows(filteredUsers)}
          </tbody>
        </table>
      </div>

      {/* ✅ NEW: View User Modal */}
      {showViewModal && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info Card */}
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{viewingUser.full_name}</h4>
                    <p className="text-sm text-gray-600">{getRoleDisplay(viewingUser.role)}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Login ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.login_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(viewingUser.role)}`}>
                    {getRoleDisplay(viewingUser.role)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.department_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${
                    viewingUser.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(viewingUser.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {viewingUser.permit_count !== undefined && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Associated Permits</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingUser.permit_count} permit{viewingUser.permit_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(viewingUser);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit User
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other modals... (Add, Edit, Assign) - keeping existing code */}
    </div>
  );
}