// Reports.tsx - Complete Reports Page with Filters and Export
// Location: frontend/src/pages/admin/Reports.tsx

import { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Filter,
  Calendar,
  Building2,

  AlertCircle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { permitsAPI, sitesAPI } from '../../services/api';

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  permit_type: string;
  site_id: string;
}

interface PermitReportData {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  status: string;
  site_name?: string;
  created_by_name?: string;
  team_size?: number;
}

interface Site {
  id: number;
  name: string;
  site_code: string;
}

interface ReportsProps {
  onBack?: () => void;
}

export default function Reports({ onBack }: ReportsProps) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [permits, setPermits] = useState<PermitReportData[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    status: '',
    permit_type: '',
    site_id: ''
  });

  useEffect(() => {
    loadSites();
    loadReportData();
  }, []);

  const loadSites = async () => {
    try {
      const response = await sitesAPI.getAll();
      if (response.success && response.data) {
        setSites(response.data);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const response = await permitsAPI.getAll();

      if (response.success && response.data) {
        let filteredData = response.data;

        // Apply filters
        if (filters.startDate) {
          filteredData = filteredData.filter((p: PermitReportData) =>
            new Date(p.start_time) >= new Date(filters.startDate)
          );
        }

        if (filters.endDate) {
          filteredData = filteredData.filter((p: PermitReportData) =>
            new Date(p.end_time) <= new Date(filters.endDate)
          );
        }

        if (filters.status) {
          filteredData = filteredData.filter((p: PermitReportData) =>
            p.status === filters.status
          );
        }

        if (filters.permit_type) {
          filteredData = filteredData.filter((p: PermitReportData) =>
            p.permit_type.includes(filters.permit_type)
          );
        }

        if (filters.site_id) {
          filteredData = filteredData.filter((p: PermitReportData) =>
            p.site_name === sites.find(s => s.id.toString() === filters.site_id)?.name
          );
        }

        setPermits(filteredData);
        setTotalCount(filteredData.length);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      alert('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadReportData();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      permit_type: '',
      site_id: ''
    });
    setCurrentPage(1);
    setTimeout(() => loadReportData(), 100);
  };

  const exportToExcel = () => {
    setExporting(true);

    try {
      // Create CSV content
      const headers = [
        'Permit Serial',
        'Type',
        'Location',
        'Description',
        'Start Time',
        'End Time',
        'Status',
        'Site',
        'Created By',
        'Team Size'
      ];

      const rows = permits.map(permit => [
        permit.permit_serial || 'N/A',
        permit.permit_type || 'N/A',
        permit.work_location || 'N/A',
        permit.work_description || 'N/A',
        new Date(permit.start_time).toLocaleString(),
        new Date(permit.end_time).toLocaleString(),
        permit.status || 'N/A',
        permit.site_name || 'N/A',
        permit.created_by_name || 'N/A',
        permit.team_size || 0
      ]);

      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `PTW_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('✅ Excel report downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export to Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>PTW Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              font-size: 12px;
            }
            h1 { 
              color: #1e40af; 
              border-bottom: 3px solid #1e40af;
              padding-bottom: 10px;
            }
            .report-info {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 11px;
            }
            th { 
              background: #1e40af; 
              color: white; 
              padding: 10px;
              text-align: left;
              font-weight: 600;
            }
            td { 
              padding: 8px; 
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) { 
              background: #f9fafb; 
            }
            .status-active { color: #059669; font-weight: 600; }
            .status-pending { color: #d97706; font-weight: 600; }
            .status-closed { color: #6b7280; font-weight: 600; }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <h1>📋 Permit to Work (PTW) Report</h1>
          <div class="report-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Permits:</strong> ${totalCount}</p>
            <p><strong>Filters Applied:</strong></p>
            <ul>
              ${filters.startDate ? `<li>Start Date: ${filters.startDate}</li>` : ''}
              ${filters.endDate ? `<li>End Date: ${filters.endDate}</li>` : ''}
              ${filters.status ? `<li>Status: ${filters.status}</li>` : ''}
              ${filters.permit_type ? `<li>Type: ${filters.permit_type}</li>` : ''}
              ${!filters.startDate && !filters.endDate && !filters.status && !filters.permit_type ? '<li>No filters applied</li>' : ''}
            </ul>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Permit Serial</th>
                <th>Type</th>
                <th>Location</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              ${permits.map(permit => `
                <tr>
                  <td>${permit.permit_serial || 'N/A'}</td>
                  <td>${permit.permit_type || 'N/A'}</td>
                  <td>${permit.work_location || 'N/A'}</td>
                  <td>${new Date(permit.start_time).toLocaleString()}</td>
                  <td>${new Date(permit.end_time).toLocaleString()}</td>
                  <td class="status-${permit.status.toLowerCase()}">${permit.status}</td>
                  <td>${permit.site_name || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Amazon EPTW System - Generated Report</p>
            <p>This is an automated report. Please verify all information.</p>
          </div>
        </body>
        </html>
      `;

      // Open in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      alert('✅ PDF ready! Use Print > Save as PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('❌ Failed to export to PDF');
    } finally {
      setExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending_Approval':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Closed':
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Pending_Approval': 'bg-amber-100 text-amber-800',
      'Closed': 'bg-slate-100 text-slate-800',
      'Draft': 'bg-gray-100 text-gray-800',
    };

    return config[status] || 'bg-slate-100 text-slate-800';
  };

  // Pagination Logic
  const totalPages = Math.ceil(permits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPermits = permits.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen p-4 bg-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
            <h1 className="text-3xl font-bold text-gray-900">PTW Reports & Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">
              Generate and export detailed permit reports with custom filters
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Start Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending_Approval">Pending Approval</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Permit Type */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Permit Type
              </label>
              <select
                value={filters.permit_type}
                onChange={(e) => handleFilterChange('permit_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                <option value="General">General</option>
                <option value="Hot_Work">Hot Work</option>
                <option value="Electrical">Electrical</option>
                <option value="Height">Height</option>
                <option value="Confined_Space">Confined Space</option>
              </select>
            </div>

            {/* Site */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Site
              </label>
              <div className="relative">
                <Building2 className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <select
                  value={filters.site_id}
                  onChange={(e) => handleFilterChange('site_id', e.target.value)}
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Sites</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.site_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center justify-between p-6 mb-6 bg-white rounded-lg shadow-md">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
            <p className="mt-1 text-sm text-gray-600">
              Download {totalCount} permit(s) in your preferred format
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              disabled={exporting || permits.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={exportToPDF}
              disabled={exporting || permits.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export to PDF
            </button>
          </div>
        </div>

        {/* Preview Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
            <p className="mt-1 text-sm text-gray-600">
              Showing {permits.length} permit(s)
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 text-orange-600 animate-spin" />
                <p className="text-gray-600">Loading report data...</p>
              </div>
            </div>
          ) : permits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-gray-600">No permits found matching the filters</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 text-sm text-orange-600 hover:underline"
              >
                Clear filters to see all permits
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Permit Serial
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Site
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPermits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {permit.permit_serial}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {permit.permit_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {permit.work_location}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(permit.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(permit.status)}`}>
                          {getStatusIcon(permit.status)}
                          {permit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {permit.site_name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {permits.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
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
                    Showing <span className="font-medium">{Math.min(permits.length, startIndex + 1)}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, permits.length)}</span> of{' '}
                    <span className="font-medium">{permits.length}</span> results
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
          )}
        </div>
      </div>
    </div>
  );
}