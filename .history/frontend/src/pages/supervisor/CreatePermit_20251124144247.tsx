import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { permitService } from '@/services/permit.service';
import { siteService } from '@/services/site.service';
import { userService } from '@/services/user.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FileText, MapPin, Shield, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Save } from 'lucide-react';

interface CreatePermitProps {
  onBack: () => void;
}

export default function CreatePermit({ onBack }: CreatePermitProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sites, setSites] = useState<any[]>([]);
  const [_workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    site_id: '',
    permit_type: 'General',
    work_location: '',
    work_description: '',
    start_time: '',
    end_time: '',
    receiver_name: '',
    hazards: [] as string[],
    control_measures: [] as string[],
    ppe_required: [] as string[],
    assigned_workers: [] as number[],
  });

  const permitTypes = [
    { value: 'General', label: 'General Work', icon: '🔧' },
    { value: 'Height', label: 'Work at Height', icon: '🪜' },
    { value: 'Hot_Work', label: 'Hot Work', icon: '🔥' },
    { value: 'Electrical', label: 'Electrical Work', icon: '⚡' },
    { value: 'Confined_Space', label: 'Confined Space', icon: '🚪' },
  ];

  const commonHazards = [
    'Slips, trips, and falls',
    'Working at height',
    'Electrical hazards',
    'Fire hazards',
    'Moving machinery',
    'Chemical exposure',
    'Noise exposure',
    'Manual handling',
  ];

  const commonControls = [
    'Use appropriate PPE',
    'Implement safety barriers',
    'Conduct safety briefing',
    'Ensure proper ventilation',
    'Follow lockout/tagout procedures',
    'Maintain safe distances',
    'Use warning signs',
    'Regular supervision',
  ];

  const commonPPE = [
    'Safety helmet',
    'Safety glasses',
    'High-visibility vest',
    'Safety boots',
    'Gloves',
    'Ear protection',
    'Respiratory protection',
    'Fall protection harness',
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sitesRes, workersRes] = await Promise.all([
        siteService.getAll(),
        userService.getByRole('Worker'),
      ]);
      setSites(sitesRes.sites || []);
      setWorkers(workersRes.users || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const permitData = {
        site_id: parseInt(formData.site_id),
        permit_type: formData.permit_type,
        work_location: formData.work_location,
        work_description: formData.work_description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        receiver_name: formData.receiver_name,
        status: 'Pending_Approval',
      };

      await permitService.create(permitData);
      setSuccess('Permit created successfully and submitted for approval!');
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create permit');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const toggleArrayItem = (array: any[], item: any, setter: (arr: any[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const progressPercentage = (currentStep / 5) * 100;

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
            <h1 className="text-3xl font-bold text-slate-900">Create New Permit</h1>
            <p className="mt-1 text-slate-600">Step {currentStep} of 5</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-4 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Basic Info</span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Permit Type</span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Hazards</span>
            <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Controls & PPE</span>
            <span className={currentStep >= 5 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Review</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site_id">Site *</Label>
              <select
                id="site_id"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full h-10 px-3 mt-1 bg-transparent border rounded-md border-input"
                required
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="work_location">Work Location *</Label>
              <Input
                id="work_location"
                value={formData.work_location}
                onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                placeholder="e.g., Building A, Floor 2, Bay 3"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="work_description">Work Description *</Label>
              <textarea
                id="work_description"
                value={formData.work_description}
                onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                placeholder="Provide detailed description of the work to be performed..."
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-transparent mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="start_time">Start Date & Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Date & Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="receiver_name">Receiver Name *</Label>
              <Input
                id="receiver_name"
                value={formData.receiver_name}
                onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                placeholder="Name of person receiving the permit"
                className="mt-1"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Permit Type */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Select Permit Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {permitTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, permit_type: type.value })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.permit_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="mb-3 text-4xl">{type.icon}</div>
                  <h3 className="font-semibold text-slate-900">{type.label}</h3>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Hazards */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Identify Hazards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">Select all hazards that apply to this work</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {commonHazards.map((hazard) => (
                <button
                  key={hazard}
                  onClick={() => toggleArrayItem(
                    formData.hazards,
                    hazard,
                    (arr) => setFormData({ ...formData, hazards: arr })
                  )}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.hazards.includes(hazard)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      formData.hazards.includes(hazard)
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-slate-300'
                    }`}>
                      {formData.hazards.includes(hazard) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{hazard}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Controls & PPE */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Control Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-600">Select control measures for identified hazards</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {commonControls.map((control) => (
                  <button
                    key={control}
                    onClick={() => toggleArrayItem(
                      formData.control_measures,
                      control,
                      (arr) => setFormData({ ...formData, control_measures: arr })
                    )}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.control_measures.includes(control)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.control_measures.includes(control)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {formData.control_measures.includes(control) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{control}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Personal Protective Equipment (PPE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-600">Select required PPE for this work</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {commonPPE.map((ppe) => (
                  <button
                    key={ppe}
                    onClick={() => toggleArrayItem(
                      formData.ppe_required,
                      ppe,
                      (arr) => setFormData({ ...formData, ppe_required: arr })
                    )}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.ppe_required.includes(ppe)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.ppe_required.includes(ppe)
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-slate-300'
                      }`}>
                        {formData.ppe_required.includes(ppe) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{ppe}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Review & Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 space-y-4 rounded-lg bg-slate-50">
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Site & Location</h4>
                <p className="text-slate-900">
                  {sites.find(s => s.id.toString() === formData.site_id)?.name || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">{formData.work_location}</p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Work Description</h4>
                <p className="text-slate-900">{formData.work_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600">Start Time</h4>
                  <p className="text-slate-900">{new Date(formData.start_time).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600">End Time</h4>
                  <p className="text-slate-900">{new Date(formData.end_time).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Permit Type</h4>
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                  {permitTypes.find(t => t.value === formData.permit_type)?.label}
                </span>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Identified Hazards ({formData.hazards.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.hazards.map((hazard) => (
                    <span key={hazard} className="px-3 py-1 text-xs text-orange-800 bg-orange-100 rounded-full">
                      {hazard}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Control Measures ({formData.control_measures.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.control_measures.map((control) => (
                    <span key={control} className="px-3 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                      {control}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Required PPE ({formData.ppe_required.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.ppe_required.map((ppe) => (
                    <span key={ppe} className="px-3 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">
                      {ppe}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-600">Receiver</h4>
                <p className="text-slate-900">{formData.receiver_name}</p>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-900">
                By submitting this permit, you confirm that all information provided is accurate and complete. 
                The permit will be sent for approval to the site safety officer.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep < 5 ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Permit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}