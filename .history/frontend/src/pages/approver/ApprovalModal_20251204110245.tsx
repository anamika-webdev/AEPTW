// frontend/src/components/approver/ApprovalModal.tsx

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  FileText, 
  MapPin, 
  Calendar,
  Users,
  AlertTriangle,
  Shield,
  PenTool
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface ApprovalModalProps {
  permit: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApprovalModal({ permit, onClose, onSuccess }: ApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [permitDetails, setPermitDetails] = useState<any>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<any>(null);

  useEffect(() => {
    loadPermitDetails();
  }, [permit.id]);

  const loadPermitDetails = async () => {
    try {
      const response = await fetch(`/api/permits/${permit.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setPermitDetails(data.data);
      }
    } catch (error) {
      console.error('Error loading permit details:', error);
      alert('Failed to load permit details');
    }
  };

  const handleApprove = () => {
    setAction('approve');
    setShowSignature(true);
  };

  const handleReject = () => {
    setAction('reject');
  };

  const confirmApproval = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please add your signature to approve');
      return;
    }

    try {
      setLoading(true);
      
      const signatureData = signatureRef.current.toDataURL();
      
      const response = await fetch(`/api/approvals/${permit.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          signature: signatureData,
          approval_role: permit.approval_role
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Permit approved successfully!');
        onSuccess();
      } else {
        alert(data.message || 'Failed to approve permit');
      }
    } catch (error) {
      console.error('Error approving permit:', error);
      alert('Failed to approve permit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this permit? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/approvals/${permit.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason,
          approval_role: permit.approval_role
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('❌ Permit rejected');
        onSuccess();
      } else {
        alert(data.message || 'Failed to reject permit');
      }
    } catch (error) {
      console.error('Error rejecting permit:', error);
      alert('Failed to reject permit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  if (!permitDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-6 bg-white rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-gray-600">Loading permit details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Permit Approval - {permit.permit_serial}
            </h2>
            <p className="text-sm text-gray-600">
              Review and approve/reject this permit
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Permit Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Permit Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Permit Serial</p>
                  <p className="mt-1 text-gray-900">{permitDetails.permit_serial}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Permit Type</p>
                  <p className="mt-1">
                    <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded">
                      {permitDetails.permit_type?.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Site</p>
                  <p className="mt-1 text-gray-900">{permitDetails.site_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="mt-1 text-gray-900">{permitDetails.work_location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested By</p>
                  <p className="mt-1 text-gray-900">{permitDetails.created_by_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created On</p>
                  <p className="mt-1 text-gray-900">
                    {new Date(permitDetails.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Work Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="mt-1 text-gray-900">{permitDetails.work_description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start Time</p>
                    <p className="mt-1 text-gray-900">
                      {new Date(permitDetails.start_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">End Time</p>
                    <p className="mt-1 text-gray-900">
                      {new Date(permitDetails.end_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hazards */}
            {permitDetails.hazards && permitDetails.hazards.length > 0 && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Identified Hazards
                </h3>
                <div className="space-y-2">
                  {permitDetails.hazards.map((hazard: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="px-2 py-1 text-sm font-medium text-orange-800 bg-orange-200 rounded">
                        {hazard.name}
                      </span>
                    </div>
                  ))}
                </div>
                {permitDetails.control_measures && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Control Measures:</p>
                    <p className="mt-1 text-sm text-gray-600">{permitDetails.control_measures}</p>
                  </div>
                )}
              </div>
            )}

            {/* PPE Required */}
            {permitDetails.ppe && permitDetails.ppe.length > 0 && (
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Required PPE
                </h3>
                <div className="flex flex-wrap gap-2">
                  {permitDetails.ppe.map((ppe: any, index: number) => (
                    <span key={index} className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-200 rounded">
                      {ppe.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            {permitDetails.team_members && permitDetails.team_members.length > 0 && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-900">
                  <Users className="w-5 h-5 text-gray-600" />
                  Team Members
                </h3>
                <div className="space-y-2">
                  {permitDetails.team_members.map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <span className="font-medium text-gray-900">{member.worker_name}</span>
                      <span className="text-sm text-gray-600">{member.worker_role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Approvers Status */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Approval Status</h3>
              <div className="space-y-2">
                {permitDetails.area_manager_name && (
                  <div className="flex items-center justify-between p-3 rounded bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Area Manager</p>
                      <p className="text-sm text-gray-600">{permitDetails.area_manager_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      permitDetails.area_manager_status === 'Approved' 
                        ? 'bg-green-100 text-green-800'
                        : permitDetails.area_manager_status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {permitDetails.area_manager_status || 'Pending'}
                    </span>
                  </div>
                )}
                
                {permitDetails.safety_officer_name && (
                  <div className="flex items-center justify-between p-3 rounded bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Safety Officer</p>
                      <p className="text-sm text-gray-600">{permitDetails.safety_officer_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      permitDetails.safety_officer_status === 'Approved' 
                        ? 'bg-green-100 text-green-800'
                        : permitDetails.safety_officer_status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {permitDetails.safety_officer_status || 'Pending'}
                    </span>
                  </div>
                )}
                
                {permitDetails.site_leader_name && (
                  <div className="flex items-center justify-between p-3 rounded bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">Site Leader</p>
                      <p className="text-sm text-gray-600">{permitDetails.site_leader_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      permitDetails.site_leader_status === 'Approved' 
                        ? 'bg-green-100 text-green-800'
                        : permitDetails.site_leader_status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {permitDetails.site_leader_status || 'Pending'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-gray-200">
          {!action && (
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex items-center justify-center flex-1 gap-2 px-6 py-3 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-5 h-5" />
                Reject Permit
              </button>
              
              <button
                onClick={handleApprove}
                className="flex items-center justify-center flex-1 gap-2 px-6 py-3 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5" />
                Approve Permit
              </button>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a detailed reason for rejection..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-6 py-2 font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejection}
                  disabled={loading}
                  className="flex-1 px-6 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}

          {/* Signature Pad */}
          {action === 'approve' && showSignature && (
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Your Signature *
                </label>
                <div className="border-2 border-gray-300 rounded-lg">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full h-40 rounded-lg bg-white',
                    }}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Signature
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAction(null);
                    setShowSignature(false);
                  }}
                  className="flex-1 px-6 py-2 font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApproval}
                  disabled={loading}
                  className="flex-1 px-6 py-2 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}