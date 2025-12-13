// frontend/src/components/supervisor/SupervisorDashboard.tsx
// COMPLETE SUPERVISOR DASHBOARD WITH EXTENDED PTW TABLE AND APPROVER STATUS

import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
  AlertOctagon,
  Calendar,
  X
} from 'lucide-react';
import { ExtendPTWModal } from './ExtendPTWModal';
import { ClosePTWModal } from './ClosePTWModal';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';
interface SupervisorDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  status: string;
  site_name?: string;
  team_member_count?: number;
  area_manager_status?: string;
  safety_officer_status?: string;
  site_leader_status?: string;
  area_manager_name?: string;
  safety_officer_name?: string;
  site_leader_name?: string;
  rejection_reason?: string;
  created_at?: string;
}

interface ExtensionFormData {
  new_end_date: string;
  new_end_time: string;
  reason: string;
  current_completion: string;
}

interface ClosureData {
  housekeeping_done: boolean;
  tools_removed: boolean;
  locks_removed: boolean;
  area_restored: boolean;
  completion_notes: string;
  safety_incidents: string;
  supervisor_signature: string;
  closureEvidences?: {
    file: File;
    preview: string;
    category: string;
    description: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
  }[];
}

export default function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  const [loading, setLoading] = useState(true);

  // PTW States
  const [initiatedPermits, setInitiatedPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [readyToStartPermits, setReadyToStartPermits] = useState<Permit[]>([]);
  const [inProgressPermits, setInProgressPermits] = useState<Permit[]>([]);
  const [closedPermits, setClosedPermits] = useState<Permit[]>([]);
  const [extendedPermits, setExtendedPermits] = useState<Permit[]>([]);

  // Modal states
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      console.log('📥 Loading supervisor dashboard data...');

      // Fetch all PTW categories
      const [initiated, approved, rejected, readyToStart, inProgress, extended, closed] = await Promise.all([
        fetch(`${baseURL}/permits/my-initiated`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),

        fetch(`${baseURL}/permits/my-approved`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),

        fetch(`${baseURL}/permits/my-rejected`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),

        fetch(`${baseURL}/permits/my-ready-to-start`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),

        fetch(`${baseURL}/permits/my-active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),

        fetch(`${baseURL}/permits/my-extended`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),

        fetch(`${baseURL}/permits/my-closed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ]);

      if (initiated.success) setInitiatedPermits(initiated.data || []);
      if (approved.success) setApprovedPermits(approved.data || []);
      if (rejected.success) setRejectedPermits(rejected.data || []);
      if (readyToStart.success) setReadyToStartPermits(readyToStart.data || []);
      if (inProgress.success) setInProgressPermits(inProgress.data || []);
      if (extended.success) setExtendedPermits(extended.data || []);
      if (closed.success) setClosedPermits(closed.data || []);

      console.log('✅ Dashboard data loaded:', {
        initiated: initiated.count,
        approved: approved.count,
        rejected: rejected.count,
        readyToStart: readyToStart.count,
        inProgress: inProgress.count,
        extended: extended.count,
        closed: closed.count
      });
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      alert('Error loading dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (permitId: number) => {
    if (!confirm('Submit this PTW to make it ready to start?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/permits/${permitId}/final-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ PTW submitted successfully! It is now Ready to Start.');
        loadDashboardData();
      } else {
        alert('❌ Failed to submit PTW: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting PTW:', error);
      alert('❌ Error submitting PTW');
    }
  };

  const handleStartPermit = async (permitId: number) => {
    if (!confirm('Start this PTW? Work will begin immediately.')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/permits/${permitId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ PTW started successfully!');
        loadDashboardData();
      } else {
        alert('❌ Failed to start PTW: ' + data.message);
      }
    } catch (error) {
      console.error('Error starting PTW:', error);
      alert('❌ Error starting PTW');
    }
  };

  const handleExtend = (permit: Permit) => {
    setSelectedPermit(permit);
    setExtendModalOpen(true);
  };

  const handleExtendSubmit = async (permitId: number, formData: ExtensionFormData) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Combine date and time into ISO string
      const fullEndDateTime = `${formData.new_end_date}T${formData.new_end_time}:00`;

      // Combine reason and completion
      const formattedReason = `${formData.reason} (Current Completion: ${formData.current_completion}%)`;

      const response = await fetch(`${baseURL}/permits/${permitId}/request-extension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_end_time: fullEndDateTime,
          reason: formattedReason
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Extension requested successfully!');
        loadDashboardData();
      } else {
        alert('❌ Failed to request extension: ' + data.message);
      }
    } catch (error) {
      console.error('Error requesting extension:', error);
      alert('❌ Error requesting extension');
    }
  };

  const handleClose = (permit: Permit) => {
    setSelectedPermit(permit);
    setCloseModalOpen(true);
  };

  const handleCloseSubmit = async (permitId: number, closureData: ClosureData) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const formData = new FormData();
      formData.append('housekeeping_done', String(closureData.housekeeping_done));
      formData.append('tools_removed', String(closureData.tools_removed));
      formData.append('locks_removed', String(closureData.locks_removed));
      formData.append('area_restored', String(closureData.area_restored));
      formData.append('remarks', `${closureData.completion_notes}\n\nSafety Incidents: ${closureData.safety_incidents || 'None'}\n\nSigned by: ${closureData.supervisor_signature}`);

      // Append Evidence
      if (closureData.closureEvidences && closureData.closureEvidences.length > 0) {
        const descriptions: string[] = [];
        const categories: string[] = [];
        const timestamps: string[] = [];
        const latitudes: (number | null)[] = [];
        const longitudes: (number | null)[] = [];

        closureData.closureEvidences.forEach((evidence) => {
          formData.append('images', evidence.file);
          descriptions.push(evidence.description || '');
          categories.push(evidence.category);
          timestamps.push(evidence.timestamp);
          latitudes.push(evidence.latitude);
          longitudes.push(evidence.longitude);
        });

        formData.append('descriptions', JSON.stringify(descriptions));
        formData.append('categories', JSON.stringify(categories));
        formData.append('timestamps', JSON.stringify(timestamps));
        formData.append('latitudes', JSON.stringify(latitudes));
        formData.append('longitudes', JSON.stringify(longitudes));
      }

      const response = await fetch(`${baseURL}/permits/${permitId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ PTW closed successfully!');
        loadDashboardData();
      } else {
        alert('❌ Failed to close PTW: ' + data.message);
      }
    } catch (error) {
      console.error('Error closing PTW:', error);
      alert('❌ Error closing PTW');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      'Approved': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Approved - Ready for Final Submit' },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ready to Start' },
      'Active': { bg: 'bg-green-100', text: 'text-green-800', label: 'In Progress' },
      'Extension_Requested': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Extension Requested' },
      'Extended': { bg: 'bg-green-100', text: 'text-green-800', label: 'Extended - Active' },
      'Extension_Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Extension Rejected' },
      'Closed': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };

    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getApprovalStatusBadge = (status?: string, approverName?: string) => {
    if (!approverName) {
      return <span className="text-xs text-gray-400">-</span>;
    }

    if (!status || status === 'Pending') {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </div>
      );
    }
    if (status === 'Approved') {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>Approved</span>
        </div>
      );
    }
    if (status === 'Rejected') {
      return (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </div>
      );
    }
    return <span className="text-xs text-gray-500">{status}</span>;
  };

  // NEW: Render Approvers Column for Initiated PTW
  const renderApproversColumn = (permit: Permit) => {
    return (
      <div className="space-y-1.5">
        {permit.area_manager_name && (
          <div className="flex items-center justify-between p-1.5 bg-white rounded">
            <span className="text-xs font-medium text-gray-700">Area Manager:</span>
            {getApprovalStatusBadge(permit.area_manager_status, permit.area_manager_name)}
          </div>
        )}
        {permit.safety_officer_name && (
          <div className="flex items-center justify-between p-1.5 bg-white rounded">
            <span className="text-xs font-medium text-gray-700">Safety Officer:</span>
            {getApprovalStatusBadge(permit.safety_officer_status, permit.safety_officer_name)}
          </div>
        )}
        {permit.site_leader_name && (
          <div className="flex items-center justify-between p-1.5 bg-white rounded">
            <span className="text-xs font-medium text-gray-700">Site Leader:</span>
            {getApprovalStatusBadge(permit.site_leader_status, permit.site_leader_name)}
          </div>
        )}
      </div>
    );
  };

  const PermitTable = ({
    permits,
    title,
    emptyMessage,
    showActions = false,
    actionType,
    showApprovers = false
  }: {
    permits: Permit[];
    title: string;
    emptyMessage: string;
    showActions?: boolean;
    actionType?: 'final-submit' | 'start' | 'extend-close' | 'close-only' | 'view' | 'view-close' | 'none';
    showApprovers?: boolean;
  }) => {
    // ADD PAGINATION HOOK HERE
    const {
      currentPage,
      totalPages,
      itemsPerPage,
      paginatedData,
      setCurrentPage,
      setItemsPerPage
    } = usePagination({
      data: permits,
      initialItemsPerPage: 10
    });

    return (
      <div className="p-6 mb-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <span className="px-3 py-1 text-sm font-medium text-orange-600 rounded-full bg-orange-50">
            {permits.length} Permits
          </span>
        </div>

        {permits.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-600 bg-white border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Permit #</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Start Time</th>
                    {showApprovers && <th className="px-4 py-3 text-left">Approvers Status</th>}
                    {showActions && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* CHANGE: Map paginatedData instead of permits */}
                  {paginatedData.map((permit) => (
                    <tr key={permit.id} className="hover:bg-orange-50">
                      <td className="px-4 py-3 font-medium text-orange-600">
                        <button
                          onClick={() => onNavigate('permit-detail', { permitId: permit.id })}
                          className="hover:underline"
                        >
                          {permit.permit_serial}
                        </button>
                      </td>
                      <td className="px-4 py-3">{permit.permit_type}</td>
                      <td className="px-4 py-3">{permit.work_location}</td>
                      <td className="px-4 py-3">{getStatusBadge(permit.status)}</td>
                      <td className="px-4 py-3">{new Date(permit.start_time).toLocaleString()}</td>

                      {showApprovers && (
                        <td className="px-4 py-3">
                          {renderApproversColumn(permit)}
                        </td>
                      )}

                      {showActions && (
                        <td className="px-4 py-3 text-right">
                          {actionType === 'final-submit' && (
                            <button onClick={() => handleFinalSubmit(permit.id)} className="px-3 py-1 text-xs font-medium text-white transition-colors bg-orange-600 rounded hover:bg-orange-700">
                              Final Submit
                            </button>
                          )}
                          {actionType === 'start' && (
                            <button onClick={() => handleStartPermit(permit.id)} className="px-3 py-1 text-xs font-medium text-white transition-colors bg-green-600 rounded hover:bg-green-700">
                              Start Work
                            </button>
                          )}
                          {actionType === 'extend-close' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleExtend(permit)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                Extend
                              </button>
                              <button
                                onClick={() => handleClose(permit)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                Close
                              </button>
                            </div>
                          )}
                          {actionType === 'view-close' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => onNavigate('permit-detail', { permitId: permit.id })}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleClose(permit)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                Close
                              </button>
                            </div>
                          )}
                          {actionType === 'view' && (
                            <button
                              onClick={() => onNavigate('permit-detail', { permitId: permit.id })}
                              className="px-3 py-1 text-xs font-medium text-orange-600 transition-colors bg-orange-100 rounded hover:bg-orange-200"
                            >
                              View
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADD PAGINATION COMPONENT */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={permits.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalPermits = initiatedPermits.length + approvedPermits.length +
    rejectedPermits.length + readyToStartPermits.length +
    inProgressPermits.length + extendedPermits.length + closedPermits.length;

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Supervisor Dashboard</h1>
            <p className="text-slate-600">Manage your permit-to-work documents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => onNavigate('create-permit')}
              className="flex items-center gap-2 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              <FileText className="w-4 h-4" />
              Create PTW
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-6 md:grid-cols-5">
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Permits</p>
                <p className="text-2xl font-bold text-slate-900">{totalPermits}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{initiatedPermits.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-green-600">{inProgressPermits.length}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Extended</p>
                <p className="text-2xl font-bold text-orange-600">{extendedPermits.length}</p>
              </div>
              <AlertOctagon className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-orange-600">{approvedPermits.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Table 1: Initiated PTWs (Pending Approval) - WITH APPROVER STATUS */}
        <PermitTable
          permits={initiatedPermits}
          title="Initiated PTWs (Pending Approval)"
          emptyMessage="No PTWs waiting for approval"
          showActions={true}
          actionType="view"
          showApprovers={true} // Show approvers column
        />

        {/* Table 2: Approved PTWs (Ready for Final Submit) */}
        <PermitTable
          permits={approvedPermits}
          title="Approved PTWs (Ready for Final Submit)"
          emptyMessage="No PTWs ready for final submit"
          showActions={true}
          actionType="final-submit"
        />

        {/* Table 3: Rejected PTWs */}
        {rejectedPermits.length > 0 && (
          <PermitTable
            permits={rejectedPermits}
            title="Rejected PTWs"
            emptyMessage="No rejected PTWs"
            showActions={true}
            actionType="view"
          />
        )}

        {/* Table 4: Ready to Start PTWs */}
        <PermitTable
          permits={readyToStartPermits}
          title="Ready to Start PTWs"
          emptyMessage="No PTWs ready to start"
          showActions={true}
          actionType="start"
        />

        {/* Table 5: In Progress PTWs */}
        <PermitTable
          permits={inProgressPermits}
          title="In Progress PTWs"
          emptyMessage="No PTWs in progress"
          showActions={true}
          actionType="extend-close"
        />

        {/* Table 6: Extended PTWs (Extension Requested) */}
        <PermitTable
          permits={extendedPermits}
          title="Extended PTWs"
          emptyMessage="No extension requests"
          showActions={true}
          actionType="view-close"
        />

        {/* Table 7: Closed PTWs */}
        <PermitTable
          permits={closedPermits}
          title="Closed PTWs"
          emptyMessage="No closed PTWs"
          showActions={true}
          actionType="view"
        />

        {/* Modals */}
        {extendModalOpen && selectedPermit && (
          <ExtendPTWModal
            isOpen={extendModalOpen}
            onClose={() => {
              setExtendModalOpen(false);
              setSelectedPermit(null);
            }}
            onSubmit={(data) => {
              handleExtendSubmit(selectedPermit.id, data);
              setExtendModalOpen(false);
              setSelectedPermit(null);
            }}
            permit={selectedPermit}
          />
        )}

        {closeModalOpen && selectedPermit && (
          <ClosePTWModal
            isOpen={closeModalOpen}
            onClose={() => {
              setCloseModalOpen(false);
              setSelectedPermit(null);
            }}
            onSubmit={(data) => {
              handleCloseSubmit(selectedPermit.id, data);
              setCloseModalOpen(false);
              setSelectedPermit(null);
            }}
            permit={selectedPermit}
          />
        )}
      </div>
    </div>
  );
}
