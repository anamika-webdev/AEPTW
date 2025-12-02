// frontend/src/pages/admin/AllPermits.tsx - FIXED
import { useEffect, useState } from 'react';
import { Filter, RefreshCw, Search, Eye, FileText } from 'lucide-react';
import ExportPermitsButton from '../../components/common/ExportPermitsButton';

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
  created_by_name?: string;
  site_name?: string;
}

export default function AllPermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchPermits = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/permits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized - Please log in again');
        }
        throw new Error('Failed to fetch permits');
      }

      const result = await response.json();
      console.log('📊 Permits data:', result);

      if (result.success && result.data) {
        setPermits(result.data);
      } else {
        throw new Error('Invalid response format');
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('❌ Error fetching permits:', error);
      setError(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPermits();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      'Draft': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'Pending_Approval': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'Active': { bg: 'bg-green-100', text: 'text-green-800' },
      'Extension_Requested': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Suspended': { bg: 'bg-red-100', text: 'text-red-800' },
      'Closed': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'Cancelled': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const config = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    const label = status.replace(/_/g, ' ');

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {label}
      </span>
    );
  };

  // Filter permits
  const filteredPermits = permits.filter(permit => {
    if (filterStatus !== 'all' && permit.status !== filterStatus) return false;
    if (filterType !== 'all' && permit.permit_type !== filterType) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        permit.permit_serial.toLowerCase().includes(search) ||
        permit.work_location.toLowerCase().includes(search) ||
        permit.work_description.toLowerCase().includes(search) ||
        (permit.created_by_name && permit.created_by_name.toLowerCase().includes(search))
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading permits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Failed to Load Permits</h3>
          <p className="mb-4 text-sm text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchPermits();
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
            <h1 className="text-3xl font-bold text-gray-900">All Permits</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage all permit-to-work documents
            </p>
          </div>
          <div className="flex gap-3">
            <ExportPermitsButton 
             permits={filteredPermits}  
              fileName="All_Permits"
               variant="secondary"
             />
           <button
            onClick={() => fetchPermits(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          </div>
         </div>      
        

        {/* Filters */}
        <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search by PTW number, location, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
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

            {/* Type Filter */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="General">General</option>
                <option value="Height">Height Work</option>
                <option value="Electrical">Electrical</option>
                <option value="Hot_Work">Hot Work</option>
                <option value="Confined_Space">Confined Space</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-sm font-medium text-gray-600">
              Showing {filteredPermits.length} of {permits.length} permits
              {(filterStatus !== 'all' || filterType !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterType('all');
                    setSearchTerm('');
                  }}
                  className="ml-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Permits Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    PTW Number
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermits.length > 0 ? (
                  filteredPermits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{permit.permit_serial}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{permit.permit_type.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{permit.work_location}</div>
                        {permit.site_name && (
                          <div className="text-xs text-gray-500">{permit.site_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-sm text-gray-900 truncate">
                          {permit.work_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{permit.created_by_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(permit.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(permit.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(permit.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No permits found</p>
                        <p className="mt-1 text-sm">
                          {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No permits have been created yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}