import { useState } from 'react';
import { ArrowLeft, Upload, FileText, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { PPESelector } from '../shared/PPESelector';
import { DigitalSignature } from '../shared/DigitalSignature';
import { mockWorkers } from '../../lib/mockData';

interface CreatePTWProps {
  onBack: () => void;
}

export function CreatePTW({ onBack }: CreatePTWProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureType, setSignatureType] = useState<string>('');
  const [workerSelectionMode, setWorkerSelectionMode] = useState<'existing' | 'new'>('existing');
  const [newWorkers, setNewWorkers] = useState<Array<{ name: string; phone: string; email: string; companyName: string }>>([]);

  const [formData, setFormData] = useState({
    // Basic Info
    category: '',
    site: '',
    location: '',
    workDescription: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',

    // Issued To
    issuedToName: '',
    issuedToContact: '',

    // Workers
    selectedWorkers: [] as string[],

    // Hazards & Controls
    hazards: [] as string[],
    controlMeasures: '',
    otherHazards: '',

    // PPE
    ppe: [] as string[],

    // File
    swmsFile: null as File | null,

    // Signatures
    issuerSignature: '',
    areaInChargeSignature: '',
    safetyInChargeSignature: '',
    siteLeaderSignature: '',

    // Requirements
    generalReqs: {} as Record<string, 'yes' | 'no' | 'na'>,
    hotWorkReqs: {} as Record<string, 'yes' | 'no' | 'na'>,
    electricalReqs: {} as Record<string, 'yes' | 'no' | 'na'>,
    heightReqs: {} as Record<string, 'yes' | 'no' | 'na'>,
    confinedSpaceReqs: {} as Record<string, 'yes' | 'no' | 'na'>,

    // Declaration
    declaration: false,
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const hazardOptions = [
    'Working at Height',
    'Electrical Hazards',
    'Fire/Explosion Risk',
    'Confined Space',
    'Chemical Exposure',
    'Moving Machinery',
    'Manual Handling',
    'Noise',
    'Vibration',
    'Temperature Extremes',
    'Slips/Trips/Falls',
    'Falling Objects'
  ];

  const ppeOptions = [
    { id: 'helmet', label: '⛑️ Safety Helmet' },
    { id: 'vest', label: '🦺 Safety Vest' },
    { id: 'gloves', label: '🧤 Safety Gloves' },
    { id: 'boots', label: '🥾 Safety Boots' },
    { id: 'glasses', label: '🥽 Safety Glasses' },
    { id: 'mask', label: '😷 Face Mask' },
    { id: 'earProtection', label: '🎧 Ear Protection' },
    { id: 'harness', label: '🪢 Safety Harness' }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    alert('PTW Created Successfully!');
    onBack();
  };

  const toggleHazard = (hazard: string) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.includes(hazard)
        ? prev.hazards.filter(h => h !== hazard)
        : [...prev.hazards, hazard]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, swmsFile: file });
    }
  };

  const handleSignatureSave = (signature: string) => {
    switch (signatureType) {
      case 'issuer':
        setFormData({ ...formData, issuerSignature: signature });
        break;
      case 'areaInCharge':
        setFormData({ ...formData, areaInChargeSignature: signature });
        break;
      case 'safetyInCharge':
        setFormData({ ...formData, safetyInChargeSignature: signature });
        break;
      case 'siteLeader':
        setFormData({ ...formData, siteLeaderSignature: signature });
        break;
    }
    setShowSignature(false);
  };

  const addNewWorker = () => {
    setNewWorkers([...newWorkers, { name: '', phone: '', email: '', companyName: '' }]);
  };

  const removeNewWorker = (index: number) => {
    setNewWorkers(newWorkers.filter((_, i) => i !== index));
  };

  const updateNewWorker = (index: number, field: 'name' | 'phone' | 'email' | 'companyName', value: string) => {
    const updated = [...newWorkers];
    updated[index][field] = value;
    setNewWorkers(updated);
  };

  interface RequirementRowProps {
    label: string;
    value: 'yes' | 'no' | 'na';
    onChange: (value: 'yes' | 'no' | 'na') => void;
  }

  const RequirementRow = ({ label, value, onChange }: RequirementRowProps) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-2">
        {(['yes', 'no', 'na'] as const).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${value === option
                ? option === 'yes'
                  ? 'bg-green-500 text-white'
                  : option === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New PTW</h1>
          <p className="text-slate-600">Step {currentStep} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Form Content */}
      <div className="p-6 bg-white border rounded-xl border-slate-200">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Basic Information</h2>

            <div>
              <Label htmlFor="category">Permit Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Work</SelectItem>
                  <SelectItem value="height">Work at Height</SelectItem>
                  <SelectItem value="electrical">Electrical Work</SelectItem>
                  <SelectItem value="hotwork">Hot Work (Welding/Cutting)</SelectItem>
                  <SelectItem value="confined">Confined Space</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="site">Site *</Label>
                <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Site Alpha">Site Alpha</SelectItem>
                    <SelectItem value="Site Beta">Site Beta</SelectItem>
                    <SelectItem value="Site Gamma">Site Gamma</SelectItem>
                    <SelectItem value="Site Delta">Site Delta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A, Floor 3"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="workDescription">Work Description *</Label>
              <Textarea
                id="workDescription"
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                placeholder="Describe the work to be performed..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <h3 className="mb-4 text-slate-900">Issuer Signature *</h3>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => {
                    setShowSignature(true);
                    setSignatureType('issuer');
                  }}
                  variant="outline"
                >
                  {formData.issuerSignature ? 'Update Issuer Signature' : 'Add Issuer Signature'}
                </Button>
                {formData.issuerSignature && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Signed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Issued To & Assign Workers */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Issued To & Workers Assignment</h2>

            {/* Issued To Section */}
            <div className="p-6 space-y-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="flex items-center gap-2 font-medium text-slate-900">
                <FileText className="w-5 h-5 text-blue-600" />
                Issued To (Permit Recipient)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="issuedToName">Name *</Label>
                  <Input
                    id="issuedToName"
                    value={formData.issuedToName}
                    onChange={(e) => setFormData({ ...formData, issuedToName: e.target.value })}
                    placeholder="e.g., Gaurav Shukla"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="issuedToContact">Contact Number *</Label>
                  <Input
                    id="issuedToContact"
                    value={formData.issuedToContact}
                    onChange={(e) => setFormData({ ...formData, issuedToContact: e.target.value })}
                    placeholder="e.g., +91 9876543210"
                    className="bg-white"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-600">
                The person to whom this permit is issued (usually the work supervisor or contractor lead)
              </p>
            </div>

            {/* Workers Assignment Section */}
            <div className="space-y-4">
              <p className="text-slate-600">Select the workers who will be performing this work</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={workerSelectionMode === 'existing'}
                    onCheckedChange={(checked) => setWorkerSelectionMode(checked ? 'existing' : 'new')}
                  />
                  <p className="text-sm text-slate-700">Existing Workers</p>
                </div>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={workerSelectionMode === 'new'}
                    onCheckedChange={(checked) => setWorkerSelectionMode(checked ? 'new' : 'existing')}
                  />
                  <p className="text-sm text-slate-700">Add New Workers</p>
                </div>
              </div>

              {workerSelectionMode === 'existing' && (
                <div className="p-4 overflow-y-auto border rounded-lg border-slate-200 max-h-96">
                  <div className="space-y-2">
                    {mockWorkers.map((worker) => (
                      <label
                        key={worker.id}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={formData.selectedWorkers.includes(worker.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedWorkers: [...prev.selectedWorkers, worker.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedWorkers: prev.selectedWorkers.filter(id => id !== worker.id)
                              }));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{worker.name}</p>
                          <p className="text-xs text-slate-500">{worker.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {workerSelectionMode === 'new' && (
                <div className="space-y-4">
                  <Button onClick={addNewWorker} variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Add New Worker
                  </Button>

                  {newWorkers.map((worker, index) => (
                    <div key={index} className="p-4 space-y-4 border rounded-lg border-slate-200">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`name-${index}`}>Name *</Label>
                          <Input
                            id={`name-${index}`}
                            value={worker.name}
                            onChange={(e) => updateNewWorker(index, 'name', e.target.value)}
                            placeholder="e.g., Rahul Mishra"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`companyName-${index}`}>Company Name *</Label>
                          <Input
                            id={`companyName-${index}`}
                            value={worker.companyName}
                            onChange={(e) => updateNewWorker(index, 'companyName', e.target.value)}
                            placeholder="e.g., XYZ Pvt Ltd"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`phone-${index}`}>Phone *</Label>
                          <Input
                            id={`phone-${index}`}
                            value={worker.phone}
                            onChange={(e) => updateNewWorker(index, 'phone', e.target.value)}
                            placeholder="e.g., +1234567890"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`email-${index}`}>Email *</Label>
                          <Input
                            id={`email-${index}`}
                            value={worker.email}
                            onChange={(e) => updateNewWorker(index, 'email', e.target.value)}
                            placeholder="e.g., rahul.mishra@example.com"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => removeNewWorker(index)}
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Worker
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Hazards & Control Measures */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Hazard Identification & Control Measures</h2>

            <div>
              <Label>Identified Hazards *</Label>
              <div className="grid gap-3 mt-2 md:grid-cols-2">
                {hazardOptions.map((hazard) => (
                  <label
                    key={hazard}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.hazards.includes(hazard)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <Checkbox
                      checked={formData.hazards.includes(hazard)}
                      onCheckedChange={() => toggleHazard(hazard)}
                    />
                    <span className="text-sm text-slate-700">{hazard}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="controlMeasures">Control Measures *</Label>
              <Textarea
                id="controlMeasures"
                value={formData.controlMeasures}
                onChange={(e) => setFormData({ ...formData, controlMeasures: e.target.value })}
                placeholder="Describe the control measures to mitigate identified hazards..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="otherHazards">Other Hazards *</Label>
              <Textarea
                id="otherHazards"
                value={formData.otherHazards}
                onChange={(e) => setFormData({ ...formData, otherHazards: e.target.value })}
                placeholder="Describe any other hazards to be identified..."
                rows={6}
              />
            </div>

            {/* Simplified Safety Measures Note */}
            <div className="p-4 border-2 rounded-lg bg-amber-50 border-amber-200">
              <p className="text-sm font-medium text-slate-700">
                <span className="font-bold">Note:</span> Describe all safety measures, procedures, and precautions to be taken
              </p>
            </div>
          </div>
        )}

        {/* Step 4: PPE & SWMS File */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">PPE Requirements & SWMS Upload</h2>

            <div>
              <Label>Required Personal Protective Equipment (PPE) *</Label>
              <p className="mb-4 text-sm text-slate-500">Select all required PPE for this work</p>
              <PPESelector
                selected={formData.ppe}
                onChange={(ppe) => setFormData({ ...formData, ppe })}
              />
            </div>

            <div>
              <Label htmlFor="swms">Upload SWMS Document</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-3 p-8 transition-all border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-blue-500 hover:bg-blue-50">
                  <input
                    id="swms"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-slate-400" />
                  <div className="text-center">
                    {formData.swmsFile ? (
                      <>
                        <p className="text-slate-900">{formData.swmsFile.name}</p>
                        <p className="text-sm text-green-600">File uploaded successfully</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-900">Click to upload SWMS file</p>
                        <p className="text-sm text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Work Requirements */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Work Requirements Checklist</h2>

            {/* General Requirements */}
            <div className="p-6 border rounded-lg border-slate-200">
              <h3 className="mb-4 text-slate-900">General Requirements</h3>
              <div>
                <RequirementRow
                  label="Work area inspected and clear of hazards"
                  value={formData.generalReqs['inspected'] || 'na'}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    generalReqs: { ...prev.generalReqs, inspected: val }
                  }))}
                />
                <RequirementRow
                  label="Emergency procedures reviewed with workers"
                  value={formData.generalReqs['emergency'] || 'na'}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    generalReqs: { ...prev.generalReqs, emergency: val }
                  }))}
                />
                <RequirementRow
                  label="Workers trained for the specific task"
                  value={formData.generalReqs['trained'] || 'na'}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    generalReqs: { ...prev.generalReqs, trained: val }
                  }))}
                />
                <RequirementRow
                  label="First aid equipment available"
                  value={formData.generalReqs['firstAid'] || 'na'}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    generalReqs: { ...prev.generalReqs, firstAid: val }
                  }))}
                />
                <RequirementRow
                  label="Communication equipment available"
                  value={formData.generalReqs['communication'] || 'na'}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    generalReqs: { ...prev.generalReqs, communication: val }
                  }))}
                />
              </div>
            </div>

            {/* Category-specific requirements based on selected category */}
            {formData.category === 'hotwork' && (
              <div className="p-6 border rounded-lg border-slate-200">
                <h3 className="mb-4 text-slate-900">Hot Work Requirements</h3>
                <div>
                  <RequirementRow
                    label="Fire extinguisher available and accessible"
                    value={formData.hotWorkReqs['extinguisher'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      hotWorkReqs: { ...prev.hotWorkReqs, extinguisher: val }
                    }))}
                  />
                  <RequirementRow
                    label="Combustible materials removed from work area"
                    value={formData.hotWorkReqs['combustibles'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      hotWorkReqs: { ...prev.hotWorkReqs, combustibles: val }
                    }))}
                  />
                  <RequirementRow
                    label="Fire watch assigned for duration of work"
                    value={formData.hotWorkReqs['fireWatch'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      hotWorkReqs: { ...prev.hotWorkReqs, fireWatch: val }
                    }))}
                  />
                </div>
              </div>
            )}

            {formData.category === 'electrical' && (
              <div className="p-6 border rounded-lg border-slate-200">
                <h3 className="mb-4 text-slate-900">Electrical Work Requirements</h3>
                <div>
                  <RequirementRow
                    label="Power isolated and locked out"
                    value={formData.electricalReqs['lockout'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      electricalReqs: { ...prev.electricalReqs, lockout: val }
                    }))}
                  />
                  <RequirementRow
                    label="Voltage testing completed"
                    value={formData.electricalReqs['testing'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      electricalReqs: { ...prev.electricalReqs, testing: val }
                    }))}
                  />
                  <RequirementRow
                    label="Insulated tools available"
                    value={formData.electricalReqs['tools'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      electricalReqs: { ...prev.electricalReqs, tools: val }
                    }))}
                  />
                </div>
              </div>
            )}

            {formData.category === 'height' && (
              <div className="p-6 border rounded-lg border-slate-200">
                <h3 className="mb-4 text-slate-900">Work at Height Requirements</h3>
                <div>
                  <RequirementRow
                    label="Fall protection system in place"
                    value={formData.heightReqs['fallProtection'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      heightReqs: { ...prev.heightReqs, fallProtection: val }
                    }))}
                  />
                  <RequirementRow
                    label="Scaffolding inspected and tagged"
                    value={formData.heightReqs['scaffolding'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      heightReqs: { ...prev.heightReqs, scaffolding: val }
                    }))}
                  />
                  <RequirementRow
                    label="Rescue plan in place"
                    value={formData.heightReqs['rescue'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      heightReqs: { ...prev.heightReqs, rescue: val }
                    }))}
                  />
                </div>
              </div>
            )}

            {formData.category === 'confined' && (
              <div className="p-6 border rounded-lg border-slate-200">
                <h3 className="mb-4 text-slate-900">Confined Space Requirements</h3>
                <div>
                  <RequirementRow
                    label="Atmosphere tested and monitored"
                    value={formData.confinedSpaceReqs['atmosphere'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      confinedSpaceReqs: { ...prev.confinedSpaceReqs, atmosphere: val }
                    }))}
                  />
                  <RequirementRow
                    label="Ventilation adequate"
                    value={formData.confinedSpaceReqs['ventilation'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      confinedSpaceReqs: { ...prev.confinedSpaceReqs, ventilation: val }
                    }))}
                  />
                  <RequirementRow
                    label="Entry attendant assigned"
                    value={formData.confinedSpaceReqs['attendant'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      confinedSpaceReqs: { ...prev.confinedSpaceReqs, attendant: val }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Review & Submit</h2>

            {/* Summary */}
            <div className="p-6 space-y-4 rounded-lg bg-slate-50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="text-slate-900">{formData.category || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Site & Location</p>
                  <p className="text-slate-900">{formData.site} - {formData.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Work Period</p>
                  <p className="text-slate-900">
                    {formData.startDate} {formData.startTime} - {formData.endDate} {formData.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Issued To</p>
                  <p className="text-slate-900">{formData.issuedToName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Assigned Workers</p>
                  <p className="text-slate-900">{formData.selectedWorkers.length + newWorkers.length} workers</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Hazards Identified</p>
                  <p className="text-slate-900">{formData.hazards.length} hazards</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">PPE Required</p>
                  <p className="text-slate-900">{formData.ppe.length} items</p>
                </div>
              </div>
            </div>

            {/* Approvals */}
            <div className="space-y-4">
              <h3 className="text-slate-900">Required Approvals</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg border-slate-200">
                  <p className="mb-3 text-sm text-slate-600">Area In-Charge Signature</p>
                  <Button
                    onClick={() => {
                      setShowSignature(true);
                      setSignatureType('areaInCharge');
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    {formData.areaInChargeSignature ? (
                      <>
                        <Check className="w-4 h-4" />
                        Signed
                      </>
                    ) : (
                      'Add Signature'
                    )}
                  </Button>
                </div>

                <div className="p-4 border rounded-lg border-slate-200">
                  <p className="mb-3 text-sm text-slate-600">Safety In-Charge Signature</p>
                  <Button
                    onClick={() => {
                      setShowSignature(true);
                      setSignatureType('safetyInCharge');
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    {formData.safetyInChargeSignature ? (
                      <>
                        <Check className="w-4 h-4" />
                        Signed
                      </>
                    ) : (
                      'Add Signature'
                    )}
                  </Button>
                </div>

                <div className="p-4 border rounded-lg border-slate-200">
                  <p className="mb-3 text-sm text-slate-600">Site Leader Signature</p>
                  <Button
                    onClick={() => {
                      setShowSignature(true);
                      setSignatureType('siteLeader');
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    {formData.siteLeaderSignature ? (
                      <>
                        <Check className="w-4 h-4" />
                        Signed
                      </>
                    ) : (
                      'Add Signature'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="p-4 border rounded-lg border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.declaration}
                  onCheckedChange={(checked) => setFormData({ ...formData, declaration: checked as boolean })}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">Declaration</p>
                  <p className="mt-1 text-sm text-slate-600">
                    I confirm that all information provided is accurate and complete. All necessary safety measures
                    have been identified and will be implemented. All workers have been briefed on the hazards and
                    control measures for this work.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          variant="outline"
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!formData.declaration}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit PTW
          </Button>
        )}
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-xl">
            <DigitalSignature
              onSave={handleSignatureSave}
              onCancel={() => setShowSignature(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}