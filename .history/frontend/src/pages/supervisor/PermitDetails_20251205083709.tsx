// frontend/src/pages/supervisor/PermitDetails.tsx
// COMPLETE PERMIT DETAILS VIEW - Shows all information same as submitted PTW

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Building,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface PermitDetailsProps {
  ptwId: number;
  onBack: () => void;
}

interface PermitData {
  // Basic Info
  id: number;
  permit_serial: string;
  permit_type: string;
  permit_types?: string;
  status: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  
  // Site Info
  site_name?: string;
  site_code?: string;
  site_address?: string;
  
  // Issuer Info
  permit_initiator?: string;
  permit_initiator_contact?: string;
  issue_department?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_by_contact?: string;
  
  // Receiver Info
  receiver_name?: string;
  receiver_contact?: string;
  
  // Approvers
  area_manager_name?: string;
  safety_officer_name?: string;
  site_leader_name?: string;
  area_manager_status?: string;
  safety_officer_status?: string;
  site_leader_status?: string;
  area_manager_approved_at?: string;
  safety_officer_approved_at?: string;
  site_leader_approved_at?: string;
  area_manager_signature?: string;
  safety_officer_signature?: string;
  site_leader_signature?: string;
  
  // Safety Info
  control_measures?: string;
  other_hazards?: string;
  swms_file_url?: string;
  swms_text?: string;
  
  // Rejection
  rejection_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  started_at?: string;
  final_submitted_at?: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  contact_number?: string;
}

interface Hazard {
  id: number;
  name: string;
  description?: string;
}

interface PPE {
  id: number;
  name: string;
  description?: string;
}

interface ChecklistResponse {
  id: number;
  question: string;
  response: string;
  remarks?: string;
}

