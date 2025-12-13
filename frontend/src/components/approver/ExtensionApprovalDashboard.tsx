// frontend/src/components/approver/ExtensionApprovalDashboard.tsx
// ✅ COMPLETE FIXED VERSION - Extension Approval, Rejection, and View functionality

import { useState, useEffect, useRef } from 'react';
import {
    CheckCircle, XCircle, Eye, Eraser, AlertCircle, Clock
} from 'lucide-react';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface ExtensionRequest {
    id: number;
    permit_id: number;
    permit_serial: string;
    permit_type: string;
    work_location: string;
    work_description?: string;
    site_name: string;
    requested_at: string;
    original_end_time: string;
    new_end_time: string;
    reason: string;
    status: string;
    requested_by_name: string;
    site_leader_name?: string;
    safety_officer_name?: string;
    site_leader_status?: string;
    safety_officer_status?: string;
    my_approval_status?: string;
    my_approved_at?: string;
    my_remarks?: string;

    // Complete PTW Details
    start_time?: string;
    end_time?: string;
    created_by_name?: string;
    area_manager_name?: string;
    area_manager_status?: string;
    safety_officer_status_ptw?: string;
    site_leader_status_ptw?: string;
    permit_status?: string;
}



interface ExtensionApprovalDashboardProps {
    onNavigate: (page: string, data?: any) => void;
}

