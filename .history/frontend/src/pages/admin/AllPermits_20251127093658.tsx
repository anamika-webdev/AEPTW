// frontend/src/pages/admin/AllPermits.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, RefreshCw, Search, Eye, Activity } from 'lucide-react';

interface Permit {
  id: number;
  number: string;
  category: string;
  site: string;
  location: string;
  workDescription: string;
  issuer: string;
  startDate: string;
  endDate: string;
  createdDate: string;
  status: string;
}

export default function AllPermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Filters
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Site options (dynamic from DB)
  const [sites, setSites] = useState<string[]>([]);

  const fetchPermits = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filterSite !== 'all') params.append('site', filterSite);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await fetch(`/api/admin/permits?${params.toString()}`, {
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
        throw new Error('Failed to fetch permits');
      }

      const data = await response.json();
      setPermits(data.permits);
      
      // Extract unique sites for filter dropdown - FIXED TypeScript error
      const uniqueSites: string[] = Array.from(
        new Set(data.permits.map((p: Permit) => p.site))
      ) as string[];
      setSites(uniqueSites);
      
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching permits:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPermits();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchPermits(), 30000);

    return () => clearInterval(interval);
  }, [filterSite, filterStatus, filterCategory]);

  const getCategoryBadge = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Height': 'bg-purple-100 text-purple-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'Hot_Work': 'bg-red-100 text-red-800',
      'Confined_Space': 'bg-orange-100 text-orange-800',
      'General': 'bg-blue-100 text-blue-800',
    };
    return categoryMap[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { className: string; label: string } } = {
      'Draft': { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'Pending_Approval': { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'Active': { className: 'bg-green-100 text-green-800', label: 'Active' },
      'Extension_Requested': { className: 'bg-blue-100 text-blue-800', label: 'Extension' },
      'Suspended': { className: 'bg-red-100 text-red-800', label: 'Suspended' },
      'Closed': { className: 'bg-purple-100 text-purple-800', label: 'Closed' },
      'Cancelled': { className: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      'Rejected': { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    return statusMap[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  };

  const filteredPermits = permits.filter(permit => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      permit.number.toLowerCase().includes(search) ||
      permit.workDescription.toLowerCase().includes(search) ||
      permit.issuer.toLowerCase().includes(search) ||
      permit.site.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading permits...</p>
          <p className="text-sm text-gray-500">Fetching data from database</p>
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
            <h1 className="text-3xl font-bold text-gray-900">All Permits</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and monitor all permit-to-work requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>Live updates</span>
            </div>
            <button
              onClick={() => fetchPermits(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className="text-xs text-gray-500">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  <Search className="inline w-4 h-4 mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by PTW number, description, issuer..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Site Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  <Filter className="inline w-4 h-4 mr-1" />
                  Site
                </label>
                <select
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sites</option>
                  {sites.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending_Approval">Pending Approval</option>
                  <option value="Active">Active</option>
                  <option value="Extension_Requested">Extension Requested</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="General">General</option>
                  <option value="Height">Height</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Hot_Work">Hot Work</option>
                  <option value="Confined_Space">Confined Space</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-sm font-medium text-gray-600">
                Showing {filteredPermits.length} permit{filteredPermits.length !== 1 ? 's' : ''}
                {(filterSite !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilterSite('all');
                      setFilterStatus('all');
                      setFilterCategory('all');
                      setSearchTerm('');
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Permits Table */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      PTW Number
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Site & Location
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Work Description
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Issuer
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPermits.length > 0 ? (
                    filteredPermits.map((permit) => {
                      const statusInfo = getStatusBadge(permit.status);
                      return (
                        <tr 
                          key={permit.id}
                          className="transition-colors cursor-pointer hover:bg-gray-50"
                          onClick={() => window.location.href = `/admin/permits/${permit.id}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{permit.number}</div>
                            <div className="text-xs text-gray-500">{permit.createdDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(permit.category)}`}>
                              {permit.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{permit.site}</div>
                            <div className="text-xs text-gray-500">{permit.location}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs text-sm text-gray-900 truncate">
                              {permit.workDescription}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{permit.issuer}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{permit.startDate}</div>
                            <div className="text-xs text-gray-500">to {permit.endDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                              <span className="mr-1">•</span>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/admin/permits/${permit.id}`;
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Filter className="w-12 h-12 mb-2 text-gray-400" />
                          <p className="text-gray-500">No permits found</p>
                          <p className="text-sm text-gray-400">
                            Try adjusting your filters or search term
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}