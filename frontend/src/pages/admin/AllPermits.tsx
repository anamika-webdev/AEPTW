// frontend/src/pages/admin/AllPermits.tsx
// ✅ COMPLETE: Fixed with proper onNavigate prop

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { permitsAPI } from '../../services/api';

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  status: string;
  created_by_name?: string;
  site_name?: string;
  created_at: string;
}

interface AllPermitsProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function AllPermits({ onNavigate }: AllPermitsProps) {
  const [loading, setLoading] = useState(true);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  useEffect(() => {
    fetchPermits();
  }, []);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      const response = await permitsAPI.getAll();
      if (response.success && response.data) {
        setPermits(response.data);
      }
    } catch (error) {
      console.error('Error fetching permits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPermits();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const handleViewPermit = (permitId: number) => {
    console.log('🔍 View permit clicked:', permitId);
    if (onNavigate) {
      onNavigate('permit-detail', { permitId });
    } else {
      console.error('❌ onNavigate prop not provided!');
    }
  };

  const filteredPermits = permits.filter((permit) => {
    const matchesSearch =
      permit.permit_serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.work_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.work_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || permit.status === statusFilter;
    const matchesType = typeFilter === 'all' || permit.permit_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredPermits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPermits = filteredPermits.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; className: string; label: string }> = {
      'Draft': { icon: Clock, className: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'Initiated': { icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      'Approved': { icon: CheckCircle, className: 'bg-green-100 text-green-800', label: 'Approved' },
      'Active': { icon: CheckCircle, className: 'bg-blue-100 text-blue-800', label: 'Active' },
      'Closed': { icon: CheckCircle, className: 'bg-purple-100 text-purple-800', label: 'Closed' },
      'Rejected': { icon: XCircle, className: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig['Draft'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const uniqueStatuses = ['all', ...new Set(permits.map(p => p.status))];
  const uniqueTypes = ['all', ...new Set(permits.map(p => p.permit_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onNavigate && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="p-2 text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Permits</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and view all PTW permits across the system
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search permits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute transform -translate-y-1/2 right-3 top-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <span className="flex items-center justify-center w-5 h-5 text-xs text-white bg-blue-600 rounded-full">
                {(statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t md:grid-cols-3">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Permit Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permits Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">PTW Number</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Created By</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPermits.length > 0 ? (
                paginatedPermits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{permit.permit_serial}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{permit.permit_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{permit.work_location}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate">{permit.work_description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{permit.created_by_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(permit.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(permit.status)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => handleViewPermit(permit.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        title="View permit details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-900">No permits found</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No permits have been created yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min(filteredPermits.length, startIndex + 1)}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredPermits.length)}</span> of{' '}
              <span className="font-medium">{filteredPermits.length}</span> results
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

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
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
    </div>
  );
}