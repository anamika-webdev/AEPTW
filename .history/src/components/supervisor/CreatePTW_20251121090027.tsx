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
  const [newWorkers, setNewWorkers] = useState<Array<{ name: string; phone: string; email: string }>>([]);
  
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
    
    // Workers
    selectedWorkers: [] as string[],
    
    // Hazards & Controls
    hazards: [] as string[],
    controlMeasures: '',
    
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
    'Fall from height',
    'Electrical shock',
    'Fire hazard',
    'Toxic gases',
    'Slips and trips',
    'Moving machinery',
    'Hot surfaces',
    'Confined space',
  ];

  const addNewWorker = () => {
    setNewWorkers([...newWorkers, { name: '', phone: '', email: '' }]);
  };

  const updateNewWorker = (index: number, field: 'name' | 'phone' | 'email', value: string) => {
    const updated = [...newWorkers];
    updated[index][field] = value;
    setNewWorkers(updated);
  };

  const removeNewWorker = (index: number) => {
    setNewWorkers(newWorkers.filter((_, i) => i !== index));
  };

  const handleSignatureSave = (signature: string) => {
    setFormData(prev => ({
      ...prev,
      [`${signatureType}Signature`]: signature,
    }));
    setShowSignature(false);
    setSignatureType('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, swmsFile: file }));
    }
  };

  const toggleHazard = (hazard: string) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.includes(hazard)
        ? prev.hazards.filter(h => h !== hazard)
        : [...prev.hazards, hazard],
    }));
  };

  const RequirementRow = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: 'yes' | 'no' | 'na'; 
    onChange: (val: 'yes' | 'no' | 'na') => void;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
      <p className="text-sm text-slate-700">{label}</p>
      <div className="flex gap-2">
        {(['yes', 'no', 'na'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-4 py-1 rounded text-sm ${
              value === option
                ? option === 'yes'
                  ? 'bg-green-600 text-white'
                  : option === 'no'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = () => {
    alert('PTW Created Successfully! This is a demo - in production, this would save to database.');
    onBack();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-slate-900">Create New PTW</h1>
          <p className="text-slate-600 text-sm md:text-base">Step {currentStep} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <Progress value={progress} className="mb-2" />
        <div className="flex justify-between text-xs text-slate-600">
          <span className="hidden sm:inline">Basic Info</span>
          <span className="hidden sm:inline">Workers</span>
          <span className="hidden sm:inline">Hazards</span>
          <span className="hidden sm:inline">PPE & Files</span>
          <span className="hidden sm:inline">Requirements</span>
          <span className="hidden sm:inline">Review</span>
          <span className="sm:hidden">{currentStep}/6</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category">Permit Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Work</SelectItem>
                    <SelectItem value="Height">Work at Height</SelectItem>
                    <SelectItem value="Electrical">Electrical Work</SelectItem>
                    <SelectItem value="Hot Work">Hot Work</SelectItem>
                    <SelectItem value="Confined Space">Confined Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="Issue department">Issue department *</Label>
                <Select value={formData.Department} onValueChange={(val) => setFormData({ ...formData, Department: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Issue department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">WHS</SelectItem>
                    <SelectItem value="Height">SLP</SelectItem>
                    <SelectItem value="Electrical">RME</SelectItem>
                    <SelectItem value="Hot Work">Ops Tech IT</SelectItem>
                    <SelectItem value="Confined Space">Operation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="site">Site *</Label>
                <Select value={formData.site} onValueChange={(val) => setFormData({ ...formData, site: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mumbai Data Center">Mumbai Data Center</SelectItem>
                    <SelectItem value="Bangalore Tech Park">Bangalore Tech Park</SelectItem>
                    <SelectItem value="Delhi Telecom Hub">Delhi Telecom Hub</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Job Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A - Roof"
                />
              </div>

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

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setShowSignature(true);
                  setSignatureType('issuer');
                }}
                variant="outline"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                {formData.issuerSignature ? 'Update Issuer Signature' : 'Add Issuer Signature'}
              </Button>
              {formData.issuerSignature && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Signed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 2:Issued To & Assign Workers */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Issued To & Workers Assignment</h2>
             {/* NEW SECTION: Issued To */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
              <h3 className="text-slate-900 font-medium flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Issued To (Permit Recipient)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issuedToName">Name *</Label>
                  <Input
                    id="issuedToName"
                    value={formData.issuedToName}
                    onChange={(e) => setFormData({ ...formData, issuedToName: e.target.value })}
                    placeholder="e.g., XYZ pvt ltd."
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
            <p className="text-slate-600">Select the workers who will be performing this work</p>
            
            <div className="grid md:grid-cols-2 gap-4">
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
                <p className="text-sm text-slate-700">New Workers</p>
              </div>
            </div>

            {workerSelectionMode === 'existing' && (
              <div className="grid md:grid-cols-2 gap-4">
                {mockWorkers.map((worker) => (
                  <label
                    key={worker.id}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.selectedWorkers.includes(worker.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.selectedWorkers.includes(worker.id)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          selectedWorkers: checked
                            ? [...prev.selectedWorkers, worker.id]
                            : prev.selectedWorkers.filter(id => id !== worker.id),
                        }));
                      }}
                    />
                    <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {worker.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900">{worker.name}</p>
                      <p className="text-sm text-slate-500 truncate">{worker.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {workerSelectionMode === 'new' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={addNewWorker}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    Add New Worker
                  </Button>
                </div>
                {newWorkers.map((worker, index) => (
                  <div key={index} className="grid md:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => removeNewWorker(index)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Hazards & Control Measures */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Hazard Identification & Control Measures</h2>
            
            <div>
              <Label>Identified Hazards *</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {hazardOptions.map((hazard) => (
                  <label
                    key={hazard}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.hazards.includes(hazard)
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
              <br/>
              <Label htmlFor="controlMeasures">Other Hazards *</Label>
              <Textarea
                id="otherHazards"
                value={formData.controlMeasures}
                onChange={(e) => setFormData({ ...formData, otheerhazards: e.target.value })}
                placeholder="Describe the other hazards to be identified..."
                rows={6}
              />
              <p className="text-sm text-slate-500 mt-2">
                Describe all safety measures, procedures, and precautions to be taken
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
              <p className="text-sm text-slate-500 mb-4">Select all required PPE for this work</p>
              <PPESelector
                selected={formData.ppe}
                onChange={(ppe) => setFormData({ ...formData, ppe })}
              />
            </div>

            <div>
              <Label htmlFor="swms">Upload SWMS Document</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
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
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">General Requirements</h3>
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
                  label="First aid kit available nearby"
                  value={formData.generalReqs['firstaid'] || 'na'}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    generalReqs: { ...prev.generalReqs, firstaid: val }
                  }))}
                />
              </div>
            </div>

            {/* Conditional Requirements based on category */}
            {formData.category === 'Height' && (
              <div className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-slate-900 mb-4">Height Work Requirements</h3>
                <div>
                  <RequirementRow
                    label="Fall protection equipment inspected"
                    value={formData.heightReqs['fallProtection'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      heightReqs: { ...prev.heightReqs, fallProtection: val }
                    }))}
                  />
                  <RequirementRow
                    label="Anchor points verified and secure"
                    value={formData.heightReqs['anchorPoints'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      heightReqs: { ...prev.heightReqs, anchorPoints: val }
                    }))}
                  />
                  <RequirementRow
                    label="Guardrails installed where required"
                    value={formData.heightReqs['guardrails'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      heightReqs: { ...prev.heightReqs, guardrails: val }
                    }))}
                  />
                </div>
              </div>
            )}

            {formData.category === 'Electrical' && (
              <div className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-slate-900 mb-4">Electrical Work Requirements</h3>
                <div>
                  <RequirementRow
                    label="Lockout/Tagout procedures implemented"
                    value={formData.electricalReqs['lockout'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      electricalReqs: { ...prev.electricalReqs, lockout: val }
                    }))}
                  />
                  <RequirementRow
                    label="Voltage testing completed"
                    value={formData.electricalReqs['voltageTesting'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      electricalReqs: { ...prev.electricalReqs, voltageTesting: val }
                    }))}
                  />
                  <RequirementRow
                    label="Insulated tools available"
                    value={formData.electricalReqs['insulatedTools'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      electricalReqs: { ...prev.electricalReqs, insulatedTools: val }
                    }))}
                  />
                </div>
              </div>
            )}

            {formData.category === 'Hot Work' && (
              <div className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-slate-900 mb-4">Hot Work Requirements</h3>
                <div>
                  <RequirementRow
                    label="Fire watch assigned"
                    value={formData.hotWorkReqs['fireWatch'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      hotWorkReqs: { ...prev.hotWorkReqs, fireWatch: val }
                    }))}
                  />
                  <RequirementRow
                    label="Fire extinguisher readily available"
                    value={formData.hotWorkReqs['fireExtinguisher'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      hotWorkReqs: { ...prev.hotWorkReqs, fireExtinguisher: val }
                    }))}
                  />
                  <RequirementRow
                    label="Combustible materials removed from area"
                    value={formData.hotWorkReqs['combustibleRemoval'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      hotWorkReqs: { ...prev.hotWorkReqs, combustibleRemoval: val }
                    }))}
                  />
                </div>
              </div>
            )}

            {formData.category === 'Confined Space' && (
              <div className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-slate-900 mb-4">Confined Space Requirements</h3>
                <div>
                  <RequirementRow
                    label="Atmospheric testing completed"
                    value={formData.confinedSpaceReqs['atmTesting'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      confinedSpaceReqs: { ...prev.confinedSpaceReqs, atmTesting: val }
                    }))}
                  />
                  <RequirementRow
                    label="Continuous gas monitoring in place"
                    value={formData.confinedSpaceReqs['gasMonitoring'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      confinedSpaceReqs: { ...prev.confinedSpaceReqs, gasMonitoring: val }
                    }))}
                  />
                  <RequirementRow
                    label="Rescue plan established"
                    value={formData.confinedSpaceReqs['rescuePlan'] || 'na'}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      confinedSpaceReqs: { ...prev.confinedSpaceReqs, rescuePlan: val }
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
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                  <p className="text-sm text-slate-500">Assigned Workers</p>
                  <p className="text-slate-900">{formData.selectedWorkers.length} workers</p>
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
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-3">Area In-Charge Signature</p>
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
                        <Check className="w-4 h-4 text-green-600" />
                        Signed
                      </>
                    ) : (
                      'Add Signature'
                    )}
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-3">Safety In-Charge Signature</p>
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
                        <Check className="w-4 h-4 text-green-600" />
                        Signed
                      </>
                    ) : (
                      'Add Signature'
                    )}
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-3">Site Leader Signature</p>
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
                        <Check className="w-4 h-4 text-green-600" />
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
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={formData.declaration}
                  onCheckedChange={(checked) => setFormData({ ...formData, declaration: !!checked })}
                />
                <div>
                  <p className="text-slate-900 mb-2">Declaration</p>
                  <p className="text-sm text-slate-600">
                    I declare that all information provided is accurate and complete. I confirm that all necessary
                    safety measures have been identified and will be implemented. All workers have been briefed on
                    the hazards and control measures for this work.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-slate-200 mt-8">
          <Button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            variant="outline"
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!formData.declaration}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Check className="w-4 h-4" />
              Submit PTW
            </Button>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <DigitalSignature
          onSave={handleSignatureSave}
          onClose={() => {
            setShowSignature(false);
            setSignatureType('');
          }}
          title={`${signatureType.replace(/([A-Z])/g, ' $1').trim()} Signature`}
        />
      )}
    </div>
  );
}