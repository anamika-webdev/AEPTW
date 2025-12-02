// frontend/src/pages/supervisor/PermitDetails.tsx
// Simple working version for debugging

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { permitsAPI } from '../../services/api';
import { ArrowLeft, FileText, MapPin, Calendar, Users } from 'lucide-react';

interface PermitDetailsProps {
  ptwId: number;
  onBack: () => void;
}

export default function PermitDetails({ ptwId, onBack }: PermitDetailsProps) {
  const [permit, setPermit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPermit();
  }, [ptwId]);

  const loadPermit = async () => {
    try {
      console.log('🔍 Loading permit:', ptwId);
      setLoading(true);
      setError('');
      
      const response = await permitsAPI.getById(ptwId);
      console.log('📦 Permit response:', response);
      
      if (response.success && response.data) {
        setPermit(response.data);
      } else {
        setError('Permit not found');
      }
    } catch (err: any) {
      console.error('❌ Error loading permit:', err);
      setError(err.message || 'Failed to load permit');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading permit details...</p>
        </div>
      </div>
    );
  }

  if (error || !permit) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md p-6 mx-auto bg-white border rounded-lg shadow-sm border-slate-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Permit Not Found</h2>
          <p className="mb-4 text-slate-600">{error || 'Unable to load permit details'}</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Pending_Approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Draft': 'bg-slate-100 text-slate-800 border-slate-200',
      'Closed': 'bg-blue-100 text-blue-800 border-blue-200',
      'Extension_Requested': 'bg-purple-100 text-purple-800 border-purple-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button 
            onClick={onBack} 
            variant="outline"
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {permit.permit_serial || `PTW-${permit.id}`}
            </h1>
            <p className="mt-1 text-slate-600">Permit Details</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(permit.status)}`}>
          {permit.status?.replace(/_/g, ' ') || 'Unknown'}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Permit Information Card */}
          <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Permit Information</h2>
            
            <div className="space-y-4">
              {/* Permit Type */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                  <FileText className="w-4 h-4" />
                  Permit Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {permit.permit_type?.split(',').map((type: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 rounded-lg bg-blue-50"
                    >
                      {type.trim().replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Location */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                  <MapPin className="w-4 h-4" />
                  Work Location
                </div>
                <p className="text-slate-900">{permit.work_location || 'N/A'}</p>
              </div>

              {/* Work Description */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                  <FileText className="w-4 h-4" />
                  Work Description
                </div>
                <p className="text-slate-900">{permit.work_description || 'N/A'}</p>
              </div>

              {/* Time Period */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                    <Calendar className="w-4 h-4" />
                    Start Time
                  </div>
                  <p className="text-slate-900">{formatDate(permit.start_time)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                    <Calendar className="w-4 h-4" />
                    End Time
                  </div>
                  <p className="text-slate-900">{formatDate(permit.end_time)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          {permit.team_members && permit.team_members.length > 0 && (
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Team Members</h2>
              <div className="space-y-3">
                {permit.team_members.map((member: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.worker_name || 'N/A'}</p>
                      <p className="text-sm text-slate-600">
                        {member.worker_role || 'Worker'} • {member.company_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Site Information */}
          <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Site Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Site Name</p>
                <p className="mt-1 text-slate-900">{permit.site_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Receiver</p>
                <p className="mt-1 text-slate-900">{permit.receiver_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Control Measures */}
          {permit.control_measures && (
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Control Measures</h2>
              <p className="text-sm text-slate-700">{permit.control_measures}</p>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="p-4 mt-6 border rounded-lg bg-slate-50 border-slate-200">
          <summary className="font-medium cursor-pointer text-slate-700">Debug Info</summary>
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify(permit, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}