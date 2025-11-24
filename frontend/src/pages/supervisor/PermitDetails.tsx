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

  useEffect(() => {
    loadPermit();
  }, [ptwId]);

  const loadPermit = async () => {
    try {
      setLoading(true);
      const response = await permitService.getById(ptwId);
      setPermit(response.permit);
    } catch (error) {
      console.error('Failed to load permit:', error);
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

  if (!permit) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Permit not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
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
            <h1 className="text-3xl font-bold text-slate-900">{permit.permit_serial}</h1>
            <p className="text-slate-600 mt-1">Permit Details</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(permit.status)}`}>
          {permit.status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <FileText className="w-4 h-4" />
                Permit Type
              </div>
              <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${getTypeColor(permit.permit_type)}`}>
                {permit.permit_type.replace('_', ' ')}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <MapPin className="w-4 h-4" />
                Work Location
              </div>
              <p className="text-slate-900">{permit.work_location}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <FileText className="w-4 h-4" />
                Work Description
              </div>
              <p className="text-slate-900">{permit.work_description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Start Time
                </div>
                <p className="text-slate-900">{new Date(permit.start_time).toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  End Time
                </div>
                <p className="text-slate-900">{new Date(permit.end_time).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <User className="w-4 h-4" />
                Receiver Name
              </div>
              <p className="text-slate-900">{permit.receiver_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                </div>
                <div className="pb-4">
                  <p className="font-medium text-sm text-slate-900">Created</p>
                  <p className="text-xs text-slate-500">{new Date(permit.created_at).toLocaleString()}</p>
                </div>
              </div>

              {permit.status === 'Active' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">Active</p>
                    <p className="text-xs text-slate-500">Work in progress</p>
                  </div>
                </div>
              )}

              {permit.status === 'Pending_Approval' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">Pending Approval</p>
                    <p className="text-xs text-slate-500">Awaiting review</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Identified Hazards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Slips, trips, and falls
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Moving machinery
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Manual handling
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Control Measures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Use appropriate PPE
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Safety barriers
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Regular supervision
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required PPE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Required PPE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              Safety helmet
            </span>
            <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              Safety glasses
            </span>
            <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              High-visibility vest
            </span>
            <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              Safety boots
            </span>
            <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              Gloves
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}