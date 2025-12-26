// frontend/src/pages/supervisor/PermitDetails.tsx
// COMPLETE VERSION - Shows ALL PTW details

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  ClipboardCheck,
  FileCheck,
  AlertOctagon,
  Camera,
  ImageIcon,
  PenTool,
  RotateCcw,
  Download
} from 'lucide-react';
import { evidenceAPI, Evidence } from '../../services/evidenceAPI';
import { closureEvidenceAPI, ClosureEvidence } from '../../services/closureEvidenceAPI';
import { workerTrainingEvidenceAPI, WorkerTrainingEvidence } from '../../services/workerTrainingEvidenceAPI';
import { CameraModal } from '../../components/shared/CameraModal';
import { downloadComprehensivePDF } from '../../utils/pdfGenerator';
interface PermitDetailsProps {
  ptwId: number;
  onBack: () => void;
}

// Local Evidence interface removed to avoid conflict

interface PermitData {
  id: number;
  permit_serial: string;
  permit_type?: string;
  permit_types?: string;
  status: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  area_manager_comments?: string;
  safety_officer_comments?: string;
  site_leader_comments?: string;
  area_manager_signature?: string;
  safety_officer_signature?: string;
  site_leader_signature?: string;

  // Site info
  site_name?: string;
  site_code?: string;
  site_address?: string;

  // Initiator info
  permit_initiator?: string;
  permit_initiator_contact?: string;
  issue_department?: string;

  // Creator info
  created_by_name?: string;
  created_by_email?: string;
  created_by_contact?: string;

  // Receiver/Issued To info
  receiver_name?: string;
  receiver_contact?: string;

  // Approver info
  area_manager_name?: string;
  safety_officer_name?: string;
  site_leader_name?: string;
  area_manager_status?: string;
  safety_officer_status?: string;
  site_leader_status?: string;
  area_manager_approved_at?: string;
  safety_officer_approved_at?: string;
  site_leader_approved_at?: string;

  // Safety measures
  control_measures?: string;
  other_hazards?: string;

  // SWMS
  swms_file_url?: string;
  swms_text?: string;

  // Status info
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  final_submitted_at?: string;
}
// Add this interface after the ChecklistResponse interface (around line 65)
interface ClosureData {
  id: number;
  closed_at: string;
  closed_by_name: string;
  housekeeping_done: boolean;
  tools_removed: boolean;
  locks_removed: boolean;
  area_restored: boolean;
  remarks?: string;
}
interface TeamMember {
  id: number;
  worker_name: string;
  company_name?: string;
  badge_id?: string;
  worker_role?: string;
  contact_number?: string;
  phone?: string;
  email?: string;
}

interface Hazard {
  id: number;
  name?: string;
  hazard_name?: string;
  description?: string;
}

interface PPE {
  id: number;
  name?: string;
  ppe_name?: string;
  description?: string;
}

interface ChecklistResponse {
  id: number;
  question?: string;
  question_text?: string;
  response: string;
  remarks?: string;
}
interface ClosureData {
  id: number;
  closed_at: string;
  closed_by_name: string;
  housekeeping_done: boolean;
  tools_removed: boolean;
  locks_removed: boolean;
  area_restored: boolean;
  remarks?: string;
}
interface ExtensionRequest {
  id: number;
  requested_at: string;
  original_end_time: string;
  new_end_time: string;
  reason: string;
  status: string;
  requested_by_name?: string;
  site_leader_status?: string;
  safety_officer_status?: string;
  site_leader_remarks?: string;
  safety_officer_remarks?: string;
}

