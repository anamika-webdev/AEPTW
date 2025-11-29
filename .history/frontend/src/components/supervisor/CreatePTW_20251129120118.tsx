// src/components/supervisor/CreatePTW.tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { DigitalSignature } from '../shared/DigitalSignature';
import { 
  sitesAPI, 
  masterDataAPI, 
  usersAPI, 
  vendorsAPI,
  permitsAPI,
  uploadAPI 
} from '../../services/api';
import type { 
  Site, 
  MasterHazard, 
  MasterPPE, 
  User, 
  Vendor,
  MasterChecklistQuestion,
  PermitType,
  WorkerRole,
  ChecklistResponse
} from '../../types';

interface CreatePTWProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function CreatePTW({ onBack, onSuccess }: CreatePTWProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSignature, setShowSignature] = useState(false);
  const [workerSelectionMode, setWorkerSelectionMode] = useState<'existing' | 'new'>('existing');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master data from database
  const [sites, setSites] = useState<Site[]>([]);
  const [hazards, setHazards] = useState<MasterHazard[]>([]);
  const [ppeItems, setPPEItems] = useState<MasterPPE[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [checklistQuestions, setChecklistQuestions] = useState<MasterChecklistQuestion[]>([]);

  const [newWorkers, setNewWorkers] = useState<Array<{ 
    name: string; 
    phone: string; 
    email: string; 
    companyName: string;
    role: WorkerRole;
  }>>([]);
  
  const [formData, setFormData] = useState({
    // Basic Info
    category: '' as PermitType | '',
    site_id: 0,
    location: '',
    workDescription: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    vendor_id: 0,
    
    // Issued To
    issuedToName: '',
    issuedToContact: '',
    
    // Workers
    selectedWorkers: [] as number[],
    
    // Hazards & Controls
    selectedHazards: [] as number[],
    controlMeasures: '',
    otherHazards: '',
    
    // PPE
    selectedPPE: [] as number[],
    
    // File
    swmsFile: null as File | null,
    
    // Signatures
    issuerSignature: '',
    
    // Requirements/Checklist
    checklistResponses: {} as Record<number, ChecklistResponse>,
    checklistRemarks: {} as Record<number, string>,
    
    // Declaration
    declaration: false,
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Load master data on component mount
  useEffect(() => {
    loadMasterData();
  }, []);

  // Load checklist questions when permit type changes
  useEffect(() => {
    if (formData.category) {
      loadChecklistQuestions(formData.category);
    }
  }, [formData.category]);

  const loadMasterData = async () => {
    setIsLoading(true);
    try {
      const [sitesRes, hazardsRes, ppeRes, workersRes, vendorsRes] = await Promise.all([
        sitesAPI.getAll(),
        masterDataAPI.getHazards(),
        masterDataAPI.getPPE(),
        usersAPI.getWorkers(),
        vendorsAPI.getAll(),
      ]);

      if (sitesRes.success && sitesRes.data) setSites(sitesRes.data);
      if (hazardsRes.success && hazardsRes.data) setHazards(hazardsRes.data);
      if (ppeRes.success && ppeRes.data) setPPEItems(ppeRes.data);
      if (workersRes.success && workersRes.data) setWorkers(workersRes.data);
      if (vendorsRes.success && vendorsRes.data) setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
      alert('Failed to load form data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChecklistQuestions = async (permitType: PermitType) => {
    try {
      const response = await masterDataAPI.getChecklistQuestions(permitType);
      if (response.success && response.data) {
        setChecklistQuestions(response.data);
      }
    } catch (error) {
      console.error('Error loading checklist questions:', error);
    }
  };

  const handleNext = () => {
    // Validation logic here
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.declaration) {
      alert('Please accept the declaration to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload SWMS file if present
      let swmsUrl = '';
      if (formData.swmsFile) {
        const uploadRes = await uploadAPI.uploadSWMS(formData.swmsFile);
        if (uploadRes.success && uploadRes.data) {
          swmsUrl = uploadRes.data.url;
        }
      }

      // Prepare team members data
      const teamMembers = [
        ...formData.selectedWorkers.map(workerId => {
          const worker = workers.find(w => w.id === workerId);
          return {
            worker_name: worker?.full_name || '',
            worker_role: 'Worker' as WorkerRole,
            badge_id: worker?.login_id || '',
          };
        }),
        ...newWorkers.map(worker => ({
          worker_name: worker.name,
          worker_role: worker.role,
          company_name: worker.companyName,
          phone: worker.phone,
          email: worker.email,
        })),
      ];

      // Prepare checklist responses
      const checklistResponses = Object.entries(formData.checklistResponses).map(([questionId, response]) => ({
        question_id: parseInt(questionId),
        response,
        remarks: formData.checklistRemarks[parseInt(questionId)] || undefined,
      }));

      // Create permit data
      const permitData = {
        site_id: formData.site_id,
        permit_type: formData.category as PermitType,
        work_location: formData.location,
        work_description: formData.workDescription,
        start_time: `${formData.startDate}T${formData.startTime}:00`,
        end_time: `${formData.endDate}T${formData.endTime}:00`,
        receiver_name: formData.issuedToName,
        receiver_contact: formData.issuedToContact,
        vendor_id: formData.vendor_id || undefined,
        hazard_ids: formData.selectedHazards,
        ppe_ids: formData.selectedPPE,
        team_members: teamMembers,
        control_measures: formData.controlMeasures,
        other_hazards: formData.otherHazards,
        checklist_responses: checklistResponses,
      };

      const response = await permitsAPI.create(permitData);

      if (response.success) {
        alert('PTW Created Successfully!');
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      } else {
        alert(response.message || 'Failed to create PTW');
      }
    } catch (error: any) {
      console.error('Error creating PTW:', error);
      alert(error.response?.data?.message || 'Failed to create PTW. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHazard = (hazardId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedHazards: prev.selectedHazards.includes(hazardId)
        ? prev.selectedHazards.filter(id => id !== hazardId)
        : [...prev.selectedHazards, hazardId]
    }));
  };

  const togglePPE = (ppeId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPPE: prev.selectedPPE.includes(ppeId)
        ? prev.selectedPPE.filter(id => id !== ppeId)
        : [...prev.selectedPPE, ppeId]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, swmsFile: file });
    }
  };

  const handleSignatureSave = async (signature: string) => {
    // Convert base64 to file and upload
    try {
      const blob = await fetch(signature).then(r => r.blob());
      const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });
      const uploadRes = await uploadAPI.uploadSignature(file);
      
      if (uploadRes.success && uploadRes.data) {
        setFormData({ ...formData, issuerSignature: uploadRes.data.url });
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
    }
    setShowSignature(false);
  };

  const addNewWorker = () => {
    setNewWorkers([...newWorkers, { 
      name: '', 
      phone: '', 
      email: '', 
      companyName: '',
      role: 'Worker' as WorkerRole 
    }]);
  };

  const removeNewWorker = (index: number) => {
    setNewWorkers(newWorkers.filter((_, i) => i !== index));
  };

  const updateNewWorker = (
    index: number, 
    field: 'name' | 'phone' | 'email' | 'companyName' | 'role', 
    value: string
  ) => {
    const updated = [...newWorkers];
    if (field === 'role') {
      updated[index][field] = value as WorkerRole;
    } else {
      updated[index][field] = value;
    }
    setNewWorkers(updated);
  };

  interface RequirementRowProps {
    questionId: number;
    label: string;
    value: ChecklistResponse | undefined;
    onChange: (value: ChecklistResponse) => void;
  }

  const RequirementRow = ({ questionId, label, value, onChange }: RequirementRowProps) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-2">
        {(['Yes', 'No', 'NA'] as ChecklistResponse[]).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${
              value === option
                ? option === 'Yes'
                  ? 'bg-green-500 text-white'
                  : option === 'No'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="sm">
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
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value as PermitType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Work</SelectItem>
                  <SelectItem value="Height">Work at Height</SelectItem>
                  <SelectItem value="Electrical">Electrical Work</SelectItem>
                  <SelectItem value="Hot_Work">Hot Work (Welding/Cutting)</SelectItem>
                  <SelectItem value="Confined_Space">Confined Space</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="site">Site *</Label>
                <Select 
                  value={formData.site_id.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, site_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name}
                      </SelectItem>
                    ))}
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
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Select 
                value={formData.vendor_id.toString()} 
                onValueChange={(value) => setFormData({ ...formData, vendor_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor (if applicable)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Vendor</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  onClick={() => setShowSignature(true)}
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
                    placeholder="e.g., John Doe"
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
                    {workers.map((worker) => (
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
                          <p className="text-sm font-medium text-slate-900">{worker.full_name}</p>
                          <p className="text-xs text-slate-500">{worker.email} | {worker.department}</p>
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
                        <div>
                          <Label htmlFor={`role-${index}`}>Role *</Label>
                          <Select
                            value={worker.role}
                            onValueChange={(value) => updateNewWorker(index, 'role', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Worker">Worker</SelectItem>
                              <SelectItem value="Supervisor">Supervisor</SelectItem>
                              <SelectItem value="Fire_Watcher">Fire Watcher</SelectItem>
                              <SelectItem value="Standby">Standby Person</SelectItem>
                            </SelectContent>
                          </Select>
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
                {hazards.map((hazard) => (
                  <label
                    key={hazard.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.selectedHazards.includes(hazard.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.selectedHazards.includes(hazard.id)}
                      onCheckedChange={() => toggleHazard(hazard.id)}
                    />
                    <span className="text-sm text-slate-700">{hazard.name}</span>
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
              <Label htmlFor="otherHazards">Other Hazards</Label>
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
              
              {/* Manual PPE Selector */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {ppeItems.map((ppe) => (
                  <button
                    key={ppe.id}
                    type="button"
                    onClick={() => togglePPE(ppe.id)}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                      formData.selectedPPE.includes(ppe.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl">
                      {ppe.name.includes('Helmet') && '⛑️'}
                      {ppe.name.includes('Vest') && '🦺'}
                      {ppe.name.includes('Shoes') && '🥾'}
                      {ppe.name.includes('Goggles') && '🥽'}
                      {ppe.name.includes('Harness') && '🪢'}
                      {ppe.name.includes('Ear') && '🎧'}
                    </div>
                    <span className="text-xs font-medium text-center">{ppe.name}</span>
                  </button>
                ))}
              </div>
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

        {/* Step 5: Work Requirements Checklist */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Work Requirements Checklist</h2>
            
            <div className="p-6 border rounded-lg border-slate-200">
              <h3 className="mb-4 text-slate-900">{formData.category} Requirements</h3>
              <div>
                {checklistQuestions.map((question) => (
                  <div key={question.id}>
                    <RequirementRow
                      questionId={question.id}
                      label={question.question_text}
                      value={formData.checklistResponses[question.id]}
                      onChange={(val) => setFormData(prev => ({
                        ...prev,
                        checklistResponses: { ...prev.checklistResponses, [question.id]: val }
                      }))}
                    />
                    {formData.checklistResponses[question.id] === 'No' && (
                      <div className="mt-2 mb-4 ml-4">
                        <Input
                          placeholder="Please provide remarks..."
                          value={formData.checklistRemarks[question.id] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            checklistRemarks: { ...prev.checklistRemarks, [question.id]: e.target.value }
                          }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                  <p className="text-sm text-slate-500">Site</p>
                  <p className="text-slate-900">
                    {sites.find(s => s.id === formData.site_id)?.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="text-slate-900">{formData.location || 'Not set'}</p>
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
                  <p className="text-slate-900">{formData.selectedHazards.length} hazards</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">PPE Required</p>
                  <p className="text-slate-900">{formData.selectedPPE.length} items</p>
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
          disabled={currentStep === 1 || isSubmitting}
        >
          Previous
        </Button>
        
        {currentStep < totalSteps ? (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={!formData.declaration || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit PTW'}
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