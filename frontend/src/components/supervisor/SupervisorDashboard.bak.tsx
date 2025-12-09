// src/components/supervisor/SupervisorDashboard.tsx
import { useState, useEffect } from 'react';
import { FileText, Users, PlayCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { StatCard } from '../shared/StatCard';
import { permitsAPI, dashboardAPI } from '../../services/api.bak.ts';
import type { Permit, SupervisorDashboardStats } from '../../types';

interface SupervisorDashboardProps {
  onNavigate: (page: string) => void;
}

export function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  const [stats, setStats] = useState<SupervisorDashboardStats>({
    total_permits: 0,
    initiated_permits: 0,
    approved_permits: 0,
    in_progress_permits: 0,
    closed_permits: 0,
    total_workers: 0,
  });

  const [permits, setPermits] = useState<Permit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load dashboard stats and permits in parallel
      const [statsRes, permitsRes] = await Promise.all([
        dashboardAPI.getSupervisorStats(),
        permitsAPI.getMySupervisorPermits(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (permitsRes.success && permitsRes.data) {
        setPermits(permitsRes.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter permits by status
  const initiatedPermits = permits.filter(p => p.status === 'Draft' || p.status === 'Pending_Approval');
  const approvedPermits = permits.filter(p => p.status === 'Pending_Approval' && 
    p.approvals?.some(a => a.status === 'Approved'));
  const inProgressPermits = permits.filter(p => p.status === 'Active');
  const closedPermits = permits.filter(p => p.status === 'Closed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Pending_Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Active':
        return 'bg-orange-100 text-orange-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  interface PTWTableProps {
    ptws: Permit[];
    emptyMessage: string;
  }

  const PTWTable = ({ ptws, emptyMessage }: PTWTableProps) => (
    <div className="overflow-x-auto">
      {ptws.length === 0 ? (
        <p className="py-8 text-center text-slate-500">{emptyMessage}</p>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-left uppercase text-slate-500">Permit ID</th>
              <th className="px-4 py-3 text-xs font-medium text-left uppercase text-slate-500">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-left uppercase text-slate-500">Location</th>
              <th className="px-4 py-3 text-xs font-medium text-left uppercase text-slate-500">Start Date</th>
              <th className="px-4 py-3 text-xs font-medium text-left uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-left uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ptws.map((ptw) => (
              <tr key={ptw.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{ptw.permit_serial}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{ptw.permit_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{ptw.work_location}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(ptw.start_time)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ptw.status)}`}>
                    {formatStatus(ptw.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    onClick={() => onNavigate(`permit-details-${ptw.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <p className="text-slate-600">Manage and monitor your work permits</p>
        </div>
        <Button
          onClick={() => onNavigate('create-ptw')}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <FileText className="w-4 h-4" />
          Create New PTW
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
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
            title="Initiated"
            value={stats.initiated_permits}
            icon={<PlayCircle className="w-5 h-5" />}
            color="yellow"
          />
        </div>
        <div>
          <StatCard
            title="Approved"
            value={stats.approved_permits}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
        </div>
        <div>
          <StatCard
            title="In Progress"
            value={stats.in_progress_permits}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
        </div>
        <div>
          <StatCard
            title="Closed"
            value={stats.closed_permits}
            icon={<XCircle className="w-5 h-5" />}
            color="gray"
          />
        </div>
      </div>

      {/* Initiated PTWs */}
      <div className="p-4 bg-white border rounded-xl border-slate-200 md:p-6">
        <h3 className="mb-4 text-slate-900">Initiated PTWs</h3>
        <PTWTable ptws={initiatedPermits} emptyMessage="No initiated permits" />
      </div>

      {/* Approved PTWs */}
      <div className="p-4 bg-white border rounded-xl border-slate-200 md:p-6">
        <h3 className="mb-4 text-slate-900">Approved PTWs</h3>
        <PTWTable ptws={approvedPermits} emptyMessage="No approved permits" />
      </div>

      {/* In Progress PTWs */}
      <div className="p-4 bg-white border rounded-xl border-slate-200 md:p-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-slate-900">In Progress PTWs</h3>
          <span className="text-sm text-slate-600">
            {inProgressPermits.length} active work{inProgressPermits.length !== 1 ? 's' : ''}
          </span>
        </div>
        <PTWTable ptws={inProgressPermits} emptyMessage="No in-progress permits" />
      </div>

      {/* Closed PTWs */}
      <div className="p-4 bg-white border rounded-xl border-slate-200 md:p-6">
        <h3 className="mb-4 text-slate-900">Closed PTWs</h3>
        <PTWTable ptws={closedPermits} emptyMessage="No closed permits" />
      </div>
    </div>
  );
}