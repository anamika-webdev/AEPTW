// src/components/supervisor/CreatePTW.tsx - COMPLETE UPDATED VERSION
import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Check, AlertTriangle, X } from 'lucide-react';
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
  permitsAPI,
  uploadAPI 
} from '../../services/api';
import type { 
  Site, 
  MasterHazard, 
  MasterPPE, 
  User, 
  MasterChecklistQuestion,
  PermitType,
  WorkerRole,
  ChecklistResponse
} from '../../types';

interface CreatePTWProps {
  onBack: () => void;
  onSuccess?: () => void;
}

// Professional PPE Icon Component
const PPEIconComponent = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    'Safety Helmet': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="48" rx="28" ry="4" fill="#E8505B" opacity="0.2"/>
        <path d="M32 12C20 12 12 20 12 28V38C12 40 13 42 15 42H49C51 42 52 40 52 38V28C52 20 44 12 32 12Z" fill="#E8505B"/>
        <ellipse cx="32" cy="42" rx="17" ry="3" fill="#D13D47"/>
        <rect x="28" y="8" width="8" height="6" rx="2" fill="#E8505B"/>
        <circle cx="32" cy="10" r="3" fill="white"/>
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
      </svg>
    ),
    'Safety Gloves': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="18" ry="3" fill="#9B59B6" opacity="0.2"/>
        <rect x="20" y="18" width="24" height="28" rx="4" fill="#9B59B6"/>
        <path d="M24 24V38M28 24V38M32 24V38M36 24V38M40 24V38" stroke="white" strokeWidth="2" opacity="0.3"/>
      </svg>
    ),
    'Safety Boots': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="24" ry="3" fill="#D4A574" opacity="0.2"/>
        <path d="M18 46H46V52H18V46Z" fill="#8B6F47"/>
        <path d="M22 22C22 18 24 16 26 16H38C40 16 42 18 42 22V46H22V22Z" fill="#D4A574"/>
        <rect x="22" y="28" width="20" height="2" fill="#8B6F47" opacity="0.3"/>
      </svg>
    ),
    'Safety Goggles': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="52" rx="26" ry="3" fill="#4A9EFF" opacity="0.2"/>
        <circle cx="18" cy="32" r="7" fill="#87CEEB"/>
        <circle cx="46" cy="32" r="7" fill="#87CEEB"/>
        <path d="M28 32H36" stroke="#4A9EFF" strokeWidth="3"/>
      </svg>
    ),
    'Face Mask': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="24" ry="3" fill="#FFB74D" opacity="0.2"/>
        <path d="M12 28C12 28 14 24 18 24H46C50 24 52 28 52 28V40C52 44 48 46 44 46H20C16 46 12 44 12 40V28Z" fill="#FFB74D"/>
        <rect x="16" y="30" width="32" height="2" rx="1" fill="white" opacity="0.3"/>
        <rect x="16" y="36" width="32" height="2" rx="1" fill="white" opacity="0.3"/>
      </svg>
    ),
    'Ear Protection': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="28" ry="3" fill="#78909C" opacity="0.2"/>
        <rect x="6" y="28" width="12" height="16" rx="6" fill="#607D8B"/>
        <rect x="46" y="28" width="12" height="16" rx="6" fill="#607D8B"/>
        <path d="M18 28V22C18 16 22 12 28 12H36C42 12 46 16 46 22V28" stroke="#78909C" strokeWidth="4" fill="none"/>
      </svg>
    ),
    'Safety Harness': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="54" rx="20" ry="3" fill="#4FC3F7" opacity="0.2"/>
        <circle cx="32" cy="14" r="6" fill="#FFB74D"/>
        <ellipse cx="32" cy="26" rx="8" ry="4" fill="#0288D1"/>
        <circle cx="32" cy="38" r="4" fill="#FFD54F" stroke="#FFA726" strokeWidth="2"/>
      </svg>
    ),
  };

  return icons[name] || (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="#94A3B8" strokeWidth="2" fill="none"/>
    </svg>
  );
};

