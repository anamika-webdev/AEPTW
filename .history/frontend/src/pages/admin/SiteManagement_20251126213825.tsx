// frontend/src/pages/admin/SiteManagement.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, MapPin } from 'lucide-react';

interface Site {
  id: number;
  name: string;
  location: string;
  area: string;
  status: 'active' | 'inactive';
}

export default function SiteManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    location: '',
    area: '',
  });

  const [sites, setSites] = useState<Site[]>([
    { id: 1, name: 'Mumbai Data Center', location: 'Bandra Kurla Complex, Mumbai', area: '5000 sqm', status: 'active' },
    { id: 2, name: 'Bangalore Tech Park', location: 'Whitefield, Bangalore', area: '3500 sqm', status: 'active' },
    { id: 3, name: 'Delhi Telecom Hub', location: 'Connaught Place, New Delhi', area: '4200 sqm', status: 'active' },
    { id: 4, name: 'Hyderabad IT Campus', location: 'HITEC City, Hyderabad', area: '6000 sqm', status: 'inactive' },
  ]);

  const handleAddSite = () => {
    if (!newSite.name || !newSite.location || !newSite.area) {
      alert('Please fill in all required fields');
      return;
    }

    const site: Site = {
      id: sites.length + 1,
      name: newSite.name,
      location: newSite.location,
      area: newSite.area,
      status: 'active',
    };

    setSites([...sites, site]);
    setShowAddModal(false);
    setNewSite({ name: '', location: '', area: '' });
  };

  const handleDeleteSite = (id: number) => {
    if (confirm('Are you sure you want to delete this site?')) {
      setSites(sites.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage all work sites and locations
            </p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        </div>

        {/* Site Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-2 font-semibold text-gray-900">{site.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                      site.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {site.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span>{site.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>{site.area}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteSite(site.id)}
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sites.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No sites found</p>
          </div>
        )}
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
                <label className="block mb-2 text-sm font-medium text-gray-700">Site Name</label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                  placeholder="e.g., Pune Tech Center"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newSite.location}
                  onChange={(e) => setNewSite({...newSite, location: e.target.value})}
                  placeholder="e.g., North District"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Area</label>
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
    </div>
  );
}