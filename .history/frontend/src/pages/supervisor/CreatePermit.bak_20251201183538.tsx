// frontend/src/components/supervisor/CreatePTW.tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Label } from '../../components/ui/label.tsx';
import { Textarea } from '../../components/ui/textarea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.tsx';
import { Checkbox } from '../../components/ui/checkbox.tsx';
import { Progress } from '../../components/ui/progress.tsx';
import { DigitalSignature } from '../../components/shared/DigitalSignature.tsx';
import { 
  sitesAPI, 
  masterDataAPI, 
  usersAPI, 
  vendorsAPI,
  permitsAPI,
  uploadAPI 
} from '../../services/api.bak.ts';
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
} from '../../types/index.ts';

interface CreatePTWProps {
  onBack: () => void;
  onSuccess?: () => void;
}

// PPE SVG Icons Component
const PPEIcon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    'Safety Helmet': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13h16M4 13v1a7 7 0 0 0 7 7h2a7 7 0 0 0 7-7v-1"/>
        <path d="M12 2a8 8 0 0 0-8 8v3h16v-3a8 8 0 0 0-8-8z"/>
        <path d="M9 13v2m6-2v2"/>
      </svg>
    ),
    'Safety Vest': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 5L5 7v15h5V8L7 5zM17 5l2 2v15h-5V8l3-3z"/>
        <path d="M10 8v14h4V8"/>
        <circle cx="12" cy="5" r="2" fill="currentColor"/>
        <path d="M6 12h4m4 0h4M6 16h4m4 0h4"/>
      </svg>
    ),
    'Safety Gloves': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 7V4a2 2 0 0 0-2-2h-3v5m0 0V2H9a2 2 0 0 0-2 2v3"/>
        <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"/>
        <path d="M9 10v4m2-4v4m2-4v4m2-4v4"/>
      </svg>
    ),
    'Safety Boots': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 20h14v2H5z"/>
        <path d="M8 20V9a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v11"/>
        <path d="M11 6h4M8 11h8M8 15h8"/>
        <circle cx="10" cy="18" r="0.5" fill="currentColor"/>
        <circle cx="14" cy="18" r="0.5" fill="currentColor"/>
      </svg>
    ),
    'Safety Glasses': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10h4a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H2"/>
        <path d="M22 10h-4a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h4"/>
        <path d="M9 13h6"/>
        <path d="M6 10c0-2 1-4 6-4s6 2 6 4"/>
      </svg>
    ),
    'Face Mask': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11h18v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-5z"/>
        <path d="M7 11V8a5 5 0 0 1 10 0v3"/>
        <path d="M7 14h10M7 17h10"/>
        <circle cx="9" cy="8" r="0.5" fill="currentColor"/>
        <circle cx="15" cy="8" r="0.5" fill="currentColor"/>
      </svg>
    ),
    'Ear Protection': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/>
        <path d="M20 12h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/>
        <path d="M6 12V8a6 6 0 0 1 12 0v4"/>
      </svg>
    ),
    'Safety Harness': (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2"/>
        <path d="M12 6v3"/>
        <path d="M8 9l4 2 4-2"/>
        <path d="M10 11v10"/>
        <path d="M14 11v10"/>
        <path d="M8 21h8"/>
        <path d="M12 11v4"/>
        <circle cx="12" cy="17" r="1" fill="currentColor"/>
      </svg>
    ),
  };

  return icons[name] || (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      loadChecklistQuestions(formData.category as PermitType);
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
        vendorsAPI.getAll()
      ]);

      if (sitesRes.success && sitesRes.data) setSites(sitesRes.data);
      if (hazardsRes.success && hazardsRes.data) setHazards(hazardsRes.data);
      if (ppeRes.success && ppeRes.data) setPPEItems(ppeRes.data);
      if (workersRes.success && workersRes.data) setWorkers(workersRes.data);
      if (vendorsRes.success && vendorsRes.data) setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
      alert('Failed to load master data. Please refresh the page.');
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
      // Upload SWMS file if present (currently not used in final submission)
      if (formData.swmsFile) {
        await uploadAPI.uploadSWMS(formData.swmsFile);
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

  const toggleWorker = (workerId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedWorkers: prev.selectedWorkers.includes(workerId)
        ? prev.selectedWorkers.filter(id => id !== workerId)
        : [...prev.selectedWorkers, workerId]
    }));
  };

  interface RequirementRowProps {
    label: string;
    value: ChecklistResponse | undefined;
    onChange: (value: ChecklistResponse) => void;
  }

  const RequirementRow = ({ label, value, onChange }: RequirementRowProps) => (
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
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New PTW</h1>
          <p className="text-sm text-slate-600 md:text-base">Step {currentStep} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 bg-white border rounded-xl border-slate-200 md:p-6">
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
      <div className="p-4 bg-white border rounded-xl border-slate-200 md:p-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="category">Permit Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as PermitType })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Work</SelectItem>
                    <SelectItem value="Height">Work at Height</SelectItem>
                    <SelectItem value="Electrical">Electrical Work</SelectItem>
                    <SelectItem value="Hot_Work">Hot Work</SelectItem>
                    <SelectItem value="Confined_Space">Confined Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="site">Site *</Label>
                <Select 
                  value={formData.site_id.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, site_id: parseInt(value) })}
                >
                  <SelectTrigger id="site">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="location">Work Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A, Floor 3, Server Room"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="workDescription">Work Description *</Label>
                <Textarea
                  id="workDescription"
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  placeholder="Describe the work to be performed in detail..."
                  rows={4}
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

              <div className="md:col-span-2">
                <Label htmlFor="vendor">Vendor (Optional)</Label>
                <Select 
                  value={formData.vendor_id.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, vendor_id: parseInt(value) })}
                >
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select vendor (if applicable)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Vendor</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Issuer Signature */}
            <div className="p-6 border-2 border-green-200 rounded-lg bg-green-50">
              <h3 className="flex items-center gap-2 mb-4 font-medium text-slate-900">
                <FileText className="w-5 h-5 text-green-600" />
                Issuer Signature *
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                As the permit issuer, please provide your digital signature to confirm the accuracy of the information provided.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={() => setShowSignature(true)}
                  variant={formData.issuerSignature ? 'outline' : 'primary'}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
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
            <h2 className="text-xl font-semibold text-slate-900">Issued To & Workers Assignment</h2>
            
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
              <h3 className="font-medium text-slate-900">Workers Assignment</h3>
              <p className="text-sm text-slate-600">Select the workers who will be performing this work</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={workerSelectionMode === 'existing'}
                    onCheckedChange={(checked) => setWorkerSelectionMode(checked ? 'existing' : 'new')}
                  />
                  <p className="text-sm text-slate-700">Select Existing Workers</p>
                </div>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={workerSelectionMode === 'new'}
                    onCheckedChange={(checked) => setWorkerSelectionMode(checked ? 'new' : 'existing')}
                  />
                  <p className="text-sm text-slate-700">Add New Workers</p>
                </div>
              </div>

              {/* Existing Workers List */}
              {workerSelectionMode === 'existing' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {workers.map(worker => (
                    <label
                      key={worker.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.selectedWorkers.includes(worker.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Checkbox
                        checked={formData.selectedWorkers.includes(worker.id)}
                        onCheckedChange={() => toggleWorker(worker.id)}
                      />
                      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white bg-orange-500 rounded-full">
                        <span className="font-bold">{worker.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-slate-900">{worker.full_name}</p>
                        <p className="text-sm truncate text-slate-600">{worker.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* New Workers Form */}
              {workerSelectionMode === 'new' && (
                <div className="space-y-4">
                  <div className="p-4 border-2 border-dashed rounded-lg border-slate-300">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">Add New Workers</h4>
                      <Button
                        type="button"
                        onClick={addNewWorker}
                        size="sm"
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Add Worker
                      </Button>
                    </div>

                    {newWorkers.length === 0 && (
                      <p className="text-sm text-center text-slate-500">
                        No workers added yet. Click "Add Worker" to start.
                      </p>
                    )}

                    {newWorkers.map((worker, index) => (
                      <div key={index} className="p-4 mb-4 border rounded-lg border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-slate-900">Worker {index + 1}</h5>
                          <Button
                            type="button"
                            onClick={() => removeNewWorker(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={worker.name}
                              onChange={(e) => updateNewWorker(index, 'name', e.target.value)}
                              placeholder="e.g., Rahul Mishra"
                              className="bg-white"
                            />
                          </div>

                          <div>
                            <Label>Company Name *</Label>
                            <Input
                              value={worker.companyName}
                              onChange={(e) => updateNewWorker(index, 'companyName', e.target.value)}
                              placeholder="e.g., ABC Contractors Pvt Ltd"
                              className="bg-white"
                            />
                          </div>

                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={worker.phone}
                              onChange={(e) => updateNewWorker(index, 'phone', e.target.value)}
                              placeholder="e.g., +91 9876543210"
                              className="bg-white"
                            />
                          </div>

                          <div>
                            <Label>Email *</Label>
                            <Input
                              value={worker.email}
                              onChange={(e) => updateNewWorker(index, 'email', e.target.value)}
                              placeholder="e.g., rahul@example.com"
                              className="bg-white"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Role *</Label>
                            <Select
                              value={worker.role}
                              onValueChange={(value) => updateNewWorker(index, 'role', value)}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Worker">Worker</SelectItem>
                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                <SelectItem value="Fire_Watcher">Fire Watcher</SelectItem>
                                <SelectItem value="Entrant">Entrant</SelectItem>
                                <SelectItem value="Standby">Standby</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {newWorkers.length > 0 && (
                    <div className="flex items-center gap-2 p-3 text-sm text-blue-700 rounded-lg bg-blue-50">
                      <Check className="w-4 h-4" />
                      <span>{newWorkers.length} new worker(s) added</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Hazards & Control Measures */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Hazards & Control Measures</h2>
            
            <div>
              <Label>Identified Hazards *</Label>
              <p className="mb-4 text-sm text-slate-500">Select all applicable hazards for this work</p>
              <div className="grid gap-3 md:grid-cols-2">
                {hazards.map((hazard) => (
                  <label
                    key={hazard.id}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
            <div className="p-5 border-2 rounded-lg bg-amber-50 border-amber-300">
              <p className="text-sm font-medium text-slate-800">
                <span className="font-bold text-amber-800">Note:</span> Describe all safety measures, procedures, and precautions to be taken.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: PPE & SWMS File */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">PPE Requirements & SWMS Upload</h2>
            
            <div>
              <Label>Required Personal Protective Equipment (PPE) *</Label>
              <p className="mb-4 text-sm text-slate-500">Select all required PPE for this work</p>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {ppeItems.map((ppe) => (
                  <button
                    key={ppe.id}
                    type="button"
                    onClick={() => togglePPE(ppe.id)}
                    className={`relative flex flex-col items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      formData.selectedPPE.includes(ppe.id)
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`transition-colors ${
                      formData.selectedPPE.includes(ppe.id) 
                        ? 'text-green-600' 
                        : 'text-slate-600'
                    }`}>
                      <PPEIcon name={ppe.name} />
                    </div>
                    <span className={`text-xs font-medium text-center ${
                      formData.selectedPPE.includes(ppe.id)
                        ? 'text-green-700'
                        : 'text-slate-700'
                    }`}>
                      {ppe.name}
                    </span>
                    {formData.selectedPPE.includes(ppe.id) && (
                      <div className="absolute p-1 bg-green-600 rounded-full top-2 right-2">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="swms">Upload SWMS Document (Optional)</Label>
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
            <h2 className="text-xl font-semibold text-slate-900">Work Requirements Checklist</h2>
            <p className="text-sm text-slate-600">
              Please answer all questions. Select YES, NO, or NA (Not Applicable) for each requirement.
            </p>

            {checklistQuestions.length > 0 ? (
              <div className="border rounded-lg border-slate-200">
                <div className="p-4 border-b bg-slate-50 border-slate-200">
                  <h3 className="font-medium text-slate-900">Safety Requirements</h3>
                </div>
                <div className="p-4 space-y-1">
                  {checklistQuestions.map((question) => (
                    <RequirementRow
                      key={question.id}
                      label={question.question_text}
                      value={formData.checklistResponses[question.id]}
                      onChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          checklistResponses: {
                            ...prev.checklistResponses,
                            [question.id]: value
                          }
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-lg border-slate-200">
                <p className="text-slate-500">No checklist questions available for this permit type.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Review & Submit</h2>
            <p className="text-sm text-slate-600">
              Please review all information before submitting the permit.
            </p>

            {/* Summary */}
            <div className="border rounded-lg border-slate-200">
              <div className="p-4 border-b bg-slate-50 border-slate-200">
                <h3 className="font-medium text-slate-900">Permit Summary</h3>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{formData.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Site</p>
                  <p className="font-medium text-slate-900">
                    {sites.find(s => s.id === formData.site_id)?.name || 'Not selected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium text-slate-900">{formData.location || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Work Period</p>
                  <p className="font-medium text-slate-900">
                    {formData.startDate} {formData.startTime} - {formData.endDate} {formData.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Issued To</p>
                  <p className="font-medium text-slate-900">{formData.issuedToName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Assigned Workers</p>
                  <p className="font-medium text-slate-900">{formData.selectedWorkers.length + newWorkers.length} workers</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Hazards Identified</p>
                  <p className="font-medium text-slate-900">{formData.selectedHazards.length} hazards</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">PPE Required</p>
                  <p className="font-medium text-slate-900">{formData.selectedPPE.length} items</p>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
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

      {/* Digital Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Add Signature</h3>
            <DigitalSignature onSave={handleSignatureSave} onCancel={() => setShowSignature(false)} />
          </div>
        </div>
      )}
    </div>
  );
}