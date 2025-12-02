// FIX 3: Update PermitDetails.tsx to handle the API response correctly
// Replace your frontend/src/pages/supervisor/PermitDetails.tsx with this:

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { permitService } from '@/services/permit.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  ArrowLeft, 
  FileText, 
  MapPin, 
  Calendar, 
  User,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PermitDetailsProps {
  ptwId: number;
  onBack: () => void;
}

export default function PermitDetails({ ptwId, onBack }: PermitDetailsProps) {
  const [permit, setPermit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermit();
  }, [ptwId]);

  const loadPermit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading permit with ID:', ptwId);
      
      const response = await permitService.getById(ptwId);
      
      console.log('📥 API Response:', response);
      
      if (response.success && response.data) {
        setPermit(response.data);
        console.log('✅ Permit loaded successfully:', response.data);
      } else {
        setError(response.message || 'Failed to load permit');
        console.error('❌ Failed to load permit:', response.message);
      }
    } catch (error) {
      console.error('❌ Error loading permit:', error);
      setError('An error occurred while loading the permit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Pending_Approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'Closed': 'bg-blue-100 text-blue-800 border-blue-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      'General': 'bg-blue-50 text-blue-700',
      'Height': 'bg-purple-50 text-purple-700',
      'Hot_Work': 'bg-red-50 text-red-700',
      'Electrical': 'bg-yellow-50 text-yellow-700',
      'Confined_Space': 'bg-orange-50 text-orange-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="mb-4 text-lg text-slate-700">{error}</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="py-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="mb-4 text-lg text-slate-500">Permit not found</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {permit.permit_serial || permit.permit_number || `PTW-${permit.id}`}
            </h1>
            <p className="mt-1 text-slate-600">Permit Details</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(permit.status)}`}>
          {permit.status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                <FileText className="w-4 h-4" />
                Permit Type
              </div>
              <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${getTypeColor(permit.permit_type)}`}>
                {permit.permit_type.replace('_', ' ')}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                <MapPin className="w-4 h-4" />
                Work Location
              </div>
              <p className="text-slate-900">{permit.work_location}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                <FileText className="w-4 h-4" />
                Work Description
              </div>
              <p className="text-slate-900">{permit.work_description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                  <Calendar className="w-4 h-4" />
                  Start Time
                </div>
                <p className="text-slate-900">
                  {new Date(permit.start_time).toLocaleString()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                  <Clock className="w-4 h-4" />
                  End Time
                </div>
                <p className="text-slate-900">
                  {new Date(permit.end_time).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">
                <User className="w-4 h-4" />
                Receiver Name
              </div>
              <p className="text-slate-900">{permit.receiver_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Side Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-slate-900">
                {permit.created_by_name || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(permit.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {permit.site_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Site</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-slate-900">{permit.site_name}</p>
                {permit.site_code && (
                  <p className="text-xs text-slate-500">Code: {permit.site_code}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Team Members */}
      {permit.team_members && permit.team_members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {permit.team_members.map((member: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{member.worker_name}</p>
                    <p className="text-sm text-slate-600">{member.worker_role.replace('_', ' ')}</p>
                  </div>
                  {member.badge_id && (
                    <span className="px-2 py-1 text-xs rounded bg-slate-200 text-slate-700">
                      Badge: {member.badge_id}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hazards & PPE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {permit.hazards && permit.hazards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Identified Hazards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {permit.hazards.map((hazard: any) => (
                  <div key={hazard.id} className="p-2 rounded bg-orange-50">
                    <p className="text-sm font-medium text-orange-900">
                      {hazard.hazard_name || hazard.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {permit.ppe && permit.ppe.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Required PPE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {permit.ppe.map((ppe: any) => (
                  <div key={ppe.id} className="p-2 rounded bg-blue-50">
                    <p className="text-sm font-medium text-blue-900">
                      {ppe.ppe_name || ppe.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}