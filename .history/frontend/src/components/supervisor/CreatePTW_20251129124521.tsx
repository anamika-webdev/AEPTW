// src/components/supervisor/CreatePTW.tsx - COMPLETE UPDATED VERSION
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

// PPE Icon Component
const PPEIconComponent = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    'Safety Helmet': (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 13h16M4 13v1a7 7 0 0 0 7 7h2a7 7 0 0 0 7-7v-1"/>
        <path d="M12 2a8 8 0 0 0-8 8v3h16v-3a8 8 0 0 0-8-8z"/>
        <circle cx="8" cy="15" r="1" fill="currentColor"/>
        <circle cx="16" cy="15" r="1" fill="currentColor"/>
      </svg>
    ),
    'Safety Vest': (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 5L5 7v15h5V8L7 5zM17 5l2 2v15h-5V8l3-3z"/>
        <path d="M10 8v14h4V8"/>
        <circle cx="12" cy="5" r="2" fill="currentColor"/>
        <path d="M6 12h4m4 0h4M6 16h4m4 0h4"/>
      </svg>
    ),
    'Safety Gloves': (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 7V4a2 2 0 0 0-2-2h-3v5m0 0V2H9a2 2 0 0 0-2 2v3"/>
        <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"/>
        <path d="M9 10v4m2-4v4m2-4v4m2-4v4"/>
      </svg>
    ),
    'Safety Boots': (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 20h14v2H5z"/>
        <path d="M8 20V9a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v11"/>
        <path d="M11 6h4M8 11h8M8 15h8"/>
        <circle cx="10" cy="18" r="0.5" fill="currentColor"/>
        <circle cx="14" cy="18" r="0.5" fill="currentColor"/>
      </svg>
    ),
    'Safety Goggles': (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 12a4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H6a4 4 0 0 1-4-4z"/>
        <path d="M22 12a4 4 0 0 0-4-4h-5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h5a4 4 0 0 0 4-4z"/>
        <path d="M12 8v8"/>
      </svg>
    ),
    'Ear Protection': (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>
        <path d="M21 12h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z"/>
        <path d="M7 12V8a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  };

  return icons[name] || (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 4"/>
    </svg>
  );
};

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
    permitInitiator: '', // NEW: Permit initiator name
    permitInitiatorContact: '', // NEW: Permit initiator contact
    
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
    
    // SWMS - UPDATED
    swmsFile: null as File | null,
    swmsText: '', // NEW: Text-based SWMS
    swmsMode: 'file' as 'file' | 'text', // NEW: Toggle between file and text
    
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

  // NEW: Load permit initiator from logged-in user
  useEffect(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        const currentUser = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          permitInitiator: currentUser.full_name || currentUser.name || '',
          permitInitiatorContact: currentUser.email || ''
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
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
        permit_initiator: formData.permitInitiator, // NEW
        permit_initiator_contact: formData.permitInitiatorContact, // NEW
        vendor_id: formData.vendor_id || undefined,
        hazard_ids: formData.selectedHazards,
        ppe_ids: formData.selectedPPE,
        team_members: teamMembers,
        control_measures: formData.controlMeasures,
        other_hazards: formData.otherHazards,
        checklist_responses: checklistResponses,
        swms_file_url: swmsUrl, // NEW
        swms_text: formData.swmsText, // NEW
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
        {/* Step 1: Basic Information - UPDATED */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
            
            {/* NEW: Permit Initiator Section */}
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <h3 className="mb-3 text-sm font-medium text-green-900">Permit Initiator</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="permitInitiator">Name *</Label>
                  <Input
                    id="permitInitiator"
                    value={formData.permitInitiator}
                    className="bg-white"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="permitInitiatorContact">Contact/Email *</Label>
                  <Input
                    id="permitInitiatorContact"
                    value={formData.permitInitiatorContact}
                    className="bg-white"
                    disabled
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-green-700">
                You are initiating this permit as the logged-in user
              </p>
            </div>

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

            <div className="p-4 border-2 rounded-lg bg-amber-50 border-amber-200">
              <p className="text-sm font-medium text-slate-700">
                <span className="font-bold">Note:</span> Describe all safety measures, procedures, and precautions to be taken
              </p>
            </div>
          </div>
        )}

       const PPEIconComponent = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    'Safety Helmet': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="48" rx="28" ry="4" fill="#E8505B" opacity="0.2"/>
        <path d="M32 12C20 12 12 20 12 28V38C12 40 13 42 15 42H49C51 42 52 40 52 38V28C52 20 44 12 32 12Z" fill="#E8505B"/>
        <ellipse cx="32" cy="42" rx="17" ry="3" fill="#D13D47"/>
        <rect x="28" y="8" width="8" height="6" rx="2" fill="#E8505B"/>
        <circle cx="32" cy="10" r="3" fill="white"/>
        <path d="M16 38C16 38 18 32 32 32C46 32 48 38 48 38" stroke="white" strokeWidth="2" opacity="0.3"/>
      </svg>
    ),
    'Safety Vest': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="22" ry="3" fill="#FF6B35" opacity="0.2"/>
        <path d="M22 16L18 20V52H28V22L22 16Z" fill="#FF6B35"/>
        <path d="M42 16L46 20V52H36V22L42 16Z" fill="#FF6B35"/>
        <rect x="26" y="22" width="12" height="30" fill="#FF8C42"/>
        <circle cx="32" cy="14" r="4" fill="#FFB480"/>
        <rect x="20" y="28" width="8" height="3" fill="#FFE55C" opacity="0.8"/>
        <rect x="36" y="28" width="8" height="3" fill="#FFE55C" opacity="0.8"/>
        <rect x="20" y="38" width="8" height="3" fill="#FFE55C" opacity="0.8"/>
        <rect x="36" y="38" width="8" height="3" fill="#FFE55C" opacity="0.8"/>
      </svg>
    ),
    'Safety Gloves': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="18" ry="3" fill="#9B59B6" opacity="0.2"/>
        <path d="M42 18V12C42 10 40 8 38 8H36V16" stroke="#9B59B6" strokeWidth="3" fill="none"/>
        <path d="M22 18V12C22 10 24 8 26 8H28V16" stroke="#9B59B6" strokeWidth="3" fill="none"/>
        <rect x="20" y="18" width="24" height="28" rx="4" fill="#9B59B6"/>
        <path d="M24 24V38M28 24V38M32 24V38M36 24V38M40 24V38" stroke="white" strokeWidth="2" opacity="0.3"/>
        <rect x="20" y="42" width="24" height="4" fill="#8E44AD"/>
      </svg>
    ),
    'Safety Boots': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="24" ry="3" fill="#D4A574" opacity="0.2"/>
        <path d="M18 46H46V52H18V46Z" fill="#8B6F47"/>
        <path d="M22 22C22 18 24 16 26 16H38C40 16 42 18 42 22V46H22V22Z" fill="#D4A574"/>
        <rect x="26" y="18" width="12" height="3" fill="#8B6F47"/>
        <rect x="22" y="28" width="20" height="2" fill="#8B6F47" opacity="0.3"/>
        <rect x="22" y="36" width="20" height="2" fill="#8B6F47" opacity="0.3"/>
        <circle cx="28" cy="48" r="1.5" fill="#5D4E37"/>
        <circle cx="36" cy="48" r="1.5" fill="#5D4E37"/>
      </svg>
    ),
    'Safety Goggles': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="52" rx="26" ry="3" fill="#4A9EFF" opacity="0.2"/>
        <rect x="8" y="24" width="20" height="16" rx="8" fill="#4A9EFF" opacity="0.3"/>
        <rect x="36" y="24" width="20" height="16" rx="8" fill="#4A9EFF" opacity="0.3"/>
        <circle cx="18" cy="32" r="7" fill="#87CEEB"/>
        <circle cx="46" cy="32" r="7" fill="#87CEEB"/>
        <path d="M28 32H36" stroke="#4A9EFF" strokeWidth="3" strokeLinecap="round"/>
        <path d="M8 32C8 32 6 28 6 28C4 28 4 32 4 32" stroke="#4A9EFF" strokeWidth="2"/>
        <path d="M56 32C56 32 58 28 58 28C60 28 60 32 60 32" stroke="#4A9EFF" strokeWidth="2"/>
        <circle cx="18" cy="32" r="3" fill="white" opacity="0.5"/>
        <circle cx="46" cy="32" r="3" fill="white" opacity="0.5"/>
      </svg>
    ),
    'Face Mask': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="24" ry="3" fill="#FFB74D" opacity="0.2"/>
        <path d="M12 28C12 28 14 24 18 24H46C50 24 52 28 52 28V40C52 44 48 46 44 46H20C16 46 12 44 12 40V28Z" fill="#FFB74D"/>
        <path d="M12 28L8 30V38L12 40" stroke="#FF9800" strokeWidth="2" fill="none"/>
        <path d="M52 28L56 30V38L52 40" stroke="#FF9800" strokeWidth="2" fill="none"/>
        <rect x="16" y="30" width="32" height="2" rx="1" fill="white" opacity="0.3"/>
        <rect x="16" y="36" width="32" height="2" rx="1" fill="white" opacity="0.3"/>
        <rect x="16" y="42" width="32" height="2" rx="1" fill="white" opacity="0.3"/>
        <circle cx="24" cy="35" r="1.5" fill="#FF9800"/>
        <circle cx="40" cy="35" r="1.5" fill="#FF9800"/>
      </svg>
    ),
    'Ear Protection': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="28" ry="3" fill="#78909C" opacity="0.2"/>
        <rect x="6" y="28" width="12" height="16" rx="6" fill="#607D8B"/>
        <rect x="46" y="28" width="12" height="16" rx="6" fill="#607D8B"/>
        <path d="M18 28V22C18 16 22 12 28 12H36C42 12 46 16 46 22V28" stroke="#78909C" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <ellipse cx="12" cy="36" rx="5" ry="7" fill="#455A64"/>
        <ellipse cx="52" cy="36" rx="5" ry="7" fill="#455A64"/>
        <rect x="8" y="32" width="8" height="8" rx="2" fill="#B0BEC5" opacity="0.3"/>
        <rect x="48" y="32" width="8" height="8" rx="2" fill="#B0BEC5" opacity="0.3"/>
      </svg>
    ),
    'Safety Harness': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="20" ry="3" fill="#4FC3F7" opacity="0.2"/>
        <circle cx="32" cy="14" r="6" fill="#FFB74D"/>
        <path d="M20 24L16 48H24L28 28" stroke="#4FC3F7" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M44 24L48 48H40L36 28" stroke="#4FC3F7" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <ellipse cx="32" cy="26" rx="8" ry="4" fill="#0288D1"/>
        <path d="M28 28V48M36 28V48" stroke="#4FC3F7" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="32" cy="38" r="4" fill="#FFD54F" stroke="#FFA726" strokeWidth="2"/>
        <rect x="14" y="46" width="10" height="4" rx="2" fill="#0288D1"/>
        <rect x="40" y="46" width="10" height="4" rx="2" fill="#0288D1"/>
      </svg>
    ),
  };

  return icons[name] || (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" stroke="#94A3B8" strokeWidth="2" fill="none"/>
      <path d="M32 20V32L40 40" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};