export default function PermitDetails({ ptwId, onBack }: PermitDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permit, setPermit] = useState<PermitData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [ppe, setPpe] = useState<PPE[]>([]);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse[]>([]);

  useEffect(() => {
    loadPermitDetails();
  }, [ptwId]);

  const loadPermitDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      console.log('📥 Fetching permit details for ID:', ptwId);

      const response = await fetch(`${baseURL}/permits/${ptwId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📦 Permit details response:', data);

      if (data.success) {
        setPermit(data.data.permit);
        setTeamMembers(data.data.team_members || []);
        setHazards(data.data.hazards || []);
        setPpe(data.data.ppe || []);
        setChecklistResponses(data.data.checklist_responses || []);
      } else {
        setError(data.message || 'Failed to load permit details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching permit details:', err);
      setError('Error fetching permit details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      'Initiated': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending Approval' },
      'Approved': { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Approved' },
      'Ready_To_Start': { bg: 'bg-purple-100', text: 'text-purple-800', icon: AlertOctagon, label: 'Ready to Start' },
      'Active': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'In Progress' },
      'Extension_Requested': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock, label: 'Extension Requested' },
      'Closed': { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' },
    };

    const { bg, text, icon: Icon, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${bg} ${text}`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  const getApprovalBadge = (status?: string) => {
    if (!status || status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (status === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return <span className="text-xs text-gray-500">{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-600">Loading permit details...</p>
        </div>
      </div>
    );
  }

  if (error || !permit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Error Loading Permit</h3>
          <p className="mb-4 text-sm text-gray-600">{error || 'Permit not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            {getStatusBadge(permit.status)}
          </div>
        </div>

        {/* Title */}
        <div className="p-6 mb-6 bg-white border-b rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-slate-900">{permit.permit_serial}</h1>
              </div>
              <p className="text-slate-600">Permit to Work Details</p>
            </div>
          </div>
        </div>

        {/* Rejection Notice */}
        {permit.status === 'Rejected' && permit.rejection_reason && (
          <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <XCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900">Rejection Reason</p>
                <p className="mt-1 text-sm text-red-700">{permit.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Basic Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <FileText className="flex-shrink-0 w-5 h-5 mt-1 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Permit Type(s)</p>
                <p className="mt-1 text-slate-900">{permit.permit_types || permit.permit_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="flex-shrink-0 w-5 h-5 mt-1 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Work Location</p>
                <p className="mt-1 text-slate-900">{permit.work_location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building className="flex-shrink-0 w-5 h-5 mt-1 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Site</p>
                <p className="mt-1 text-slate-900">
                  {permit.site_name || 'N/A'}
                  {permit.site_code && <span className="text-sm text-slate-500"> ({permit.site_code})</span>}
                </p>
                {permit.site_address && (
                  <p className="mt-1 text-sm text-slate-600">{permit.site_address}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="flex-shrink-0 w-5 h-5 mt-1 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Duration</p>
                <p className="mt-1 text-slate-900">
                  {new Date(permit.start_time).toLocaleString()} 
                  <br />
                  <span className="text-sm text-slate-600">to</span>
                  <br />
                  {new Date(permit.end_time).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t">
            <p className="text-sm font-medium text-slate-600">Work Description</p>
            <p className="mt-2 text-slate-900">{permit.work_description}</p>
          </div>
        </div>

        {/* Issuer & Receiver Information */}
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* Issuer */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Permit Issuer</h3>
            <div className="space-y-3">
              {permit.permit_initiator && (
                <div className="flex items-start gap-3">
                  <User className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Name</p>
                    <p className="text-slate-900">{permit.permit_initiator}</p>
                  </div>
                </div>
              )}
              {permit.permit_initiator_contact && (
                <div className="flex items-start gap-3">
                  <Phone className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Contact</p>
                    <p className="text-slate-900">{permit.permit_initiator_contact}</p>
                  </div>
                </div>
              )}
              {permit.issue_department && (
                <div className="flex items-start gap-3">
                  <Building className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Department</p>
                    <p className="text-slate-900">{permit.issue_department}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Receiver */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Issued To</h3>
            <div className="space-y-3">
              {permit.receiver_name && (
                <div className="flex items-start gap-3">
                  <User className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Name</p>
                    <p className="text-slate-900">{permit.receiver_name}</p>
                  </div>
                </div>
              )}
              {permit.receiver_contact && (
                <div className="flex items-start gap-3">
                  <Phone className="flex-shrink-0 w-5 h-5 mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Contact</p>
                    <p className="text-slate-900">{permit.receiver_contact}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Team Members ({teamMembers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{member.name}</td>
                      <td className="px-4 py-3 text-slate-600">{member.role}</td>
                      <td className="px-4 py-3 text-slate-600">{member.contact_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approvers */}
        {(permit.area_manager_name || permit.safety_officer_name || permit.site_leader_name) && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Approvers</h2>
            <div className="space-y-4">
              {permit.area_manager_name && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Area Manager</p>
                    <p className="mt-1 text-slate-900">{permit.area_manager_name}</p>
                    {permit.area_manager_approved_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Approved: {new Date(permit.area_manager_approved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {getApprovalBadge(permit.area_manager_status)}
                </div>
              )}
              {permit.safety_officer_name && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Safety Officer</p>
                    <p className="mt-1 text-slate-900">{permit.safety_officer_name}</p>
                    {permit.safety_officer_approved_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Approved: {new Date(permit.safety_officer_approved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {getApprovalBadge(permit.safety_officer_status)}
                </div>
              )}
              {permit.site_leader_name && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Site Leader</p>
                    <p className="mt-1 text-slate-900">{permit.site_leader_name}</p>
                    {permit.site_leader_approved_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Approved: {new Date(permit.site_leader_approved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {getApprovalBadge(permit.site_leader_status)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hazards */}
        {hazards.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-slate-900">Identified Hazards ({hazards.length})</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {hazards.map((hazard) => (
                <div key={hazard.id} className="flex items-start gap-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <AlertTriangle className="flex-shrink-0 w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">{hazard.name}</p>
                    {hazard.description && (
                      <p className="mt-1 text-sm text-orange-700">{hazard.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control Measures */}
        {permit.control_measures && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Control Measures</h2>
            <p className="whitespace-pre-wrap text-slate-700">{permit.control_measures}</p>
          </div>
        )}

        {/* Other Hazards */}
        {permit.other_hazards && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Other Hazards</h2>
            <p className="whitespace-pre-wrap text-slate-700">{permit.other_hazards}</p>
          </div>
        )}

        {/* PPE */}
        {ppe.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Required PPE ({ppe.length})</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {ppe.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <Shield className="flex-shrink-0 w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 text-sm text-blue-700">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Responses */}
        {checklistResponses.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Safety Checklist ({checklistResponses.length})</h2>
            <div className="space-y-3">
              {checklistResponses.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-slate-900">{item.question}</p>
                    <span className={`ml-4 px-3 py-1 text-xs font-medium rounded-full ${
                      item.response === 'Yes' 
                        ? 'bg-green-100 text-green-800' 
                        : item.response === 'No'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.response}
                    </span>
                  </div>
                  {item.remarks && (
                    <p className="mt-2 text-sm text-slate-600"><strong>Remarks:</strong> {item.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SWMS */}
        {(permit.swms_file_url || permit.swms_text) && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Safe Work Method Statement (SWMS)</h2>
            {permit.swms_file_url && (
              <a
                href={permit.swms_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                View SWMS Document
              </a>
            )}
            {permit.swms_text && (
              <div className="p-4 mt-4 rounded-lg bg-slate-50">
                <p className="whitespace-pre-wrap text-slate-700">{permit.swms_text}</p>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Timeline</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Created:</span>
              <span className="font-medium text-slate-900">{new Date(permit.created_at).toLocaleString()}</span>
            </div>
            {permit.final_submitted_at && (
              <div className="flex justify-between">
                <span className="text-slate-600">Final Submitted:</span>
                <span className="font-medium text-slate-900">{new Date(permit.final_submitted_at).toLocaleString()}</span>
              </div>
            )}
            {permit.started_at && (
              <div className="flex justify-between">
                <span className="text-slate-600">Started:</span>
                <span className="font-medium text-slate-900">{new Date(permit.started_at).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Last Updated:</span>
              <span className="font-medium text-slate-900">{new Date(permit.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}