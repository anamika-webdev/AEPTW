// frontend/src/components/approver/ApproverDashboard.tsx
// APPROVER DASHBOARD - Only shows PTWs assigned to this specific approver

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  PenTool,
} from 'lucide-react';

interface ApproverDashboardProps {
  onNavigate: (view: string, data?: any) => void;
   initialTab?: 'pending' | 'approved' | 'rejected'; 
}

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  permit_status: string;
  my_approval_status?: string;
  site_name?: string;
  created_by_name?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  team_member_count?: number;
}

// Signature Canvas Component
const SignatureCanvas = ({ onSave }: { onSave: (signature: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className="space-y-3">
      <Label>Draw your signature below:</Label>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="bg-white border-2 rounded border-slate-300 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex gap-2">
        <Button type="button" onClick={clearCanvas} variant="outline" size="sm">
          Clear
        </Button>
        <Button type="button" onClick={saveSignature} size="sm">
          <PenTool className="w-4 h-4 mr-2" />
          Use This Signature
        </Button>
      </div>
    </div>
  );
};

export default function ApproverDashboard({ onNavigate, initialTab = 'pending'}: ApproverDashboardProps) {
   const [activeTab, setActiveTab] = useState(initialTab); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Data states
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [approverRole, setApproverRole] = useState<string>('');

  // Modal states
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [signature, setSignature] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading approver dashboard...');

      // Import API dynamically
      const { default: api } = await import('../../services/api');

      // Load all three categories in parallel
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        api.get('/approvals/pending'),
        api.get('/approvals/approved'),
        api.get('/approvals/rejected'),
      ]);

      console.log('✅ Approvals loaded:', {
        pending: pendingRes.data?.count || 0,
        approved: approvedRes.data?.count || 0,
        rejected: rejectedRes.data?.count || 0,
      });

      setPendingPermits(pendingRes.data?.data || []);
      setApprovedPermits(approvedRes.data?.data || []);
      setRejectedPermits(rejectedRes.data?.data || []);
      setApproverRole(pendingRes.data?.approver_role || 'Approver');

    } catch (error: any) {
      console.error('❌ Error loading approver dashboard:', error);
      alert('Error loading dashboard: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPermit = (permit: Permit) => {
    console.log('📄 Viewing permit:', permit.id);
    onNavigate('permit-detail', { permitId: permit.id });
  };

  const handleOpenApprovalModal = (permit: Permit) => {
    setSelectedPermit(permit);
    setSignature('');
    setApprovalModalOpen(true);
  };

  const handleOpenRejectionModal = (permit: Permit) => {
    setSelectedPermit(permit);
    setRejectionReason('');
    setSignature('');
    setRejectionModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;

    if (!signature) {
      alert('⚠️ Please provide your digital signature');
      return;
    }

    try {
      const { default: api } = await import('../../services/api');

      const response = await api.post(`/approvals/${selectedPermit.id}/approve`, {
        signature: signature,
      });

      if (response.data?.success) {
        alert('✅ PTW approved successfully!');
        setApprovalModalOpen(false);
        setSelectedPermit(null);
        setSignature('');
        loadDashboardData(); // Reload data
      } else {
        alert('❌ Failed to approve: ' + response.data?.message);
      }
    } catch (error: any) {
      console.error('❌ Error approving PTW:', error);
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async () => {
    if (!selectedPermit) return;

    if (!rejectionReason.trim()) {
      alert('⚠️ Please provide a rejection reason');
      return;
    }

    try {
      const { default: api } = await import('../../services/api');

      const response = await api.post(`/approvals/${selectedPermit.id}/reject`, {
        rejection_reason: rejectionReason,
        signature: signature || null,
      });

      if (response.data?.success) {
        alert('✅ PTW rejected successfully');
        setRejectionModalOpen(false);
        setSelectedPermit(null);
        setRejectionReason('');
        setSignature('');
        loadDashboardData(); // Reload data
      } else {
        alert('❌ Failed to reject: ' + response.data?.message);
      }
    } catch (error: any) {
      console.error('❌ Error rejecting PTW:', error);
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ready to Start' },
      'Active': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active' },
    };

    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  // Reusable table component
  const PermitTable = ({
    permits,
    showApprovalActions = false,
    emptyMessage,
  }: {
    permits: Permit[];
    showApprovalActions?: boolean;
    emptyMessage: string;
  }) => (
    <div className="overflow-x-auto">
      {permits.length === 0 ? (
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">PTW ID</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Type</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Location</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Supervisor</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Start Time</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-700">Status</th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-right uppercase text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {permits.map((permit) => (
              <tr key={permit.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {permit.permit_serial}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {permit.permit_type}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {permit.work_location}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {permit.created_by_name || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(permit.start_time).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getStatusBadge(permit.permit_status)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => handleViewPermit(permit)}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    
                    {showApprovalActions && (
                      <>
                        <Button
                          onClick={() => handleOpenApprovalModal(permit)}
                          size="sm"
                          className="gap-1 text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleOpenRejectionModal(permit)}
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </Button>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approver Dashboard</h1>
          <p className="text-slate-600">Review and approve PTW requests - {approverRole}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingPermits.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedPermits.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedPermits.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingPermits.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedPermits.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedPermits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="p-6 mt-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Approvals</h2>
          <PermitTable
            permits={pendingPermits}
            showApprovalActions={true}
            emptyMessage="No PTWs waiting for your approval"
          />
        </TabsContent>

        <TabsContent value="approved" className="p-6 mt-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Approved by You</h2>
          <PermitTable
            permits={approvedPermits}
            showApprovalActions={false}
            emptyMessage="You haven't approved any PTWs yet"
          />
        </TabsContent>

        <TabsContent value="rejected" className="p-6 mt-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Rejected by You</h2>
          <PermitTable
            permits={rejectedPermits}
            showApprovalActions={false}
            emptyMessage="You haven't rejected any PTWs"
          />
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve PTW: {selectedPermit?.permit_serial}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50">
              <h3 className="mb-2 font-semibold text-slate-900">PTW Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Type:</span> {selectedPermit?.permit_type}</p>
                <p><span className="font-medium">Location:</span> {selectedPermit?.work_location}</p>
                <p><span className="font-medium">Description:</span> {selectedPermit?.work_description}</p>
                <p><span className="font-medium">Start:</span> {selectedPermit && new Date(selectedPermit.start_time).toLocaleString()}</p>
              </div>
            </div>

            <SignatureCanvas onSave={setSignature} />

            {signature && (
              <div className="p-3 rounded bg-green-50">
                <p className="text-sm font-medium text-green-800">✓ Signature captured</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="text-white bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve PTW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reject PTW: {selectedPermit?.permit_serial}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50">
              <h3 className="mb-2 font-semibold text-slate-900">PTW Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Type:</span> {selectedPermit?.permit_type}</p>
                <p><span className="font-medium">Location:</span> {selectedPermit?.work_location}</p>
                <p><span className="font-medium">Description:</span> {selectedPermit?.work_description}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="rejection_reason" className="required">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this PTW..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="p-3 rounded bg-orange-50">
              <p className="text-sm text-orange-800">
                ⚠️ Rejecting this PTW will notify the supervisor and prevent work from proceeding.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              <XCircle className="w-4 h-4 mr-2" />
              Reject PTW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}