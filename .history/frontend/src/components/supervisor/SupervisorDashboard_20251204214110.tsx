// src/components/supervisor/SupervisorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { permitsAPI, usersAPI } from '../../services/api';
import {
  FileText,
  Users,
  CheckCircle2,
  Play,
  XCircle,
  Eye,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { ExtendPTWModal } from './ExtendPTWModal';
import { ClosePTWModal } from './ClosePTWModal';
import type { ExtensionData } from './ExtendPTWModal';
import type { ClosureData } from './ClosePTWModal';
import PTWExpirationNotifications from './PTWExpirationNotifications';

interface SupervisorDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

interface Permit {
  id: number;
  permit_serial: string;
  permit_number?: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  status: string;
  team_size?: number;
}

interface Stats {
  total_workers: number;
  total_permits: number;
  approved_permits: number;
  in_progress_permits: number;
  closed_permits: number;
}

export default function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total_workers: 0,
    total_permits: 0,
    approved_permits: 0,
    in_progress_permits: 0,
    closed_permits: 0,
  });
  const [allPermits, setAllPermits] = useState<Permit[]>([]);
  
  // Modal states
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

const loadDashboardData = async () => {
  try {
    setIsLoading(true);
    console.log('🔄 Loading supervisor dashboard data...');

    // Load initiated PTWs (waiting for approval)
    const initiatedRes = await permitsAPI.getMyInitiated();
    const initiatedPermits = initiatedRes.success ? initiatedRes.data : [];
    console.log('✅ Initiated PTWs:', initiatedPermits.length);

    // Load approved PTWs (waiting for final submit)
    const approvedRes = await permitsAPI.getMyApproved();
    const approvedPermits = approvedRes.success ? approvedRes.data : [];
    console.log('✅ Approved PTWs:', approvedPermits.length);

    // Load ready-to-start PTWs
    const readyRes = await permitsAPI.getMyReadyToStart();
    const readyPermits = readyRes.success ? readyRes.data : [];
    console.log('✅ Ready-to-Start PTWs:', readyPermits.length);

    // Load in-progress PTWs
    const inProgressRes = await permitsAPI.getMyInProgress();
    const inProgressPermits = inProgressRes.success ? inProgressRes.data : [];
    console.log('✅ In-Progress PTWs:', inProgressPermits.length);

    // Load closed PTWs
    const closedRes = await permitsAPI.getMyClosed();
    const closedPermits = closedRes.success ? closedRes.data : [];
    console.log('✅ Closed PTWs:', closedPermits.length);

    // Load worker count
    const workersRes = await usersAPI.getWorkers();
    const workerCount = workersRes.success && workersRes.data ? workersRes.data.length : 0;

    // Set state
    setInitiatedPermits(initiatedPermits);
    setApprovedPermits(approvedPermits);
    setReadyToStartPermits(readyPermits);
    setInProgressPermits(inProgressPermits);
    setClosedPermits(closedPermits);

    // Calculate stats
    setStats({
      total_workers: workerCount,
      total_permits: initiatedPermits.length + approvedPermits.length + readyPermits.length + inProgressPermits.length + closedPermits.length,
      initiated_permits: initiatedPermits.length,
      approved_permits: approvedPermits.length,
      in_progress_permits: inProgressPermits.length,
      closed_permits: closedPermits.length,
    });

    console.log('✅ Dashboard data loaded successfully');

  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    alert('Error loading dashboard data');
  } finally {
    setIsLoading(false);
  }
};
  // Filter permits by status
  const approvedPermits = allPermits.filter(p => 
    p.status === 'Pending_Approval' || p.status === 'Active'
  );
  
  const inProgressPermits = allPermits.filter(p => 
    p.status === 'Active'
  );
  
  const extendedPermits = allPermits.filter(p => 
    p.status === 'Extension_Requested'
  );
  
  const closedPermits = allPermits.filter(p => 
    p.status === 'Closed'
  );

  // Handler functions
  const handleViewPermit = (permit: Permit) => {
    console.log('📄 Viewing permit:', permit.id);
    onNavigate('permit-detail', { permitId: permit.id });
  };

  const handleExtendPermit = (permit: Permit) => {
    console.log('⏱️ Extending permit:', permit.id);
    setSelectedPermit(permit);
    setExtendModalOpen(true);
  };

  const handleClosePermit = (permit: Permit) => {
    console.log('🔒 Closing permit:', permit.id);
    setSelectedPermit(permit);
    setCloseModalOpen(true);
  };

  const onExtendPTW = async (permitId: number, extensionData: ExtensionData) => {
    try {
      const combinedDateTime = `${extensionData.new_end_date} ${extensionData.new_end_time}`;
      
      const response = await permitsAPI.requestExtension(permitId, {
        new_end_time: combinedDateTime,
        reason: `${extensionData.reason} (Current completion: ${extensionData.current_completion}%)`,
      });

      if (response.success) {
        alert('✅ Extension requested successfully!');
        loadDashboardData();
      } else {
        alert('❌ Failed to request extension: ' + response.message);
      }
    } catch (error) {
      console.error('Error requesting extension:', error);
      alert('❌ Error requesting extension');
    }
  };

  const onClosePTW = async (permitId: number, closureData: ClosureData) => {
    try {
      const response = await permitsAPI.close(permitId, {
        housekeeping_done: closureData.housekeeping_done,
        tools_removed: closureData.tools_removed,
        locks_removed: closureData.locks_removed,
        area_restored: closureData.area_restored,
        remarks: `${closureData.completion_notes || ''}\nSafety Incidents: ${closureData.safety_incidents || 'None'}\nSupervisor: ${closureData.supervisor_signature}`,
      });

      if (response.success) {
        alert('✅ Permit closed successfully!');
        loadDashboardData();
      } else {
        alert('❌ Failed to close permit: ' + response.message);
      }
    } catch (error) {
      console.error('Error closing permit:', error);
      alert('❌ Error closing permit');
    }
  };

  const getStatusBadge = (status: string) => {
  const statusConfig = {
    'Pending_Approval': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending Approval'
    },
    'Active': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Active'
    },
    'Rejected': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Rejected'
    },
    'Closed': {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Closed'
    },
    'Extension_Requested': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Extension Requested'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: status
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      slate: 'bg-slate-50 text-slate-600',
    };

    return (
      <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-xs font-medium text-slate-600">{title}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Regular table for Approved and Closed Permits
  const PermitTable = ({
    permits,
    title,
    emptyMessage,
  }: {
    permits: Permit[];
    title: string;
    emptyMessage: string;
  }) => (
    <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{permits.length} permit(s)</p>
      </div>

      {permits.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">PTW Number</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Workers</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Start Date</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {permit.permit_serial || permit.permit_number || `PTW-${permit.id}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {permit.permit_type?.split(',').map((type, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {type.trim().replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {permit.work_location || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {permit.team_size || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(permit.start_time)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(permit.status)}</td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => handleViewPermit(permit)}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Special table for In Progress PTWs with Extend and Close buttons
  const InProgressTable = ({ permits }: { permits: Permit[] }) => (
    <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">In Progress PTWs</h2>
            <p className="text-sm text-slate-600">{permits.length} permit(s) currently active</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>Click buttons to extend or close permits</span>
          </div>
        </div>
      </div>

      {permits.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">No permits in progress</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">PTW Number</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Workers</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Start Date</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {permit.permit_serial || permit.permit_number || `PTW-${permit.id}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {permit.permit_type?.split(',').map((type, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {type.trim().replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {permit.work_location || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {permit.team_size || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(permit.start_time)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(permit.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewPermit(permit)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleExtendPermit(permit)}
                        variant="outline"
                        size="sm"
                        className="gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Extend
                      </Button>
                      <Button
                        onClick={() => handleClosePermit(permit)}
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Close
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Extended PTWs Table with Close button
  const ExtendedTable = ({ permits }: { permits: Permit[] }) => (
    <div className="overflow-hidden bg-white border border-purple-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-purple-200 bg-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">PTW Extended</h2>
            <p className="text-sm text-slate-600">{permits.length} permit(s) with extension requests</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-purple-700 border border-purple-200 rounded-full bg-purple-50">
            <Clock className="w-4 h-4" />
            Extension Requested
          </div>
        </div>
      </div>

      {permits.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">No extension requests</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">PTW Number</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Workers</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Start Date</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {permit.permit_serial || permit.permit_number || `PTW-${permit.id}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {permit.permit_type?.split(',').map((type, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {type.trim().replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {permit.work_location || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {permit.team_size || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(permit.start_time)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(permit.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewPermit(permit)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleClosePermit(permit)}
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Close
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supervisor Dashboard</h1>
          <p className="text-slate-600">Manage workers and create PTW permits</p>
        </div>
        <Button
          onClick={() => onNavigate('create-permit')}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <FileText className="w-4 h-4" />
          Create New PTW
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <button onClick={() => onNavigate('worker-list')} className="text-left">
          <StatCard
            title="Total Workers"
            value={stats.total_workers}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
        </button>
        <div>
          <StatCard
            title="PTW Issued"
            value={stats.total_permits}
            icon={<FileText className="w-5 h-5" />}
            color="green"
          />
        </div>
        <div>
          <StatCard
            title="Approved"
            value={stats.approved_permits}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
        </div>
        <div>
          <StatCard
            title="In Progress"
            value={stats.in_progress_permits}
            icon={<Play className="w-5 h-5" />}
            color="purple"
          />
        </div>
        <div>
          <StatCard
            title="Closed"
            value={stats.closed_permits}
            icon={<XCircle className="w-5 h-5" />}
            color="slate"
          />
        </div>
      </div>

      {/* Approved PTWs */}
      <PermitTable
        permits={approvedPermits}
        title="Approved PTWs"
        emptyMessage="No approved permits"
      />

      {/* In Progress PTWs - Special table with Extend/Close buttons */}
      <InProgressTable permits={inProgressPermits} />

      {/* PTW Extended - NEW TABLE with Close button! */}
      <ExtendedTable permits={extendedPermits} />

      {/* Closed PTWs */}
      <PermitTable
        permits={closedPermits}
        title="Closed PTWs"
        emptyMessage="No closed permits"
      />

      {/* All Permits */}
      <PermitTable
        permits={allPermits}
        title="All Permits"
        emptyMessage="No permits created yet"
      />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => onNavigate('worker-list')}
          className="flex items-center gap-4 p-6 text-left transition-all bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md hover:border-blue-300"
        >
          <div className="p-4 rounded-lg bg-blue-50">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Manage Workers</h3>
            <p className="text-sm text-slate-600">View and manage all workers</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('create-permit')}
          className="flex items-center gap-4 p-6 text-left transition-all bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md hover:border-green-300"
        >
          <div className="p-4 rounded-lg bg-green-50">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Create New PTW</h3>
            <p className="text-sm text-slate-600">Issue a new permit to work</p>
          </div>
        </button>
      </div>

      {/* Modals */}
      <ExtendPTWModal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        permit={selectedPermit}
        onExtendPTW={onExtendPTW}
      />

      <ClosePTWModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        permit={selectedPermit}
        onClosePTW={onClosePTW}
      />
    </div>
  );
}