// frontend/src/pages/admin/UserManagement.tsx - COMPLETE FIXED VERSION
// This version has PROPER filtering with separate tables for each role

import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, Mail, UserIcon as User, Loader2, Building2 } from 'lucide-react';
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
      // Validation
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
        await fetchUsers(true);
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
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
        await fetchUsers(true);
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
      alert(`Cannot delete: User has ${user.permit_count} permit(s)`);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) {
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
        alert('User deleted successfully');
        await fetchUsers(true);
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
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

  const getRoleDisplay = (role: string): string => {
    const roleMap: Record<string, string> = {
      'Admin': 'Administrator',
      'Administrator': 'Administrator',
      'Approver_Safety': 'Safety Officer',
      'Approver_AreaManager': 'Area Manager',
      'Approver_SiteLeader': 'Site Leader',
      'Requester': 'Supervisor',
      'Supervisor': 'Supervisor',
      'Worker': 'Worker'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string): string => {
    if (role === 'Admin' || role === 'Administrator') return 'bg-red-100 text-red-800 border-red-200';
    if (role === 'Requester' || role === 'Supervisor') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (role === 'Worker') return 'bg-green-100 text-green-800 border-green-200';
    if (role.includes('Approver')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ============================================
  // PROPER FILTERING LOGIC - FIXED
  // ============================================
  
  const adminUsers = users.filter(u => 
    u.role === 'Admin' || u.role === 'Administrator'
  );
  
  const supervisorUsers = users.filter(u => 
    u.role === 'Requester' || u.role === 'Supervisor'
  );
  
  const workerUsers = users.filter(u => 
    u.role === 'Worker'
  );
  
  const approverUsers = users.filter(u => 
    u.role.includes('Approver')
  );

  // Apply search filter
  const filterBySearch = (userList: User[]) => {
    if (!searchQuery.trim()) return userList;
    
    const query = searchQuery.toLowerCase();
    return userList.filter(user =>
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.login_id.toLowerCase().includes(query) ||
      (user.department_name && user.department_name.toLowerCase().includes(query))
    );
  };

  // Get filtered list based on active tab
  const getFilteredUsers = (): User[] => {
    let filtered: User[] = [];
    
    switch (activeTab) {
      case 'admins':
        filtered = adminUsers;
        break;
      case 'supervisors':
        filtered = supervisorUsers;
        break;
      case 'workers':
        filtered = workerUsers;
        break;
      case 'approvers':
        filtered = approverUsers;
        break;
      default:
        filtered = users;
    }
    
    return filterBySearch(filtered);
  };

  const filteredUsers = getFilteredUsers();

  // Render user table rows
  const renderUserRows = (userList: User[]) => {
    if (userList.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <User className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                {searchQuery 
                  ? `No users found matching "${searchQuery}"`
                  : `No ${activeTab === 'all' ? 'users' : activeTab} found`
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
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
          {/* Assignment Button for Supervisors */}
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
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-600 hover:text-red-900'
            }`}
            title={user.permit_count && user.permit_count > 0 ? 
              `Cannot delete: User has ${user.permit_count} permit(s)` : 
              'Delete user'
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage system users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          Create New User
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or login ID..."
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All Users
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'admins'
                ? 'border-red-600 text-red-600 bg-red-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Administrators
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {adminUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('supervisors')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'supervisors'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Supervisors
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {supervisorUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'workers'
                ? 'border-green-600 text-green-600 bg-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Workers
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {workerUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvers')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'approvers'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Approvers
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {approverUsers.length}
            </span>
          </button>
        </div>
        
        {/* Active filter indicator */}
        {activeTab !== 'all' && (
          <div className="flex items-center gap-2 px-4 py-2 mt-2 border border-blue-200 rounded-lg bg-blue-50">
            <span className="text-sm text-blue-700">
              Showing {filteredUsers.length} {activeTab === 'admins' ? 'administrator' : activeTab.slice(0, -1)}(s)
            </span>
            <button
              onClick={() => setActiveTab('all')}
              className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filter
            </button>
          </div>
        )}
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

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Create New User</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Login ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.login_id}
                    onChange={(e) => setNewUser({...newUser, login_id: e.target.value})}
                    placeholder="username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Worker">Worker</option>
                    <option value="Requester">Supervisor</option>
                    <option value="Approver_Safety">Safety Officer</option>
                    <option value="Approver_AreaManager">Area Manager</option>
                    <option value="Approver_SiteLeader">Site Leader</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    placeholder="Operations, IT, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Edit User</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  New Password <span className="text-gray-400">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Worker">Worker</option>
                    <option value="Requester">Supervisor</option>
                    <option value="Approver_Safety">Safety Officer</option>
                    <option value="Approver_AreaManager">Area Manager</option>
                    <option value="Approver_SiteLeader">Site Leader</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editingUser.permit_count !== undefined && editingUser.permit_count > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This user has {editingUser.permit_count} permit{editingUser.permit_count !== 1 ? 's' : ''}.
                    Changes may affect existing permits.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && assigningUser && (
        <AssignResourcesModal
          requester={assigningUser}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningUser(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setAssigningUser(null);
            fetchUsers(true);
          }}
        />
      )}
    </div>
  );
}