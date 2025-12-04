// frontend/src/pages/approver/ApproverDashboard.tsx

import { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  AlertCircle,
  Eye,
  Filter,
  Search
} from 'lucide-react';

interface Permit {
  id: number;
  permit_serial: string;
  site_name: string;
  work_location: string;
  work_description: string;
  permit_type: string;
  created_by_name: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  my_approval_status?: 'Pending' | 'Approved' | 'Rejected';
  approval_role: 'Area_Manager' | 'Safety_Officer' | 'Site_Leader';
}

interface ApprovalStats {
  pending_approvals: number;
  approved_today: number;
  total_approved: number;
  total_rejected: number;
}

export default function ApproverDashboard() {
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    pending_approvals: 0,
    approved_today: 0,
    total_approved: 0,
    total_rejected: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    loadApproverData();
  }, []);

  const loadApproverData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, pendingRes, approvedRes] = await Promise.all([
        fetch('/api/approvals/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/approvals/pending', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/approvals/approved', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();

      if (statsData.success) setStats(statsData.data);
      if (pendingData.success) setPendingPermits(pendingData.data);
      if (approvedData.success) setApprovedPermits(approvedData.data);
      
    } catch (error) {
      console.error('Error loading approver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (permit: Permit) => {
    setSelectedPermit(permit);
    setShowApprovalModal(true);
  };

  const getFilteredPermits = () => {
    let permits: Permit[] = [];
    
    if (selectedTab === 'pending') {
      permits = pendingPermits;
    } else if (selectedTab === 'approved') {
      permits = approvedPermits;
    } else {
      permits = [...pendingPermits, ...approvedPermits];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      permits = permits.filter(p => 
        p.permit_serial.toLowerCase().includes(query) ||
        p.work_location.toLowerCase().includes(query) ||
        p.created_by_name.toLowerCase().includes(query)
      );
    }

    return permits;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'Pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'Approved': { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300' },
      'Rejected': { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300' },
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      'Area_Manager': { label: 'Area Manager', className: 'bg-blue-100 text-blue-800' },
      'Safety_Officer': { label: 'Safety Officer', className: 'bg-purple-100 text-purple-800' },
      'Site_Leader': { label: 'Site Leader', className: 'bg-orange-100 text-orange-800' },
    };

    const config = roleConfig[role] || { label: role, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading approvals...</p>
        </div>
      </div>
    );
  }

  const filteredPermits = getFilteredPermits();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and approve pending permit requests
          </p>
        </div>
        
        {stats.pending_approvals > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
            <Bell className="w-5 h-5 text-yellow-600 animate-pulse" />
            <span className="font-semibold text-yellow-800">
              {stats.pending_approvals} Pending Approval{stats.pending_approvals !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {stats.pending_approvals}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {stats.approved_today}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Approved</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {stats.total_approved}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {stats.total_rejected}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by permit ID, location, or requester..."
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'pending'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingPermits.length})
            </div>
          </button>

          <button
            onClick={() => setSelectedTab('approved')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'approved'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedPermits.length})
            </div>
          </button>

          <button
            onClick={() => setSelectedTab('all')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              All ({pendingPermits.length + approvedPermits.length})
            </div>
          </button>
        </div>
      </div>

      {/* Permits List */}
      <div className="space-y-4">
        {filteredPermits.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              {selectedTab === 'pending' 
                ? 'No pending approvals'
                : searchQuery
                ? 'No permits found matching your search'
                : 'No permits to display'
              }
            </p>
          </div>
        ) : (
          filteredPermits.map((permit) => (
            <div
              key={permit.id}
              className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {permit.permit_serial}
                    </h3>
                    {getStatusBadge(permit.my_approval_status || 'Pending')}
                    {getRoleBadge(permit.approval_role)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Site:</span>
                      <span>{permit.site_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Location:</span>
                      <span>{permit.work_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Type:</span>
                      <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded">
                        {permit.permit_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Requested by:</span>
                      <span>{permit.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Duration:</span>
                      <span>
                        {new Date(permit.start_time).toLocaleString()} - {new Date(permit.end_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleViewDetails(permit)}
                    className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View & {permit.my_approval_status === 'Pending' ? 'Approve' : 'Review'}
                  </button>

                  {permit.my_approval_status === 'Pending' && (
                    <div className="px-3 py-2 text-xs font-medium text-center text-yellow-700 bg-yellow-100 rounded">
                      Action Required
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal - Will be imported */}
      {showApprovalModal && selectedPermit && (
        <ApprovalModal
          permit={selectedPermit}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedPermit(null);
          }}
          onSuccess={() => {
            setShowApprovalModal(false);
            setSelectedPermit(null);
            loadApproverData();
          }}
        />
      )}
    </div>
  );
}

// Placeholder for ApprovalModal - will be created next
function ApprovalModal({ permit, onClose, onSuccess }: any) {
  return <div>Modal coming next...</div>;
}