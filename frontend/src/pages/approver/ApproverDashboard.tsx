// frontend/src/pages/approver/ApproverDashboard.tsx
// ✅ USES SAME NAVIGATION AS SUPERVISOR DASHBOARD

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { approvalsAPI } from '../../services/api';

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
  rejection_reason?: string | null;
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
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        approvalsAPI.getPending(),
        approvalsAPI.getApproved(),
        approvalsAPI.getRejected()
      ]);

      if (pendingRes.success) {
        setPendingPermits(pendingRes.data || []);
        // Note: approver_role is in the response but typed as any due to loose typing in api.ts responses? 
        // We'll trust it matches our expected structure or fallback
        setApproverRole((pendingRes as any).approver_role || 'Approver');
      }
      if (approvedRes.success) setApprovedPermits(approvedRes.data || []);
      if (rejectedRes.success) setRejectedPermits(rejectedRes.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading approvals:', error);
      setLoading(false);
    }
  };

  // ✅ SAME AS SUPERVISOR DASHBOARD - Navigate to permit detail page
  const handleViewDetails = (permit: Permit) => {
    if (onNavigate) {
      onNavigate('permit-detail', { permitId: permit.id });
    } else {
      console.warn('onNavigate not provided to ApproverDashboard');
      alert(`View details for ${permit.permit_serial}\n\nPlease ensure ApproverDashboard has onNavigate prop.`);
    }
  };

  const handleApprove = async () => {
    if (!selectedPermit || !signature.trim()) {
      alert('Please provide your signature');
      return;
    }

    try {
      const response = await approvalsAPI.approve(selectedPermit.id, signature);

      if (response.success) {
        alert('✅ Permit approved successfully!');
        setShowApproveModal(false);
        setSelectedPermit(null);
        setSignature('');
        loadApprovals();
      } else {
        alert(response.message || 'Failed to approve permit');
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
      // API service expects: permitId, rejectionCount, signature (optional)
      const response = await approvalsAPI.reject(selectedPermit.id, rejectionReason);

      if (response.success) {
        alert('✅ Permit rejected');
        setShowRejectModal(false);
        setSelectedPermit(null);
        setRejectionReason('');
        loadApprovals();
      } else {
        alert(response.message || 'Failed to reject permit');
      }
    } catch (error) {
      console.error('Error rejecting permit:', error);
      alert('Error rejecting permit');
    }
  };



  // ✅ PermitTable WITHOUT Status Column
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
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      {/* ✅ VIEW BUTTON - Same as Supervisor Dashboard */}
                      <button
                        onClick={() => handleViewDetails(permit)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>

                      {/* APPROVE/REJECT - Only on Pending tab */}
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
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Pending ({pendingPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'approved' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Approved ({approvedPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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