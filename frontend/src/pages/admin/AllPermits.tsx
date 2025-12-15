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
  ChevronRight,
  Download
} from 'lucide-react';
import { permitsAPI } from '../../services/api';
import { downloadComprehensivePDF } from '../../utils/pdfGenerator';

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
  const [selectedPermits, setSelectedPermits] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleSelectPermit = (permitId: number) => {
    setSelectedPermits(prev =>
      prev.includes(permitId)
        ? prev.filter(id => id !== permitId)
        : [...prev, permitId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermits.length === paginatedPermits.length) {
      setSelectedPermits([]);
    } else {
      setSelectedPermits(paginatedPermits.map(p => p.id));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedPermits.length === 0) {
      alert('Please select at least one permit to download');
      return;
    }

    setIsDownloading(true);
    try {
      // Fetch complete details for selected permits
      const permitDetailsPromises = selectedPermits.map(id => permitsAPI.getById(id));
      const responses = await Promise.all(permitDetailsPromises);
      const permitsWithDetails = responses
        .filter(r => r.success && r.data)
        .map(r => r.data);


      if (permitsWithDetails.length > 0) {
        await downloadComprehensivePDF(permitsWithDetails);
        alert(`Successfully downloaded ${permitsWithDetails.length} permit(s) with complete details`);
      } else {
        alert('Failed to fetch permit details. Please try again.');
        // Fallback removed
      }
    } catch (error) {
      console.error('Error downloading permits:', error);
      alert('Failed to download permits. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (permit: Permit) => {
    setIsDownloading(true);
    try {
      // Fetch complete details for the permit
      const response = await permitsAPI.getById(permit.id);
      if (response.success && response.data) {
        await downloadComprehensivePDF([response.data]);
      } else {
        alert('Failed to fetch complete details for download.');
      }
    } catch (error) {
      console.error('Error downloading permit:', error);
      alert('Failed to download permit. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (filteredPermits.length === 0) {
      alert('No permits to download');
      return;
    }

    if (filteredPermits.length > 20) {
      if (!confirm(`You are about to download ${filteredPermits.length} permits. This may take a while. Continue?`)) {
        return;
      }
    }

    setIsDownloading(true);
    try {
      // Fetch complete details for all filtered permits
      const permitDetailsPromises = filteredPermits.map(p => permitsAPI.getById(p.id));
      const responses = await Promise.all(permitDetailsPromises);
      const permitsWithDetails = responses
        .filter(r => r.success && r.data)
        .map(r => r.data);

      if (permitsWithDetails.length > 0) {
        await downloadComprehensivePDF(permitsWithDetails);
        alert(`Successfully downloaded ${permitsWithDetails.length} permit(s) of ${filteredPermits.length}`);
      }
    } catch (error) {
      console.error('Error downloading permits:', error);
      alert('Failed to download permits. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPermitsPDF = async (permitsToDownload: any[]) => {
    // Dynamic import of jsPDF
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 20;

    // Title Page
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 102, 0); // Orange
    doc.text('Permit to Work (PTW)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    doc.text('Comprehensive Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Total Permits: ${permitsToDownload.length}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Add page break after title page
    doc.addPage();

    // Process each permit
    for (let index = 0; index < permitsToDownload.length; index++) {
      const permit = permitsToDownload[index];

      if (index > 0) {
        doc.addPage();
      }

      // Reset position for each permit
      yPosition = 20;

      // Permit Header with Serial Number
      doc.setFillColor(255, 102, 0);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`PTW #${permit.permit_serial || 'N/A'}`, margin + 5, yPosition + 8);
      yPosition += 17;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      // Helper function to add section
      const addSection = (title: string, content: [string, any][]) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
        doc.text(title, margin + 3, yPosition + 5);
        yPosition += 10;

        // Section Content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        content.forEach(([label, value]) => {
          const displayValue = value !== null && value !== undefined ? String(value) : 'N/A';
          const lines = doc.splitTextToSize(displayValue, pageWidth - margin - 60); // Wrap text

          // Check if starting a new item requires a page break
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${label}:`, margin + 3, yPosition);

          doc.setFont('helvetica', 'normal');

          // Print lines one by one to handle pagination
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin + 55, yPosition);
            yPosition += 5;
          });

          // Add small spacing after each item
          yPosition += 1;
        });
        yPosition += 3;
      };

      // 1. Basic Information
      addSection('BASIC INFORMATION', [
        ['Permit Type', permit.permit_type || 'N/A'],
        ['Status', permit.status || 'N/A'],
        ['Site', permit.site_name || 'N/A'],
        ['Work Location', permit.work_location || 'N/A'],
        ['Work Description', permit.work_description || 'N/A'],
        ['Issue Department', permit.issue_department || 'N/A'],
      ]);

      // 2. Time Information
      addSection('TIME DETAILS', [
        ['Start Time', permit.start_time ? new Date(permit.start_time).toLocaleString() : 'N/A'],
        ['End Time', permit.end_time ? new Date(permit.end_time).toLocaleString() : 'N/A'],
        ['Created At', permit.created_at ? new Date(permit.created_at).toLocaleString() : 'N/A'],
        ['Updated At', permit.updated_at ? new Date(permit.updated_at).toLocaleString() : 'N/A'],
      ]);

      // 3. Personnel Information
      addSection('PERSONNEL', [
        ['Permit Initiator', permit.permit_initiator || 'N/A'],
        ['Initiator Contact', permit.permit_initiator_contact || 'N/A'],
        ['Receiver Name', permit.receiver_name || 'N/A'],
        ['Receiver Contact', permit.receiver_contact || 'N/A'],
        ['Created By', permit.created_by_name || 'N/A'],
      ]);

      // 4. Team Members
      if (permit.team_members && permit.team_members.length > 0) {
        addSection('TEAM MEMBERS', [
          ['Total Team Size', permit.team_members.length],
          ['Team Details', permit.team_members.map((tm: any, idx: number) =>
            `${idx + 1}. ${tm.worker_name || 'N/A'} - ${tm.worker_role || 'N/A'}${tm.badge_id ? ` (Badge: ${tm.badge_id})` : ''}`
          ).join('\n')],
        ]);
      }

      // 5. Hazards
      if (permit.hazards && permit.hazards.length > 0) {
        addSection('IDENTIFIED HAZARDS', [
          ['Total Hazards', permit.hazards.length],
          ['Hazard List', permit.hazards.map((h: any, idx: number) =>
            `${idx + 1}. ${h.name || h.hazard_name || 'N/A'}${h.description ? ` - ${h.description}` : ''}`
          ).join('\n')],
          ['Other Hazards', permit.other_hazards || 'None'],
        ]);
      }

      // 6. Control Measures
      if (permit.control_measures) {
        addSection('CONTROL MEASURES', [
          ['Control Measures', permit.control_measures],
        ]);
      }

      // 7. PPE Requirements
      if (permit.ppe && permit.ppe.length > 0) {
        addSection('PPE REQUIREMENTS', [
          ['Total PPE Items', permit.ppe.length],
          ['PPE List', permit.ppe.map((p: any, idx: number) =>
            `${idx + 1}. ${p.name || p.ppe_name || 'N/A'}${p.description ? ` - ${p.description}` : ''}`
          ).join('\n')],
        ]);
      }

      // 8. Checklist Responses
      if (permit.checklist_responses && permit.checklist_responses.length > 0) {
        const responses = permit.checklist_responses.map((cr: any, idx: number) => {
          const question = cr.question_text || cr.question || 'Question';
          const response = cr.response || 'N/A';
          const remarks = cr.remarks ? ` (${cr.remarks})` : '';
          return `${idx + 1}. ${question}: ${response}${remarks}`;
        }).join('\n');

        addSection('CHECKLIST RESPONSES', [
          ['Total Questions', permit.checklist_responses.length],
          ['Responses', responses],
        ]);
      }

      // 9. SWMS Information
      if (permit.swms_file_url || permit.swms_text) {
        addSection('SWMS (Safe Work Method Statement)', [
          ['SWMS File', permit.swms_file_url || 'No file attached'],
          ['SWMS Text', permit.swms_text || 'No text provided'],
        ]);
      }

      // 10. Approvals
      addSection('APPROVALS', [
        ['Area Manager', permit.area_manager_name || 'Not assigned'],
        ['AM Status', permit.area_manager_status || 'Pending'],
        ['AM Approved At', permit.area_manager_approved_at ? new Date(permit.area_manager_approved_at).toLocaleString() : 'N/A'],
        ['Safety Officer', permit.safety_officer_name || 'Not assigned'],
        ['SO Status', permit.safety_officer_status || 'Pending'],
        ['SO Approved At', permit.safety_officer_approved_at ? new Date(permit.safety_officer_approved_at).toLocaleString() : 'N/A'],
        ['Site Leader', permit.site_leader_name || 'Not assigned'],
        ['SL Status', permit.site_leader_status || 'Pending'],
        ['SL Approved At', permit.site_leader_approved_at ? new Date(permit.site_leader_approved_at).toLocaleString() : 'N/A'],
      ]);

      // 11. Signatures
      addSection('SIGNATURES', [
        ['Issuer Signature', permit.issuer_signature ? 'Signed' : 'Not signed'],
        ['Receiver Signature', permit.receiver_signature ? 'Signed' : 'Not signed'],
      ]);

      // 12. Additional Information
      addSection('ADDITIONAL INFORMATION', [
        ['Permit ID', permit.id || 'N/A'],
        ['Permit Serial', permit.permit_serial || 'N/A'],
        ['Comments', permit.comments || 'None'],
        ['Rejection Reason', permit.rejection_reason || 'N/A'],
      ]);
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Amazon EPTW System - Comprehensive PTW Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('This document contains complete permit details for record-keeping and audit purposes.', pageWidth / 2, pageHeight - 6, { align: 'center' });

    // Save the PDF
    const filename = permitsToDownload.length === 1
      ? `PTW_Complete_${permitsToDownload[0].permit_serial}_${new Date().toISOString().split('T')[0]}.pdf`
      : `PTW_Complete_Report_${permitsToDownload.length}_permits_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(filename);
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
      'Active': { icon: CheckCircle, className: 'bg-orange-100 text-orange-800', label: 'Active' },
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
        <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading || filteredPermits.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${isDownloading ? 'animate-pulse' : ''}`} />
              Download All ({filteredPermits.length})
            </button>
            {selectedPermits.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-pulse' : ''}`} />
                Download Selected ({selectedPermits.length})
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
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
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
              <span className="flex items-center justify-center w-5 h-5 text-xs text-white bg-orange-600 rounded-full">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPermits.length === paginatedPermits.length && paginatedPermits.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </th>
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
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPermits.includes(permit.id)}
                        onChange={() => handleSelectPermit(permit.id)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-orange-600">{permit.permit_serial}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{permit.permit_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{permit.work_location}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate">{permit.work_description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{permit.created_by_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(permit.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(permit.status)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadSingle(permit)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download this permit"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button
                          onClick={() => handleViewPermit(permit.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                          title="View permit details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
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
    </div>
  );
}