export function CreatePTW({ onBack, onSuccess }: CreatePTWProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSignature, setShowSignature] = useState(false);
  const [workerSelectionMode, setWorkerSelectionMode] = useState<'existing' | 'new'>('existing');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master data
  const [sites, setSites] = useState<Site[]>([]);
  const [hazards, setHazards] = useState<MasterHazard[]>([]);
  const [ppeItems, setPPEItems] = useState<MasterPPE[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [checklistQuestions, setChecklistQuestions] = useState<MasterChecklistQuestion[]>([]);

  // NEW: Approvers by role
  const [areaManagers, setAreaManagers] = useState<User[]>([]);
  const [safetyOfficers, setSafetyOfficers] = useState<User[]>([]);
  const [siteLeaders, setSiteLeaders] = useState<User[]>([]);

  const [newWorkers, setNewWorkers] = useState<Array<{ 
    name: string; 
    phone: string; 
    email: string; 
    companyName: string;
    role: WorkerRole;
  }>>([]);
  
  const [formData, setFormData] = useState({
    // UPDATED: Multiple categories instead of single
    categories: [] as PermitType[],
    site_id: 0,
    location: '',
    workDescription: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    issueDepartment: '', // Changed from vendor_id
    permitInitiator: '',
    permitInitiatorContact: '',
    
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
    
    // SWMS
    swmsFile: null as File | null,
    swmsText: '',
    swmsMode: 'file' as 'file' | 'text',
    
    // Signatures
    issuerSignature: '',
    
    // Checklist
    checklistResponses: {} as Record<number, ChecklistResponse>,
    checklistRemarks: {} as Record<number, string>,
    checklistTextResponses: {} as Record<number, string>, // NEW: For name input fields
    
    // Declaration
    declaration: false,
  });

  // NEW: Approver selection
  const [approvers, setApprovers] = useState({
    areaManager: 0,
    safetyOfficer: 0,
    siteLeader: 0,
  });

  // NEW: Approver signatures
  const [approverSignatures, setApproverSignatures] = useState({
    areaManagerSignature: '',
    safetyOfficerSignature: '',
    siteLeaderSignature: '',
  });

  const [showApproverSignature, setShowApproverSignature] = useState<'areaManager' | 'safetyOfficer' | 'siteLeader' | null>(null);

  // NEW: High-risk permit logic
  const highRiskPermits: PermitType[] = ['Hot_Work', 'Confined_Space', 'Electrical', 'Height'];
  const selectedHighRiskCount = formData.categories.filter(cat => highRiskPermits.includes(cat)).length;
  const requiresSiteLeaderApproval = selectedHighRiskCount >= 2;

  const totalSteps = 7; // UPDATED: Added approver selection step
  const progress = (currentStep / totalSteps) * 100;

  // Load data on mount
  useEffect(() => {
    loadMasterData();
    loadApprovers();
  }, []);

  // Load permit initiator
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

  // Load checklists when categories change
  useEffect(() => {
    // Always load ALL checklist questions regardless of selected categories
    loadAllChecklistQuestions(['General', 'Hot_Work', 'Electrical', 'Height', 'Confined_Space']);
  }, []); // Only load once on mount, not when categories change

  const loadMasterData = async () => {
    setIsLoading(true);
    try {
      const [sitesRes, hazardsRes, ppeRes, workersRes] = await Promise.all([
        sitesAPI.getAll(),
        masterDataAPI.getHazards(),
        masterDataAPI.getPPE(),
        usersAPI.getWorkers(),
      ]);

      console.log('Sites response:', sitesRes); // Debug log
      
      if (sitesRes.success && sitesRes.data) {
        console.log('Setting sites:', sitesRes.data); // Debug log
        setSites(sitesRes.data);
      }
      if (hazardsRes.success && hazardsRes.data) setHazards(hazardsRes.data);
      if (ppeRes.success && ppeRes.data) setPPEItems(ppeRes.data);
      if (workersRes.success && workersRes.data) setWorkers(workersRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
      alert('Failed to load form data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Load approvers by role
  const loadApprovers = async () => {
    try {
      const [amRes, soRes, slRes] = await Promise.all([
        usersAPI.getAll(), // Get all users and filter by role
        usersAPI.getAll(),
        usersAPI.getAll(),
      ]);

      if (amRes.success && amRes.data) {
        setAreaManagers(amRes.data.filter((u: User) => u.role === 'Approver_AreaManager'));
        setSafetyOfficers(amRes.data.filter((u: User) => u.role === 'Approver_Safety'));
        setSiteLeaders(amRes.data.filter((u: User) => u.role === 'Admin')); // Or specific Site_Lead role
      }
    } catch (error) {
      console.error('Error loading approvers:', error);
    }
  };

  // NEW: Load checklists for ALL selected categories
  const loadAllChecklistQuestions = async (categories: PermitType[]) => {
    try {
      const allQuestions: MasterChecklistQuestion[] = [];
      
      // Comprehensive fallback checklist questions
      const comprehensiveQuestions: Record<PermitType, string[]> = {
        'General': [
          'Job Location has been checked and verified to conduct the activity.',
          'Area has been barricaded to eliminate the possibilities of unauthorized entry.',
          'Caution board has been displayed.',
          "PPE's available as per job requirement.",
          'Information of work has been communicated to the affected team.',
          'Tools to be inspected for safe use.',
        ],
        'Hot_Work': [
          'No hot work to be carried out at site during fire impairment.',
          'Area barricade.',
          'Authorize/Certified welder',
          'Area clearance of 11mt',
          'Fire Blanket availability',
          'Fire Extinguisher availability (CO2/DCP)',
          'No flammable and combustible material in the vicinity of hot work',
          'Welding machine earthing to be ensured',
          'Face shield, welding gloves, apron must be provided to welder.',
          'Cable condition to be checked.',
          'Fire watcher/fire fighter/first aider/AED certified person availability',
        ],
        'Electrical': [
          'Area Barricade',
          'Wiremen License',
          'Supervisory License',
          'Approved "A" class contractor.',
          "Electrical approved PPE's",
          'De-energized of electrical equipment.',
          'LOTO',
          'Fire fighter/first aider/AED certified person availability',
          'Insulated tools provided.',
        ],
        'Height': [
          'Area Barricade',
          'Vertigo (Height Phobia)/Acrophobic',
          'Pre use inspection of scaffolding/full body harness/ A type ladder / FRP ladder/ Scissor lift/Boom lift/Hydra/Crane.',
          'TPI certificate lifting tools and tackles',
          "PPE's must be inspected and certified.",
          'Anchorage point availability',
          'Rescue plan available.',
          'Supervision available.',
          'Bottom support of ladders/scaffolding to be available.',
        ],
        'Confined_Space': [
          'Area Barricade',
          'Person NOT Claustrophobic',
          'Confined Space Number & Name',
          'LEL Checking',
          'Flameproof handlamp provided (if requirement)',
          'Force air ventilation provided (if required)',
          'O2 Level (19.5 To 23.5%)',
          'CO & H2S Value',
          'Tripod stand availability.',
          'Service/Area and energy isolation',
          'Mechanical equipment lockout',
          'Rescue plan available',
          'GFCI provided for electrical tools',
          'Entrant name',
          'Attendant name',
          'Supervisor name',
          'Stand-by person name',
        ],
      };
      
      for (const category of categories) {
        try {
          const response = await masterDataAPI.getChecklistQuestions(category);
          if (response.success && response.data && response.data.length > 0) {
            allQuestions.push(...response.data);
          } else {
            // Use comprehensive fallback questions
            console.log(`Using fallback checklist for ${category}`);
            const fallbackQuestions = (comprehensiveQuestions[category] || []).map((q, index) => ({
              id: parseInt(`${category.charCodeAt(0)}${index + 1}`), // Generate unique ID
              permit_type: category,
              question_text: q,
              is_mandatory: true,
            }));
            allQuestions.push(...fallbackQuestions);
          }
        } catch (error) {
          // Use fallback on error
          console.log(`Error loading ${category} checklist, using fallback`);
          const fallbackQuestions = (comprehensiveQuestions[category] || []).map((q, index) => ({
            id: parseInt(`${category.charCodeAt(0)}${index + 1}`),
            permit_type: category,
            question_text: q,
            is_mandatory: true,
          }));
          allQuestions.push(...fallbackQuestions);
        }
      }
      
      setChecklistQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading checklist questions:', error);
    }
  };

  // NEW: Toggle category selection
  const toggleCategory = (category: PermitType) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleNext = () => {
    // Validation - RELAXED FOR TESTING
    if (currentStep === 1) {
      if (formData.categories.length === 0) {
        alert('Please select at least one permit category');
        return;
      }
      // Removed strict validation - allow testing with incomplete data
      // Site, location, and work description are now optional for testing
    }

    // Approver validation - RELAXED FOR TESTING
    // Skip approver validation in testing mode
    
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
      let swmsUrl = '';
      if (formData.swmsFile) {
        const uploadRes = await uploadAPI.uploadSWMS(formData.swmsFile);
        if (uploadRes.success && uploadRes.data) {
          swmsUrl = uploadRes.data.url;
        }
      }

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

      const checklistResponses = Object.entries(formData.checklistResponses).map(([questionId, response]) => ({
        question_id: parseInt(questionId),
        response,
        remarks: formData.checklistRemarks[parseInt(questionId)] || undefined,
      }));

      // Add text-based responses (for name fields)
      Object.entries(formData.checklistTextResponses).forEach(([questionId, textValue]) => {
        if (textValue) {
          checklistResponses.push({
            question_id: parseInt(questionId),
            response: 'Yes' as ChecklistResponse, // Mark as Yes if name provided
            remarks: textValue, // Store the name in remarks
          });
        }
      });

      // UPDATED: Submit with multiple categories and approvers
      const permitData = {
        site_id: formData.site_id || 1, // Default to 1 for testing
        permit_types: formData.categories, // Multiple categories
        work_location: formData.location || 'Test Location',
        work_description: formData.workDescription || 'Test Work Description',
        start_time: formData.startDate && formData.startTime 
          ? `${formData.startDate}T${formData.startTime}:00` 
          : new Date().toISOString(),
        end_time: formData.endDate && formData.endTime 
          ? `${formData.endDate}T${formData.endTime}:00`
          : new Date(Date.now() + 86400000).toISOString(), // +1 day
        receiver_name: formData.issuedToName || 'Test Receiver',
        receiver_contact: formData.issuedToContact || 'N/A',
        permit_initiator: formData.permitInitiator,
        permit_initiator_contact: formData.permitInitiatorContact,
        issue_department: formData.issueDepartment || 'Test Department',
        hazard_ids: formData.selectedHazards,
        ppe_ids: formData.selectedPPE,
        team_members: teamMembers,
        control_measures: formData.controlMeasures || 'N/A',
        other_hazards: formData.otherHazards || 'N/A',
        checklist_responses: checklistResponses,
        swms_file_url: swmsUrl,
        swms_text: formData.swmsText,
        // NEW: Approvers (optional for testing)
        area_manager_id: approvers.areaManager || null,
        safety_officer_id: approvers.safetyOfficer || null,
        site_leader_id: requiresSiteLeaderApproval ? (approvers.siteLeader || null) : null,
        // NEW: Approver signatures
        area_manager_signature: approverSignatures.areaManagerSignature || null,
        safety_officer_signature: approverSignatures.safetyOfficerSignature || null,
        site_leader_signature: approverSignatures.siteLeaderSignature || null,
      };

      console.log('Submitting permit data:', permitData); // Debug log

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
        if (showApproverSignature) {
          // Save approver signature
          setApproverSignatures(prev => ({
            ...prev,
            [`${showApproverSignature}Signature`]: uploadRes.data.url
          }));
          setShowApproverSignature(null);
        } else {
          // Save issuer signature
          setFormData({ ...formData, issuerSignature: uploadRes.data.url });
          setShowSignature(false);
        }
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
    }
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
    isTextInput?: boolean; // NEW: flag for text input questions
    textValue?: string;
    onTextChange?: (value: string) => void;
  }

  const RequirementRow = ({ questionId, label, value, onChange, isTextInput, textValue, onTextChange }: RequirementRowProps) => {
    // Check if this question requires a text input instead of YES/NO/NA
    const requiresTextInput = isTextInput || 
      label.toLowerCase().includes('entrant name') ||
      label.toLowerCase().includes('attendant name') ||
      label.toLowerCase().includes('supervisor name') ||
      label.toLowerCase().includes('stand-by person name');

    if (requiresTextInput) {
      return (
        <div className="py-3 border-b border-slate-100">
          <Label htmlFor={`text-${questionId}`} className="block mb-2 text-sm text-slate-700">
            {label}
          </Label>
          <Input
            id={`text-${questionId}`}
            value={textValue || ''}
            onChange={(e) => onTextChange?.(e.target.value)}
            placeholder="Enter name..."
            className="max-w-md"
          />
        </div>
      );
    }

    return (
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
  };

  // Category badge helper
  const getCategoryBadgeColor = (category: PermitType) => {
    const colors: Record<PermitType, string> = {
      'General': 'bg-blue-100 text-blue-800 border-blue-300',
      'Height': 'bg-purple-100 text-purple-800 border-purple-300',
      'Hot_Work': 'bg-red-100 text-red-800 border-red-300',
      'Electrical': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Confined_Space': 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[category];
  };

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
        
        {/* STEP 1: Basic Information with MULTIPLE CATEGORY SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
            
            {/* Testing Mode Notice */}
            <div className="p-4 border-2 rounded-lg border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Testing Mode Enabled</p>
                  <p className="text-sm text-amber-700">
                    Validation is relaxed for frontend testing. Most fields are optional. 
                    Only permit category selection is required to proceed.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Permit Initiator */}
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

            {/* NEW: Multiple Category Selection */}
            <div>
              <Label>Permit Categories * (Select all that apply)</Label>
              <p className="mb-3 text-sm text-slate-500">You can select multiple permit types for this work</p>
              
              <div className="grid gap-3 md:grid-cols-2">
                {(['General', 'Height', 'Electrical', 'Hot_Work', 'Confined_Space'] as PermitType[]).map((category) => {
                  const isHighRisk = highRiskPermits.includes(category);
                  return (
                    <label
                      key={category}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.categories.includes(category)
                          ? isHighRisk
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Checkbox
                        checked={formData.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {category.replace('_', ' ')}
                          </span>
                          {isHighRisk && (
                            <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded">
                              High Risk
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Selected Categories Display */}
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 mt-3 rounded-lg bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">Selected:</span>
                  {formData.categories.map(cat => (
                    <span key={cat} className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryBadgeColor(cat)}`}>
                      {cat.replace('_', ' ')}
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="inline w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* High-Risk Warning */}
              {requiresSiteLeaderApproval && (
                <div className="flex items-start gap-3 p-4 mt-3 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">Site Leader Approval Required</p>
                    <p className="text-sm text-orange-700">
                      You've selected {selectedHighRiskCount} high-risk permit types. This requires approval from a Site Leader in addition to Area Manager and Safety Officer.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Site Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="site">Site (Optional - Backend Issue)</Label>
                <Select 
                  value={formData.site_id.toString()} 
                  onValueChange={(value) => {
                    console.log('Site selected:', value); // Debug
                    setFormData({ ...formData, site_id: parseInt(value) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site (or skip for testing)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">-- Skip Site Selection (Testing) --</SelectItem>
                    {sites.length === 0 ? (
                      <SelectItem value="1">Default Test Site</SelectItem>
                    ) : (
                      sites.map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {sites.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠️ Sites not loaded from backend. Using test mode. Fix backend/sites API later.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A, Floor 3 (optional for testing)"
                />
              </div>
            </div>

            {/* Issue Department */}
            <div>
              <Label htmlFor="issueDepartment">Issue Department</Label>
              <Input
                id="issueDepartment"
                value={formData.issueDepartment}
                onChange={(e) => setFormData({ ...formData, issueDepartment: e.target.value })}
                placeholder="e.g., Maintenance, Operations, Engineering (optional for testing)"
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter the department that is issuing this permit
              </p>
            </div>

            {/* Work Description */}
            <div>
              <Label htmlFor="workDescription">Work Description</Label>
              <Textarea
                id="workDescription"
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                placeholder="Describe the work to be performed... (optional for testing)"
                rows={4}
              />
            </div>

            {/* Date & Time */}
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

            {/* Issuer Signature */}
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

        {/* STEP 2: Issued To & Workers (Same as before) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Issued To & Workers Assignment</h2>
            
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
            </div>

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

        {/* STEP 3: Hazards (Same as before) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Hazard Identification & Control Measures</h2>
            
            <div>
              <Label>Identified Hazards *</Label>
              <p className="mb-3 text-sm text-slate-500">Select all hazards that apply to this work</p>
              
              {/* Predefined Hazards Dropdown */}
              <div className="space-y-3">
                {[
                  'Fall from height',
                  'Electrical shock',
                  'Fire hazard',
                  'Toxic gases',
                  'Slips and trips',
                  'Moving machinery',
                  'Hot surfaces',
                  'Confined space'
                ].map((hazard, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.selectedHazards.includes(index + 1)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.selectedHazards.includes(index + 1)}
                      onCheckedChange={() => {
                        const hazardId = index + 1;
                        setFormData(prev => ({
                          ...prev,
                          selectedHazards: prev.selectedHazards.includes(hazardId)
                            ? prev.selectedHazards.filter(id => id !== hazardId)
                            : [...prev.selectedHazards, hazardId]
                        }));
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700">{hazard}</span>
                  </label>
                ))}
              </div>

              {/* Show selected hazards */}
              {formData.selectedHazards.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 mt-3 rounded-lg bg-orange-50">
                  <span className="text-sm font-medium text-orange-900">Selected Hazards:</span>
                  {formData.selectedHazards.map(id => {
                    const hazardNames = [
                      'Fall from height',
                      'Electrical shock',
                      'Fire hazard',
                      'Toxic gases',
                      'Slips and trips',
                      'Moving machinery',
                      'Hot surfaces',
                      'Confined space'
                    ];
                    return (
                      <span key={id} className="px-3 py-1 text-xs font-semibold text-orange-800 bg-orange-200 rounded-full">
                        {hazardNames[id - 1]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="controlMeasures">Control Measures</Label>
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

            {/* Important Note */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <p className="mb-2 text-sm font-semibold text-blue-900">
                📋 Important Note:
              </p>
              <p className="text-sm text-blue-800">
                Describe all safety measures, procedures, and precautions to be taken
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: PPE & SWMS with Professional Icons */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">PPE Requirements & SWMS Upload</h2>
            
            <div>
              <Label>Required Personal Protective Equipment (PPE) *</Label>
              <p className="mb-4 text-sm text-slate-500">Select all required PPE for this work</p>
              
              {ppeItems.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-lg border-slate-200 bg-slate-50">
                  <p className="mb-4 text-slate-600">No PPE items loaded from backend. Using default PPE list.</p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {['Safety Helmet', 'Safety Vest', 'Safety Gloves', 'Safety Boots', 'Safety Goggles', 'Face Mask', 'Ear Protection', 'Safety Harness'].map((ppeName, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const mockId = index + 1;
                          setFormData(prev => ({
                            ...prev,
                            selectedPPE: prev.selectedPPE.includes(mockId)
                              ? prev.selectedPPE.filter(id => id !== mockId)
                              : [...prev.selectedPPE, mockId]
                          }));
                        }}
                        className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                          formData.selectedPPE.includes(index + 1)
                            ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="transition-transform">
                          <PPEIconComponent name={ppeName} />
                        </div>
                        <span className={`text-sm font-semibold text-center ${
                          formData.selectedPPE.includes(index + 1) ? 'text-blue-900' : 'text-slate-700'
                        }`}>
                          {ppeName}
                        </span>
                        {formData.selectedPPE.includes(index + 1) && (
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full shadow-sm">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
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
                      <div className="transition-transform">
                        <PPEIconComponent name={ppe.name} />
                      </div>
                      
                      <span className={`text-sm font-semibold text-center ${
                        formData.selectedPPE.includes(ppe.id) ? 'text-blue-900' : 'text-slate-700'
                      }`}>
                        {ppe.name}
                      </span>
                      
                      {formData.selectedPPE.includes(ppe.id) && (
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full shadow-sm">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
              <h3 className="mb-4 text-lg font-medium text-purple-900">
                Safe Work Method Statement (SWMS)
              </h3>

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
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Work Requirements Checklist */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Work Requirements Checklist</h2>
            <p className="text-sm text-slate-600">
              Complete the following safety requirements checklist for all permit types
            </p>
            
            <div className="p-6 border rounded-lg border-slate-200">
              <div className="space-y-6">
                {/* Always show ALL categories */}
                {(['General', 'Hot_Work', 'Electrical', 'Height', 'Confined_Space'] as PermitType[]).map(category => {
                  const categoryQuestions = checklistQuestions.filter(
                    q => q.permit_type === category
                  );
                  
                  // Category display names
                  const categoryNames: Record<PermitType, string> = {
                    'General': 'General Work',
                    'Hot_Work': 'Hot Work',
                    'Electrical': 'Electrical Work',
                    'Height': 'Height Work',
                    'Confined_Space': 'Confined Space Work',
                  };
                  
                  return (
                    <div key={category} className="pb-6 border-b border-slate-200 last:border-0">
                      <h3 className="mb-4 text-lg font-semibold text-slate-900">
                        {categoryNames[category]} Requirements
                      </h3>
                      {categoryQuestions.length > 0 ? (
                        categoryQuestions.map((question) => {
                          // Check if this question requires text input
                          const isTextInput = 
                            question.question_text.toLowerCase().includes('entrant name') ||
                            question.question_text.toLowerCase().includes('attendant name') ||
                            question.question_text.toLowerCase().includes('supervisor name') ||
                            question.question_text.toLowerCase().includes('stand-by person name');

                          return (
                            <div key={question.id}>
                              <RequirementRow
                                questionId={question.id}
                                label={question.question_text}
                                value={formData.checklistResponses[question.id]}
                                onChange={(val) => setFormData(prev => ({
                                  ...prev,
                                  checklistResponses: { ...prev.checklistResponses, [question.id]: val }
                                }))}
                                isTextInput={isTextInput}
                                textValue={formData.checklistTextResponses[question.id]}
                                onTextChange={(val) => setFormData(prev => ({
                                  ...prev,
                                  checklistTextResponses: { ...prev.checklistTextResponses, [question.id]: val }
                                }))}
                              />
                              {!isTextInput && formData.checklistResponses[question.id] === 'No' && (
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
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500">Loading {categoryNames[category]} requirements...</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: NEW - Approver Selection */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Approver Selection</h2>
            <p className="text-sm text-slate-600">
              Select the approvers who will review and approve this permit (Optional for testing)
            </p>

            {requiresSiteLeaderApproval && (
              <div className="flex items-start gap-3 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">High-Risk Permit - Site Leader Required</p>
                  <p className="text-sm text-orange-700">
                    This permit requires approval from all three approvers due to multiple high-risk work types.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Area Manager */}
              <div>
                <Label htmlFor="areaManager">Area Manager (Optional for testing)</Label>
                <Select 
                  value={approvers.areaManager.toString()} 
                  onValueChange={(value) => setApprovers({ ...approvers, areaManager: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Area Manager (or skip)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">-- Skip for Testing --</SelectItem>
                    {areaManagers.length === 0 ? (
                      <SelectItem value="1">Test Area Manager</SelectItem>
                    ) : (
                      areaManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.full_name} ({manager.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Digital Signature Button */}
                <div className="flex items-center gap-4 mt-3">
                  <Button
                    type="button"
                    onClick={() => setShowApproverSignature('areaManager')}
                    variant="outline"
                    size="sm"
                  >
                    {approverSignatures.areaManagerSignature ? 'Update Signature' : 'Add Digital Signature'}
                  </Button>
                  {approverSignatures.areaManagerSignature && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      Signed
                    </span>
                  )}
                </div>
              </div>

              {/* Safety Officer */}
              <div>
                <Label htmlFor="safetyOfficer">Safety Officer (Optional for testing)</Label>
                <Select 
                  value={approvers.safetyOfficer.toString()} 
                  onValueChange={(value) => setApprovers({ ...approvers, safetyOfficer: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Safety Officer (or skip)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">-- Skip for Testing --</SelectItem>
                    {safetyOfficers.length === 0 ? (
                      <SelectItem value="1">Test Safety Officer</SelectItem>
                    ) : (
                      safetyOfficers.map((officer) => (
                        <SelectItem key={officer.id} value={officer.id.toString()}>
                          {officer.full_name} ({officer.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Digital Signature Button */}
                <div className="flex items-center gap-4 mt-3">
                  <Button
                    type="button"
                    onClick={() => setShowApproverSignature('safetyOfficer')}
                    variant="outline"
                    size="sm"
                  >
                    {approverSignatures.safetyOfficerSignature ? 'Update Signature' : 'Add Digital Signature'}
                  </Button>
                  {approverSignatures.safetyOfficerSignature && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      Signed
                    </span>
                  )}
                </div>
              </div>

              {/* Site Leader - Conditional */}
              {requiresSiteLeaderApproval && (
                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <Label htmlFor="siteLeader" className="text-red-900">
                    Site Leader (Optional for testing - Required for High-Risk in Production)
                  </Label>
                  <Select 
                    value={approvers.siteLeader.toString()} 
                    onValueChange={(value) => setApprovers({ ...approvers, siteLeader: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-2 bg-white">
                      <SelectValue placeholder="Select Site Leader (or skip)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">-- Skip for Testing --</SelectItem>
                      {siteLeaders.length === 0 ? (
                        <SelectItem value="1">Test Site Leader</SelectItem>
                      ) : (
                        siteLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id.toString()}>
                            {leader.full_name} ({leader.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Digital Signature Button */}
                  <div className="flex items-center gap-4 mt-3">
                    <Button
                      type="button"
                      onClick={() => setShowApproverSignature('siteLeader')}
                      variant="outline"
                      size="sm"
                      className="bg-white"
                    >
                      {approverSignatures.siteLeaderSignature ? 'Update Signature' : 'Add Digital Signature'}
                    </Button>
                    {approverSignatures.siteLeaderSignature && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        Signed
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 text-xs text-red-700">
                    Site Leader approval is mandatory for permits with 2 or more high-risk work types
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: Review & Submit */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-slate-900">Review & Submit</h2>
            
            <div className="p-6 space-y-4 rounded-lg bg-slate-50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Permit Initiator</p>
                  <p className="text-slate-900">{formData.permitInitiator || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Permit Categories</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.categories.map(cat => (
                      <span key={cat} className={`px-2 py-1 text-xs font-semibold rounded ${getCategoryBadgeColor(cat)}`}>
                        {cat.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
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
                  <p className="text-sm text-slate-500">Approvers</p>
                  <p className="text-sm text-slate-700">
                    {requiresSiteLeaderApproval ? '3 approvers required' : '2 approvers required'}
                  </p>
                </div>
              </div>
            </div>

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
      {(showSignature || showApproverSignature) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {showApproverSignature 
                ? `${showApproverSignature === 'areaManager' ? 'Area Manager' : 
                     showApproverSignature === 'safetyOfficer' ? 'Safety Officer' : 
                     'Site Leader'} Digital Signature`
                : 'Issuer Digital Signature'}
            </h3>
            <DigitalSignature
              onSave={handleSignatureSave}
              onCancel={() => {
                setShowSignature(false);
                setShowApproverSignature(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}