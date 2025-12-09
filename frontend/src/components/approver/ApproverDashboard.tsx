// frontend/src/components/approver/ApproverDashboard.tsx
// ✅ WITH DEBUG OUTPUT TO DIAGNOSE PAGINATION

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Pagination from '../common/Pagination';
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
}

export default function ApproverDashboard({ initialTab = 'pending' }: ApproverDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>(initialTab);
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);

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

      if (pendingData.success) setPendingPermits(pendingData.data || []);
      if (approvedData.success) setApprovedPermits(approvedData.data || []);
      if (rejectedData.success) setRejectedPermits(rejectedData.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading approvals:', error);
      setLoading(false);
    }
  };

  const handleApprove = (permit: Permit) => {
    setSelectedPermit(permit);
    setShowApproveModal(true);
  };

  const handleReject = (permit: Permit) => {
    setSelectedPermit(permit);
    setShowRejectModal(true);
  };

  const submitApproval = async () => {
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
        alert('Permit approved successfully!');
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

  const submitRejection = async () => {
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
        body: JSON.stringify({ reason: rejectionReason })
      });

      const data = await response.json();
      if (data.success) {
        alert('Permit rejected');
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'Pending_Approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getApprovalStatusBadge = (status?: string, name?: string) => {
    if (!name) {
      return <span className="text-xs text-gray-400">Not assigned</span>;
    }

    let badge;
    if (status === 'Approved') {
      badge = (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    } else if (status === 'Rejected') {
      badge = (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    } else {
      badge = (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-900">{name}</span>
        {badge}
      </div>
    );
  };

  const PermitTable = ({
    permits,
    showActions
  }: {
    permits: Permit[];
    showActions: boolean;
  }) => {
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

    // 🔍 DEBUG OUTPUT
    console.log('🔍 PAGINATION DEBUG:', {
      totalPermits: permits.length,
      currentPage,
      totalPages,
      itemsPerPage,
      paginatedDataLength: paginatedData.length
    });

    return (
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        {permits.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No permits found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">PTW ID</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Location</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Supervisor</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Start Time</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Area Manager</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Safety Officer</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Site Leader</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Status</th>
                    {showActions && (
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-700 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((permit) => (
                    <tr key={permit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{permit.permit_serial}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{permit.permit_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{permit.work_location}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{permit.created_by_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(permit.start_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getApprovalStatusBadge(permit.area_manager_status, permit.area_manager_name)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getApprovalStatusBadge(permit.safety_officer_status, permit.safety_officer_name)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getApprovalStatusBadge(permit.site_leader_status, permit.site_leader_name)}
                      </td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(permit.status)}</td>
                      {showActions && (
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(permit)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 transition-colors bg-green-100 rounded hover:bg-green-200"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(permit)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 transition-colors bg-red-100 rounded hover:bg-red-200"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔍 DEBUG BOX - TEMPORARY */}
            <div className="p-4 bg-yellow-100 border-t-2 border-yellow-300">
              <p className="font-bold text-yellow-900">🔍 DEBUG INFO (Remove after testing):</p>
              <p className="text-sm text-yellow-800">Total Permits: {permits.length}</p>
              <p className="text-sm text-yellow-800">Current Page: {currentPage}</p>
              <p className="text-sm text-yellow-800">Total Pages: {totalPages}</p>
              <p className="text-sm text-yellow-800">Items Per Page: {itemsPerPage}</p>
              <p className="text-sm text-yellow-800">Showing: {paginatedData.length} items</p>
            </div>

            {/* PAGINATION */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={permits.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Approver Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPermits.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedPermits.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedPermits.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'pending'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Pending ({pendingPermits.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'approved'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Approved ({approvedPermits.length})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Rejected ({rejectedPermits.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <PermitTable permits={pendingPermits} showActions={true} />
            )}
            {activeTab === 'approved' && (
              <PermitTable permits={approvedPermits} showActions={false} />
            )}
            {activeTab === 'rejected' && (
              <PermitTable permits={rejectedPermits} showActions={false} />
            )}
          </div>
        </div>

        {/* Approve Modal */}
        {showApproveModal && selectedPermit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg">
              <h3 className="mb-4 text-xl font-bold">Approve Permit</h3>
              <p className="mb-4 text-gray-600">
                Approve {selectedPermit.permit_serial}?
              </p>
              <input
                type="text"
                placeholder="Your signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={submitApproval}
                  className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedPermit(null);
                    setSignature('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
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
            <div className="w-full max-w-md p-6 bg-white rounded-lg">
              <h3 className="mb-4 text-xl font-bold">Reject Permit</h3>
              <p className="mb-4 text-gray-600">
                Reject {selectedPermit.permit_serial}?
              </p>
              <textarea
                placeholder="Rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={submitRejection}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedPermit(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
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