// frontend/src/components/admin/AssignResourcesModal.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { X, Building2, Users, Check, Loader2 } from 'lucide-react';
import type { User } from '../../types';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';

interface AssignResourcesModalProps {
  requester: User;
  onClose: () => void;
  onSuccess: () => void;
}

interface SiteData {
  id: number;
  site_code: string;
  name: string;
  location?: string;
}

interface WorkerData {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department_name?: string;
}



export function AssignResourcesModal({ requester, onClose, onSuccess }: AssignResourcesModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'sites' | 'workers'>('sites');

  // Available resources
  const [availableSites, setAvailableSites] = useState<SiteData[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerData[]>([]);

  // Selected IDs
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // Added search query state

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available sites
      const sitesRes = await fetch('/api/requester-assignments/available/sites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const sitesData = await sitesRes.json();
      if (sitesData.success) {
        setAvailableSites(sitesData.data);
      }

      // Fetch available workers
      const workersRes = await fetch('/api/requester-assignments/available/workers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const workersData = await workersRes.json();
      if (workersData.success) {
        setAvailableWorkers(workersData.data);
      }

      // Fetch current assignments
      const assignmentsRes = await fetch(`/api/requester-assignments/${requester.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const assignmentsData = await assignmentsRes.json();
      if (assignmentsData.success) {
        // Set initially selected IDs
        setSelectedSiteIds(assignmentsData.data.sites.map((s: any) => s.id));
        setSelectedWorkerIds(assignmentsData.data.workers.map((w: any) => w.id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSites = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/requester-assignments/${requester.id}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ site_ids: selectedSiteIds })
      });

      const data = await response.json();

      if (data.success) {
        alert('Sites assigned successfully!');
        onSuccess();
      } else {
        alert(data.message || 'Failed to assign sites');
      }
    } catch (error) {
      console.error('Error assigning sites:', error);
      alert('Failed to assign sites');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkers = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/requester-assignments/${requester.id}/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ worker_ids: selectedWorkerIds })
      });

      const data = await response.json();

      if (data.success) {
        alert('Workers assigned successfully!');
        onSuccess();
      } else {
        alert(data.message || 'Failed to assign workers');
      }
    } catch (error) {
      console.error('Error assigning workers:', error);
      alert('Failed to assign workers');
    } finally {
      setSaving(false);
    }
  };

  const toggleSite = (siteId: number) => {
    setSelectedSiteIds(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const toggleWorker = (workerId: number) => {
    setSelectedWorkerIds(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const getRoleDisplay = (role: string): string => {
    if (role.includes('Approver')) return 'Approver';
    const roleMap: Record<string, string> = {
      'Requester': 'Supervisor',
      'Supervisor': 'Supervisor',
      'Worker': 'Worker'
    };
    return roleMap[role] || role;
  };

  const filteredSites = availableSites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.site_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkers = availableWorkers.filter(worker =>
    worker.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.login_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Resources to {getRoleDisplay(requester.role)}
            </h2>
            <p className="text-sm text-gray-600">{requester.full_name} ({requester.login_id})</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'sites'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Building2 className="inline-block w-4 h-4 mr-2" />
            Sites ({selectedSiteIds.length})
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'workers'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Users className="inline-block w-4 h-4 mr-2" />
            Workers ({selectedWorkerIds.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'sites' ? 'sites' : 'workers'}...`}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Sites Tab */}
              {activeTab === 'sites' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Select which sites this {getRoleDisplay(requester.role).toLowerCase()} can access.
                    They will only be able to create permits for their assigned sites.
                  </p>
                  {filteredSites.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">
                      {searchQuery ? 'No sites match your search' : 'No sites available. Please create sites first in the Sites Management section.'}
                    </p>
                  ) : (
                    filteredSites.map(site => (
                      <label
                        key={site.id}
                        className="flex items-start gap-3 p-4 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedSiteIds.includes(site.id)}
                          onCheckedChange={() => toggleSite(site.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{site.name}</p>
                          <p className="text-sm text-gray-600">
                            Code: {site.site_code}
                            {site.location && ` • ${site.location}`}
                          </p>
                        </div>
                        {selectedSiteIds.includes(site.id) && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </label>
                    ))
                  )}
                </div>
              )}

              {/* Workers Tab */}
              {activeTab === 'workers' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Select which workers this {getRoleDisplay(requester.role).toLowerCase()} can assign to permits.
                    They will only see their assigned workers when creating permits.
                  </p>
                  {filteredWorkers.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">
                      {searchQuery ? 'No workers match your search' : 'No workers available. Please create worker accounts first in the User Management section.'}
                    </p>
                  ) : (
                    filteredWorkers.map(worker => (
                      <label
                        key={worker.id}
                        className="flex items-start gap-3 p-4 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedWorkerIds.includes(worker.id)}
                          onCheckedChange={() => toggleWorker(worker.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{worker.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {worker.email} • {worker.login_id}
                            {worker.department_name && ` • ${worker.department_name}`}
                          </p>
                        </div>
                        {selectedWorkerIds.includes(worker.id) && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </label>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {activeTab === 'sites' && `${selectedSiteIds.length} site(s) selected`}
            {activeTab === 'workers' && `${selectedWorkerIds.length} worker(s) selected`}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={activeTab === 'sites' ? handleSaveSites : handleSaveWorkers}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                `Save ${activeTab === 'sites' ? 'Sites' : 'Workers'}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}