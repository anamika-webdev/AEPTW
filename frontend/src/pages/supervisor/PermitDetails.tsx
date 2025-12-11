// frontend/src/pages/supervisor/PermitDetails.tsx
// COMPLETE VERSION - Shows ALL PTW details

import { useState, useEffect } from 'react';
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
  AlertOctagon
} from 'lucide-react';

interface PermitDetailsProps {
  ptwId: number;
  onBack: () => void;
}

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

  useEffect(() => {
    loadPermitDetails();
  }, [ptwId]);

  const loadPermitDetails = async () => {
    setLoading(true);
    setError(null);

    try {
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', icon: AlertOctagon },
      'Active': { bg: 'bg-orange-100', text: 'text-orange-800', icon: CheckCircle },
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
          {getStatusBadge(permit.status)}
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
            <div className="space-y-4">
              {extensions.map((ext) => (
                <div key={ext.id} className="p-4 border-2 rounded-lg border-purple-100 bg-purple-50">
                  <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-purple-700">Request Date:</span>
                        <span className="text-sm font-medium text-slate-700">{formatDate(ext.requested_at)}</span>
                      </div>
                      <div className="mb-2 text-sm text-slate-800">
                        <span className="font-bold">Reason: </span>
                        {ext.reason}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">From:</span>
                          <span className="font-medium text-slate-900">{formatDate(ext.original_end_time)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">To:</span>
                          <span className="font-bold text-green-700">{formatDate(ext.new_end_time)}</span>
                        </div>
                      </div>
                      {ext.requested_by_name && (
                        <div className="mt-2 text-xs text-slate-500">
                          Requested by: {ext.requested_by_name}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${ext.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          ext.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {ext.status}
                      </span>
                    </div>
                  </div>

                  {/* Approval Details for Extension */}
                  {(ext.site_leader_status || ext.safety_officer_status) && (
                    <div className="mt-4 pt-3 border-t border-purple-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ext.site_leader_status && (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-600 block mb-1">Site Leader:</span>
                          <span className={`${ext.site_leader_status === 'Approved' ? 'text-green-700' :
                              ext.site_leader_status === 'Rejected' ? 'text-red-700' :
                                'text-yellow-700'
                            } font-medium`}>
                            {ext.site_leader_status}
                          </span>
                          {ext.site_leader_remarks && <p className="mt-1 text-slate-500 italic">"{ext.site_leader_remarks}"</p>}
                        </div>
                      )}
                      {ext.safety_officer_status && (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-600 block mb-1">Safety Officer:</span>
                          <span className={`${ext.safety_officer_status === 'Approved' ? 'text-green-700' :
                              ext.safety_officer_status === 'Rejected' ? 'text-red-700' :
                                'text-yellow-700'
                            } font-medium`}>
                            {ext.safety_officer_status}
                          </span>
                          {ext.safety_officer_remarks && <p className="mt-1 text-slate-500 italic">"{ext.safety_officer_remarks}"</p>}
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
                  href={permit.swms_file_url}
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
    </div>
  );
}