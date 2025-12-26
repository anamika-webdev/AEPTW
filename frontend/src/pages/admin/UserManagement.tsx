// frontend/src/pages/admin/UserManagement.tsx - COMPLETE WITH ASSIGNMENTS
// Enhanced version with assigned sites and workers display in View modal

import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, Mail, UserIcon as User, Loader2, Building2, Eye, X, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { AssignResourcesModal } from '../../components/admin/AssignResourcesModal';
import { BulkImportModal } from '../../components/admin/BulkImportModal';
import { JOB_ROLES } from '../../utils/jobRoles';
import { DEPARTMENTS } from '../../utils/departments';

interface Site {
  id: number;
  name: string;
  site_code: string;
  location: string;
}

// ... existing code ...

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department_name?: string;
  site_id?: number;
  site_name?: string;
  job_role?: string;
  created_at: string;
  permit_count?: number;
  is_active: boolean;
}

type UserTab = 'all' | 'admins' | 'supervisors' | 'workers' | 'approvers';

interface UserManagementProps {
  onBack?: () => void;
}

export default function UserManagement({ onBack }: UserManagementProps) {
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSiteAssignment, setShowSiteAssignment] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<User | null>(null);

  // ✅ NEW: Assignment states
  const [userAssignments, setUserAssignments] = useState<{
    sites: any[];
    workers: any[];
    loading: boolean;
  }>({ sites: [], workers: [], loading: false });

  // Bulk Selection States
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({
    role: '',
    department: '',
    site: '',
    job_role: '',
    is_active: ''
  });

  const [sites, setSites] = useState<Site[]>([]); // New state for sites

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setSites(data.data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  useEffect(() => {
    if (showBulkEditModal) {
      fetchSites();
    }
  }, [showBulkEditModal]);

  // Form states
  const [newUser, setNewUser] = useState({
    login_id: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ['Worker'], // Default as array
    department: '',
    job_role: ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    job_role: ''
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

  // ✅ NEW: Fetch user assignments
  const fetchUserAssignments = async (userId: number) => {
    // Only fetch for Supervisors/Requesters
    const user = users.find(u => u.id === userId);
    if (!user || (user.role !== 'Requester' && user.role !== 'Supervisor')) {
      setUserAssignments({ sites: [], workers: [], loading: false });
      return;
    }

    setUserAssignments({ sites: [], workers: [], loading: true });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/requester-assignments/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserAssignments({
            sites: result.data.sites || [],
            workers: result.data.workers || [],
            loading: false
          });
        } else {
          setUserAssignments({ sites: [], workers: [], loading: false });
        }
      } else {
        setUserAssignments({ sites: [], workers: [], loading: false });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setUserAssignments({ sites: [], workers: [], loading: false });
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
          role: Array.isArray(newUser.role) ? newUser.role.join(',') : newUser.role, // Join array to string
          department: newUser.department,
          job_role: newUser.job_role
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
          role: [], // Changed to array
          department: '',
          job_role: ''
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
      role: user.role, // This will be "Role1, Role2" string from backend
      department: user.department_name || '',
      job_role: user.job_role || ''
    });
    setShowEditModal(true);
  };

  // Bulk Actions
  const handleSelectUser = (id: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (filteredList: User[]) => {
    if (selectedUsers.size === filteredList.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredList.map(u => u.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.size === 0) return;

    try {
      const updates: any = {};
      if (bulkUpdates.role) updates.role = bulkUpdates.role;
      if (bulkUpdates.department) updates.department = bulkUpdates.department;
      if (bulkUpdates.site) updates.site = bulkUpdates.site; // Add site to updates
      if (bulkUpdates.job_role) updates.job_role = bulkUpdates.job_role;
      if (bulkUpdates.is_active) updates.is_active = bulkUpdates.is_active === 'true';

      if (Object.keys(updates).length === 0) {
        alert('Please select at least one field to update');
        return;
      }

      const response = await fetch('/api/users/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          updates
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully updated ${selectedUsers.size} users`);
        setShowBulkEditModal(false);
        setSelectedUsers(new Set());
        setBulkUpdates({ role: '', department: '', site: '', job_role: '', is_active: '' }); // Fixed reset
        await fetchUsers(true);
      } else {
        alert(data.message || 'Failed to update users');
      }
    } catch (error) {
      console.error('Error updating users:', error);
      alert('Failed to update users');
    }
  };

  // ✅ UPDATED: Now fetches assignments when viewing user
  const handleViewUser = (user: User) => {
    // Find the latest user data from state to ensure we have fresh data
    const latestUser = users.find(u => u.id === user.id) || user;

    setViewingUser(latestUser);
    setShowViewModal(true);
    fetchUserAssignments(latestUser.id);
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
    const roles = role.split(',').map(r => r.trim());
    return roles.map(r => roleMap[r] || r).join(', ');
  };

  const getRoleBadgeColor = (role: string): string => {
    const roles = role.split(',').map(r => r.trim());
    // Prioritize highest privilege color
    if (roles.includes('Admin') || roles.includes('Administrator')) return 'bg-red-100 text-red-800 border-red-200';
    if (roles.includes('Requester') || roles.includes('Supervisor')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (roles.some(r => r.includes('Approver'))) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // ============================================
  // PROPER FILTERING LOGIC - FIXED FOR MULTI-ROLE
  // ============================================

  const hasRole = (user: User, roleToCheck: string) => {
    const roles = (user.role || '').split(',').map(r => r.trim());
    return roles.includes(roleToCheck);
  };

  const adminUsers = users.filter(u =>
    hasRole(u, 'Admin') || hasRole(u, 'Administrator')
  );

  const supervisorUsers = users.filter(u =>
    hasRole(u, 'Requester') || hasRole(u, 'Supervisor')
  );

  const workerUsers = users.filter(u =>
    hasRole(u, 'Worker')
  );

  const approverUsers = users.filter(u =>
    (u.role || '').includes('Approver') // Simple includes works for Approver check
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

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
                  className="mt-2 text-sm text-orange-600 hover:text-orange-800"
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
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={selectedUsers.has(user.id)}
            onChange={() => handleSelectUser(user.id)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full">
              <User className="w-5 h-5 text-orange-600" />
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
          {user.job_role && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <Briefcase className="w-3 h-3 mr-1" />
              {user.job_role}
            </div>
          )}
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
          <div className="text-sm text-gray-900">{user.site_name || '-'}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
          {/* View Button */}
          <button
            onClick={() => handleViewUser(user)}
            className="mr-3 text-green-600 hover:text-green-900"
            title="View user details"
          >
            <Eye className="w-4 h-4" />
          </button>

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

          {/* Assignment Button for Approvers */}
          {(user.role || '').includes('Approver') && (
            <button
              onClick={() => {
                setSelectedApprover(user);
                setShowSiteAssignment(true);
              }}
              className="mr-3 text-blue-600 hover:text-blue-900"
              title="Assign sites to approver"
            >
              <Building2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => openEditModal(user)}
            className="mr-3 text-orange-600 hover:text-orange-900"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDeleteUser(user)}
            disabled={user.permit_count !== undefined && user.permit_count > 0}
            className={`${user.permit_count && user.permit_count > 0
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
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage system users, roles, and permissions
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
        >
          <UserPlus className="w-5 h-5" />
          Create New User
        </button>
        <button
          onClick={() => setShowBulkImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-orange-700 bg-orange-100 border border-orange-200 rounded-lg hover:bg-orange-200"
        >
          <Building2 className="w-5 h-5" />
          Bulk Import
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
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          {/* ... existing tabs code will be maintained ... */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
              ? 'border-orange-600 text-orange-600 bg-orange-50'
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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'admins'
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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'supervisors'
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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'workers'
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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'approvers'
              ? 'border-orange-600 text-orange-600 bg-orange-50'
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
          <div className="flex items-center gap-2 px-4 py-2 mt-2 border border-orange-200 rounded-lg bg-orange-50">
            <span className="text-sm text-orange-700">
              Showing {filteredUsers.length} {activeTab === 'admins' ? 'administrator' : activeTab.slice(0, -1)}(s)
            </span>
            <button
              onClick={() => setActiveTab('all')}
              className="ml-auto text-sm font-medium text-orange-600 hover:text-orange-800"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-4 mb-6 text-orange-800 bg-orange-100 border border-orange-200 rounded-lg">
          <span className="font-medium">{selectedUsers.size} users selected</span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-orange-700 bg-white border border-orange-300 rounded hover:bg-orange-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowBulkEditModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Bulk Edit
            </button>
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 w-4">
                <input
                  type="checkbox"
                  checked={paginatedUsers.length > 0 && selectedUsers.size === paginatedUsers.length}
                  onChange={() => handleSelectAll(paginatedUsers)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">User</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Login ID</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Department</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Site</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-xs font-medium text-right text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {renderUserRows(paginatedUsers)}
          </tbody>
        </table>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Bulk Update Users</h2>
            <p className="mb-6 text-sm text-gray-600">
              Updating {selectedUsers.size} users. Only selected fields will be changed.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Role</label>
                <select
                  value={bulkUpdates.role}
                  onChange={(e) => setBulkUpdates({ ...bulkUpdates, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No Change</option>
                  <option value="Worker">Worker</option>
                  <option value="Requester">Supervisor</option>
                  <option value="Approver_Safety">Safety Officer</option>
                  <option value="Approver_AreaManager">Area Manager</option>
                  <option value="Approver_SiteLeader">Site Leader</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Department</label>
                <select
                  value={bulkUpdates.department}
                  onChange={(e) => setBulkUpdates({ ...bulkUpdates, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No Change</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Site Assignment</label>
                <select
                  value={bulkUpdates.site}
                  onChange={(e) => setBulkUpdates({ ...bulkUpdates, site: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No Change</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.name}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Job Role</label>
                <select
                  value={bulkUpdates.job_role}
                  onChange={(e) => setBulkUpdates({ ...bulkUpdates, job_role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No Change</option>
                  {JOB_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                <select
                  value={bulkUpdates.is_active}
                  onChange={(e) => setBulkUpdates({ ...bulkUpdates, is_active: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No Change</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                Update Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border border-t-0 border-gray-200 rounded-b-lg sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min(filteredUsers.length, startIndex + 1)}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
              <span className="font-medium">{filteredUsers.length}</span> results
            </p>
          </div>
          <div>
            <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 text-gray-400 rounded-l-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show a window of pages around current page
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (pageNum > totalPages) {
                    pageNum = totalPages - 4 + i;
                  }
                }

                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                      ? 'z-10 bg-orange-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 text-gray-400 rounded-r-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
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
                    onChange={(e) => setNewUser({ ...newUser, login_id: e.target.value })}
                    placeholder="username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="Gaurav Shukla"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Job Role Dropdown */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Job Role
              </label>
              <select
                value={newUser.job_role}
                onChange={(e) => setNewUser({ ...newUser, job_role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Job Role</option>
                {JOB_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Roles (Ctrl+Click to select multiple) <span className="text-red-500">*</span>
                </label>
                <select
                  multiple
                  value={Array.isArray(newUser.role) ? newUser.role : []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setNewUser({ ...newUser, role: selected });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 h-32"
                >
                  <option value="Worker">Worker</option>
                  <option value="Requester">Supervisor</option>
                  <option value="Approver_Safety">Safety Officer</option>
                  <option value="Approver_AreaManager">Area Manager</option>
                  <option value="Approver_SiteLeader">Site Leader</option>
                  <option value="Admin">Administrator</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles.</p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
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
                className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                Create User
              </button>
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
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Roles (Ctrl+Click to select multiple) <span className="text-red-500">*</span>
                  </label>
                  <select
                    multiple
                    value={
                      Array.isArray(editFormData.role)
                        ? editFormData.role
                        : (typeof editFormData.role === 'string' ? (editFormData.role as string || '').split(',').map((r: string) => r.trim()) : [])
                    }
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      // Store as comma-separated string for edit form compatible with backend
                      setEditFormData({ ...editFormData, role: selected.join(',') });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 h-32"
                  >
                    <option value="Worker">Worker</option>
                    <option value="Requester">Supervisor</option>
                    <option value="Approver_Safety">Safety Officer</option>
                    <option value="Approver_AreaManager">Area Manager</option>
                    <option value="Approver_SiteLeader">Site Leader</option>
                    <option value="Admin">Administrator</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple roles.</p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
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
                  className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Assignment Modal */}
      {
        showAssignModal && assigningUser && (
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
        )
      }

      {/* ✅ ENHANCED VIEW USER MODAL - WITH ASSIGNMENTS */}
      {
        showViewModal && viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-3xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
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
                    <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full">
                      <User className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{viewingUser.full_name}</h4>
                      <p className="text-sm text-gray-600">{getRoleDisplay(viewingUser.role)}</p>
                    </div>
                  </div>
                </div>

                {/* Basic Details Grid */}
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
                    <label className="block text-sm font-medium text-gray-700">Site Assignment</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingUser.site_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Role</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingUser.job_role || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${viewingUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {viewingUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(viewingUser.created_at).toLocaleDateString()}
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

                {/* ✅ NEW: Assignments Section (for Supervisors/Requesters) */}
                {(viewingUser.role === 'Requester' || viewingUser.role === 'Supervisor') && (
                  <div className="pt-4 border-t">
                    {userAssignments.loading ? (
                      <div className="p-4 text-center rounded-lg bg-gray-50">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 text-orange-600 animate-spin" />
                        <p className="text-sm text-gray-600">Loading assignments...</p>
                      </div>
                    ) : (userAssignments.sites.length > 0 || userAssignments.workers.length > 0) ? (
                      <div className="space-y-4">
                        {/* Assigned Sites */}
                        {userAssignments.sites.length > 0 && (
                          <div>
                            <h5 className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-900">
                              <Building2 className="w-4 h-4 text-orange-600" />
                              Assigned Sites ({userAssignments.sites.length})
                            </h5>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {userAssignments.sites.map((site: any) => (
                                <div
                                  key={site.assignment_id}
                                  className="p-3 border border-gray-200 rounded-lg bg-orange-50"
                                >
                                  <p className="text-sm font-medium text-gray-900">{site.name}</p>
                                  <p className="text-xs text-gray-600">Code: {site.site_code}</p>
                                  {site.location && (
                                    <p className="mt-1 text-xs text-gray-500">{site.location}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assigned Workers */}
                        {userAssignments.workers.length > 0 && (
                          <div>
                            <h5 className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-900">
                              <User className="w-4 h-4 text-green-600" />
                              Assigned Workers ({userAssignments.workers.length})
                            </h5>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {userAssignments.workers.map((worker: any) => (
                                <div
                                  key={worker.assignment_id}
                                  className="p-3 border border-gray-200 rounded-lg bg-green-50"
                                >
                                  <p className="text-sm font-medium text-gray-900">{worker.full_name}</p>
                                  <p className="text-xs text-gray-600">{worker.email}</p>
                                  <p className="text-xs text-gray-500">ID: {worker.login_id}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">No sites or workers assigned</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewingUser);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
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
        )
      }

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={() => {
            setShowBulkImportModal(false);
            fetchUsers(true);
          }}
        />
      )}

      {/* Site Assignment Modal for Approvers */}
      {
        showSiteAssignment && selectedApprover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Assign Sites to {selectedApprover.full_name}
                </h2>
                <button
                  onClick={() => {
                    setShowSiteAssignment(false);
                    setSelectedApprover(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Select sites where this approver will be available for permit approvals
              </p>

              <SiteAssignmentContent
                approverId={selectedApprover.id}
                approverRole={selectedApprover.role}
                onClose={() => {
                  setShowSiteAssignment(false);
                  setSelectedApprover(null);
                }}
                onSuccess={() => {
                  fetchUsers(true);
                }}
              />
            </div>
          </div>
        )
      }
    </div >
  );
}

// Site Assignment Content Component
function SiteAssignmentContent({
  approverId,
  approverRole,
  onClose,
  onSuccess
}: {
  approverId: number;
  approverRole: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [approverId]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load all sites
      const sitesResponse = await fetch('/api/sites', { headers });
      const sitesData = await sitesResponse.json();

      if (sitesData.success) {
        setSites(sitesData.data || []);
      }

      // Load approver's current site assignments
      const assignedResponse = await fetch(`/api/approvers/${approverId}/sites`, { headers });
      const assignedData = await assignedResponse.json();

      if (assignedData.success && assignedData.data) {
        setSelectedSites(assignedData.data.map((s: any) => s.site_id));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSite = (siteId: number) => {
    setSelectedSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`/api/approvers/${approverId}/assign-sites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site_ids: selectedSites,
          approver_role: approverRole
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Sites assigned successfully!');
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to assign sites');
      }
    } catch (error) {
      console.error('Error assigning sites:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {sites.length === 0 ? (
        <p className="py-8 text-center text-gray-500">
          No sites available. Please add sites first.
        </p>
      ) : (
        <div className="space-y-2 mb-6">
          {sites.map((site) => (
            <label
              key={site.id}
              className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedSites.includes(site.id)}
                onChange={() => handleToggleSite(site.id)}
                className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{site.name}</div>
                <div className="text-sm text-gray-600">
                  Code: {site.site_code} • {site.location}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
        <p className="text-sm text-blue-900">
          <strong>Selected sites: {selectedSites.length}</strong>
          <br />
          This approver will appear in the approval workflow for permits created at these sites.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Assignment'
          )}
        </button>
      </div>
    </div>
  );
}