// Updated Step 4 PPE Section - Replace your existing Step 4 PPE grid with this:

{currentStep === 4 && (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-slate-900">PPE Requirements & SWMS Upload</h2>
    
    {/* PPE Section with Professional Icons */}
    <div>
      <Label>Required Personal Protective Equipment (PPE) *</Label>
      <p className="mb-4 text-sm text-slate-500">Select all required PPE for this work</p>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ppeItems.map((ppe) => (
          <button
            key={ppe.id}
            type="button"
            onClick={() => togglePPE(ppe.id)}
            className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
              formData.selectedPPE.includes(ppe.id)
                ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
          >
            {/* Professional PPE Icon */}
            <div className="transition-transform">
              <PPEIconComponent name={ppe.name} />
            </div>
            
            {/* PPE Name */}
            <span className={`text-sm font-semibold text-center ${
              formData.selectedPPE.includes(ppe.id) ? 'text-blue-900' : 'text-slate-700'
            }`}>
              {ppe.name}
            </span>
            
            {/* Selection Indicator */}
            {formData.selectedPPE.includes(ppe.id) && (
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full shadow-sm">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>

            {/* SWMS Section - UPDATED with Text Option */}
            <div className="p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
              <h3 className="mb-4 text-lg font-medium text-purple-900">
                Safe Work Method Statement (SWMS)
              </h3>

              {/* Toggle between File Upload and Text Input */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, swmsMode: 'file', swmsText: '' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.swmsMode === 'file'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-600 border border-purple-300'
                  }`}
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, swmsMode: 'text', swmsFile: null })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.swmsMode === 'text'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-600 border border-purple-300'
                  }`}
                >
                  Write Text
                </button>
              </div>

              {/* File Upload Mode */}
              {formData.swmsMode === 'file' && (
                <div>
                  <Label htmlFor="swmsFile">Upload SWMS Document</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <label 
                      htmlFor="swmsFile" 
                      className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50"
                    >
                      <Upload className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-purple-900">Choose File</span>
                    </label>
                    <input
                      id="swmsFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {formData.swmsFile && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        {formData.swmsFile.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-purple-700">
                    Accepted formats: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>
              )}

              {/* Text Input Mode */}
              {formData.swmsMode === 'text' && (
                <div>
                  <Label htmlFor="swmsText">Write SWMS Details</Label>
                  <Textarea
                    id="swmsText"
                    value={formData.swmsText}
                    onChange={(e) => setFormData({ ...formData, swmsText: e.target.value })}
                    placeholder="Enter the Safe Work Method Statement details here...

Include:
• Scope of work
• Hazards identified
• Risk control measures
• Emergency procedures
• Required qualifications/training
• Step-by-step work process"
                    rows={15}
                    className="mt-2 font-mono text-sm bg-white"
                  />
                  <p className="mt-2 text-xs text-purple-700">
                    Provide comprehensive safety procedures and work methods
                  </p>
                </div>
              )}
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
                  <p className="text-sm text-slate-500">Permit Initiator</p>
                  <p className="text-slate-900">{formData.permitInitiator || 'Not set'}</p>
                </div>
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
                <div>
                  <p className="text-sm text-slate-500">SWMS</p>
                  <p className="text-slate-900">
                    {formData.swmsMode === 'file' 
                      ? (formData.swmsFile ? 'File uploaded' : 'No file') 
                      : (formData.swmsText ? 'Text provided' : 'No text')}
                  </p>
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