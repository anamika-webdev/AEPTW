// frontend/src/pages/approver/ApproverDashboard.tsx
// ✅ FIXED TYPO: setItemsPerPageChange → setItemsPerPage

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
}

export default function ApproverDashboard({ initialTab = 'pending' }: ApproverDashboardProps) {
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
    const config: any = {
      'Pending_Approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };
    const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
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

  // ✅ FIXED: setItemsPerPageChange → setItemsPerPage
  const PermitTable = ({ permits, showActions }: { permits: Permit[]; showActions: boolean }) => {
    const {
      currentPage,
      totalPages,
      itemsPerPage,
      paginatedData,
      setCurrentPage,
      setItemsPerPage  // ✅ FIXED TYPO HERE
    } = usePagination<Permit>({
      data: permits,
      initialItemsPerPage: 10
    });

    // 🔍 DEBUG
    console.log('🔍 PAGINATION:', {
      total: permits.length,
      currentPage,
      totalPages,
      showing: paginatedData.length
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
                {showActions && <th className="px-4 py-3 text-xs font-semibold text-right text-gray-700 uppercase border-b">ACTIONS</th>}
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
                  {showActions && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedPermit(permit); setShowApproveModal(true); }}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          👁️ View Details
                        </button>
                        <button
                          onClick={() => { setSelectedPermit(permit); setShowApproveModal(true); }}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => { setSelectedPermit(permit); setShowRejectModal(true); }}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                        >
                          × Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔍 DEBUG BOX - BRIGHT YELLOW */}
        <div className="p-6 bg-yellow-300 border-4 border-yellow-600 rounded-lg">
          <p className="mb-2 text-xl font-bold text-yellow-900">🔍 PAGINATION DEBUG (DELETE THIS AFTER TESTING)</p>
          <p className="text-lg text-yellow-900">Total Permits: <strong>{permits.length}</strong></p>
          <p className="text-lg text-yellow-900">Current Page: <strong>{currentPage}</strong></p>
          <p className="text-lg text-yellow-900">Total Pages: <strong>{totalPages}</strong></p>
          <p className="text-lg text-yellow-900">Items Per Page: <strong>{itemsPerPage}</strong></p>
          <p className="text-lg text-yellow-900">Showing: <strong>{paginatedData.length}</strong> items</p>
        </div>

        {/* ✅ PAGINATION COMPONENT */}
        <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg">
          <p className="mb-2 font-bold text-blue-900">PAGINATION SHOULD BE BELOW THIS LINE:</p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={permits.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
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
              className={`px-6 py-4 font-medium border-b-2 ${
                activeTab === 'pending' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500'
              }`}
            >
              Pending ({pendingPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-4 font-medium border-b-2 ${
                activeTab === 'approved' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
              }`}
            >
              Approved ({approvedPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-4 font-medium border-b-2 ${
                activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'
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
            <div className="w-full max-w-md p-6 bg-white rounded-lg">
              <h3 className="mb-4 text-xl font-bold">Approve Permit</h3>
              <p className="mb-4">Approve {selectedPermit.permit_serial}?</p>
              <input
                type="text"
                placeholder="Your signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full px-4 py-2 mb-4 border rounded"
              />
              <div className="flex gap-3">
                <button onClick={handleApprove} className="flex-1 px-4 py-2 text-white bg-green-600 rounded">
                  Approve
                </button>
                <button
                  onClick={() => { setShowApproveModal(false); setSignature(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded"
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
              <p className="mb-4">Reject {selectedPermit.permit_serial}?</p>
              <textarea
                placeholder="Rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 mb-4 border rounded"
                rows={4}
              />
              <div className="flex gap-3">
                <button onClick={handleReject} className="flex-1 px-4 py-2 text-white bg-red-600 rounded">
                  Reject
                </button>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded"
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