// frontend/src/pages/supervisor/SupervisorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, PlayCircle, CheckCircle, 
  Clock, XCircle, Plus, CalendarClock, AlertCircle 
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'slate' | 'purple';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    slate: 'bg-slate-50 text-slate-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(status)}`}>
      {displayStatus}
    </span>
  );
};

export default function SupervisorDashboard() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    ptwIssued: 0,
    initiated: 0,
    approved: 0,
    inProgress: 0,
    closed: 0,
  });
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'workers' | 'create'>('dashboard');
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch permits
      const permitsRes = await axios.get(`${API_URL}/permits/my-permits`, { headers });
      const myPermits = permitsRes.data;
      
      setPermits(myPermits);

      // Calculate stats
      const initiated = myPermits.filter((p: any) => p.status === 'Initiated').length;
      const approved = myPermits.filter((p: any) => p.status === 'Approved').length;
      const inProgress = myPermits.filter((p: any) => p.status === 'In_Progress').length;
      const closed = myPermits.filter((p: any) => p.status === 'Closed').length;

      setStats({
        totalWorkers: 0, // Will be updated when we fetch workers
        ptwIssued: myPermits.length,
        initiated,
        approved,
        inProgress,
        closed,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General Work': 'bg-blue-100 text-blue-800',
      'Work at Height': 'bg-orange-100 text-orange-800',
      'Electrical Work': 'bg-yellow-100 text-yellow-800',
      'Hot Work': 'bg-red-100 text-red-800',
      'Confined Space': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supervisor Dashboard</h1>
          <p className="mt-1 text-slate-600">Manage your permits and workers</p>
        </div>
        <button
          onClick={() => setCurrentView('create')}
          className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create New PTW
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          title="Total Workers"
          value={stats.totalWorkers}
          icon={Users}
          color="blue"
          onClick={() => setCurrentView('workers')}
        />
        <StatCard
          title="PTW Issued"
          value={stats.ptwIssued}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Initiated"
          value={stats.initiated}
          icon={PlayCircle}
          color="slate"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={XCircle}
          color="purple"
        />
      </div>

      {/* Initiated PTWs */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Initiated PTWs</h3>
        <PermitTable 
          permits={permits.filter(p => p.status === 'Initiated')} 
          emptyMessage="No initiated permits"
          onSelectPermit={setSelectedPermitId}
        />
      </div>

      {/* Approved PTWs */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Approved PTWs</h3>
        <PermitTable 
          permits={permits.filter(p => p.status === 'Approved')} 
          emptyMessage="No approved permits"
          onSelectPermit={setSelectedPermitId}
        />
      </div>

      {/* In Progress PTWs */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">In Progress PTWs</h3>
        <PermitTable 
          permits={permits.filter(p => p.status === 'In_Progress')} 
          emptyMessage="No permits in progress"
          onSelectPermit={setSelectedPermitId}
          showActions
        />
      </div>

      {/* Closed PTWs */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Closed PTWs</h3>
        <PermitTable 
          permits={permits.filter(p => p.status === 'Closed')} 
          emptyMessage="No closed permits"
          onSelectPermit={setSelectedPermitId}
        />
      </div>
    </div>
  );

  const renderWorkersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workers List</h1>
          <p className="mt-1 text-slate-600">View and manage your team</p>
        </div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 transition-colors text-slate-600 hover:text-slate-900"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Worker list will be loaded from the backend API</p>
        </div>
        <p className="py-8 text-center text-slate-500">No workers assigned yet</p>
      </div>
    </div>
  );

  const renderCreatePTW = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New PTW</h1>
          <p className="mt-1 text-slate-600">Fill out the permit form</p>
        </div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 transition-colors text-slate-600 hover:text-slate-900"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="p-6 bg-white border rounded-xl border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Create PTW form will be implemented here</p>
        </div>
        <p className="py-8 text-center text-slate-500">PTW creation form coming soon</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'workers' && renderWorkersList()}
        {currentView === 'create' && renderCreatePTW()}
      </div>
    </div>
  );
}

// Permit Table Component
interface PermitTableProps {
  permits: any[];
  emptyMessage: string;
  onSelectPermit: (id: number) => void;
  showActions?: boolean;
}

const PermitTable: React.FC<PermitTableProps> = ({ 
  permits, 
  emptyMessage, 
  onSelectPermit, 
  showActions = false 
}) => {
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General Work': 'bg-blue-100 text-blue-800',
      'Work at Height': 'bg-orange-100 text-orange-800',
      'Electrical Work': 'bg-yellow-100 text-yellow-800',
      'Hot Work': 'bg-red-100 text-red-800',
      'Confined Space': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  if (permits.length === 0) {
    return <p className="py-8 text-center text-slate-500">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b bg-slate-50 border-slate-200">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">PTW Number</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Category</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Location</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Start Date</th>
              <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Status</th>
              {showActions && (
                <th className="px-4 py-3 text-xs font-medium text-left text-slate-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {permits.map((permit) => (
              <tr 
                key={permit.permit_id} 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSelectPermit(permit.permit_id)}
              >
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {permit.permit_number}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(permit.work_category)}`}>
                    {permit.work_category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {permit.work_location}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(permit.start_datetime).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={permit.status} />
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Extend permit:', permit.permit_id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-700 transition-colors border border-blue-200 rounded bg-blue-50 hover:bg-blue-100"
                      >
                        Extend
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Close permit:', permit.permit_id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-red-700 transition-colors border border-red-200 rounded bg-red-50 hover:bg-red-100"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {permits.map((permit) => (
          <div
            key={permit.permit_id}
            onClick={() => onSelectPermit(permit.permit_id)}
            className="p-4 transition-colors rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-medium text-slate-900">{permit.permit_number}</p>
              <StatusBadge status={permit.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(permit.work_category)}`}>
                  {permit.work_category}
                </span>
              </div>
              <p className="text-slate-600">📍 {permit.work_location}</p>
              <p className="text-slate-600">📅 {new Date(permit.start_datetime).toLocaleDateString()}</p>
            </div>
            {showActions && (
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Extend permit:', permit.permit_id);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 transition-colors border border-blue-200 rounded bg-blue-50 hover:bg-blue-100"
                >
                  Extend
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Close permit:', permit.permit_id);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-700 transition-colors border border-red-200 rounded bg-red-50 hover:bg-red-100"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};