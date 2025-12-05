import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  Play, Pause, StopCircle, Plus, RefreshCw
} from 'lucide-react';

// ADD THESE IMPORTS
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
}

const SupervisorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('initiated');
  
  // PTW States
  const [initiatedPermits, setInitiatedPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [readyToStartPermits, setReadyToStartPermits] = useState<Permit[]>([]);
  const [activePermits, setActivePermits] = useState<Permit[]>([]);
  const [closedPermits, setClosedPermits] = useState<Permit[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Fetch all PTW categories
      const [initiated, approved, rejected, readyToStart, active, closed] = await Promise.all([
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
        
        fetch(`${baseURL}/permits/my-closed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ]);

      if (initiated.success) setInitiatedPermits(initiated.data || []);
      if (approved.success) setApprovedPermits(approved.data || []);
      if (rejected.success) setRejectedPermits(rejected.data || []);
      if (readyToStart.success) setReadyToStartPermits(readyToStart.data || []);
      if (active.success) setActivePermits(active.data || []);
      if (closed.success) setClosedPermits(closed.data || []);

      console.log('✅ Dashboard data loaded');
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      'Approved': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved - Ready for Final Submit' },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ready to Start' },
      'Active': { bg: 'bg-green-100', text: 'text-green-800', label: 'In Progress' },
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

  const getApprovalStatusBadge = (status?: string) => {
    if (!status || status === 'Pending') {
      return <span className="text-xs text-yellow-600">⏳ Pending</span>;
    }
    if (status === 'Approved') {
      return <span className="text-xs text-green-600">✓ Approved</span>;
    }
    if (status === 'Rejected') {
      return <span className="text-xs text-red-600">✗ Rejected</span>;
    }
    return <span className="text-xs text-gray-500">{status}</span>;
  };

  const PermitTable = ({ 
    permits, 
    title, 
    emptyMessage, 
    showActions = false,
    actionType 
  }: { 
    permits: Permit[]; 
    title: string; 
    emptyMessage: string; 
    showActions?: boolean;
    actionType?: 'final-submit' | 'start' | 'none';
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
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-600 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Permit #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Start Time</th>
                {actionType === 'final-submit' && <th className="px-4 py-3 text-left">Approvals</th>}
                {showActions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{permit.permit_serial}</td>
                  <td className="px-4 py-3">{permit.permit_type}</td>
                  <td className="px-4 py-3">{permit.work_location}</td>
                  <td className="px-4 py-3">{getStatusBadge(permit.status)}</td>
                  <td className="px-4 py-3">{new Date(permit.start_time).toLocaleString()}</td>
                  
                  {actionType === 'final-submit' && (
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        {permit.area_manager_name && (
                          <div>Area Mgr: {getApprovalStatusBadge(permit.area_manager_status)}</div>
                        )}
                        {permit.safety_officer_name && (
                          <div>Safety: {getApprovalStatusBadge(permit.safety_officer_status)}</div>
                        )}
                        {permit.site_leader_name && (
                          <div>Site Leader: {getApprovalStatusBadge(permit.site_leader_status)}</div>
                        )}
                      </div>
                    </td>
                  )}
                  
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      {actionType === 'final-submit' && (
                        <button
                          onClick={() => handleFinalSubmit(permit.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          Final Submit
                        </button>
                      )}
                      {actionType === 'start' && (
                        <button
                          onClick={() => handleStartPermit(permit.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Start Work
                        </button>
                      )}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Supervisor Dashboard</h1>
            <p className="text-slate-600">Manage your permit-to-work documents</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-6 md:grid-cols-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Initiated</p>
                <p className="text-2xl font-bold text-yellow-600">{initiatedPermits.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{approvedPermits.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedPermits.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ready</p>
                <p className="text-2xl font-bold text-purple-600">{readyToStartPermits.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activePermits.length}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Closed</p>
                <p className="text-2xl font-bold text-gray-600">{closedPermits.length}</p>
              </div>
              <StopCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="initiated">Initiated ({initiatedPermits.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedPermits.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedPermits.length})</TabsTrigger>
            <TabsTrigger value="ready">Ready ({readyToStartPermits.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activePermits.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closedPermits.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="initiated" className="mt-4">
            <PermitTable
              permits={initiatedPermits}
              title="Initiated PTWs (Waiting for Approval)"
              emptyMessage="No PTWs waiting for approval"
              showActions={false}
              actionType="none"
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <PermitTable
              permits={approvedPermits}
              title="Approved PTWs (Ready for Final Submit)"
              emptyMessage="No PTWs ready for final submit"
              showActions={true}
              actionType="final-submit"
            />
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <PermitTable
              permits={rejectedPermits}
              title="Rejected PTWs"
              emptyMessage="No rejected PTWs"
              showActions={false}
              actionType="none"
            />
          </TabsContent>

          <TabsContent value="ready" className="mt-4">
            <PermitTable
              permits={readyToStartPermits}
              title="Ready to Start PTWs"
              emptyMessage="No PTWs ready to start"
              showActions={true}
              actionType="start"
            />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <PermitTable
              permits={activePermits}
              title="Active PTWs (Work in Progress)"
              emptyMessage="No active PTWs"
              showActions={false}
              actionType="none"
            />
          </TabsContent>

          <TabsContent value="closed" className="mt-4">
            <PermitTable
              permits={closedPermits}
              title="Closed PTWs"
              emptyMessage="No closed PTWs"
              showActions={false}
              actionType="none"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupervisorDashboard;