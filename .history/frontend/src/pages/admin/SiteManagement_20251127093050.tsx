// frontend/src/pages/admin/SiteManagement.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, MapPin, RefreshCw, Activity, Building } from 'lucide-react';

interface Site {
  id: number;
  site_code: string;
  name: string;
  location: string;
  area?: string;
  status: 'active' | 'inactive';
  permit_count?: number;
}

export default function SiteManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [newSite, setNewSite] = useState({
    name: '',
    location: '',
    area: '',
  });

  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
  });

  const fetchSites = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/sites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch sites');
      }

      const data = await response.json();
      setSites(data.sites);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSites();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchSites(), 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAddSite = async () => {
    if (!newSite.name || !newSite.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSite)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add site');
      }

      await fetchSites(true);
      setShowAddModal(false);
      setNewSite({ name: '', location: '', area: '' });
    } catch (error: any) {
      console.error('Error adding site:', error);
      alert(error.message || 'Failed to add site');
    }
  };

  const handleEditSite = async () => {
    if (!editingSite) return;

    if (!editFormData.name || !editFormData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/sites/${editingSite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update site');
      }

      await fetchSites(true);
      setShowEditModal(false);
      setEditingSite(null);
      setEditFormData({ name: '', location: '' });
    } catch (error: any) {
      console.error('Error updating site:', error);
      alert(error.message || 'Failed to update site');
    }
  };

  const handleDeleteSite = async (id: number, permitCount: number = 0) => {
    if (permitCount > 0) {
      alert(`Cannot delete site with ${permitCount} existing permit(s). Please close or cancel all permits first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/sites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete site');
      }

      await fetchSites(true);
    } catch (error: any) {
      console.error('Error deleting site:', error);
      alert(error.message || 'Failed to delete site');
    }
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setEditFormData({
      name: site.name,
      location: site.location,
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading sites...</p>
          <p className="text-sm text-gray-500">Fetching from database</p>
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
            <p className="mt-2 text-sm text-gray-600">
              Manage all work sites and locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>Live updates</span>
            </div>
            <button
              onClick={() => fetchSites(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className="text-xs text-gray-500">
              {lastUpdated.toLocaleTimeString()}
            </span>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </div>
        </div>

        {/* Site Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.length > 0 ? (
            sites.map((site) => (
              <Card key={site.id} className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full shrink-0">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 font-semibold text-gray-900">{site.name}</h3>
                      <p className="mb-2 text-xs text-gray-500">Code: {site.site_code}</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                          site.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {site.status}
                        </span>
                        {site.permit_count !== undefined && site.permit_count > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                            {site.permit_count} permit{site.permit_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                      <span>{site.location}</span>
                    </div>
                    
                    {site.area && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4 shrink-0" />
                        <span>{site.area}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditModal(site)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteSite(site.id, site.permit_count)}
                      className={`flex-1 ${
                        site.permit_count && site.permit_count > 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                      disabled={site.permit_count !== undefined && site.permit_count > 0}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center col-span-full">
              <Building className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No sites found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                + Add your first site
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Site</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                  placeholder="e.g., Pune Tech Center"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSite.location}
                  onChange={(e) => setNewSite({...newSite, location: e.target.value})}
                  placeholder="e.g., North District, City Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Area (Optional)</label>
                <input
                  type="text"
                  value={newSite.area}
                  onChange={(e) => setNewSite({...newSite, area: e.target.value})}
                  placeholder="e.g., 5000 sqm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSite} className="bg-blue-600 hover:bg-blue-700">
                  Add Site
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {showEditModal && editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Site</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 mb-4 rounded-lg bg-blue-50">
              <p className="text-sm text-blue-800">
                <strong>Site Code:</strong> {editingSite.site_code}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {editingSite.permit_count !== undefined && editingSite.permit_count > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This site has {editingSite.permit_count} active permit{editingSite.permit_count !== 1 ? 's' : ''}.
                    Changes will affect existing permits.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditSite}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}