export default function ExtensionApprovalDashboard({ onNavigate }: ExtensionApprovalDashboardProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [pendingExtensions, setPendingExtensions] = useState<ExtensionRequest[]>([]);
    const [approvedExtensions, setApprovedExtensions] = useState<ExtensionRequest[]>([]);
    const [rejectedExtensions, setRejectedExtensions] = useState<ExtensionRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Selection
    const [selectedExtension, setSelectedExtension] = useState<ExtensionRequest | null>(null);

    const [remarks, setRemarks] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        loadExtensions();
    }, []);

    useEffect(() => {
        // Initialize canvas for signature
        if (showApproveModal && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, [showApproveModal]);

    const loadExtensions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Fetch pending
            const pendingRes = await fetch(`${baseURL}/extension-approvals/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pendingData = await pendingRes.json();
            if (pendingData.success) setPendingExtensions(pendingData.data);

            // Fetch approved
            const approvedRes = await fetch(`${baseURL}/extension-approvals/approved`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const approvedData = await approvedRes.json();
            if (approvedData.success) setApprovedExtensions(approvedData.data);

            // Fetch rejected
            const rejectedRes = await fetch(`${baseURL}/extension-approvals/rejected`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rejectedData = await rejectedRes.json();
            if (rejectedData.success) setRejectedExtensions(rejectedData.data);

        } catch (error) {
            console.error('Error loading extensions:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==================== HANDLE VIEW PTW DETAILS ====================
    const handleView = (ext: ExtensionRequest) => {
        if (ext.permit_id) {
            onNavigate('permit-detail', { permitId: ext.permit_id });
        } else {
            console.error('Missing permit_id for extension:', ext);
            alert('Cannot view details: Missing Permit ID');
        }
    };

    // ==================== HANDLE APPROVE ====================
    const handleApprove = (ext: ExtensionRequest) => {
        setSelectedExtension(ext);
        setShowApproveModal(true);
        setRemarks('');
    };

    // ==================== HANDLE REJECT ====================
    const handleReject = (ext: ExtensionRequest) => {
        setSelectedExtension(ext);
        setShowRejectModal(true);
        setRemarks('');
    };

    // ==================== SUBMIT APPROVAL ====================
    const submitApproval = async () => {
        if (!selectedExtension) return;

        const canvas = canvasRef.current;
        if (!canvas) {
            alert('Signature canvas not found');
            return;
        }

        // Check if signature is drawn
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Could not access signature canvas');
            return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasSignature = imageData.data.some(channel => channel !== 0);

        if (!hasSignature) {
            alert('Please provide your digital signature');
            return;
        }

        const signatureData = canvas.toDataURL();

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            console.log(`📤 Approving extension ${selectedExtension.id}...`);

            const response = await fetch(`${baseURL}/extension-approvals/${selectedExtension.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    signature: signatureData,
                    remarks: remarks.trim() || null
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message || '✅ Extension approved successfully');
                setShowApproveModal(false);
                setSelectedExtension(null);
                setRemarks('');
                loadExtensions(); // Reload all tabs
            } else {
                alert(data.message || 'Failed to approve extension');
            }
        } catch (error) {
            console.error('❌ Error approving extension:', error);
            alert('Error approving extension. Please try again.');
        }
    };

    // ==================== SUBMIT REJECTION ====================
    const submitRejection = async () => {
        if (!selectedExtension) return;

        if (!remarks.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        if (!confirm('Are you sure you want to reject this extension request?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            console.log(`📤 Rejecting extension ${selectedExtension.id}...`);

            const response = await fetch(`${baseURL}/extension-approvals/${selectedExtension.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ remarks: remarks.trim() })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message || '❌ Extension rejected');
                setShowRejectModal(false);
                setSelectedExtension(null);
                setRemarks('');
                loadExtensions(); // Reload all tabs
            } else {
                alert(data.message || 'Failed to reject extension');
            }
        } catch (error) {
            console.error('❌ Error rejecting extension:', error);
            alert('Error rejecting extension. Please try again.');
        }
    };

    // ==================== CANVAS DRAWING FUNCTIONS ====================
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // ==================== UTILITY FUNCTIONS ====================
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            'Approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
            'Extension_Requested': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
        };

        const config = statusConfig[status] || statusConfig['Pending'];

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    // ============= EXTENSION TABLE COMPONENT WITH PAGINATION =============
    const ExtensionTable = ({ extensions, showActions }: { extensions: ExtensionRequest[], showActions: boolean }) => {
        const {
            currentPage,
            totalPages,
            itemsPerPage,
            paginatedData,
            setCurrentPage,
            setItemsPerPage
        } = usePagination<ExtensionRequest>({
            data: extensions,
            initialItemsPerPage: 10
        });

        if (extensions.length === 0) {
            return (
                <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">No extension requests found</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">PTW Serial</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Site</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Location</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Original End</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">New End</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Reason</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Requested By</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-slate-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedData.map((ext) => (
                                <tr key={ext.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{ext.permit_serial}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">{ext.site_name}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">{ext.work_location}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(ext.original_end_time)}</td>
                                    <td className="px-4 py-4 text-sm font-medium text-green-700">{formatDate(ext.new_end_time)}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate" title={ext.reason}>{ext.reason}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">{ext.requested_by_name}</td>
                                    <td className="px-4 py-4 text-sm">
                                        {getStatusBadge(ext.my_approval_status || ext.status)}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleView(ext)}
                                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-orange-600 transition-colors bg-orange-100 rounded hover:bg-orange-200"
                                                title="View Complete PTW Details"
                                            >
                                                <Eye className="w-3 h-3 mr-1" />
                                                View PTW
                                            </button>
                                            {showActions && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(ext)}
                                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 transition-colors bg-green-100 rounded hover:bg-green-200"
                                                    >
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(ext)}
                                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 transition-colors bg-red-100 rounded hover:bg-red-200"
                                                    >
                                                        <XCircle className="w-3 h-3 mr-1" />
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

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={extensions.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">PTW Extension Approvals</h1>
                    <p className="mt-1 text-sm text-slate-600">Review and approve extension requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Approvals</p>
                            <p className="text-3xl font-bold text-yellow-600">{pendingExtensions.length}</p>
                        </div>
                        <Clock className="w-10 h-10 text-yellow-600" />
                    </div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Approved</p>
                            <p className="text-3xl font-bold text-green-600">{approvedExtensions.length}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Rejected</p>
                            <p className="text-3xl font-bold text-red-600">{rejectedExtensions.length}</p>
                        </div>
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex -mb-px space-x-8">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Pending ({pendingExtensions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Approved ({approvedExtensions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('rejected')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Rejected ({rejectedExtensions.length})
                    </button>
                </nav>
            </div>

            {/* Tables */}
            <div className="bg-white rounded-lg shadow">
                {activeTab === 'pending' && <ExtensionTable extensions={pendingExtensions} showActions={true} />}
                {activeTab === 'approved' && <ExtensionTable extensions={approvedExtensions} showActions={false} />}
                {activeTab === 'rejected' && <ExtensionTable extensions={rejectedExtensions} showActions={false} />}
            </div>

            {/* ==================== APPROVE MODAL ==================== */}
            {showApproveModal && selectedExtension && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-2xl p-6 mx-4 overflow-y-auto bg-white rounded-lg max-h-[90vh]">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Approve Extension Request</h3>

                        <div className="mb-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-600">PTW Serial</p>
                                <p className="font-medium">{selectedExtension.permit_serial}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Extension Details</p>
                                <p className="text-sm">From: {formatDate(selectedExtension.original_end_time)}</p>
                                <p className="text-sm font-medium text-green-700">To: {formatDate(selectedExtension.new_end_time)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Reason</p>
                                <p className="text-sm">{selectedExtension.reason}</p>
                            </div>

                            {/* Optional Remarks */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Add any comments..."
                                />
                            </div>

                            {/* Digital Signature */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Digital Signature <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed rounded-lg border-slate-300">
                                    <canvas
                                        ref={canvasRef}
                                        width={600}
                                        height={200}
                                        className="w-full cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                    />
                                </div>
                                <button
                                    onClick={clearSignature}
                                    className="flex items-center gap-2 px-3 py-1 mt-2 text-sm text-red-600 transition-colors rounded hover:bg-red-50"
                                >
                                    <Eraser className="w-4 h-4" />
                                    Clear Signature
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedExtension(null);
                                    setRemarks('');
                                }}
                                className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitApproval}
                                className="px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                            >
                                <CheckCircle className="inline-block w-4 h-4 mr-2" />
                                Approve Extension
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== REJECT MODAL ==================== */}
            {showRejectModal && selectedExtension && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-2xl p-6 mx-4 overflow-y-auto bg-white rounded-lg max-h-[90vh]">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Reject Extension Request</h3>

                        <div className="mb-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-600">PTW Serial</p>
                                <p className="font-medium">{selectedExtension.permit_serial}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Extension Details</p>
                                <p className="text-sm">From: {formatDate(selectedExtension.original_end_time)}</p>
                                <p className="text-sm font-medium text-green-700">To: {formatDate(selectedExtension.new_end_time)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Reason for Extension</p>
                                <p className="text-sm">{selectedExtension.reason}</p>
                            </div>

                            {/* Rejection Reason (Required) */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows={4}
                                    placeholder="Please provide a detailed reason for rejection..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedExtension(null);
                                    setRemarks('');
                                }}
                                className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRejection}
                                className="px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                            >
                                <XCircle className="inline-block w-4 h-4 mr-2" />
                                Reject Extension
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}