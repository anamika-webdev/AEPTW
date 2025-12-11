// frontend/src/pages/approver/ApproverDashboard.tsx
// ✅ UPDATED WITH APPROVAL/REJECTION DETAILS DISPLAY

import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Eraser, PenTool, Layout, Calendar } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { approvalsAPI } from '../../services/api';
import ExtensionApprovalDashboard from '../../components/approver/ExtensionApprovalDashboard';

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
  // ✅ ADDED: Fields for displaying approval/rejection details
  my_signature?: string;
  area_manager_comments?: string;
  safety_officer_comments?: string;
  site_leader_comments?: string;
  area_manager_signature?: string;
  safety_officer_signature?: string;
  site_leader_signature?: string;
}

interface ApproverDashboardProps {
  initialTab?: 'pending' | 'approved' | 'rejected';
  onNavigate?: (view: string, data?: any) => void;
}

export default function ApproverDashboard({ initialTab = 'pending', onNavigate }: ApproverDashboardProps) {
  const [viewMode, setViewMode] = useState<'permits' | 'extensions'>('permits');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>(initialTab);
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [approverRole, setApproverRole] = useState('Approver');

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  // Signature & Notes State
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // key effect for initializing canvas when modal opens
  useEffect(() => {
    if (showApproveModal || showRejectModal) {
      setTimeout(initializeCanvas, 100);
    }
  }, [showApproveModal, showRejectModal]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // ... (StartDrawing, Draw, etc. remain the same) ...



  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initializeCanvas();
  };

  // Check if canvas is empty (basic check)
  const isCanvasEmpty = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const pixelBuffer = new Uint32Array(
      ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );

    return !pixelBuffer.some(color => color !== 0 && color !== 0xFFFFFFFF); // Simple check for non-white/transparent pixels
  };

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending first to get role early if possible
      const pendingRes = await approvalsAPI.getPending();

      if (pendingRes.success) {
        setPendingPermits(pendingRes.data || []);
        // Safely access approver_role from response
        const role = (pendingRes as any).approver_role;
        console.log('✅ Approver role:', role);
        if (role) {
          setApproverRole(role);
        }
      } else {
        console.warn('⚠️ Failed to fetch pending approvals:', pendingRes);
        // Don't error out yet, try others
      }

      const [approvedRes, rejectedRes] = await Promise.all([
        approvalsAPI.getApproved(),
        approvalsAPI.getRejected()
      ]);

      if (approvedRes.success) setApprovedPermits(approvedRes.data || []);
      if (rejectedRes.success) setRejectedPermits(rejectedRes.data || []);

    } catch (err: any) {
      console.error('❌ Error loading approvals:', err);
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (permit: Permit) => {
    if (onNavigate) {
      onNavigate('permit-detail', { permitId: permit.id });
    } else {
      console.warn('onNavigate not provided to ApproverDashboard');
      alert(`View details for ${permit.permit_serial}\n\nPlease ensure ApproverDashboard has onNavigate prop.`);
    }
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;

    // Check signature from canvas
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('Internal error: Canvas not found');
      return;
    }

    // Convert canvas to data URL
    const signatureDataUrl = canvas.toDataURL('image/png');

    try {
      // Using 'any' cast to bypass strict typing of existing API method temporarily
      // pending api.ts update to support object argument
      const response = await approvalsAPI.approve(selectedPermit.id, {
        signature: signatureDataUrl,
        comments: approvalNotes
      } as any);

      if (response.success) {
        alert('✅ Permit approved successfully!');
        setShowApproveModal(false);
        setSelectedPermit(null);
        setApprovalNotes('');
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

    // Check signature from canvas
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('Internal error: Canvas not found');
      return;
    }

    // Convert canvas to data URL
    const signatureDataUrl = canvas.toDataURL('image/png');

    try {
      const response = await approvalsAPI.reject(selectedPermit.id, rejectionReason, signatureDataUrl);

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

  // ✅ UPDATED: PermitTable now includes approval/rejection details column
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

                {/* ✅ NEW COLUMN: Show approval/rejection details on approved/rejected tabs */}
                {!showActions && (
                  <th className="px-4 py-3 text-xs font-semibold text-left text-gray-700 uppercase border-b">
                    {activeTab === 'rejected' ? 'REJECTION DETAILS' : 'APPROVAL DETAILS'}
                  </th>
                )}

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

                  {/* ✅ NEW CELL: Display approval/rejection details */}
                  {!showActions && (
                    <td className="px-4 py-3">
                      {activeTab === 'rejected' ? (
                        // Show rejection details
                        <div className="space-y-2 max-w-xs">
                          {permit.rejection_reason && (
                            <div className="text-sm">
                              <p className="font-medium text-red-700 mb-1">Reason:</p>
                              <p className="text-slate-600 text-xs leading-relaxed">{permit.rejection_reason}</p>
                            </div>
                          )}
                          {permit.my_signature && (
                            <div className="text-sm">
                              <p className="font-medium text-slate-700 mb-1">Signature:</p>
                              <img
                                src={permit.my_signature}
                                alt="Rejection Signature"
                                className="h-12 border border-slate-300 rounded bg-white p-1"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        // Show approval details
                        <div className="space-y-2 max-w-xs">
                          {/* Show comments based on which approver this is */}
                          {permit.area_manager_comments && approverRole === 'Area Manager' && (
                            <div className="text-sm">
                              <p className="font-medium text-green-700 mb-1">Comments:</p>
                              <p className="text-slate-600 text-xs leading-relaxed">{permit.area_manager_comments}</p>
                            </div>
                          )}
                          {permit.safety_officer_comments && approverRole === 'Safety Officer' && (
                            <div className="text-sm">
                              <p className="font-medium text-green-700 mb-1">Comments:</p>
                              <p className="text-slate-600 text-xs leading-relaxed">{permit.safety_officer_comments}</p>
                            </div>
                          )}
                          {permit.site_leader_comments && approverRole === 'Site Leader' && (
                            <div className="text-sm">
                              <p className="font-medium text-green-700 mb-1">Comments:</p>
                              <p className="text-slate-600 text-xs leading-relaxed">{permit.site_leader_comments}</p>
                            </div>
                          )}
                          {permit.my_signature && (
                            <div className="text-sm">
                              <p className="font-medium text-slate-700 mb-1">Signature:</p>
                              <img
                                src={permit.my_signature}
                                alt="Approval Signature"
                                className="h-12 border border-slate-300 rounded bg-white p-1"
                              />
                            </div>
                          )}
                          {!permit.my_signature && !permit.area_manager_comments && !permit.safety_officer_comments && !permit.site_leader_comments && (
                            <p className="text-xs text-gray-400 italic">No details recorded</p>
                          )}
                        </div>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => handleViewDetails(permit)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-600 transition-colors bg-orange-100 rounded hover:bg-orange-200"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>

                      {/* Approve/Reject - Only on Pending tab */}
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
        <div className="w-16 h-16 border-4 border-orange-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">Approver Dashboard</h1>
        <p className="mb-6 text-gray-600">Role: <strong>{approverRole}</strong></p>

        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Error:</span>
              <span className="ml-2">{error}</span>
            </div>
          </div>
        )}

        {/* View Switcher */}
        <div className="flex p-1 mb-8 space-x-1 rounded-lg bg-slate-100 w-fit">
          <button
            onClick={() => setViewMode('permits')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'permits'
              ? 'bg-white text-orange-600 shadow'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Layout className="w-4 h-4" />
            Permit Approvals
          </button>
          <button
            onClick={() => setViewMode('extensions')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'extensions'
              ? 'bg-white text-orange-600 shadow'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Calendar className="w-4 h-4" />
            Extension Approvals
          </button>
        </div>

        {viewMode === 'extensions' ? (
          <ExtensionApprovalDashboard />
        ) : (
          <>
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
                <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Approve Permit</h3>
                    <button
                      onClick={() => setShowApproveModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="mb-4 text-gray-600">
                    You are approving PTW <strong>{selectedPermit.permit_serial}</strong>.
                  </p>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Comments / Notes (Optional)</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add any additional notes or conditions for this approval..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Digital Signature <span className="text-red-500">*</span>
                    </label>
                    <div className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 touch-none">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full cursor-crosshair rounded-lg"
                        width={460}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="p-1.5 bg-white text-gray-500 rounded shadow hover:text-red-600 transition-colors"
                          title="Clear Signature"
                        >
                          <Eraser className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Please sign above to authorize this permit.</p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={handleApprove}
                      className="flex-1 px-4 py-2 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300"
                    >
                      Confirm Approval
                    </button>
                    <button
                      onClick={() => { setShowApproveModal(false); setSelectedPermit(null); setApprovalNotes(''); }}
                      className="flex-1 px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-100"
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
                <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Reject Permit</h3>
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="mb-4 text-gray-600">
                    Reject <strong>{selectedPermit.permit_serial}</strong>?
                  </p>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea
                      placeholder="Reason for rejection (required)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Digital Signature <span className="text-red-500">*</span>
                    </label>
                    <div className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 touch-none">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full cursor-crosshair rounded-lg"
                        width={460}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="p-1.5 bg-white text-gray-500 rounded shadow hover:text-red-600 transition-colors"
                          title="Clear Signature"
                        >
                          <Eraser className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Please sign above to confirm rejection.</p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={handleReject}
                      className="flex-1 px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setShowRejectModal(false); setSelectedPermit(null); setRejectionReason(''); }}
                      className="flex-1 px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}