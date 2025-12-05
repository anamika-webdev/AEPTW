// frontend/src/pages/approver/ApproverDashboard.tsx
// COMPLETE APPROVER DASHBOARD WITH VIEW DETAILS BUTTONS

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Check, X } from 'lucide-react';

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
}

interface ApproverDashboardProps {
  onNavigate: (view: string, data?: any) => void;
  initialTab?: 'pending' | 'approved' | 'rejected';
}

export default function ApproverDashboard({ onNavigate, initialTab = 'pending' }: ApproverDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>(initialTab);
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [approverRole, setApproverRole] = useState('Approver');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [signature, setSignature] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  // Update active tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadApprovals = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Fetch pending
      const pendingRes = await fetch(`${baseURL}/approvals/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pendingData = await pendingRes.json();

      // Fetch approved
      const approvedRes = await fetch(`${baseURL}/approvals/approved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const approvedData = await approvedRes.json();

      // Fetch rejected
      const rejectedRes = await fetch(`${baseURL}/approvals/rejected`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rejectedData = await rejectedRes.json();

      console.log('✅ Loaded:', {
        pending: pendingData.count || 0,
        approved: approvedData.count || 0,
        rejected: rejectedData.count || 0
      });

      if (pendingData.success) {
        setPendingPermits(pendingData.data || []);
        setApproverRole(pendingData.approver_role || 'Approver');
      }
      if (approvedData.success) setApprovedPermits(approvedData.data || []);
      if (rejectedData.success) setRejectedPermits(rejectedData.data || []);

    } catch (error: any) {
      console.error('❌ Error loading approvals:', error);
      alert('Error loading approvals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;
    if (!signature) {
      alert('⚠️ Please provide your signature');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/approvals/${selectedPermit.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ signature })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ PTW approved successfully!');
        setShowApproveModal(false);
        setSelectedPermit(null);
        setSignature('');
        loadApprovals();
      } else {
        alert('❌ ' + (data.message || 'Failed to approve'));
      }
    } catch (error: any) {
      console.error('Error approving:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedPermit) return;
    if (!rejectionReason.trim()) {
      alert('⚠️ Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/approvals/${selectedPermit.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason,
          signature: signature || null
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ PTW rejected successfully');
        setShowRejectModal(false);
        setSelectedPermit(null);
        setRejectionReason('');
        setSignature('');
        loadApprovals();
      } else {
        alert('❌ ' + (data.message || 'Failed to reject'));
      }
    } catch (error: any) {
      console.error('Error rejecting:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
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

  const PermitTable = ({ 
    permits, 
    showActions 
  }: { 
    permits: Permit[]; 
    showActions: boolean;
  }) => (
    <div className="overflow-x-auto">
      {permits.length === 0 ? (
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No permits found</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">PTW ID</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Type</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Location</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Supervisor</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Start Time</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permits.map((permit) => (
              <tr key={permit.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{permit.permit_serial}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{permit.permit_type}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{permit.work_location}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{permit.created_by_name || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(permit.start_time).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">{getStatusBadge(permit.status)}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Details Button - Always shown */}
                    <button
                      onClick={() => onNavigate('permit-detail', { permitId: permit.id })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    {/* Approve/Reject Buttons - Only for pending */}
                    {showActions && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPermit(permit);
                            setShowApproveModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPermit(permit);
                            setShowRejectModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
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
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approver Dashboard</h1>
          <p className="text-gray-600">Review and approve PTW requests - {approverRole}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'approved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved ({approvedPermits.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rejected'
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
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending Approvals</h2>
              <PermitTable permits={pendingPermits} showActions={true} />
            </div>
          )}

          {activeTab === 'approved' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Approved by You</h2>
              <PermitTable permits={approvedPermits} showActions={false} />
            </div>
          )}

          {activeTab === 'rejected' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Rejected by You</h2>
              <PermitTable permits={rejectedPermits} showActions={false} />
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold">Approve PTW: {selectedPermit.permit_serial}</h2>
            
            <div className="p-4 mb-4 rounded bg-gray-50">
              <p className="mb-1"><strong>Location:</strong> {selectedPermit.work_location}</p>
              <p className="mb-1"><strong>Description:</strong> {selectedPermit.work_description}</p>
              <p className="mb-1"><strong>Start:</strong> {new Date(selectedPermit.start_time).toLocaleString()}</p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Digital Signature <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Approve PTW
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedPermit(null);
                  setSignature('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
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
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold text-red-600">Reject PTW: {selectedPermit.permit_serial}</h2>
            
            <div className="p-4 mb-4 rounded bg-gray-50">
              <p className="mb-1"><strong>Location:</strong> {selectedPermit.work_location}</p>
              <p className="mb-1"><strong>Description:</strong> {selectedPermit.work_description}</p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're rejecting this PTW..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Digital Signature (Optional)
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Reject PTW
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPermit(null);
                  setRejectionReason('');
                  setSignature('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}