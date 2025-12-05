// frontend/src/pages/approver/ApproverDashboard.tsx
// SIMPLIFIED APPROVER DASHBOARD - Only shows PTWs assigned to ME

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle,
  PenTool
} from 'lucide-react';

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
  created_by_email?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

// Simple Signature Canvas
const SignaturePad = ({ onSave, onClear }: { onSave: (sig: string) => void, onClear: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Digital Signature</label>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full bg-white border-2 border-gray-300 rounded cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex gap-2">
        <Button type="button" onClick={clear} variant="outline" size="sm">
          Clear
        </Button>
        <Button type="button" onClick={save} size="sm" className="bg-blue-600">
          <PenTool className="w-4 h-4 mr-2" />
          Save Signature
        </Button>
      </div>
    </div>
  );
};

export default function ApproverDashboard({ onNavigate, onPTWSelect }: any) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [pendingPermits, setPendingPermits] = useState<Permit[]>([]);
  const [approvedPermits, setApprovedPermits] = useState<Permit[]>([]);
  const [rejectedPermits, setRejectedPermits] = useState<Permit[]>([]);
  const [approverRole, setApproverRole] = useState('');

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [signature, setSignature] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApprovalData();
  }, []);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading approver dashboard...');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Fetch pending approvals
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
        loadApprovalData();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error: any) {
      console.error('❌ Error approving:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedPermit) return;
    if (!rejectionReason.trim()) {
      alert('⚠️ Please provide rejection reason');
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
        alert('✅ PTW rejected');
        setShowRejectModal(false);
        setSelectedPermit(null);
        setRejectionReason('');
        setSignature('');
        loadApprovalData();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error: any) {
      console.error('❌ Error rejecting:', error);
      alert('Error: ' + error.message);
    }
  };

  const PermitCard = ({ permit, showActions }: { permit: Permit; showActions: boolean }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-blue-600">{permit.permit_serial}</span>
              <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                {permit.permit_type}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Location:</strong> {permit.work_location}</p>
              <p><strong>Description:</strong> {permit.work_description}</p>
              <p><strong>Supervisor:</strong> {permit.created_by_name}</p>
              <p><strong>Site:</strong> {permit.site_name || 'N/A'}</p>
              <p><strong>Start Time:</strong> {new Date(permit.start_time).toLocaleString()}</p>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2 ml-4">
              <Button 
                onClick={() => {
                  setSelectedPermit(permit);
                  setShowApproveModal(true);
                }}
                size="sm"
                className="text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                onClick={() => {
                  setSelectedPermit(permit);
                  setShowRejectModal(true);
                }}
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approver Dashboard</h1>
        <p className="text-gray-600">Review and approve PTW requests - {approverRole}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingPermits.length}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedPermits.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedPermits.length}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        <TabsContent value="pending" className="mt-4">
          {pendingPermits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            pendingPermits.map(permit => (
              <PermitCard key={permit.id} permit={permit} showActions={true} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedPermits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No approved PTWs</p>
              </CardContent>
            </Card>
          ) : (
            approvedPermits.map(permit => (
              <PermitCard key={permit.id} permit={permit} showActions={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedPermits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No rejected PTWs</p>
              </CardContent>
            </Card>
          ) : (
            rejectedPermits.map(permit => (
              <div key={permit.id}>
                <PermitCard permit={permit} showActions={false} />
                {permit.rejection_reason && (
                  <div className="p-3 mb-4 -mt-4 text-sm text-red-800 rounded-b bg-red-50">
                    <strong>Reason:</strong> {permit.rejection_reason}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Modal */}
      {showApproveModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold">Approve PTW: {selectedPermit.permit_serial}</h2>
            
            <div className="p-4 mb-4 rounded bg-gray-50">
              <p className="mb-1"><strong>Location:</strong> {selectedPermit.work_location}</p>
              <p className="mb-1"><strong>Description:</strong> {selectedPermit.work_description}</p>
              <p><strong>Supervisor:</strong> {selectedPermit.created_by_name}</p>
            </div>

            <SignaturePad 
              onSave={setSignature}
              onClear={() => setSignature('')}
            />

            {signature && (
              <div className="p-3 mt-3 text-sm text-green-800 rounded bg-green-50">
                ✓ Signature captured
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowApproveModal(false);
                setSignature('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleApprove} className="text-white bg-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve PTW
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold">Reject PTW: {selectedPermit.permit_serial}</h2>
            
            <div className="p-4 mb-4 rounded bg-gray-50">
              <p className="mb-1"><strong>Location:</strong> {selectedPermit.work_location}</p>
              <p><strong>Supervisor:</strong> {selectedPermit.created_by_name}</p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide detailed reason for rejection..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleReject} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-2" />
                Reject PTW
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}