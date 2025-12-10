// frontend/src/components/approver/ApproverDashboard.tsx
// ENHANCED VERSION - Digital Signature + Notes for BOTH Approve and Reject

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  MapPin,
  X
} from 'lucide-react';

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  site_name: string;
  created_at: string;
  start_time: string;
  end_time: string;
  my_approval_status: string;
  area_manager_status: string | null;
  safety_officer_status: string | null;
  site_leader_status: string | null;
  created_by_name: string;
  created_by_email: string;
  area_manager_name: string | null;
  safety_officer_name: string | null;
  site_leader_name: string | null;
  team_member_count: number;
}

export default function ApproverDashboard() {
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Form states
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas refs
  const approveCanvasRef = useRef<HTMLCanvasElement>(null);
  const rejectCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Fetch pending approvals
      const pendingRes = await fetch(`${baseURL}/approvals/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pendingData = await pendingRes.json();
      if (pendingData.success) {
        setPendingPermits(pendingData.data);
      }

      // Fetch approved approvals
      const approvedRes = await fetch(`${baseURL}/approvals/approved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const approvedData = await approvedRes.json();
      if (approvedData.success) {
        setApprovedPermits(approvedData.data);
      }

      // Fetch rejected approvals
      const rejectedRes = await fetch(`${baseURL}/approvals/rejected`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rejectedData = await rejectedRes.json();
      if (rejectedData.success) {
        setRejectedPermits(rejectedData.data);
      }

    } catch (error) {
      console.error('Error loading approvals:', error);
      alert('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (permit: Permit) => {
    setSelectedPermit(permit);
    setApprovalNotes('');
    setShowApproveModal(true);
    // Initialize canvas after modal opens
    setTimeout(() => initializeCanvas(approveCanvasRef), 100);
  };

  const handleRejectClick = (permit: Permit) => {
    setSelectedPermit(permit);
    setRejectionNotes('');
    setShowRejectModal(true);
    // Initialize canvas after modal opens
    setTimeout(() => initializeCanvas(rejectCanvasRef), 100);
  };

  const initializeCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and reset to white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
  };

  const isCanvasEmpty = (canvasRef: React.RefObject<HTMLCanvasElement>): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check if all pixels are white (255, 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        return false; // Found a non-white pixel
      }
    }
    return true;
  };

  const submitApproval = async () => {
    if (!selectedPermit) return;

    // Validate signature
    if (isCanvasEmpty(approveCanvasRef)) {
      alert('Please add your signature to approve');
      return;
    }

    const canvas = approveCanvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/approvals/${selectedPermit.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signature: signatureData,
          comments: approvalNotes.trim() || null
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Permit approved successfully');
        setShowApproveModal(false);
        setSelectedPermit(null);
        setApprovalNotes('');
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
    if (!selectedPermit) return;

    // Validate rejection reason
    if (!rejectionNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    // Validate signature
    if (isCanvasEmpty(rejectCanvasRef)) {
      alert('Please add your signature to confirm rejection');
      return;
    }

    const canvas = rejectCanvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${baseURL}/approvals/${selectedPermit.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionNotes.trim(),
          signature: signatureData
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Permit rejected');
        setShowRejectModal(false);
        setSelectedPermit(null);
        setRejectionNotes('');
        loadApprovals();
      } else {
        alert(data.message || 'Failed to reject permit');
      }
    } catch (error) {
      console.error('Error rejecting permit:', error);
      alert('Error rejecting permit');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
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

  const renderPermitTable = (permits: Permit[], showActions: boolean) => {
    if (permits.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          No permits found
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                PTW Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Work Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Approval Status
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {permits.map((permit) => (
              <tr key={permit.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{permit.permit_serial}</div>
                      <div className="text-xs text-slate-500">{permit.permit_type}</div>
                      <div className="text-xs text-slate-500">{permit.site_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-900">{permit.work_location}</div>
                      <div className="text-xs text-slate-500 max-w-xs truncate">
                        {permit.work_description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">Start:</span>
                    </div>
                    <div className="text-xs text-slate-700">{formatDate(permit.start_time)}</div>
                    <div className="flex items-center gap-1 text-slate-600 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">End:</span>
                    </div>
                    <div className="text-xs text-slate-700">{formatDate(permit.end_time)}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-900">{permit.created_by_name}</div>
                      <div className="text-xs text-slate-500">{formatDate(permit.created_at)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {permit.area_manager_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Area Mgr:</span>
                        {getStatusBadge(permit.area_manager_status || 'Pending')}
                      </div>
                    )}
                    {permit.safety_officer_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Safety:</span>
                        {getStatusBadge(permit.safety_officer_status || 'Pending')}
                      </div>
                    )}
                    {permit.site_leader_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Site Leader:</span>
                        {getStatusBadge(permit.site_leader_status || 'Pending')}
                      </div>
                    )}
                  </div>
                </td>
                {showActions && (
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveClick(permit)}
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(permit)}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
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
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PTW Approvals</h1>
          <p className="text-sm text-slate-600 mt-1">Review and approve permit to work requests</p>
        </div>
        <button
          onClick={loadApprovals}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingPermits.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-900">{approvedPermits.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-900">{rejectedPermits.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            Pending ({pendingPermits.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            Approved ({approvedPermits.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            Rejected ({rejectedPermits.length})
          </button>
        </nav>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'pending' && renderPermitTable(pendingPermits, true)}
        {activeTab === 'approved' && renderPermitTable(approvedPermits, false)}
        {activeTab === 'rejected' && renderPermitTable(rejectedPermits, false)}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedPermit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Approve Permit</h3>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedPermit(null);
                  setApprovalNotes('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>PTW Serial:</strong> {selectedPermit.permit_serial}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Work Location:</strong> {selectedPermit.work_location}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Requested By:</strong> {selectedPermit.created_by_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes / Comments (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Add any comments or conditions for this approval..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  e.g., "Approved subject to daily safety inspections" or "All PPE requirements verified"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Digital Signature <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-slate-300 rounded-lg bg-white">
                  <canvas
                    ref={approveCanvasRef}
                    width={600}
                    height={150}
                    onMouseDown={(e) => startDrawing(e, approveCanvasRef)}
                    onMouseMove={(e) => draw(e, approveCanvasRef)}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <button
                  onClick={() => clearSignature(approveCanvasRef)}
                  className="mt-2 px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                >
                  Clear Signature
                </button>
                <p className="text-xs text-slate-500 mt-1">
                  Draw your signature above using your mouse or touchpad
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedPermit(null);
                  setApprovalNotes('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Permit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPermit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Reject Permit</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPermit(null);
                  setRejectionNotes('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      You are about to reject PTW {selectedPermit.permit_serial}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      This action cannot be undone. The supervisor will need to address your concerns and resubmit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-900">
                  <strong>Work Location:</strong> {selectedPermit.work_location}
                </p>
                <p className="text-sm text-slate-900 mt-1">
                  <strong>Requested By:</strong> {selectedPermit.created_by_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="Provide a detailed reason for rejection..."
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Be specific about what needs to be corrected or improved
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Digital Signature <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-slate-300 rounded-lg bg-white">
                  <canvas
                    ref={rejectCanvasRef}
                    width={600}
                    height={150}
                    onMouseDown={(e) => startDrawing(e, rejectCanvasRef)}
                    onMouseMove={(e) => draw(e, rejectCanvasRef)}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <button
                  onClick={() => clearSignature(rejectCanvasRef)}
                  className="mt-2 px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                >
                  Clear Signature
                </button>
                <p className="text-xs text-slate-500 mt-1">
                  Your signature confirms this rejection decision
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPermit(null);
                  setRejectionNotes('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Permit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}