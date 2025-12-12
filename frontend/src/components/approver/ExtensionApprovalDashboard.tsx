// frontend/src/components/approver/ExtensionApprovalDashboard.tsx
// ✅ FIXED: Approve/Reject functionality + Complete PTW Details View

import { useState, useEffect, useRef } from 'react';
import {
    Clock, CheckCircle, XCircle, AlertCircle, Eye, Eraser,
    FileText, Users, Shield, User, AlertTriangle
} from 'lucide-react';

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

interface PTWDetails {
    permit: any;
    team_members: any[];
    hazards: any[];
    ppe: any[];
    checklist_responses: any[];
    extensions: any[];
}

export default function ExtensionApprovalDashboard() {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [pendingExtensions, setPendingExtensions] = useState<ExtensionRequest[]>([]);
    const [approvedExtensions, setApprovedExtensions] = useState<ExtensionRequest[]>([]);
    const [rejectedExtensions, setRejectedExtensions] = useState<ExtensionRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedExtension, setSelectedExtension] = useState<ExtensionRequest | null>(null);
    const [ptwDetails, setPtwDetails] = useState<PTWDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [remarks, setRemarks] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        loadExtensions();
    }, []);

    useEffect(() => {
        // Initialize canvas for signature
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
    }, [showApproveModal]);

    const loadExtensions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            console.log('🔄 Loading extension requests...');

            // Fetch pending extensions
            const pendingRes = await fetch(`${baseURL}/extension-approvals/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pendingData = await pendingRes.json();
            if (pendingData.success) {
                console.log(`✅ Loaded ${pendingData.data.length} pending extensions`);
                setPendingExtensions(pendingData.data);
            }

            // Fetch approved extensions
            const approvedRes = await fetch(`${baseURL}/extension-approvals/approved`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const approvedData = await approvedRes.json();
            if (approvedData.success) {
                console.log(`✅ Loaded ${approvedData.data.length} approved extensions`);
                setApprovedExtensions(approvedData.data);
            }

            // Fetch rejected extensions
            const rejectedRes = await fetch(`${baseURL}/extension-approvals/rejected`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rejectedData = await rejectedRes.json();
            if (rejectedData.success) {
                console.log(`✅ Loaded ${rejectedData.data.length} rejected extensions`);
                setRejectedExtensions(rejectedData.data);
            }

        } catch (error) {
            console.error('❌ Error loading extensions:', error);
            alert('Failed to load extension requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadPTWDetails = async (permitId: number) => {
        try {
            setLoadingDetails(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            console.log(`📥 Loading PTW details for permit ID: ${permitId}`);

            const response = await fetch(`${baseURL}/permits/${permitId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success && data.data) {
                console.log('✅ PTW details loaded:', data.data);
                setPtwDetails(data.data);
            } else {
                throw new Error(data.message || 'Failed to load PTW details');
            }
        } catch (error) {
            console.error('❌ Error loading PTW details:', error);
            alert('Failed to load PTW details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleView = async (extension: ExtensionRequest) => {
        setSelectedExtension(extension);
        await loadPTWDetails(extension.permit_id);
        setShowViewModal(true);
    };

    const handleApprove = (extension: ExtensionRequest) => {
        setSelectedExtension(extension);
        setRemarks('');
        setShowApproveModal(true);
        // Clear signature canvas
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        }, 100);
    };

    const handleReject = (extension: ExtensionRequest) => {
        setSelectedExtension(extension);
        setRemarks('');
        setShowRejectModal(true);
    };

    const submitApproval = async () => {
        if (!selectedExtension) return;

        const canvas = canvasRef.current;
        if (!canvas) {
            alert('Please add your signature');
            return;
        }

        // Check if canvas has any drawing
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Canvas error');
            return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasDrawing = imageData.data.some((channel) => channel !== 0);

        if (!hasDrawing) {
            alert('Please add your signature before approving');
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

    // Canvas drawing functions
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

    const formatDate = (dateString: string) => {
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
            'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
        };

        const config = statusConfig[status] || statusConfig['Pending'];

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const renderExtensionTable = (extensions: ExtensionRequest[], showActions: boolean) => {
        if (extensions.length === 0) {
            return (
                <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">No extension requests found</p>
                </div>
            );
        }

        return (
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
                        {extensions.map((ext) => (
                            <tr key={ext.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 text-sm font-medium text-slate-900">{ext.permit_serial}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{ext.site_name}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{ext.work_location}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{formatDate(ext.original_end_time)}</td>
                                <td className="px-4 py-4 text-sm font-medium text-green-700">{formatDate(ext.new_end_time)}</td>
                                <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate">{ext.reason}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{ext.requested_by_name}</td>
                                <td className="px-4 py-4 text-sm">
                                    {getStatusBadge(ext.my_approval_status || ext.status)}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleView(ext)}
                                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                            title="View Complete PTW Details"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            View PTW
                                        </button>
                                        {showActions && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(ext)}
                                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(ext)}
                                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
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
                {activeTab === 'pending' && renderExtensionTable(pendingExtensions, true)}
                {activeTab === 'approved' && renderExtensionTable(approvedExtensions, false)}
                {activeTab === 'rejected' && renderExtensionTable(rejectedExtensions, false)}
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

                            {/* Remarks (Optional) */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-700">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Add any comments..."
                                />
                            </div>

                            {/* Signature Canvas */}
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
                                    type="button"
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

            {/* ==================== VIEW PTW DETAILS MODAL ==================== */}
            {showViewModal && selectedExtension && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-4xl p-6 mx-4 overflow-y-auto bg-white rounded-lg max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Complete PTW Details</h3>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedExtension(null);
                                    setPtwDetails(null);
                                }}
                                className="p-2 transition-colors rounded-lg hover:bg-slate-100"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : ptwDetails && ptwDetails.permit ? (
                            <div className="space-y-6">
                                {/* Extension Request Info */}
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                        Extension Request
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-600">Original End Time:</p>
                                            <p className="font-medium">{formatDate(selectedExtension.original_end_time)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">New End Time:</p>
                                            <p className="font-medium text-green-700">{formatDate(selectedExtension.new_end_time)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-600">Reason:</p>
                                            <p className="font-medium">{selectedExtension.reason}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Requested By:</p>
                                            <p className="font-medium">{selectedExtension.requested_by_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Requested At:</p>
                                            <p className="font-medium">{formatDate(selectedExtension.requested_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic PTW Information */}
                                <div className="p-4 bg-white border rounded-lg border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Basic Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-600">PTW Serial:</p>
                                            <p className="font-medium">{ptwDetails.permit.permit_serial}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Type:</p>
                                            <p className="font-medium">{ptwDetails.permit.permit_type || ptwDetails.permit.permit_types}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Site:</p>
                                            <p className="font-medium">{ptwDetails.permit.site_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Status:</p>
                                            <p className="font-medium">{ptwDetails.permit.status}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-600">Work Location:</p>
                                            <p className="font-medium">{ptwDetails.permit.work_location}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-600">Work Description:</p>
                                            <p className="font-medium">{ptwDetails.permit.work_description}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Start Time:</p>
                                            <p className="font-medium">{formatDate(ptwDetails.permit.start_time)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Current End Time:</p>
                                            <p className="font-medium">{formatDate(ptwDetails.permit.end_time)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* People Involved */}
                                <div className="p-4 bg-white border rounded-lg border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <User className="w-5 h-5 text-purple-600" />
                                        People Involved
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-600">Created By:</p>
                                            <p className="font-medium">{ptwDetails.permit.created_by_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Permit Initiator:</p>
                                            <p className="font-medium">{ptwDetails.permit.permit_initiator}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Issued To:</p>
                                            <p className="font-medium">{ptwDetails.permit.receiver_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Department:</p>
                                            <p className="font-medium">{ptwDetails.permit.issue_department}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Approval Status */}
                                <div className="p-4 bg-white border rounded-lg border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        Approval Status
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                            <span className="font-medium">Area Manager:</span>
                                            <div className="text-right">
                                                <p>{ptwDetails.permit.area_manager_name || 'Not assigned'}</p>
                                                <span className={`text-xs px-2 py-1 rounded ${ptwDetails.permit.area_manager_status === 'Approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : ptwDetails.permit.area_manager_status === 'Rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {ptwDetails.permit.area_manager_status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                            <span className="font-medium">Safety Officer:</span>
                                            <div className="text-right">
                                                <p>{ptwDetails.permit.safety_officer_name || 'Not assigned'}</p>
                                                <span className={`text-xs px-2 py-1 rounded ${ptwDetails.permit.safety_officer_status === 'Approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : ptwDetails.permit.safety_officer_status === 'Rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {ptwDetails.permit.safety_officer_status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                            <span className="font-medium">Site Leader:</span>
                                            <div className="text-right">
                                                <p>{ptwDetails.permit.site_leader_name || 'Not assigned'}</p>
                                                <span className={`text-xs px-2 py-1 rounded ${ptwDetails.permit.site_leader_status === 'Approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : ptwDetails.permit.site_leader_status === 'Rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {ptwDetails.permit.site_leader_status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members */}
                                {ptwDetails.team_members && ptwDetails.team_members.length > 0 && (
                                    <div className="p-4 bg-white border rounded-lg border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-600" />
                                            Team Members ({ptwDetails.team_members.length})
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {ptwDetails.team_members.map((member: any, idx: number) => (
                                                <div key={idx} className="p-2 bg-slate-50 rounded">
                                                    <p className="font-medium">{member.worker_name}</p>
                                                    <p className="text-slate-600">{member.company_name} - {member.worker_role}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hazards */}
                                {ptwDetails.hazards && ptwDetails.hazards.length > 0 && (
                                    <div className="p-4 bg-white border rounded-lg border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                            Identified Hazards ({ptwDetails.hazards.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {ptwDetails.hazards.map((hazard: any, idx: number) => (
                                                <span key={idx} className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                                    {hazard.name || hazard.hazard_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PPE */}
                                {ptwDetails.ppe && ptwDetails.ppe.length > 0 && (
                                    <div className="p-4 bg-white border rounded-lg border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-orange-600" />
                                            Required PPE ({ptwDetails.ppe.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {ptwDetails.ppe.map((item: any, idx: number) => (
                                                <span key={idx} className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                                    {item.name || item.ppe_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Control Measures */}
                                {ptwDetails.permit.control_measures && (
                                    <div className="p-4 bg-white border rounded-lg border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-2">Control Measures</h4>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{ptwDetails.permit.control_measures}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-600">
                                No PTW details available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}