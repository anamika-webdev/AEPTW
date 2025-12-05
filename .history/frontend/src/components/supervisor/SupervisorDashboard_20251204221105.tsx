// frontend/src/components/supervisor/SupervisorDashboard.tsx
// COMPLETE WORKFLOW IMPLEMENTATION

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
  Send,
} from 'lucide-react';
import { ExtendPTWModal } from './ExtendPTWModal';
import { ClosePTWModal } from './ClosePTWModal';
import type { ExtensionData } from './ExtendPTWModal';
import type { ClosureData } from './ClosePTWModal';

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
  site_name?: string;
  team_member_count?: number;
  area_manager_name?: string;
  safety_officer_name?: string;
  site_leader_name?: string;
}

interface Stats {
  total_workers: number;
  total_permits: number;
  initiated_permits: number;
  approved_permits: number;
  ready_to_start_permits: number;
  in_progress_permits: number;
  closed_permits: number;
}

export default function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total_workers: 0,
    total_permits: 0,
    initiated_permits: 0,
    approved_permits: 0,
    ready_to_start_permits: 0,
    in_progress_permits: 0,
    closed_permits: 0,
  });
  
  // Separate state for each permit category
  const [initiatedPermits, setInitiatedPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [readyToStartPermits, setReadyToStartPermits] = useState<Permit[]>([]);
  const [inProgressPermits, setInProgressPermits] = useState<Permit[]>([]);
  const [closedPermits, setClosedPermits] = useState<Permit[]>([]);
  
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
      console.log('🔄 Loading supervisor dashboard...');

      // Load all permit categories in parallel
      const [
        initiatedRes,
        approvedRes,
        readyRes,
        inProgressRes,
        closedRes,
        workersRes
      ] = await Promise.all([
        permitsAPI.getMyInitiated(),
        permitsAPI.getMyApproved(),
        permitsAPI.getMyReadyToStart(),
        permitsAPI.getMyInProgress(),
        permitsAPI.getMyClosed(),
        usersAPI.getWorkers()
      ]);

      const initiated = initiatedRes.success && initiatedRes.data ? initiatedRes.data : [];
      const approved = approvedRes.success && approvedRes.data ? approvedRes.data : [];
      const ready = readyRes.success && readyRes.data ? readyRes.data : [];
      const inProgress = inProgressRes.success && inProgressRes.data ? inProgressRes.data : [];
      const closed = closedRes.success && closedRes.data ? closedRes.data : [];
      const workerCount = workersRes.success && workersRes.data ? workersRes.data.length : 0;

      console.log('✅ Permits loaded:', {
        initiated: initiated.length,
        approved: approved.length,
        ready: ready.length,
        inProgress: inProgress.length,
        closed: closed.length
      });

      // Set state
      setInitiatedPermits(initiated);
      setApprovedPermits(approved);
      setReadyToStartPermits(ready);
      setInProgressPermits(inProgress);
      setClosedPermits(closed);

      // Calculate stats
      setStats({
        total_workers: workerCount,
        total_permits: initiated.length + approved.length + ready.length + inProgress.length + closed.length,
        initiated_permits: initiated.length,
        approved_permits: approved.length,
        ready_to_start_permits: ready.length,
        in_progress_permits: inProgress.length,
        closed_permits: closed.length,
      });

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      alert('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler functions
  const handleViewPermit = (permit: Permit) => {
    console.log('📄 Viewing permit:', permit.id);
    onNavigate('permit-detail', { permitId: permit.id });
  };

  const handleFinalSubmit = async (permit: Permit) => {
    if (!confirm(`Are you sure you want to do FINAL SUBMIT for PTW ${permit.permit_serial}?`)) {
      return;
    }

    try {
      console.log('📤 Final submitting PTW:', permit.id);
      const response = await permitsAPI.finalSubmit(permit.id);

      if (response.success) {
        alert('✅ PTW final submitted successfully! It is now Ready to Start.');
        loadDashboardData(); // Reload data
      } else {
        alert('❌ Failed to final submit: ' + response.message);
      }
    } catch (error: any) {
      console.error('Error final submitting PTW:', error);
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStartPTW = async (permit: Permit) => {
    // Check if current time >= start time
    const now = new Date();
    const startTime = new Date(permit.start_time);

    if (now < startTime) {
      alert(`⏰ Cannot start PTW before scheduled start time: ${startTime.toLocaleString()}`);
      return;
    }

    if (!confirm(`Are you sure you want to START work for PTW ${permit.permit_serial}?`)) {
      return;
    }

    try {
      console.log('▶️ Starting PTW:', permit.id);
      const response = await permitsAPI.startPTW(permit.id);

      if (response.success) {
        alert('✅ PTW started successfully! Work is now In Progress.');
        loadDashboardData(); // Reload data
      } else {
        alert('❌ Failed to start PTW: ' + response.message);
      }
    } catch (error: any) {
      console.error('Error starting PTW:', error);
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
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
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      'Approved': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved - Ready for Final Submit' },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ready to Start' },
      'Active': { bg: 'bg-green-100', text: 'text-green-800', label: 'In Progress' },
      'Extension_Requested': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Extension Requested' },
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

  // Reusable table component
  const PermitTable = ({ 
    permits, 
    title, 
    emptyMessage, 
    showActions = true,
    actionType 
  }: { 
    permits: Permit[]; 
    title: string; 
    emptyMessage: string; 
    showActions?: boolean;
    actionType?: 'final-submit' | 'start' | 'extend-close' | 'none';
  }) => (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="px-3 py-1 text-sm font-medium text-blue-600 rounded-full bg-blue-50">
          {permits.length} Permits
        </span>
      </div>

      {permits.length === 0 ? (
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">PTW ID</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Type</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Location</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Start Time</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Status</th>
                {showActions && <th className="px-4 py-3 text-xs font-medium tracking-wider text-right uppercase text-slate-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {permit.permit_serial}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {permit.permit_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {permit.work_location}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(permit.start_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(permit.status)}
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleViewPermit(permit)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        
                        {actionType === 'final-submit' && (
                          <Button
                            onClick={() => handleFinalSubmit(permit)}
                            size="sm"
                            className="gap-1 text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-3 h-3" />
                            Final Submit
                          </Button>
                        )}
                        
                        {actionType === 'start' && (
                          <Button
                            onClick={() => handleStartPTW(permit)}
                            size="sm"
                            className="gap-1 text-white bg-green-600 hover:bg-green-700"
                            disabled={new Date() < new Date(permit.start_time)}
                          >
                            <Play className="w-3 h-3" />
                            {new Date() < new Date(permit.start_time) ? 'Not Time Yet' : 'Start'}
                          </Button>
                        )}
                        
                        {actionType === 'extend-close' && (
                          <>
                            <Button
                              onClick={() => handleExtendPermit(permit)}
                              variant="outline"
                              size="sm"
                              className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <Clock className="w-3 h-3" />
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
                          </>
                        )}
                      </div>
                    </td>
                  )}
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
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Workers</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_workers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Permits</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_permits}</p>
            </div>
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.initiated_permits}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-green-600">{stats.in_progress_permits}</p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Table 1: Initiated PTWs (Pending Approval) */}
      <PermitTable
        permits={initiatedPermits}
        title="Initiated PTWs (Pending Approval)"
        emptyMessage="No PTWs waiting for approval"
        showActions={true}
        actionType="none"
      />

      {/* Table 2: Approved PTWs (Ready for Final Submit) */}
      <PermitTable
        permits={approvedPermits}
        title="Approved PTWs (Ready for Final Submit)"
        emptyMessage="No approved PTWs"
        showActions={true}
        actionType="final-submit"
      />

      {/* Table 3: Ready to Start PTWs */}
      <PermitTable
        permits={readyToStartPermits}
        title="Ready to Start PTWs"
        emptyMessage="No PTWs ready to start"
        showActions={true}
        actionType="start"
      />

      {/* Table 4: In Progress PTWs */}
      <PermitTable
        permits={inProgressPermits}
        title="In Progress PTWs"
        emptyMessage="No PTWs in progress"
        showActions={true}
        actionType="extend-close"
      />

      {/* Table 5: Closed PTWs */}
      <PermitTable
        permits={closedPermits}
        title="Closed PTWs"
        emptyMessage="No closed PTWs"
        showActions={true}
        actionType="none"
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
            onExtendPTW(selectedPermit.id, data);
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
            onClosePTW(selectedPermit.id, data);
            setCloseModalOpen(false);
            setSelectedPermit(null);
          }}
          permit={selectedPermit}
        />
      )}
    </div>
  );
}