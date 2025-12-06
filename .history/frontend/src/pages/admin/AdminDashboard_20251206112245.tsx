import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Building2, FileText, BarChart } from 'lucide-react';
import Pagination from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';

// StatCard Component
const StatCard = ({ title, value, color }) => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  </div>
);

// User Management Component with Pagination
const UserManagement = ({ users, userType, onEdit, onDelete, onAdd, title }) => {
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

// Site Management Component with Pagination
const SiteManagement = ({ sites, onEdit, onDelete, onAdd }) => {
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

// User Edit Modal (simplified for this example)
const UserEditModal = ({ user, userType, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    user || {
      user_id: '',
      name: '',
      email: '',
      password: '',
      contact: '',
      user_type: userType || 'supervisor',
      domain: '',
      location: '',
      city: '',
      state: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
        <h2 className="mb-4 text-xl font-semibold">
          {user ? 'Edit User' : 'Add New User'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">User ID</label>
              <input
                type="text"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={!!user}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                {user ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required={!user}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Contact</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Domain</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Site Edit Modal (simplified for this example)
const SiteEditModal = ({ site, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    site || {
      site_id: '',
      site_name: '',
      location: '',
      latitude: '',
      longitude: '',
      city: '',
      state: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
        <h2 className="mb-4 text-xl font-semibold">
          {site ? 'Edit Site' : 'Add New Site'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Site ID</label>
              <input
                type="text"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={!!site}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Site Name</label>
              <input
                type="text"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block mb-1 text-sm font-medium">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Latitude</label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Longitude</label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {site ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('supervisors');
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadSites(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSites = async () => {
    try {
      const data = await api.getSites();
      setSites(data);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // User CRUD operations
  const handleAddUser = async (userData) => {
    try {
      await api.createUser(userData);
      setShowAddUser(false);
      await loadUsers();
      await loadStats();
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await api.updateUser(editingUser.id, userData);
      setEditingUser(null);
      await loadUsers();
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await api.deleteUser(userId);
        await loadUsers();
        await loadStats();
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. User may have active tasks.');
      }
    }
  };

  // Site CRUD operations
  const handleAddSite = async (siteData) => {
    try {
      await api.createSite(siteData);
      setShowAddSite(false);
      await loadSites();
      await loadStats();
      alert('Site created successfully!');
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Failed to create site');
    }
  };

  const handleUpdateSite = async (siteData) => {
    try {
      await api.updateSite(editingSite.id, siteData);
      setEditingSite(null);
      await loadSites();
      alert('Site updated successfully!');
    } catch (error) {
      console.error('Error updating site:', error);
      alert('Failed to update site');
    }
  };

  const handleDeleteSite = async (siteId, siteName) => {
    if (window.confirm(`Are you sure you want to delete site "${siteName}"? This action cannot be undone.`)) {
      try {
        await api.deleteSite(siteId);
        await loadSites();
        await loadStats();
        alert('Site deleted successfully!');
      } catch (error) {
        console.error('Error deleting site:', error);
        alert('Failed to delete site. Site may have active tasks.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-32 h-32 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.totalUsers} color="text-blue-600" />
          <StatCard title="Total Sites" value={stats.totalSites} color="text-green-600" />
          <StatCard title="Active Tasks" value={stats.activeTasks} color="text-yellow-600" />
          <StatCard title="Completed Tasks" value={stats.completedTasks} color="text-purple-600" />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex">
            {['supervisors', 'workers', 'sites'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
                <span className="px-2 py-1 ml-2 text-xs text-gray-700 bg-gray-200 rounded-full">
                  {tab === 'sites' 
                    ? sites.length 
                    : users.filter(user => user.user_type === tab.slice(0, -1)).length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'supervisors' && (
            <UserManagement
              users={users.filter(user => user.user_type === 'supervisor')}
              userType="supervisor"
              onEdit={setEditingUser}
              onDelete={handleDeleteUser}
              onAdd={() => setShowAddUser(true)}
              title="Supervisors"
            />
          )}

          {activeTab === 'workers' && (
            <UserManagement
              users={users.filter(user => user.user_type === 'worker')}
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

      {/* Modals */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {showAddUser && (
        <UserEditModal
          user={null}
          userType={activeTab.slice(0, -1)}
          onSave={handleAddUser}
          onClose={() => setShowAddUser(false)}
        />
      )}

      {editingSite && (
        <SiteEditModal
          site={editingSite}
          onSave={handleUpdateSite}
          onClose={() => setEditingSite(null)}
        />
      )}

      {showAddSite && (
        <SiteEditModal
          site={null}
          onSave={handleAddSite}
          onClose={() => setShowAddSite(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;