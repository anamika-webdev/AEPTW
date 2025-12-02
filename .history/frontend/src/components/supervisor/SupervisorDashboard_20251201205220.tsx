// frontend/src/components/supervisor/SupervisorDashboard.tsx - WITH WORKING BUTTONS
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { FileText, Users, CheckCircle2, Clock, XCircle, Play, Eye, ArrowRight, CheckSquare } from 'lucide-react';
import { dashboardAPI, permitsAPI } from '../../services/api';
import type { Permit, SupervisorDashboardStats } from '../../types';

interface SupervisorDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'slate' | 'red';
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  const [stats, setStats] = useState<SupervisorDashboardStats>({
    total_permits: 0,
    initiated_permits: 0,
    approved_permits: 0,
    in_progress_permits: 0,
    closed_permits: 0,
    total_workers: 0
  });
  
  const [allPermits, setAllPermits] = useState<Permit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading supervisor dashboard data...');

      const [statsRes, permitsRes] = await Promise.all([
        dashboardAPI.getSupervisorStats().catch(err => {
          console.error('❌ Stats API error:', err);
          return { success: false, data: null };
        }),
        permitsAPI.getMySupervisorPermits().catch(err => {
          console.error('❌ Permits API error:', err);
          return { success: false, data: [] };
        })
      ]);

      if (statsRes.success && statsRes.data) {
        console.log('✅ Stats loaded:', statsRes.data);
        setStats(statsRes.data);
      }

      if (permitsRes.success && permitsRes.data) {
        console.log('✅ Permits loaded:', permitsRes.data.length);
        setAllPermits(Array.isArray(permitsRes.data) ? permitsRes.data : []);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter permits by status
  const approvedPermits = allPermits.filter(p => 
    p.status === 'Pending_Approval' || p.status === 'Active'
  );
  
  const inProgressPermits = allPermits.filter(p => 
    p.status === 'Active' || p.status === 'Extension_Requested'
  );
  
  const closedPermits = allPermits.filter(p => 
    p.status === 'Closed'
  );

  // Handler functions
  const handleViewPermit = (permit: Permit) => {
    console.log('📄 Viewing permit:', permit.id);
    // Navigate to permit detail page (you'll create this)
    onNavigate('permit-detail', { permitId: permit.id });
  };

  const handleExtendPermit = async (permit: Permit) => {
    console.log('⏱️ Extending permit:', permit.id);
    
    // Simple prompt for now - you can make a modal later
    const newEndTime = prompt('Enter new end date/time (YYYY-MM-DD HH:MM):');
    const reason = prompt('Enter reason for extension:');
    
    if (!newEndTime || !reason) {
      alert('Extension cancelled');
      return;
    }

    try {
      const response = await permitsAPI.requestExtension(permit.id, {
        new_end_time: newEndTime,
        reason: reason
      });

      if (response.success) {
        alert('✅ Extension requested successfully!');
        loadDashboardData(); // Reload data
      } else {
        alert('❌ Failed to request extension: ' + response.message);
      }
    } catch (error) {
      console.error('Error requesting extension:', error);
      alert('❌ Error requesting extension');
    }
  };

  const handleClosePermit = async (permit: Permit) => {
    console.log('🔒 Closing permit:', permit.id);
    
    const confirmClose = confirm(
      `Are you sure you want to close permit ${permit.permit_serial || permit.id}?\n\n` +
      `Location: ${permit.work_location}\n` +
      `This action cannot be undone.`
    );

    if (!confirmClose) return;

    // Closure checklist
    const housekeepingDone = confirm('✓ Housekeeping completed?');
    const toolsRemoved = confirm('✓ Tools and equipment removed?');
    const locksRemoved = confirm('✓ Locks/tags removed?');
    const areaRestored = confirm('✓ Area restored to normal?');
    const remarks = prompt('Enter any final remarks (optional):');

    try {
      const response = await permitsAPI.close(permit.id, {
        housekeeping_done: housekeepingDone,
        tools_removed: toolsRemoved,
        locks_removed: locksRemoved,
        area_restored: areaRestored,
        remarks: remarks || ''
      });

      if (response.success) {
        alert('✅ Permit closed successfully!');
        loadDashboardData(); // Reload data
      } else {
        alert('❌ Failed to close permit: ' + response.message);
      }
    } catch (error) {
      console.error('Error closing permit:', error);
      alert('❌ Error closing permit');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'Draft': { label: 'Draft', className: 'bg-slate-100 text-slate-800' },
      'Pending_Approval': { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
      'Active': { label: 'Active', className: 'bg-green-100 text-green-800' },
      'Extension_Requested': { label: 'Extension', className: 'bg-purple-100 text-purple-800' },
      'Suspended': { label: 'Suspended', className: 'bg-orange-100 text-orange-800' },
      'Closed': { label: 'Closed', className: 'bg-blue-100 text-blue-800' },
      'Cancelled': { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      'Rejected': { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Regular table for Approved, Closed, and All Permits
  const PermitTable = ({ 
    permits, 
    title, 
    emptyMessage 
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
                        <span key={idx} className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {permit.work_location || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {permit.team_members?.length || permit.team_member_count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(permit.start_time)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(permit.status)}
                  </td>
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
                        <span key={idx} className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {permit.work_location || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {permit.team_members?.length || permit.team_member_count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(permit.start_time)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(permit.status)}
                  </td>
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
                        className="gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
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
    </div>
  );
}