export default function PermitDetails({ ptwId, onBack }: PermitDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permit, setPermit] = useState<PermitData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [ppe, setPpe] = useState<PPE[]>([]);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse[]>([]);
  const [extensions, setExtensions] = useState<ExtensionRequest[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [closureEvidences, setClosureEvidences] = useState<ClosureEvidence[]>([]);
  const [savedClosureEvidences, setSavedClosureEvidences] = useState<ClosureEvidence[]>([]);
  const [workerTrainingEvidences, setWorkerTrainingEvidences] = useState<WorkerTrainingEvidence[]>([]);
  const [isUploadingClosure, setIsUploadingClosure] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [closureData, setClosureData] = useState<ClosureData | null>(null);
  // Close Permit State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [housekeepingDone, setHousekeepingDone] = useState(false);
  const [toolsRemoved, setToolsRemoved] = useState(false);
  const [locksRemoved, setLocksRemoved] = useState(false);

  // Signature State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [areaRestored, setAreaRestored] = useState(false);
  const [closureRemarks, setClosureRemarks] = useState('');


  useEffect(() => {
    loadPermitDetails();
  }, [ptwId]);

  const loadPermitDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load Evidences (Parallel or Serial)
      try {
        const evidenceRes = await evidenceAPI.getByPermitId(ptwId);
        if (evidenceRes.success && evidenceRes.data) {
          setEvidences(evidenceRes.data);
        }
      } catch (err) {
        console.warn('Failed to load evidences:', err);
      }

      // Load Closure Evidences
      try {
        const closureRes = await closureEvidenceAPI.get(ptwId);
        if (closureRes.success && closureRes.data) {
          setSavedClosureEvidences(closureRes.data);
        }
      } catch (err) {
        console.warn('Failed to load closure evidences:', err);
      }

      // Load Worker Training Evidences
      try {
        const trainingRes = await workerTrainingEvidenceAPI.getByPermit(ptwId);
        if (trainingRes.success && trainingRes.data) {
          setWorkerTrainingEvidences(trainingRes.data);
        }
      } catch (err) {
        console.warn('Failed to load worker training evidences:', err);
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = `${baseURL}/permits/${ptwId}`;

      console.log('🔍 Fetching permit:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📥 Full API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch permit');
      }

      if (data.success && data.data) {
        // Handle nested structure
        const permitData = data.data.permit || data.data;
        const members = data.data.team_members || [];
        const haz = data.data.hazards || [];
        const ppeItems = data.data.ppe || [];
        const checklist = data.data.checklist_responses || [];
        const ext = data.data.extensions || [];
        const closure = data.data.closure || null;
        console.log('✅ Parsed data:', {
          permit: permitData.permit_serial,
          teamMembers: members.length,
          hazards: haz.length,
          ppe: ppeItems.length,
          checklist: checklist.length,
          extensions: ext.length
        });

        setPermit(permitData);
        setTeamMembers(members);
        setHazards(haz);
        setPpe(ppeItems);
        setChecklistResponses(checklist);
        setExtensions(ext);
        setClosureData(closure);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const getCurrentLocation = (): Promise<{ latitude: number | null; longitude: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve({ latitude: null, longitude: null });
        }
      );
    });
  };
  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', icon: AlertOctagon },
      'Active': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Extension_Requested': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },
      'Extended': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Extension_Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      'Closed': { bg: 'bg-gray-100', text: 'text-gray-800', icon: FileCheck },
    };

    const { bg, text, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: FileText };

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${bg} ${text}`}>
        <Icon className="w-4 h-4" />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };
  const handleCameraCapture = async (blob: Blob) => {
    try {
      const location = await getCurrentLocation();
      const timestamp = new Date().toISOString();

      const file = new File([blob], `closure-evidence-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      const preview = URL.createObjectURL(file);

      const evidence: ClosureEvidence = {
        permit_id: ptwId,
        file,
        preview,
        category: 'area_organization',
        description: '',
        timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setClosureEvidences((prev) => [...prev, evidence]);
    } catch (error) {
      console.error('Error preparing closure evidence:', error);
      alert('Failed to prepare evidence. Please try again.');
    }
  };

  const removeClosureEvidence = (index: number) => {
    setClosureEvidences((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const updateClosureEvidenceDescription = (index: number, description: string) => {
    setClosureEvidences((prev) =>
      prev.map((e, i) => (i === index ? { ...e, description } : e))
    );
  };

  // Signature Canvas Helpers
  useEffect(() => {
    if (showCloseModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showCloseModal]);

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
    setHasSignature(true);
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
    setHasSignature(false);
  };

  const handleClosePermit = async () => {
    if (!housekeepingDone || !toolsRemoved || !locksRemoved || !areaRestored) {
      alert('All checklist items must be completed before closing the permit.');
      return;
    }

    if (closureEvidences.length === 0) {
      if (!confirm('No closure evidence photos uploaded. Are you sure you want to close without photos?')) {
        return;
      }
    }

    if (!hasSignature) {
      alert('Please provide your digital signature before closing.');
      return;
    }

    setIsUploadingClosure(true);
    try {
      // DEBUG: Verify state
      // alert(`DEBUG: Submitting ${closureEvidences.length} new photos.`);
      console.log('Current closureEvidences:', closureEvidences);

      const formData = new FormData();
      formData.append('housekeeping_done', String(housekeepingDone));
      formData.append('tools_removed', String(toolsRemoved));
      formData.append('locks_removed', String(locksRemoved));
      formData.append('area_restored', String(areaRestored));

      // Append Signature to Remarks
      const signatureData = canvasRef.current?.toDataURL('image/png') || '';
      const fullRemarks = `${closureRemarks}\n\nSigned by: ${signatureData}`;
      formData.append('remarks', fullRemarks);

      formData.append('test_submission', 'true'); // Debug marker

      // Append Evidence
      const descriptions: string[] = [];
      const categories: string[] = [];
      const timestamps: string[] = [];
      const latitudes: (number | null)[] = [];
      const longitudes: (number | null)[] = [];

      // Validated evidence count
      let validFiles = 0;

      // Base64 helper
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      const base64Promises: Promise<string | null>[] = [];

      closureEvidences.forEach((evidence) => {
        if (evidence.file && evidence.file.size > 0) {
          formData.append('images', evidence.file);
          base64Promises.push(fileToBase64(evidence.file));
          validFiles++;
        } else {
          console.error('Invalid file encountered:', evidence);
          // alert('Error: One of the photos is invalid (0 bytes). Please retake.');
          base64Promises.push(Promise.resolve(null));
          // Continue anyway to debug
          return;
        }

        descriptions.push(evidence.description || '');
        categories.push(evidence.category);
        timestamps.push(evidence.timestamp);
        latitudes.push(evidence.latitude);
        longitudes.push(evidence.longitude);
      });

      console.log(`📤 Uploading ${validFiles} files for Permit ${ptwId}`);

      if (closureEvidences.length > 0 && validFiles === 0) {
        alert('Error: No valid files to upload. Please retake photos.');
        setIsUploadingClosure(false);
        return;
      }

      // Add Base64 fallback
      try {
        const base64Results = await Promise.all(base64Promises);
        const validBase64 = base64Results.filter(s => s !== null);
        formData.append('images_base64', JSON.stringify(validBase64));
        console.log('Added Base64 fallbacks:', validBase64.length);
      } catch (err) {
        console.error('Base64 conversion failed', err);
      }

      formData.append('descriptions', JSON.stringify(descriptions));
      formData.append('categories', JSON.stringify(categories));
      formData.append('timestamps', JSON.stringify(timestamps));
      formData.append('latitudes', JSON.stringify(latitudes));
      formData.append('longitudes', JSON.stringify(longitudes));

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // DEBUG: Log FormData contents
      console.log('--- FORM DATA DEBUG ---');
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0], 'FILE:', (pair[1] as File).name, (pair[1] as File).size, (pair[1] as File).type);
        } else {
          console.log(pair[0], pair[1]);
        }
      }
      console.log('-----------------------');

      const response = await fetch(`${baseURL}/permits/${ptwId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Permit closed successfully!');
        setShowCloseModal(false);
        setClosureEvidences([]);
        loadPermitDetails();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error closing permit:', error);
      alert(error.message || 'Failed to close permit.');
    } finally {
      setIsUploadingClosure(false);
    }
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | undefined }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
      <Icon className="w-5 h-5 mt-0.5 text-slate-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold break-words text-slate-900">{value || 'Not specified'}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium text-slate-700">Loading permit details...</p>
        </div>
      </div>
    );
  }

  if (error || !permit) {
    return (
      <div className="p-8">
        <div className="max-w-2xl p-6 mx-auto text-center bg-red-50 rounded-xl">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h2 className="mb-2 text-2xl font-bold text-red-900">Error Loading Permit</h2>
          <p className="mb-6 text-red-700">{error || 'Permit not found'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Parse permit types
  const permitTypes = permit.permit_types
    ? permit.permit_types.split(',')
    : permit.permit_type
      ? [permit.permit_type]
      : [];

  const handleDownloadPDF = () => {
    if (!permit) return;
    const comprehensiveData = {
      ...permit,
      team_members: teamMembers,
      hazards: hazards,
      ppe: ppe,
      checklist_responses: checklistResponses,
      extensions: extensions,
      closure: closureData,
      evidence: evidences,
      closure_evidence: savedClosureEvidences
    };
    downloadComprehensivePDF([comprehensiveData]);
  };


  return (
    <div className="min-h-screen pb-12 space-y-6 bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 p-6 bg-white shadow-md">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 transition-colors rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{permit.permit_serial}</h1>
              <p className="text-sm text-slate-600">Complete Permit Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            {getStatusBadge(permit.status)}
          </div>
        </div>
      </div>

      <div className="px-6 mx-auto space-y-6 max-w-7xl">

        {/* ==================== SECTION 1: Basic Information ==================== */}
        <div className="p-6 bg-white shadow-lg rounded-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
            <FileText className="text-orange-600 w-7 h-7" />
            <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={FileText} label="Permit Serial" value={permit.permit_serial} />
            <InfoRow icon={Building} label="Site" value={permit.site_name} />
            <InfoRow icon={MapPin} label="Location" value={permit.work_location} />
            <InfoRow icon={Briefcase} label="Issue Department" value={permit.issue_department} />
            <InfoRow icon={Calendar} label="Created Date" value={formatDate(permit.created_at)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDate(permit.updated_at)} />
          </div>

          {/* Permit Types */}
          <div className="pt-6 mt-6 border-t">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Permit Categories</h3>
            <div className="flex flex-wrap gap-2">
              {permitTypes.map((type, index) => (
                <span key={index} className="px-4 py-2 text-sm font-semibold text-orange-900 bg-orange-100 border border-orange-300 rounded-full">
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Work Description */}
          {permit.work_description && (
            <div className="pt-6 mt-6 border-t">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Work Description</h3>
              <p className="p-4 text-sm leading-relaxed rounded-lg text-slate-700 bg-slate-50">
                {permit.work_description}
              </p>
            </div>
          )}
        </div>

        {/* ==================== SECTION 2: Schedule ==================== */}
        <div className="p-6 bg-white shadow-lg rounded-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
            <Clock className="text-green-600 w-7 h-7" />
            <h2 className="text-2xl font-bold text-slate-900">Schedule</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <p className="mb-1 text-xs font-medium text-green-700 uppercase">Start Time</p>
              <p className="text-lg font-bold text-green-900">{formatDate(permit.start_time)}</p>
            </div>
            <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
              <p className="mb-1 text-xs font-medium text-red-700 uppercase">End Time</p>
              <p className="text-lg font-bold text-red-900">{formatDate(permit.end_time)}</p>
            </div>
          </div>
        </div>

        {/* ==================== SECTION 3: People Involved ==================== */}
        <div className="p-6 bg-white shadow-lg rounded-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
            <Users className="text-purple-600 w-7 h-7" />
            <h2 className="text-2xl font-bold text-slate-900">People Involved</h2>
          </div>

          {/* Permit Initiator */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Permit Initiator</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow icon={User} label="Name" value={permit.permit_initiator} />
              <InfoRow icon={Mail} label="Contact" value={permit.permit_initiator_contact} />
            </div>
          </div>

          {/* Issued To (Receiver/Vendor) */}
          <div className="pt-6 mb-6 border-t">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Issued To (Receiver/Vendor)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow icon={Briefcase} label="Vendor Name" value={permit.receiver_name} />
              <InfoRow icon={Phone} label="Contact Number" value={permit.receiver_contact} />
            </div>
          </div>

          {/* Created By */}
          {permit.created_by_name && (
            <div className="pt-6 mb-6 border-t">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Created By</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoRow icon={User} label="Name" value={permit.created_by_name} />
                <InfoRow icon={Mail} label="Email" value={permit.created_by_email} />
                <InfoRow icon={Phone} label="Contact" value={permit.created_by_contact} />
              </div>
            </div>
          )}
        </div>
        {/* ✅ ADD THIS SECTION - Approver Details with Comments & Signatures */}
        {permit && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Approval Details</h3>
            </div>

            <div className="space-y-6">
              {/* Area Manager */}
              {permit.area_manager_name && (
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">Area Manager</p>
                      <p className="text-sm text-slate-600">{permit.area_manager_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${permit.area_manager_status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : permit.area_manager_status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {permit.area_manager_status || 'Pending'}
                    </span>
                  </div>

                  {permit.area_manager_status === 'Approved' && (
                    <>
                      {permit.area_manager_approved_at && (
                        <p className="text-xs text-slate-500 mb-2">
                          Approved: {new Date(permit.area_manager_approved_at).toLocaleString()}
                        </p>
                      )}
                      {permit.area_manager_comments && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-xs font-medium text-green-900 mb-1">Comments:</p>
                          <p className="text-sm text-slate-700">{permit.area_manager_comments}</p>
                        </div>
                      )}
                      {permit.area_manager_signature && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-700 mb-2">Digital Signature:</p>
                          <img
                            src={permit.area_manager_signature}
                            alt="Area Manager Signature"
                            className="h-16 border-2 border-slate-300 rounded bg-white p-1"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Safety Officer */}
              {permit.safety_officer_name && (
                <div className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">Safety Officer</p>
                      <p className="text-sm text-slate-600">{permit.safety_officer_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${permit.safety_officer_status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : permit.safety_officer_status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {permit.safety_officer_status || 'Pending'}
                    </span>
                  </div>

                  {permit.safety_officer_status === 'Approved' && (
                    <>
                      {permit.safety_officer_approved_at && (
                        <p className="text-xs text-slate-500 mb-2">
                          Approved: {new Date(permit.safety_officer_approved_at).toLocaleString()}
                        </p>
                      )}
                      {permit.safety_officer_comments && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-xs font-medium text-green-900 mb-1">Comments:</p>
                          <p className="text-sm text-slate-700">{permit.safety_officer_comments}</p>
                        </div>
                      )}
                      {permit.safety_officer_signature && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-700 mb-2">Digital Signature:</p>
                          <img
                            src={permit.safety_officer_signature}
                            alt="Safety Officer Signature"
                            className="h-16 border-2 border-slate-300 rounded bg-white p-1"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Site Leader */}
              {permit.site_leader_name && (
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">Site Leader</p>
                      <p className="text-sm text-slate-600">{permit.site_leader_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${permit.site_leader_status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : permit.site_leader_status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {permit.site_leader_status || 'Pending'}
                    </span>
                  </div>

                  {permit.site_leader_status === 'Approved' && (
                    <>
                      {permit.site_leader_approved_at && (
                        <p className="text-xs text-slate-500 mb-2">
                          Approved: {new Date(permit.site_leader_approved_at).toLocaleString()}
                        </p>
                      )}
                      {permit.site_leader_comments && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-xs font-medium text-green-900 mb-1">Comments:</p>
                          <p className="text-sm text-slate-700">{permit.site_leader_comments}</p>
                        </div>
                      )}
                      {permit.site_leader_signature && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-700 mb-2">Digital Signature:</p>
                          <img
                            src={permit.site_leader_signature}
                            alt="Site Leader Signature"
                            className="h-16 border-2 border-slate-300 rounded bg-white p-1"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Rejection Details if permit was rejected */}
              {permit.status === 'Rejected' && permit.rejection_reason && (
                <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                  <p className="font-semibold text-red-900 mb-2">Rejection Reason</p>
                  <p className="text-sm text-slate-700">{permit.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ==================== SECTION 4: Team Members ==================== */}
        {teamMembers.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <Users className="text-indigo-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Team Members ({teamMembers.length})</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {teamMembers.map((member, index) => (
                <div key={member.id || index} className="p-4 border-2 border-indigo-100 rounded-lg bg-indigo-50">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 font-bold text-white bg-indigo-600 rounded-full">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-indigo-900">{member.worker_name}</p>
                      {member.company_name && (
                        <p className="text-sm text-indigo-700">
                          <Briefcase className="inline w-4 h-4 mr-1" />
                          {member.company_name}
                        </p>
                      )}
                      {member.worker_role && (
                        <p className="text-sm text-indigo-700">
                          <User className="inline w-4 h-4 mr-1" />
                          {member.worker_role}
                        </p>
                      )}
                      {(member.contact_number || member.phone) && (
                        <p className="text-sm text-indigo-700">
                          <Phone className="inline w-4 h-4 mr-1" />
                          {member.contact_number || member.phone}
                        </p>
                      )}
                      {member.badge_id && (
                        <p className="text-xs text-indigo-600">Badge: {member.badge_id}</p>
                      )}

                      {/* Training Evidence */}
                      {workerTrainingEvidences.filter(e => e.team_member_id === member.id).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-indigo-200">
                          <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Training Evidence ({workerTrainingEvidences.filter(e => e.team_member_id === member.id).length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {workerTrainingEvidences
                              .filter(e => e.team_member_id === member.id)
                              .map((evidence, idx) => (
                                <a
                                  key={evidence.id || idx}
                                  href={workerTrainingEvidenceAPI.getFileUrl(evidence.file_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative"
                                  title={evidence.file_name}
                                >
                                  <img
                                    src={workerTrainingEvidenceAPI.getFileUrl(evidence.file_path)}
                                    alt={`Training evidence ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded border-2 border-indigo-300 group-hover:border-indigo-500 transition-all"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23e0e0e0' rx='4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='12' fill='%23666'%3EDoc%3C/text%3E%3C/svg%3E";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </a>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SECTION 5: Approvers ==================== */}
        <div className="p-6 bg-white shadow-lg rounded-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
            <CheckCircle className="text-teal-600 w-7 h-7" />
            <h2 className="text-2xl font-bold text-slate-900">Approval Status</h2>
          </div>

          <div className="space-y-4">
            {/* Area Manager */}
            {permit.area_manager_name && (
              <div className="p-4 border-2 rounded-lg border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Area In-charge</p>
                    <p className="text-lg font-bold text-slate-900">{permit.area_manager_name}</p>
                    {permit.area_manager_approved_at && (
                      <p className="text-xs text-slate-600">Approved: {formatDate(permit.area_manager_approved_at)}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${permit.area_manager_status === 'Approved' ? 'bg-green-100 text-green-800' :
                    permit.area_manager_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {permit.area_manager_status || 'Pending'}
                  </span>
                </div>
              </div>
            )}

            {/* Safety Officer */}
            {permit.safety_officer_name && (
              <div className="p-4 border-2 rounded-lg border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Safety In-charge</p>
                    <p className="text-lg font-bold text-slate-900">{permit.safety_officer_name}</p>
                    {permit.safety_officer_approved_at && (
                      <p className="text-xs text-slate-600">Approved: {formatDate(permit.safety_officer_approved_at)}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${permit.safety_officer_status === 'Approved' ? 'bg-green-100 text-green-800' :
                    permit.safety_officer_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {permit.safety_officer_status || 'Pending'}
                  </span>
                </div>
              </div>
            )}

            {/* Site Leader */}
            {permit.site_leader_name && (
              <div className="p-4 border-2 rounded-lg border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Site Leader / Senior Ops</p>
                    <p className="text-lg font-bold text-slate-900">{permit.site_leader_name}</p>
                    {permit.site_leader_approved_at && (
                      <p className="text-xs text-slate-600">Approved: {formatDate(permit.site_leader_approved_at)}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${permit.site_leader_status === 'Approved' ? 'bg-green-100 text-green-800' :
                    permit.site_leader_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {permit.site_leader_status || 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== SECTION 5.5: Extension Requests ==================== */}
        {extensions.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <Clock className="text-purple-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Extension Requests ({extensions.length})</h2>
            </div>
            <div className="space-y-6">
              {extensions.map((ext) => (
                <div key={ext.id} className="border-2 rounded-lg border-purple-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden">
                  {/* Header Section */}
                  <div className="p-4 bg-purple-100 border-b border-purple-200">
                    <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold uppercase text-purple-700">Request Date:</span>
                          <span className="text-sm font-medium text-slate-700">{formatDate(ext.requested_at)}</span>
                        </div>
                        {ext.requested_by_name && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <User className="w-3 h-3" />
                            <span>Requested by: <span className="font-medium">{ext.requested_by_name}</span></span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-2 text-sm font-bold rounded-full shadow-sm ${ext.status === 'Extended' || ext.status === 'Approved' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                          ext.status === 'Extension_Rejected' || ext.status === 'Rejected' ? 'bg-red-100 text-red-800 border-2 border-red-300' :
                            ext.status === 'Extension_Requested' || ext.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                              'bg-gray-100 text-gray-800 border-2 border-gray-300'
                          }`}>
                          {ext.status === 'Extended' ? '✓ Extended' :
                            ext.status === 'Extension_Requested' ? '⏳ Pending Approval' :
                              ext.status === 'Extension_Rejected' ? '✗ Rejected' :
                                ext.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Extension Details */}
                  <div className="p-4 bg-white">
                    <div className="mb-3">
                      <span className="text-sm font-bold text-slate-700">Reason for Extension:</span>
                      <p className="mt-1 text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                        "{ext.reason}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Original End Time</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-900">{formatDate(ext.original_end_time)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-green-600 uppercase block mb-1">New End Time</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700 text-lg">{formatDate(ext.new_end_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  {(ext.site_leader_status || ext.safety_officer_status) && (
                    <div className="p-4 bg-slate-50 border-t-2 border-purple-200">
                      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Approval Status
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Site Leader Approval */}
                        {ext.site_leader_status && (
                          <div className={`p-4 rounded-lg border-2 ${ext.site_leader_status === 'Approved' ? 'bg-green-50 border-green-300' :
                            ext.site_leader_status === 'Rejected' ? 'bg-red-50 border-red-300' :
                              'bg-yellow-50 border-yellow-300'
                            }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-xs font-semibold text-slate-600 uppercase block">Site Leader</span>
                                {(ext as any).site_leader_name && (
                                  <span className="text-xs text-slate-500">{(ext as any).site_leader_name}</span>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${ext.site_leader_status === 'Approved' ? 'bg-green-200 text-green-800' :
                                ext.site_leader_status === 'Rejected' ? 'bg-red-200 text-red-800' :
                                  'bg-yellow-200 text-yellow-800'
                                }`}>
                                {ext.site_leader_status}
                              </span>
                            </div>
                            {(ext as any).site_leader_approved_at && (
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                                <Calendar className="w-3 h-3" />
                                {formatDate((ext as any).site_leader_approved_at)}
                              </div>
                            )}
                            {ext.site_leader_remarks && (
                              <div className="mt-2 pt-2 border-t border-current/20">
                                <span className="text-xs font-semibold text-slate-600">Remarks:</span>
                                <p className="mt-1 text-xs text-slate-600 italic">"{ext.site_leader_remarks}"</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Safety Officer Approval */}
                        {ext.safety_officer_status && (
                          <div className={`p-4 rounded-lg border-2 ${ext.safety_officer_status === 'Approved' ? 'bg-green-50 border-green-300' :
                            ext.safety_officer_status === 'Rejected' ? 'bg-red-50 border-red-300' :
                              'bg-yellow-50 border-yellow-300'
                            }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-xs font-semibold text-slate-600 uppercase block">Safety Officer</span>
                                {(ext as any).safety_officer_name && (
                                  <span className="text-xs text-slate-500">{(ext as any).safety_officer_name}</span>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${ext.safety_officer_status === 'Approved' ? 'bg-green-200 text-green-800' :
                                ext.safety_officer_status === 'Rejected' ? 'bg-red-200 text-red-800' :
                                  'bg-yellow-200 text-yellow-800'
                                }`}>
                                {ext.safety_officer_status}
                              </span>
                            </div>
                            {(ext as any).safety_officer_approved_at && (
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                                <Calendar className="w-3 h-3" />
                                {formatDate((ext as any).safety_officer_approved_at)}
                              </div>
                            )}
                            {ext.safety_officer_remarks && (
                              <div className="mt-2 pt-2 border-t border-current/20">
                                <span className="text-xs font-semibold text-slate-600">Remarks:</span>
                                <p className="mt-1 text-xs text-slate-600 italic">"{ext.safety_officer_remarks}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Overall Status Message */}
                      {ext.status === 'Extended' && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Extension Approved - Permit end time has been extended</span>
                          </div>
                        </div>
                      )}
                      {(ext.status === 'Extension_Requested' || ext.status === 'Pending') && (
                        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">Awaiting approval from all required approvers</span>
                          </div>
                        </div>
                      )}
                      {(ext.status === 'Extension_Rejected' || ext.status === 'Rejected') && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800">
                            <XCircle className="w-5 h-5" />
                            <span className="font-semibold">Extension Request Rejected</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SECTION 6: Hazards ==================== */}
        {hazards.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <AlertTriangle className="text-orange-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Identified Hazards ({hazards.length})</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {hazards.map((hazard) => (
                <div key={hazard.id} className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <AlertTriangle className="flex-shrink-0 w-6 h-6 text-orange-600" />
                  <div>
                    <p className="font-bold text-orange-900">{hazard.name || hazard.hazard_name}</p>
                    {hazard.description && (
                      <p className="mt-1 text-sm text-orange-700">{hazard.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Control Measures */}
            {permit.control_measures && (
              <div className="pt-6 mt-6 border-t">
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Control Measures</h3>
                <p className="p-4 text-sm leading-relaxed whitespace-pre-wrap rounded-lg text-slate-700 bg-slate-50">
                  {permit.control_measures}
                </p>
              </div>
            )}

            {/* Other Hazards */}
            {permit.other_hazards && (
              <div className="pt-6 mt-6 border-t">
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Other Hazards</h3>
                <p className="p-4 text-sm leading-relaxed whitespace-pre-wrap rounded-lg text-slate-700 bg-slate-50">
                  {permit.other_hazards}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================== SECTION 7: PPE ==================== */}
        {ppe.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <Shield className="text-orange-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Required PPE ({ppe.length})</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {ppe.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <Shield className="flex-shrink-0 w-6 h-6 text-orange-600" />
                  <p className="font-bold text-orange-900">{item.name || item.ppe_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SECTION 8: SWMS ==================== */}
        {(permit.swms_file_url || permit.swms_text) && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <FileCheck className="text-purple-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Safe Work Method Statement (SWMS)</h2>
            </div>

            {permit.swms_file_url && (
              <div className="mb-4">
                <a
                  href={evidenceAPI.getFileUrl(permit.swms_file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <FileText className="w-5 h-5" />
                  View SWMS Document
                </a>
              </div>
            )}

            {permit.swms_text && (
              <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap rounded-lg text-slate-700 bg-slate-50">
                {permit.swms_text}
              </div>
            )}
          </div>
        )}

        {/* ==================== SECTION 8.5: Evidence & Photos ==================== */}
        {evidences.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <Camera className="text-blue-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Evidence & Photos ({evidences.length})</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {evidences.map((evidence, index) => (
                <div key={evidence.id || index} className="overflow-hidden border-2 rounded-lg border-slate-200">
                  <div className="relative aspect-video bg-slate-100">
                    {evidence.file_path ? (
                      <a
                        href={evidenceAPI.getFileUrl(evidence.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full cursor-zoom-in"
                        title="Click to view full image"
                      >
                        <img
                          src={evidenceAPI.getFileUrl(evidence.file_path)}
                          alt={evidence.category}
                          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%23999'%3EImage Error%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </a>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-slate-400">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute pointer-events-none top-2 left-2 px-2 py-1 text-xs font-bold text-white bg-black bg-opacity-60 rounded capitalize">
                      {evidence.category.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(evidence.timestamp).toLocaleString()}
                    </div>
                    {evidence.latitude && evidence.longitude && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {Number(evidence.latitude).toFixed(6)}, {Number(evidence.longitude).toFixed(6)}
                      </div>
                    )}
                    {evidence.description && (
                      <p className="text-sm text-slate-700 line-clamp-2">{evidence.description}</p>
                    )}
                    {!evidence.description && (
                      <p className="text-xs italic text-slate-400">No description provided</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SECTION 9: Safety Checklist ==================== */}
        {checklistResponses.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
              <ClipboardCheck className="text-green-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-slate-900">Safety Checklist ({checklistResponses.length})</h2>
            </div>
            <div className="space-y-3">
              {checklistResponses.map((item) => (
                <div key={item.id} className="p-4 border-2 rounded-lg border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <p className="flex-1 font-medium text-slate-900">{item.question || item.question_text}</p>
                    <span className={`px-3 py-1 text-sm font-bold rounded-full flex-shrink-0 ${item.response === 'Yes' ? 'bg-green-100 text-green-800' :
                      item.response === 'No' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {item.response}
                    </span>
                  </div>
                  {item.remarks && (
                    <div className="p-3 mt-3 rounded bg-slate-50">
                      <p className="text-xs font-medium uppercase text-slate-500">Remarks:</p>
                      <p className="mt-1 text-sm text-slate-700">{item.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SECTION 10: Rejection Reason ==================== */}
        {permit.rejection_reason && (
          <div className="p-6 border-2 border-red-200 shadow-lg bg-red-50 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="text-red-600 w-7 h-7" />
              <h2 className="text-2xl font-bold text-red-900">Rejection Reason</h2>
            </div>
            <p className="p-4 text-sm leading-relaxed text-red-800 bg-white rounded-lg">
              {permit.rejection_reason}
            </p>
          </div>
        )}

        {/* ==================== SECTION 11: Permit Closure & Evidence ==================== */}
        <div className="p-6 bg-white shadow-lg rounded-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-2">
            <FileCheck className="text-teal-600 w-7 h-7" />
            <h2 className="text-2xl font-bold text-slate-900">Permit Closure</h2>
          </div>

          {/* Close Permit Button */}
          {(permit.status === 'Active' || permit.status === 'Ready_To_Start' || permit.status === 'Extension_Requested' || permit.status === 'Extended') && (
            <div className="mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      To close this permit, please click the button below. You will be asked to capture evidence photos and complete the safety checklist.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <CheckCircle className="w-6 h-6" />
                Close Permit
              </button>
            </div>
          )}



          {/* 2. Display Saved Closure Evidence */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Saved Closure Evidence</h3>
            {savedClosureEvidences.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedClosureEvidences.map((evidence, index) => (
                  <div key={`saved-${evidence.id || index}`} className="overflow-hidden border-2 rounded-lg border-teal-100 bg-teal-50/30">
                    <div className="relative aspect-video bg-slate-100 group">
                      {evidence.file_path ? (
                        <a
                          href={closureEvidenceAPI.getFileUrl(evidence.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full cursor-zoom-in"
                          title="Click to view full image"
                        >
                          <img
                            src={closureEvidenceAPI.getFileUrl(evidence.file_path)}
                            alt={evidence.category}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%23999'%3EImage Error%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </a>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-slate-400">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute pointer-events-none top-2 left-2 px-2 py-1 text-xs font-bold text-white bg-teal-900/80 rounded capitalize backdrop-blur-sm">
                        {evidence.category.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(evidence.timestamp).toLocaleString()}
                      </div>
                      {evidence.latitude && evidence.longitude && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {Number(evidence.latitude).toFixed(6)}, {Number(evidence.longitude).toFixed(6)}
                        </div>
                      )}
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">
                        {evidence.description || <span className="text-slate-400 italic font-normal">No description</span>}
                      </p>
                      {evidence.captured_by_name && (
                        <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-teal-100">
                          Uploaded by: <span className="font-medium text-teal-700">{evidence.captured_by_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <FileCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No closure evidence uploaded yet.</p>
              </div>
            )}
          </div>

          {/* ============= CLOSURE DETAILS SECTION ============= */}
          {permit?.status === 'Closed' && closureData && (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-600 rounded-lg">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Permit Closure Details</h3>
                  <p className="text-sm text-slate-600">
                    Closed on {formatDate(closureData.closed_at)} by {closureData.closed_by_name}
                  </p>
                </div>
              </div>

              {/* Closure Checklist */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">Housekeeping Completed</span>
                  </div>
                  {closureData.housekeeping_done ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">All Tools and Equipment Removed</span>
                  </div>
                  {closureData.tools_removed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">All Locks and Tags Removed</span>
                  </div>
                  {closureData.locks_removed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">Work Area Restored to Normal</span>
                  </div>
                  {closureData.area_restored ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>

              {/* Closure Remarks & Signature */}
              {closureData.remarks && (
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Closure Remarks
                  </h4>

                  {/* Remarks Text */}
                  <p className="text-slate-800 whitespace-pre-wrap mb-4">
                    {closureData.remarks.split('Signed by: ')[0].trim()}
                  </p>

                  {/* Signature Image */}
                  {closureData.remarks.includes('Signed by: ') && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Signed by Supervisor</p>
                      <div className="p-2 border rounded-lg bg-white inline-block">
                        <img
                          src={closureData.remarks.split('Signed by: ')[1].trim()}
                          alt="Supervisor Signature"
                          className="h-20 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={onBack}
            className="px-8 py-3 font-medium text-white transition-colors rounded-lg bg-slate-600 hover:bg-slate-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>


      {/* Close Permit Modal */}
      {
        showCloseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6 bg-red-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertOctagon className="w-6 h-6" />
                  Close Permit: {permit?.permit_serial}
                </h3>
                <button onClick={() => setShowCloseModal(false)} className="hover:bg-red-700 p-2 rounded-full transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    Ensure all work is completed and the area is safe before closing. This action cannot be undone.
                  </p>
                </div>

                {/* Checklist */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Closure Checklist</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        checked={housekeepingDone}
                        onChange={(e) => setHousekeepingDone(e.target.checked)}
                      />
                      <span className="font-medium text-slate-700">Housekeeping completed</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        checked={toolsRemoved}
                        onChange={(e) => setToolsRemoved(e.target.checked)}
                      />
                      <span className="font-medium text-slate-700">All tools & equipment removed</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        checked={locksRemoved}
                        onChange={(e) => setLocksRemoved(e.target.checked)}
                      />
                      <span className="font-medium text-slate-700">LOTO locks removed (if applicable)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        checked={areaRestored}
                        onChange={(e) => setAreaRestored(e.target.checked)}
                      />
                      <span className="font-medium text-slate-700">Area restored to safe condition</span>
                    </label>
                  </div>
                </div>

                {/* Evidence Capture & Review */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Closure Evidence (Required)</h4>

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="w-full cursor-pointer group flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 rounded-xl bg-red-50 hover:bg-red-100 transition-all"
                    >
                      <div className="p-3 bg-white rounded-full mb-3 shadow-md transform group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-red-600" />
                      </div>
                      <span className="font-bold text-red-900 text-lg">Click to Capture Evidence</span>
                      <span className="text-sm text-red-700 mt-1">Take photos of area and activity completion</span>
                    </button>
                  </div>

                  {/* Previews */}
                  {closureEvidences.length > 0 ? (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Captured Photos ({closureEvidences.length})</p>
                      {closureEvidences.map((evidence, index) => (
                        <div key={index} className="flex gap-3 bg-white p-2 rounded border border-slate-200 shadow-sm relative">
                          <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                            <img
                              src={evidence.preview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wide border border-slate-200">
                                {evidence.category.replace('_', ' ')}
                              </div>
                              <button
                                onClick={() => removeClosureEvidence(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Add description..."
                              value={evidence.description}
                              onChange={(e) => updateClosureEvidenceDescription(index, e.target.value)}
                              className="mt-2 w-full text-xs p-1.5 border border-slate-300 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 italic bg-red-50 p-3 rounded border border-red-100">
                      <AlertTriangle className="inline w-4 h-4 mr-1" />
                      Please capture at least one photo of the area/activity.
                    </p>
                  )}
                </div>

                {/* Remarks */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Remarks / Comments</h4>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter any final comments..."
                    value={closureRemarks}
                    onChange={(e) => setClosureRemarks(e.target.value)}
                  />
                </div>

                {/* Digital Signature */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Digital Signature <span className="text-red-500">*</span>
                  </h4>
                  <div className="p-4 border-2 border-slate-300 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <PenTool className="w-4 h-4" />
                        <span>Sign with mouse or touchpad</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 transition-colors border border-slate-300 rounded hover:bg-slate-100"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full bg-white border-2 border-slate-300 rounded cursor-crosshair touch-none"
                    />
                    {hasSignature && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Signature captured</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 px-6 py-3 font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClosePermit}
                    disabled={isUploadingClosure || !housekeepingDone || !toolsRemoved || !locksRemoved || !areaRestored || !hasSignature}
                    className="flex-1 px-6 py-3 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploadingClosure ? 'Closing...' : 'Confirm Close & Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showCameraModal && (
          <CameraModal
            isOpen={showCameraModal}
            onClose={() => setShowCameraModal(false)}
            onCapture={handleCameraCapture}
          />
        )
      }
    </div >
  );
}