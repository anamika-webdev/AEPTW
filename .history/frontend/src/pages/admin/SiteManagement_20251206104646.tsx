// frontend/src/pages/admin/SiteManagement.tsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, MapPin, RefreshCw, Building, AlertCircle, Eye } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
interface Site {
  id: number;
  site_code: string;
  name: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active: boolean;
  permit_count?: number;
  created_at?: string;
}

export default function SiteManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
const [showViewModal, setShowViewModal] = useState(false);
const [viewingSite, setViewingSite] = useState<Site | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newSite, setNewSite] = useState({
    site_code: '',
    name: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: 'India'
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: 'India'
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchSites = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized - Please log in again');
        }
        throw new Error('Failed to fetch sites');
      }

      const result = await response.json();
      console.log('📍 Sites data:', result);

      // Handle different response formats
      const sitesData = result.data || result.sites || [];
      
      // Get permit counts for each site
      const sitesWithCounts = await Promise.all(
        sitesData.map(async (site: Site) => {
          try {
            const countRes = await fetch(`${API_BASE_URL}/permits?site_id=${site.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (countRes.ok) {
              const permits = await countRes.json();
              const permitList = permits.data || permits.permits || [];
              return { ...site, permit_count: permitList.length };
            }
          } catch (err) {
            console.error('Error fetching permit count:', err);
          }
          return { ...site, permit_count: 0 };
        })
      );

      setSites(sitesWithCounts);
      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('❌ Error fetching sites:', error);
      setError(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const generateSiteCode = (name: string): string => {
    // Generate site code from name (e.g., "Building A" -> "BLD-A-001")
    const prefix = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}`;
  };

  const handleAddSite = async () => {
    if (!newSite.name || !newSite.location) {
      alert('Please fill in Site Name and Location (required fields)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Auto-generate site_code if not provided
      const site_code = newSite.site_code || generateSiteCode(newSite.name);

      const siteData = {
        site_code,
        name: newSite.name,
        location: newSite.location,
        address: newSite.address || null,
        city: newSite.city || null,
        state: newSite.state || null,
        country: newSite.country || 'India'
      };

      console.log('📤 Creating site:', siteData);

      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(siteData)
      });

      const result = await response.json();
      console.log('📥 Create response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add site');
      }

      alert('Site added successfully!');
      setShowAddModal(false);
      setNewSite({
        site_code: '',
        name: '',
        location: '',
        address: '',
        city: '',
        state: '',
        country: 'India'
      });
      await fetchSites(true);
    } catch (error: any) {
      console.error('❌ Error adding site:', error);
      alert(error.message || 'Failed to add site');
    }
  };

  const handleEditSite = async () => {
    if (!editingSite) return;

    if (!editFormData.name || !editFormData.location) {
      alert('Please fill in Site Name and Location (required fields)');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const siteData = {
        name: editFormData.name,
        location: editFormData.location,
        address: editFormData.address || null,
        city: editFormData.city || null,
        state: editFormData.state || null,
        country: editFormData.country || 'India'
      };

      console.log('📤 Updating site:', siteData);

      const response = await fetch(`${API_BASE_URL}/sites/${editingSite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(siteData)
      });

      const result = await response.json();
      console.log('📥 Update response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update site');
      }

      alert('Site updated successfully!');
      setShowEditModal(false);
      setEditingSite(null);
      setEditFormData({
        name: '',
        location: '',
        address: '',
        city: '',
        state: '',
        country: 'India'
      });
      await fetchSites(true);
    } catch (error: any) {
      console.error('❌ Error updating site:', error);
      alert(error.message || 'Failed to update site');
    }
  };

  const handleDeleteSite = async (site: Site) => {
    if (site.permit_count && site.permit_count > 0) {
      alert(`Cannot delete site "${site.name}" - it has ${site.permit_count} existing permit(s). Please close or cancel all permits first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${site.name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sites/${site.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete site');
      }

      alert('Site deleted successfully!');
      await fetchSites(true);
    } catch (error: any) {
      console.error('❌ Error deleting site:', error);
      alert(error.message || 'Failed to delete site');
    }
  };

const handleViewSite = (site: Site) => {
  setViewingSite(site);
  setShowViewModal(true);
};
  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setEditFormData({
      name: site.name,
      location: site.location || '',
      address: site.address || '',
      city: site.city || '',
      state: site.state || '',
      country: site.country || 'India'
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading sites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Failed to Load Sites</h3>
          <p className="mb-4 text-sm text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchSites();
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
            <h1 className="text-3xl font-bold text-gray-900">Site Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all work sites and locations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchSites(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Site
            </button>
          </div>
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.length > 0 ? (
            sites.map((site) => (
              <div key={site.id} className="p-6 transition-shadow bg-white rounded-lg shadow-md hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                    </div>
                    <p className="mb-2 text-xs text-gray-500">Code: {site.site_code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    site.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {site.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{site.location || 'No location specified'}</p>
                      {site.address && (
                        <p className="mt-1 text-xs text-gray-500">{site.address}</p>
                      )}
                      {(site.city || site.state) && (
                        <p className="mt-1 text-xs text-gray-500">
                          {[site.city, site.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {site.permit_count !== undefined && (
                  <div className="p-2 mb-4 rounded bg-blue-50">
                    <p className="text-xs text-blue-800">
                      {site.permit_count} active permit{site.permit_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                    {/* ✅ ADD THIS VIEW BUTTON FIRST: */}
  <button
    onClick={() => handleViewSite(site)}
    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded hover:bg-green-100"
  >
    <Eye className="w-4 h-4" />
    View
  </button>

                  <button
                    onClick={() => openEditModal(site)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSite(site)}
                    disabled={site.permit_count !== undefined && site.permit_count > 0}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded ${
                      site.permit_count && site.permit_count > 0
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-red-600 bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center col-span-full">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-4 text-gray-500">No sites found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                + Add your first site
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 p-6 bg-white border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Site</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Site Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSite.name}
                    onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                    placeholder="e.g., Building A, Warehouse 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Site Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSite.site_code}
                    onChange={(e) => setNewSite({...newSite, site_code: e.target.value})}
                    placeholder="Auto-generated if empty"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty to auto-generate</p>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSite.location}
                  onChange={(e) => setNewSite({...newSite, location: e.target.value})}
                  placeholder="e.g., North Wing, Ground Floor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  value={newSite.address}
                  onChange={(e) => setNewSite({...newSite, address: e.target.value})}
                  placeholder="Full address"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={newSite.city}
                    onChange={(e) => setNewSite({...newSite, city: e.target.value})}
                    placeholder="City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={newSite.state}
                    onChange={(e) => setNewSite({...newSite, state: e.target.value})}
                    placeholder="State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={newSite.country}
                    onChange={(e) => setNewSite({...newSite, country: e.target.value})}
                    placeholder="Country"
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
                  onClick={handleAddSite}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Add Site
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {showEditModal && editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 p-6 bg-white border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Site</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                <strong>Code:</strong> {editingSite.site_code}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editingSite.permit_count !== undefined && editingSite.permit_count > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This site has {editingSite.permit_count} active permit{editingSite.permit_count !== 1 ? 's' : ''}.
                    Changes will affect existing permits.
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
                  onClick={handleEditSite}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ✅ ADD THIS ENTIRE VIEW MODAL: */}
      {showViewModal && viewingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Site Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{viewingSite.name}</h4>
                    <p className="text-sm text-gray-600">{viewingSite.site_code}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingSite.location || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingSite.address || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingSite.city || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingSite.state || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingSite.country || 'India'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${
                    viewingSite.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingSite.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {viewingSite.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(viewingSite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {viewingSite.permit_count !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Active Permits</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingSite.permit_count} permit{viewingSite.permit_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
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
    </div>
  );
}