// frontend/src/pages/approver/ApproverDashboard.tsx
// ✅ FIXED: Status badge mapping + View button on ALL tables

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

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
  rejection_reason?: string;
  site_name?: string;
  area_manager_name?: string;
  safety_officer_name?: string;
  site_leader_name?: string;
  area_manager_status?: string;
  safety_officer_status?: string;
  site_leader_status?: string;
}

interface ApproverDashboardProps {
  initialTab?: 'pending' | 'approved' | 'rejected';
  onNavigate?: (view: string, data?: any) => void;
}

export default function ApproverDashboard({ initialTab = 'pending', onNavigate }: ApproverDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>(initialTab);
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [approverRole, setApproverRole] = useState('Approver');
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [signature, setSignature] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadApprovals = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`${baseURL}/approvals/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseURL}/approvals/approved`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseURL}/approvals/rejected`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();
      const rejectedData = await rejectedRes.json();

      console.log('📊 Loaded approvals:', {
        pending: pendingData.data?.length || 0,
        approved: approvedData.data?.length || 0,
        rejected: rejectedData.data?.length || 0
      });

      if (pendingData.success) {
        setPendingPermits(pendingData.data || []);
        setApproverRole(pendingData.approver_role || 'Approver');
      }
      if (approvedData.success) setApprovedPermits(approvedData.data || []);
      if (rejectedData.success) setRejectedPermits(rejectedData.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading approvals:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = (permit: Permit) => {
    console.log('View permit details:', permit);
    if (onNavigate) {
      onNavigate('permit-details', permit);
    } else {
      // Fallback: show details in modal or alert
      alert(`Viewing details for ${permit.permit_serial}\n\nType: ${permit.permit_type}\nLocation: ${permit.work_location}\nStatus: ${permit.status}`);
    }
  };

  const handleApprove = async () => {
    if (!selectedPermit || !signature.trim()) {
      alert('Please provide your signature');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/approvals/${selectedPermit.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signature })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Permit approved successfully!');
        setShowApproveModal(false);
        setSelectedPermit(null);
        setSignature('');
        loadApprovals();
      } else {
        alert(data.message || 'Failed to approve permit');
      }
    } catch (error) {
      console.error('Error approving permit:', error);
      alert('Error approving permit');
    }
  };

  const handleReject = async () => {
    if (!selectedPermit || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/approvals/${selectedPermit.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Permit rejected');
        setShowRejectModal(false);
        setSelectedPermit(null);
        setRejectionReason('');
        loadApprovals();
      } else {
        alert(data.message || 'Failed to reject permit');
      }
    } catch (error) {
      console.error('Error rejecting permit:', error);
      alert('Error rejecting permit');
    }
  };

  // ✅ FIXED: Updated status badge to handle ALL possible status values
  const getStatusBadge = (status: string) => {
    console.log('🏷️ Status value:', status); // Debug log
    
    // Normalize status for comparison
    const normalizedStatus = status?.toLowerCase() || '';
    
    const statusConfig: any = {
      // Pending variations
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      'pending_approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      'initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      
      // Approved variations
      'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      'fully_approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      
      // Rejected variations
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: XCircle },
      
      // Active/In Progress
      'active': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active', icon: Clock },
      'in_progress': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress', icon: Clock },
      
      // Closed/Completed
      'closed': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed', icon: CheckCircle },
      'completed': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed', icon: CheckCircle },
    };

    const config = statusConfig[normalizedStatus] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      label: status, 
      icon: AlertCircle 
    };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getApprovalStatusBadge = (status?: string, name?: string) => {
    if (!name) return <span className="text-xs text-gray-400">Not assigned</span>;

    let badge;
    if (status === 'Approved') {
      badge = <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded"><CheckCircle className="w-3 h-3" />Approved</span>;
    } else if (status === 'Rejected') {
      badge = <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded"><XCircle className="w-3 h-3" />Rejected</span>;
    } else {
      badge = <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded"><Clock className="w-3 h-3" />Pending</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-900">{name}</span>
        {badge}
      </div>
    );
  };

  // ✅ FIXED: PermitTable with View button on ALL tabs
  const PermitTable = ({ permits, showActions }: { permits: Permit[]; showActions: boolean }) => {
    const {
      currentPage,
      totalPages,
      itemsPerPage,
      paginatedData,
      setCurrentPage,
      setItemsPerPage
    } = usePagination<Permit>({
      data: permits,
      initialItemsPerPage: 10
    });

    if (permits.length === 0) {
      return (
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No permits found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">PTW ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">TYPE</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">LOCATION</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">SUPERVISOR</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">START TIME</th>
                <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">STATUS</th>
                <th className="px-4 py-3 text-xs font-semibold text-right text-gray-700 uppercase border-b">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((permit) => (
                <tr key={permit.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{permit.permit_serial}</td>
                  <td className="px-4 py-3 text-sm">{permit.permit_type}</td>
                  <td className="px-4 py-3 text-sm">{permit.work_location}</td>
                  <td className="px-4 py-3 text-sm">{permit.created_by_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(permit.start_time).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(permit.status)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      {/* ✅ VIEW BUTTON - Shows on ALL tabs */}
                      <button
                        onClick={() => handleViewDetails(permit)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                      
                      {/* ✅ APPROVE/REJECT - Only on Pending tab */}
                      {showActions && (
                        <>
                          <button
                            onClick={() => { setSelectedPermit(permit); setShowApproveModal(true); }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 transition-colors bg-green-100 rounded hover:bg-green-200"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => { setSelectedPermit(permit); setShowRejectModal(true); }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 transition-colors bg-red-100 rounded hover:bg-red-200"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={permits.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">Approver Dashboard</h1>
        <p className="mb-6 text-gray-600">Role: <strong>{approverRole}</strong></p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingPermits.length}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedPermits.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedPermits.length}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'pending' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({pendingPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'approved' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved ({approvedPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected ({rejectedPermits.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && <PermitTable permits={pendingPermits} showActions={true} />}
            {activeTab === 'approved' && <PermitTable permits={approvedPermits} showActions={false} />}
            {activeTab === 'rejected' && <PermitTable permits={rejectedPermits} showActions={false} />}
          </div>
        </div>

        {/* Approve Modal */}
        {showApproveModal && selectedPermit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
              <h3 className="mb-4 text-xl font-bold">Approve Permit</h3>
              <p className="mb-4 text-gray-600">
                Approve <strong>{selectedPermit.permit_serial}</strong>?
              </p>
              <input
                type="text"
                placeholder="Your digital signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3">
                <button 
                  onClick={handleApprove} 
                  className="flex-1 px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => { setShowApproveModal(false); setSelectedPermit(null); setSignature(''); }}
                  className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedPermit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
              <h3 className="mb-4 text-xl font-bold">Reject Permit</h3>
              <p className="mb-4 text-gray-600">
                Reject <strong>{selectedPermit.permit_serial}</strong>?
              </p>
              <textarea
                placeholder="Reason for rejection (required)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
              <div className="flex gap-3">
                <button 
                  onClick={handleReject} 
                  className="flex-1 px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => { setShowRejectModal(false); setSelectedPermit(null); setRejectionReason(''); }}
                  className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}