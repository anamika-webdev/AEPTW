// frontend/src/components/approver/ExtensionApprovalDashboard.tsx
// Extension Approval Dashboard for Site Leader and Safety In-charge

import React, { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileText,
    Calendar,
    User,
    MapPin
} from 'lucide-react';

interface ExtensionRequest {
    id: number;
    permit_id: number;
    permit_serial: string;
    permit_type: string;
    work_location: string;
    work_description: string;
    site_name: string;
    requested_at: string;
    original_end_time: string;
    new_end_time: string;
    reason: string;
    extension_status: string;
    my_approval_status: string;
    site_leader_status: string | null;
    safety_officer_status: string | null;
    requested_by_name: string;
    requested_by_email: string;
    site_leader_name: string | null;
    safety_officer_name: string | null;
}

export default function ExtensionApprovalDashboard() {
    const [pendingExtensions, setPendingExtensions] = useState<ExtensionRequest[]>([]);
    const [approvedExtensions, setApprovedExtensions] = useState<ExtensionRequest[]>([]);
    const [rejectedExtensions, setRejectedExtensions] = useState<ExtensionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [selectedExtension, setSelectedExtension] = useState<ExtensionRequest | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [signature, setSignature] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        loadExtensions();
    }, []);

    const loadExtensions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Fetch pending extensions
            const pendingRes = await fetch(`${baseURL}/extension-approvals/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pendingData = await pendingRes.json();
            if (pendingData.success) {
                setPendingExtensions(pendingData.data);
            }

            // Fetch approved extensions
            const approvedRes = await fetch(`${baseURL}/extension-approvals/approved`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const approvedData = await approvedRes.json();
            if (approvedData.success) {
                setApprovedExtensions(approvedData.data);
            }

            // Fetch rejected extensions
            const rejectedRes = await fetch(`${baseURL}/extension-approvals/rejected`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rejectedData = await rejectedRes.json();
            if (rejectedData.success) {
                setRejectedExtensions(rejectedData.data);
            }

        } catch (error) {
            console.error('Error loading extensions:', error);
            alert('Failed to load extension requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (extension: ExtensionRequest) => {
        setSelectedExtension(extension);
        setShowApproveModal(true);
    };

    const handleReject = (extension: ExtensionRequest) => {
        setSelectedExtension(extension);
        setShowRejectModal(true);
    };

    const submitApproval = async () => {
        if (!selectedExtension) return;

        const canvas = canvasRef.current;
        if (!canvas) {
            alert('Please add your signature');
            return;
        }

        const signatureData = canvas.toDataURL();

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseURL}/extension-approvals/${selectedExtension.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    signature: signatureData,
                    remarks: remarks
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Extension approved successfully');
                setShowApproveModal(false);
                setSelectedExtension(null);
                setSignature('');
                setRemarks('');
                loadExtensions();
            } else {
                alert(data.message || 'Failed to approve extension');
            }
        } catch (error) {
            console.error('Error approving extension:', error);
            alert('Error approving extension');
        }
    };

    const submitRejection = async () => {
        if (!selectedExtension || !remarks.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseURL}/extension-approvals/${selectedExtension.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ remarks })
            });

            const data = await response.json();
            if (data.success) {
                alert('Extension rejected');
                setShowRejectModal(false);
                setSelectedExtension(null);
                setRemarks('');
                loadExtensions();
            } else {
                alert(data.message || 'Failed to reject extension');
            }
        } catch (error) {
            console.error('Error rejecting extension:', error);
            alert('Error rejecting extension');
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
        setSignature('');
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

    const renderExtensionTable = (extensions: ExtensionRequest[], showActions: boolean) => {
        if (extensions.length === 0) {
            return (
                <div className="text-center py-8 text-slate-500">
                    No extension requests found
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
                                Time Extension
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Reason
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Requested By
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
                        {extensions.map((ext) => (
                            <tr key={ext.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{ext.permit_serial}</div>
                                            <div className="text-xs text-slate-500">{ext.permit_type}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {ext.work_location}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-xs">From:</span>
                                        </div>
                                        <div className="text-xs text-slate-600">{formatDate(ext.original_end_time)}</div>
                                        <div className="flex items-center gap-1 text-green-600 mt-1">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-xs">To:</span>
                                        </div>
                                        <div className="text-xs font-medium text-green-700">{formatDate(ext.new_end_time)}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 max-w-xs">
                                        {ext.reason}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <div className="text-sm text-slate-900">{ext.requested_by_name}</div>
                                            <div className="text-xs text-slate-500">{formatDate(ext.requested_at)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        {ext.site_leader_name && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-600">Site Leader:</span>
                                                {getStatusBadge(ext.site_leader_status || 'Pending')}
                                            </div>
                                        )}
                                        {ext.safety_officer_name && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-600">Safety:</span>
                                                {getStatusBadge(ext.safety_officer_status || 'Pending')}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                {showActions && (
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleApprove(ext)}
                                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(ext)}
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
                    <h1 className="text-2xl font-bold text-slate-900">PTW Extension Approvals</h1>
                    <p className="text-sm text-slate-600 mt-1">Review and approve extension requests for active permits</p>
                </div>
                <button
                    onClick={loadExtensions}
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
                            <p className="text-2xl font-bold text-yellow-900">{pendingExtensions.length}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600">Approved</p>
                            <p className="text-2xl font-bold text-green-900">{approvedExtensions.length}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600">Rejected</p>
                            <p className="text-2xl font-bold text-red-900">{rejectedExtensions.length}</p>
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

            {/* Approve Modal */}
            {showApproveModal && selectedExtension && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Approve Extension Request</h3>

                        <div className="space-y-4 mb-6">
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
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Remarks (Optional)
                            </label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                rows={3}
                                placeholder="Add any comments..."
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Signature *
                            </label>
                            <canvas
                                ref={canvasRef}
                                width={500}
                                height={150}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                className="border-2 border-slate-300 rounded cursor-crosshair w-full"
                            />
                            <button
                                onClick={clearSignature}
                                className="mt-2 px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                                Clear Signature
                            </button>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedExtension(null);
                                    setRemarks('');
                                    clearSignature();
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitApproval}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Approve Extension
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedExtension && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Reject Extension Request</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-sm text-slate-600">PTW Serial</p>
                                <p className="font-medium">{selectedExtension.permit_serial}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                rows={4}
                                placeholder="Please provide a detailed reason for rejection..."
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedExtension(null);
                                    setRemarks('');
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRejection}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Reject Extension
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}