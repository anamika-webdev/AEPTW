// src/components/supervisor/CreatePTW.tsx - COMPLETE UPDATED VERSION WITH FIXES
import { useState, useEffect, useCallback, memo } from 'react';
import { ArrowLeft, FileText, Check, AlertTriangle, X, Camera, Clock, MapPin, ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { DigitalSignature } from '../shared/DigitalSignature';
import PersonnelFields from './PersonnelFields';

import {
  sitesAPI,
  masterDataAPI,
  usersAPI,
  permitsAPI,
  uploadAPI,
} from '../../services/api';
import evidenceAPI from '../../services/evidenceAPI';
import type {
  Site,
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
// Evidence interface
interface Evidence {
  id: string;
  file: File;
  preview: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  category: 'ppe' | 'barricading' | 'tool_condition' | 'other';
  description: string;
}

interface PTWFormData {
  evidences: Evidence[];
  selectedHazards: number[];
  controlMeasures: string;
  otherHazards: string;
  selectedPPE: number[];
  swmsFile: File | null;
  swmsText: string;
  swmsMode: 'file' | 'text';
  // Add other missing fields to this interface or rely on state initialization inference if this interface is incomplete
  [key: string]: any;
}
import { CameraModal } from '../shared/CameraModal';

export function CreatePTW({ onBack, onSuccess }: CreatePTWProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSignature, setShowSignature] = useState(false);
  const [workerSelectionMode, setWorkerSelectionMode] = useState<'existing' | 'new'>('existing');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master data
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [checklistQuestions, setChecklistQuestions] = useState<MasterChecklistQuestion[]>([]);
  // Approvers
  const [areaManagers, setAreaManagers] = useState<User[]>([]);
  const [safetyOfficers, setSafetyOfficers] = useState<User[]>([]);
  const [siteLeaders, setSiteLeaders] = useState<User[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [captureType, setCaptureType] = useState<'worker' | 'evidence'>('worker');
  const [currentWorkerIndex, setCurrentWorkerIndex] = useState<number | null>(null);
  const [newWorkers, setNewWorkers] = useState<Array<{
    name: string;
    phone: string;
    email: string;
    companyName: string;
    role: WorkerRole;
    trainingEvidences: TrainingEvidence[];  // ⭐ ADD THIS LINE
  }>>([]);

  const [formData, setFormData] = useState<PTWFormData>({
    categories: [] as PermitType[],
    site_id: 0,
    location: '',
    workDescription: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    issueDepartment: '', // This will now hold dropdown value
    permitInitiator: '',
    permitInitiatorContact: '',
    evidences: [] as Evidence[],
    selectedHazards: [] as number[],
    controlMeasures: '',
    otherHazards: '',
    selectedPPE: [] as number[],
    swmsFile: null as File | null,
    swmsText: '',
    swmsMode: 'file' as 'file' | 'text',

    issuedToName: '',
    issuedToContact: '',
    selectedWorkers: [] as number[],

    issuerSignature: '',

    checklistResponses: {} as Record<number, ChecklistResponse>,
    checklistRemarks: {} as Record<number, string>,
    checklistTextResponses: {} as Record<number, string>,

    // Approver IDs
    area_manager_id: 0 as number | string,
    safety_officer_id: 0 as number | string,
    site_leader_id: 0 as number | string,

    declaration: false,
  });



  // Geolocation function
  const getCurrentLocation = (): Promise<{ latitude: number | null; longitude: number | null }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve({ latitude: null, longitude: null });
        }
      );
    });
  };
  // ⭐ NEW: Handle captured photo from camera
  const handlePhotoCaptured = (workerIndex: number, blob: Blob) => {
    const file = new File([blob], `training-evidence-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });

    const evidence: TrainingEvidence = {
      id: `evidence-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(blob),
      caption: '',
    };

    setNewWorkers((prev) =>
      prev.map((worker, idx) =>
        idx === workerIndex
          ? { ...worker, trainingEvidences: [...worker.trainingEvidences, evidence] }
          : worker
      )
    );
  };

  const handleEvidenceCaptured = async (blob: Blob) => {
    try {
      const location = await getCurrentLocation();
      const timestamp = new Date().toISOString();

      const file = new File([blob], `evidence-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      const preview = URL.createObjectURL(blob);

      const evidence: Evidence = {
        id: `${Date.now()}`,
        file,
        preview,
        timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
        category: 'ppe', // Default category
        description: '',
      };

      setFormData((prev) => ({
        ...prev,
        evidences: [...prev.evidences, evidence],
      }));
    } catch (error) {
      console.error('Error processing captured evidence:', error);
      alert('Failed to process captured photo.');
    }
  };




  // Remove evidence
  const removeEvidence = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      evidences: prev.evidences.filter((e) => e.id !== id),
    }));
  };

  // Update evidence description
  const updateEvidenceDescription = (id: string, description: string) => {
    setFormData((prev) => ({
      ...prev,
      evidences: prev.evidences.map((e) =>
        e.id === id ? { ...e, description } : e
      ),
    }));
  };
  // High-risk permit logic - used throughout the component
  const highRiskPermits: PermitType[] = ['Hot_Work', 'Confined_Space', 'Electrical', 'Height'];
  const selectedHighRiskCount = formData.categories.filter((cat: PermitType) => highRiskPermits.includes(cat)).length;
  const requiresSiteLeaderApproval = selectedHighRiskCount >= 2;

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  // CRITICAL FIX: Memoized text change handler to prevent re-renders


  useEffect(() => {
    loadMasterData();
    loadApprovers();
  }, []);

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

  useEffect(() => {
    loadCorrectChecklistQuestions();
  }, []);

  const loadMasterData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading master data from admin database...');

      const [sitesRes, hazardsRes, ppeRes, workersRes] = await Promise.all([
        sitesAPI.getAll().catch(err => {
          console.error('❌ Sites API error:', err);
          return { success: false, data: [] };
        }),
        masterDataAPI.getHazards().catch(err => {
          console.error('❌ Hazards API error:', err);
          return { success: false, data: [] };
        }),
        masterDataAPI.getPPE().catch(err => {
          console.error('❌ PPE API error:', err);
          return { success: false, data: [] };
        }),
        usersAPI.getWorkers().catch(err => {
          console.error('❌ Workers API error:', err);
          return { success: false, data: [] };
        }),
      ]);

      console.log('📍 Sites API Response:', sitesRes);
      // ⭐ MODIFIED: Handle sites with auto-prefill logic
      if (sitesRes.success && sitesRes.data) {
        const sitesList = Array.isArray(sitesRes.data) ? sitesRes.data : [];
        console.log(`✅ Sites loaded: ${sitesList.length}`);
        setSites(sitesList);

        // ⭐ NEW: Auto-prefill if only 1 site is assigned

        if (sitesList.length === 1) {
          console.log('✅ Auto-selecting single site:', sitesList[0].name);
          setFormData(prev => ({
            ...prev,
            site_id: sitesList[0].id
          }));

          // ⭐ ALSO load approvers for the auto-selected site
          loadSiteApprovers(sitesList[0].id);
        }
        else if (sitesList.length > 1) {
          console.log(`📋 ${sitesList.length} sites available - user must select`);
        } else {
          console.warn('⚠️ No sites assigned to this user');
        }
      } else {
        console.warn('⚠️ Sites not loaded');
        setSites([]);
      }

      // ✅ FIXED: Proper null checks and array validation
      if (sitesRes.success && sitesRes.data) {
        console.log('✅ Sites loaded:', sitesRes.data.length);
        setSites(Array.isArray(sitesRes.data) ? sitesRes.data : []);
      } else {
        console.warn('⚠️ Sites not loaded');
        setSites([]);
      }

      if (hazardsRes.success && hazardsRes.data) {
        console.log('✅ Hazards loaded:', hazardsRes.data.length);
        // Hazards data loaded but not stored in state (not currently used in UI)
      } else {
        console.warn('⚠️ Hazards not loaded');
      }

      if (ppeRes.success && ppeRes.data) {
        console.log('✅ PPE loaded:', ppeRes.data.length);
        // PPE data loaded but not stored in state (not currently used in UI)
      } else {
        console.warn('⚠️ PPE not loaded');
      }

      if (workersRes.success && workersRes.data) {
        console.log('✅ Workers loaded:', workersRes.data.length);
        setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      } else {
        console.warn('⚠️ Workers not loaded');
        setWorkers([]);
      }

      // ✅ FIXED: Don't show error if at least some data loaded
      const hasData = sitesRes.success || hazardsRes.success || ppeRes.success || workersRes.success;
      if (!hasData) {
        alert('Failed to load form data. Please refresh the page.');
      }

    } catch (error) {
      console.error('❌ Error loading master data:', error);
      alert('Failed to load form data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };
  const loadApprovers = async () => {
    try {
      console.log('🔄 [APPROVERS] Loading approvers...');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/approvers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📊 [APPROVERS] Response:', data);

      if (data.success && data.data) {
        const am = data.data.filter((a: User) => a.role === 'Approver_AreaManager');
        const so = data.data.filter((a: User) => a.role === 'Approver_Safety');
        const sl = data.data.filter((a: User) => a.role === 'Approver_SiteLeader');

        console.log('✅ Area Managers:', am.length, am.map((a: User) => a.full_name));
        console.log('✅ Safety Officers:', so.length, so.map((a: User) => a.full_name));
        console.log('✅ Site Leaders:', sl.length, sl.map((a: User) => a.full_name));

        setAreaManagers(am);
        setSafetyOfficers(so);
        setSiteLeaders(sl);

        console.log('✅ [APPROVERS] Done!');
      }
    } catch (error) {
      console.error('❌ [APPROVERS] Error:', error);
    }
  };
  // ⭐ NEW: Load approvers for selected site
  const loadSiteApprovers = async (siteId: number) => {
    if (!siteId) return;

    try {
      console.log(`🔄 Loading approvers for site ID: ${siteId}`);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/approvers/sites/${siteId}/approvers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📊 Site Approvers Response:', data);

      if (data.success && data.data) {
        const siteApprovers = data.data;

        // Auto-fill approver fields
        setFormData(prev => ({
          ...prev,
          area_manager_id: siteApprovers.area_manager_id || 0,
          safety_officer_id: siteApprovers.safety_officer_id || 0,
          site_leader_id: siteApprovers.site_leader_id || 0
        }));

        console.log('✅ Auto-selected approvers:', {
          area_manager: siteApprovers.area_manager_name || 'None',
          safety_officer: siteApprovers.safety_officer_name || 'None',
          site_leader: siteApprovers.site_leader_name || 'None'
        });
      } else {
        console.log('⚠️ No approvers configured for this site');
        // Clear approver fields if no approvers found
        setFormData(prev => ({
          ...prev,
          area_manager_id: 0,
          safety_officer_id: 0,
          site_leader_id: 0
        }));
      }
    } catch (error) {
      console.error('❌ Error loading site approvers:', error);
    }
  };
  const loadCorrectChecklistQuestions = () => {
    const correctQuestions: Record<PermitType, Array<{ question: string; isTextInput: boolean }>> = {
      'General': [
        { question: 'Job Location has been checked and verified to conduct the activity.', isTextInput: false },
        { question: 'Area has been barricaded to eliminate the possibilities of unauthorized entry.', isTextInput: false },
        { question: 'Caution board has been displayed.', isTextInput: false },
        { question: "PPE's available as per job requirement.", isTextInput: false },
        { question: 'Information of work has been communicated to the affected team.', isTextInput: false },
        { question: 'Tools to be inspected for safe use.', isTextInput: false },
      ],
      'Hot_Work': [
        { question: 'No hot work to be carried out at site during fire impairment.', isTextInput: false },
        { question: 'Area barricade.', isTextInput: false },
        { question: 'Authorize/Certified welder', isTextInput: false },
        { question: 'Area clearance of 11mt', isTextInput: false },
        { question: 'Fire Blanket availability', isTextInput: false },
        { question: 'Fire Extinguisher availability (CO2/DCP)', isTextInput: false },
        { question: 'No flammable and combustible material in the vicinity of hot work', isTextInput: false },
        { question: 'Welding machine earthing to be ensured', isTextInput: false },
        { question: 'Face shield, welding gloves, apron must be provided to welder.', isTextInput: false },
        { question: 'Cable condition to be checked.', isTextInput: false },
        { question: 'Fire watcher/fire fighter/first aider/AED certified person availability', isTextInput: false },
      ],
      'Electrical': [
        { question: 'Area Barricade', isTextInput: false },
        { question: 'Wiremen License', isTextInput: false },
        { question: 'Supervisory License', isTextInput: false },
        { question: 'Approved "A" class contractor.', isTextInput: false },
        { question: "Electrical approved PPE's", isTextInput: false },
        { question: 'De-energized of electrical equipment.', isTextInput: false },
        { question: 'LOTO', isTextInput: false },
        { question: 'Fire fighter/first aider/AED certified person availability', isTextInput: false },
        { question: 'Insulated tools provided.', isTextInput: false },
      ],
      'Height': [
        { question: 'Area Barricade', isTextInput: false },
        { question: 'Vertigo (Height Phobia)/Acrophobic', isTextInput: false },
        { question: 'Pre use inspection of scaffolding/full body harness/ A type ladder / FRP ladder/ Scissor lift/Boom lift/Hydra/Crane.', isTextInput: false },
        { question: 'TPI certificate lifting tools and tackles', isTextInput: false },
        { question: "PPE's must be inspected and certified.", isTextInput: false },
        { question: 'Anchorage point availability', isTextInput: false },
        { question: 'Rescue plan available.', isTextInput: false },
        { question: 'Supervision available.', isTextInput: false },
        { question: 'Bottom support of ladders/scaffolding to be available.', isTextInput: false },
      ],
      'Confined_Space': [
        { question: 'Area Barricade', isTextInput: false },
        { question: 'Person NOT Claustrophobic', isTextInput: false },
        { question: 'Confined Space Number & Name', isTextInput: false },
        { question: 'LEL Checking', isTextInput: false },
        { question: 'Flameproof handlamp provided (if requirement)', isTextInput: false },
        { question: 'Force air ventilation provided (if required)', isTextInput: false },
        { question: 'O2 Level (19.5 To 23.5%)', isTextInput: false },
        { question: 'CO & H2S Value', isTextInput: false },
        { question: 'Tripod stand availability.', isTextInput: false },
        { question: 'Service/Area and energy isolation', isTextInput: false },
        { question: 'Mechanical equipment lockout', isTextInput: false },
        { question: 'Rescue plan available', isTextInput: false },
        { question: 'GFCI provided for electrical tools', isTextInput: false },
      ],
    };

    const allQuestions: MasterChecklistQuestion[] = [];
    let idCounter = 1;

    (['General', 'Hot_Work', 'Electrical', 'Height', 'Confined_Space'] as PermitType[]).forEach(category => {
      correctQuestions[category].forEach(({ question, isTextInput }) => {
        allQuestions.push({
          id: idCounter++,
          permit_type: category,
          question_text: question,
          is_mandatory: true,
          response_type: isTextInput ? 'text' : 'yes_no'
        });
      });
    });

    console.log('✅ Loaded correct checklist questions:', allQuestions.length);
    setChecklistQuestions(allQuestions);
  };

  const toggleCategory = (category: PermitType) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c: PermitType) => c !== category)
        : [...prev.categories, category]
    }));
  };

  // ⭐ NEW FUNCTION 2: Remove Training Evidence
  const handleRemoveTrainingEvidence = (workerIndex: number, evidenceId: string) => {
    setNewWorkers((prev) =>
      prev.map((worker, idx) => {
        if (idx === workerIndex) {
          // Revoke object URL to prevent memory leaks
          const evidence = worker.trainingEvidences.find((e) => e.id === evidenceId);
          if (evidence) {
            URL.revokeObjectURL(evidence.preview);
          }
          return {
            ...worker,
            trainingEvidences: worker.trainingEvidences.filter((e) => e.id !== evidenceId),
          };
        }
        return worker;
      })
    );
  };

  // ⭐ NEW FUNCTION 3: Update Evidence Caption
  const handleUpdateEvidenceCaption = (workerIndex: number, evidenceId: string, caption: string) => {
    setNewWorkers((prev) =>
      prev.map((worker, idx) =>
        idx === workerIndex
          ? {
            ...worker,
            trainingEvidences: worker.trainingEvidences.map((e) =>
              e.id === evidenceId ? { ...e, caption } : e
            ),
          }
          : worker
      )
    );
  };
  const handleNext = () => {
    console.log('📍 Current Step:', currentStep);

    // Step 1: Basic Information Validation
    if (currentStep === 1) {
      if (formData.categories.length === 0) {
        alert('Please select at least one permit category');
        return;
      }

      // ⭐ Use the validateStep2 function which includes site validation
      if (!formData.site_id) {
        if (sites.length === 0) {
          alert('⚠️ No sites assigned to you. Please contact your administrator to assign sites before creating a PTW.');
        } else {
          alert('⚠️ Please select a site to proceed.');
        }
        return;
      }

      if (!formData.issueDepartment) {
        alert('Please select an Issue Department');
        return;
      }
      if (!formData.location.trim()) {
        alert('Please enter layout/location');
        return;
      }
      if (!formData.workDescription.trim()) {
        alert('Please enter Work Description');
        return;
      }
      if (!formData.startDate) {
        alert('Please select Start Date');
        return;
      }
      if (!formData.startTime) {
        alert('Please select Start Time');
        return;
      }
      if (!formData.endDate) {
        alert('Please select End Date');
        return;
      }
      if (!formData.endTime) {
        alert('Please select End Time');
        return;
      }

      // Date and Time Validation
      const now = new Date();
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (startDateTime < now) {
        // Allow small buffer of 1 min for slow users/clock differences
        const diff = now.getTime() - startDateTime.getTime();
        if (diff > 60000) {
          alert('Start date and time cannot be in the past');
          return;
        }
      }

      if (endDateTime <= startDateTime) {
        alert('End date and time must be after start date and time');
        return;
      }
      if (!formData.issuerSignature) {
        alert('Issuer Signature is required');
        return;
      }
    }

    // Step 2: Workers Validation
    if (currentStep === 2) {
      if (!formData.issuedToName.trim()) {
        alert('Please enter Vendor Name (Issued To)');
        return;
      }
      if (!formData.issuedToContact.trim()) {
        alert('Please enter Contact Number (Issued To)');
        return;
      }
      if (formData.selectedWorkers.length === 0 && newWorkers.length === 0) {
        alert('Please assign at least one worker');
        return;
      }

      // ⭐ NEW: Validate training evidences for new workers
      const workersWithoutEvidence = newWorkers.filter(
        (worker) => worker.trainingEvidences && worker.trainingEvidences.length === 0
      );
      if (workersWithoutEvidence.length > 0) {
        const proceed = window.confirm(
          `Warning: ${workersWithoutEvidence.length} worker(s) have no training evidence uploaded. Do you want to proceed anyway?`
        );
        if (!proceed) return;
      }
    }

    // ⭐ VALIDATION FOR SUBSEQUENT STEPS ⭐

    // Step 3: Hazards Validation
    if (currentStep === 3) {
      if (formData.selectedHazards.length === 0) {
        alert('Please select at least one hazard');
        return;
      }
      if (!formData.controlMeasures.trim()) {
        alert('Please enter Control Measures');
        return;
      }
    }

    // Step 4: PPE & SWMS Validation
    if (currentStep === 4) {
      if (formData.selectedPPE.length === 0) {
        alert('Please select at least one PPE');
        return;
      }
      if (formData.swmsMode === 'file' && !formData.swmsFile) {
        alert('Please upload a SWMS document');
        return;
      }
      if (formData.swmsMode === 'text' && (!formData.swmsText.trim() || formData.swmsText.length < 20)) {
        alert('Please enter valid SWMS text (min 20 chars)');
        return;
      }
    }

    // Step 5: Checklist Validation - DYNAMIC BASED ON PERMIT TYPE
    if (currentStep === 5) {
      if (!formData.categories || formData.categories.length === 0) {
        alert('Please select at least one permit category in Step 1');
        return;
      }


      // Validate other dynamic checklist questions
      const activeQuestions = checklistQuestions.filter(q =>
        formData.categories.includes(q.permit_type as PermitType)
      );

      // ⭐ PERSONNEL FIELDS VALIDATION ⭐
      const hasCat = (cat: PermitType) => formData.categories.includes(cat);
      const isGeneral = hasCat('General');
      const isHotWork = hasCat('Hot_Work');
      const isElectrical = hasCat('Electrical');
      const isHeight = hasCat('Height');
      const isConfinedSpace = hasCat('Confined_Space');

      // Helper to validate a specific field pair
      const validateField = (id: number, name: string, contactId: number) => {
        const val = formData.checklistTextResponses[id];
        const contact = formData.checklistTextResponses[contactId];

        if (!val || val.trim().length < 2) {
          alert(`Please enter a valid ${name}`);
          return false;
        }
        if (!contact || !/^[0-9]{10}$/.test(contact)) {
          alert(`Please enter a valid 10-digit contact number for ${name}`);
          return false;
        }
        return true;
      };

      // 1. Supervisor (Required for ALL)
      if (!validateField(400, 'Supervisor Name', 4400)) return;

      // 2. Emergency Response (ALL permit types now require First Aider & AED)
      if (isGeneral || isHotWork || isElectrical || isHeight || isConfinedSpace) {
        if (!validateField(501, 'First Aider Name', 4501)) return;
        if (!validateField(502, 'AED Certified Person Name', 4502)) return;
      }

      // 3. Fire Safety (Hot Work OR Electrical) 
      // Note: User requirement says Fire Fighter is required for BOTH Hot Work and Electrical
      if (isHotWork || isElectrical) {
        if (!validateField(504, 'Fire Fighter Name', 4504)) return;
      }

      // 4. Hot Work Specific
      if (isHotWork) {
        if (!validateField(500, 'Fire Watcher Name', 4500)) return;
        // Fire Fighter Availability Checkbox (503)
        // If we treat 503 as "Are they available?", we might want to check it.
        // PersonnelFields sets it to 'Yes'/'No'.
        // If checking 'Yes' is mandatory:
        // if (formData.checklistTextResponses[503] !== 'Yes') {
        //   alert('Fire Fighter Available on Site must be checked for Hot Work');
        //   return;
        // }
      }

      // 5. Confined Space Specific
      if (isConfinedSpace) {
        if (!validateField(398, 'Entrant Name', 4398)) return;
        if (!validateField(399, 'Attendant Name', 4399)) return;
        if (!validateField(401, 'Stand-by Person Name', 4401)) return;
      }


      for (const q of activeQuestions) {
        if (q.response_type === 'text') {
          // Generic text input
          if (!formData.checklistTextResponses[q.id] || formData.checklistTextResponses[q.id].trim() === '') {
            alert(`Please answer: ${q.question_text}`);
            return;
          }
        } else {
          // Yes/No/NA Responses
          const response = formData.checklistResponses[q.id];
          if (!response) {
            alert(`Please answer: ${q.question_text}`);
            return;
          }
          // Remarks validation for 'No'
          if (response === 'No' && (!formData.checklistRemarks[q.id] || !formData.checklistRemarks[q.id].trim())) {
            alert(`Please provide remarks for "No" answer: ${q.question_text}`);
            return;
          }
        }
      }
    }

    // Step 6: Approvers Validation
    if (currentStep === 6) {
      if (!formData.area_manager_id) {
        alert('Please select Area Manager');
        return;
      }
      if (requiresSiteLeaderApproval && !formData.site_leader_id) {
        alert('Site Leader approval is required for High-Risk permits');
        return;
      }
    }

    if (currentStep < totalSteps) {
      console.log('✅ Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('⚠️ Already at last step:', currentStep);
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
    // ✅ ADD THESE VALIDATION CHECKS:
    if (formData.categories.length === 0) {
      alert('Please select at least one permit category');
      return;
    }

    if (!formData.site_id || formData.site_id === 0) {
      alert('Please select a site');
      return;
    }
    // Validate permit types
    if (!formData.categories || formData.categories.length === 0) {
      alert('⚠️ Please select at least one permit type');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      let swmsUrl = '';
      if (formData.swmsFile) {
        try {
          const uploadRes = await uploadAPI.uploadSWMS(formData.swmsFile);
          if (uploadRes.success && uploadRes.data) {
            swmsUrl = uploadRes.data.url;
          }
        } catch (uploadError) {
          console.warn('SWMS upload failed, continuing without file:', uploadError);
        }
      }

      const teamMembers = [
        ...formData.selectedWorkers.map((workerId: number) => {
          const worker = workers.find((w: { id: number }) => w.id === workerId);
          return {
            worker_name: worker?.full_name || '',
            worker_role: 'Worker' as WorkerRole,
            badge_id: worker?.login_id || '',
            contact_number: worker?.phone || '',
          };
        }),
        ...newWorkers.map(worker => ({
          worker_name: worker.name.trim(),
          worker_role: worker.role,
          company_name: worker.companyName,
          contact_number: worker.phone, // Map phone to contact_number for backend
          email: worker.email,
        })),
      ];

      const checklistResponses = Object.entries(formData.checklistResponses)
        .map(([questionId, response]) => ({
          question_id: parseInt(questionId),
          response: response as ChecklistResponse,
          remarks: formData.checklistRemarks[parseInt(questionId)] || undefined,
        }));

      Object.entries(formData.checklistTextResponses).forEach(([questionId, textValue]) => {
        const qId = parseInt(questionId);

        if (textValue) {
          checklistResponses.push({
            question_id: qId,
            response: 'Yes' as ChecklistResponse,
            remarks: textValue,
          });
        }
      });

      const permitData = {
        site_id: formData.site_id,
        permit_type: formData.categories[0], // ✅ Required by backend
        permit_types: formData.categories,
        work_location: formData.location || 'Location not specified',  // ✅ Better default
        work_description: formData.workDescription || 'Description not provided',  // ✅ Better default
        start_time: formData.startDate && formData.startTime
          ? `${formData.startDate}T${formData.startTime}:00`
          : new Date().toISOString(),
        end_time: formData.endDate && formData.endTime
          ? `${formData.endDate}T${formData.endTime}:00`
          : new Date(Date.now() + 86400000).toISOString(),
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
        area_manager_id: formData.area_manager_id || null,
        safety_officer_id: formData.safety_officer_id || null,
        site_leader_id: formData.site_leader_id || null,
        issuer_signature: formData.issuerSignature || null,
      };

      console.log('📤 Submitting permit data:', permitData);

      const response = await permitsAPI.create(permitData);
      console.log('📥 API Response:', response);

      if (response.success) {
        // ✅ Upload Evidence if available
        if (response.data && response.data.id && formData.evidences.length > 0) {
          try {
            console.log('📸 Uploading evidences for permit:', response.data.id);
            console.log('📸 Uploading evidences for permit:', response.data.id);
            // Map evidence to match API expectation (remove string ID)
            const apiEvidences = formData.evidences.map(e => ({
              ...e,
              id: undefined // Backend expects number or undefined, not string
            })) as any[];

            await evidenceAPI.upload(response.data.id, apiEvidences);
            console.log('✅ Evidences uploaded successfully');
          } catch (evidenceError) {
            console.error('❌ Failed to upload evidences:', evidenceError);
            alert('Permit created, but failed to upload some evidence images. You can add them later.');
          }
        }

        // ✅ Upload Worker Training Evidence if available
        if (response.data && response.data.id) {
          console.log('📋 Checking for worker training evidence...');
          console.log('📋 New workers count:', newWorkers.length);

          try {
            const permitId = response.data.id;

            // Fetch permit details to get team member IDs
            const permitResponse = await permitsAPI.getById(permitId);

            if (permitResponse.success && permitResponse.data) {
              const teamMembers = permitResponse.data.team_members || [];
              console.log('📋 Team members from permit:', teamMembers.length);
              console.log('📋 Available Team Members:', teamMembers.map((tm: any) => tm.worker_name));

              // Upload training evidence for each new worker
              for (let i = 0; i < newWorkers.length; i++) {
                const worker = newWorkers[i];
                console.log(`📋 Processing Worker ${i + 1}:`, worker.name);

                if (worker.trainingEvidences && worker.trainingEvidences.length > 0) {
                  console.log(`📸 Uploading ${worker.trainingEvidences.length} training evidence(s) for ${worker.name}`);

                  // ROBUST MATCHING: Normalize strings for comparison
                  const normalize = (str: string) => str ? str.trim().toLowerCase() : '';
                  const workerNameNormalized = normalize(worker.name);

                  // Find the team member by normalized name
                  const teamMember = teamMembers.find((tm: any) =>
                    normalize(tm.worker_name) === workerNameNormalized
                  );

                  if (teamMember) {
                    console.log(`✅ Found team member ID: ${teamMember.id} for ${worker.name}`);
                    const trainingFiles = worker.trainingEvidences.map(e => e.file);

                    // Import the API at the top of the file or use existing import
                    const { workerTrainingEvidenceAPI } = await import('../../services/workerTrainingEvidenceAPI');

                    console.log(`📤 Uploading ${trainingFiles.length} files...`);
                    await workerTrainingEvidenceAPI.upload(
                      teamMember.id,
                      permitId,
                      trainingFiles
                    );

                    console.log(`✅ Training evidence uploaded for ${worker.name}`);
                  } else {
                    console.warn(`⚠️ Team member not found for ${worker.name}. Available names:`, teamMembers.map((t: any) => t.worker_name));
                  }
                }
              }
            } else {
              console.error('❌ Failed to fetch permit details for evidence upload');
            }
          } catch (trainingError) {
            console.error('❌ Failed to upload training evidence:', trainingError);
            console.warn('Some training evidence could not be uploaded');
          }
        }

        alert('✅ PTW Created Successfully! Redirecting to dashboard...');
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      } else {
        alert(response.message || 'Failed to create PTW');
      }
    } catch (error: any) {
      console.error('❌ Error creating PTW:', error);
      alert(error.response?.data?.message || 'Failed to create PTW. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };




  const handleSignatureSave = (signature: string) => {
    console.log('💾 Saving signature:', signature ? 'Signature captured' : 'No signature');

    setFormData(prev => {
      const updated = { ...prev, issuerSignature: signature };
      console.log('✅ Issuer signature saved');
      return updated;
    });
    setShowSignature(false);
  };

  const addNewWorker = () => {
    setNewWorkers([...newWorkers, {
      name: '',
      phone: '',
      email: '',
      companyName: '',
      role: 'Worker' as WorkerRole,
      trainingEvidences: []  // ⭐ ADD THIS LINE
    }]);
  };

  const removeNewWorker = (index: number) => {
    // ⭐ Clean up any object URLs to prevent memory leaks
    const worker = newWorkers[index];
    if (worker && worker.trainingEvidences) {
      worker.trainingEvidences.forEach((evidence) => {
        URL.revokeObjectURL(evidence.preview);
      });
    }
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
    value?: ChecklistResponse;
    onChange: (value: ChecklistResponse) => void;
    isTextInput?: boolean;
    textValue?: string;
    onTextChange?: (value: string) => void;
  }
  //  Training Evidence Interface
  interface TrainingEvidence {
    id: string;
    file: File;
    preview: string;
    caption?: string;
  }

  // ALTERNATIVE FIX: Uncontrolled input with ref (no re-render issues)
  const RequirementRow = memo(({
    questionId,
    label,
    value,
    onChange,
    isTextInput,
    textValue,
    onTextChange
  }: RequirementRowProps) => {

    // Local state prevents focus loss during typing
    const [localValue, setLocalValue] = useState(textValue || '');
    // Sync with parent when parent value changes
    useEffect(() => {
      if (textValue !== undefined) {
        setLocalValue(textValue);
      }
    }, [textValue]);

    // Handle input change - update local state and notify parent
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (onTextChange) {
        onTextChange(newValue);
      }
    }, [onTextChange]);

    // Text input field (for names)
    if (isTextInput) {
      return (
        <div className="py-4 space-y-2 border-b border-slate-200">
          <Label
            htmlFor={`text-${questionId}`}
            className="text-sm font-medium text-slate-900"
          >
            {label} <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`text-${questionId}`}
            type="text"
            value={localValue}
            onChange={handleChange}
            placeholder="Enter full name..."
            required
            className="w-full max-w-lg text-base"
            autoComplete="off"
          />
          {localValue && localValue.length < 2 && (
            <p className="text-xs text-amber-600">
              Please enter a valid full name (at least 2 characters)
            </p>
          )}
        </div>
      );
    }

    // Yes/No/N/A buttons (for regular questions)
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100">
        <span className="text-sm text-slate-700">{label}</span>
        <div className="flex gap-2">
          {(['Yes', 'No', 'N/A'] as ChecklistResponse[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${value === option
                ? option === 'Yes'
                  ? 'bg-green-500 text-white'
                  : option === 'No'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-500 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
    RequirementRow.displayName = 'RequirementRow';
  });

  const getCategoryBadgeColor = (category: PermitType) => {
    const colors: Record<PermitType, string> = {
      'General': 'bg-orange-100 text-orange-800 border-orange-300',
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
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-orange-600 rounded-full animate-spin"></div>
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

        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>

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

            {/* Multiple Category Selection */}
            <div>
              <Label>Permit Categories * (Select all that apply)</Label>
              <p className="mb-3 text-sm text-slate-500">You can select multiple permit types for this work</p>

              <div className="grid gap-3 md:grid-cols-2">
                {(['General', 'Height', 'Electrical', 'Hot_Work', 'Confined_Space'] as PermitType[]).map((category: PermitType) => {
                  const isHighRisk = highRiskPermits.includes(category);
                  return (
                    <label
                      key={category}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.categories.includes(category)
                        ? isHighRisk
                          ? 'border-red-500 bg-red-50'
                          : 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
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
                  {formData.categories.map((cat: PermitType) => (
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
                <div className="flex items-start gap-3 p-4 mt-3 border-2 border-red-200 rounded-lg bg-red-50">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">⚠️ Site Leader Approval Required</p>
                    <p className="text-sm text-red-700">
                      You've selected {selectedHighRiskCount} high-risk permit types. This requires approval from a Site Leader in addition to Area Manager and Safety Officer.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Site Selection - UPDATED WITH AUTO-PREFILL */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="site">
                  Site *
                  {/* Show indicator for single site auto-selection */}
                  {sites.length === 1 && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✓ Auto-selected (only 1 site assigned)
                    </span>
                  )}
                </Label>

                {/* Conditional rendering based on number of sites */}
                {sites.length === 0 ? (
                  // NO SITES ASSIGNED
                  <div className="p-4 border-2 border-amber-300 rounded-lg bg-amber-50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">No Sites Assigned</p>
                        <p className="mt-1 text-sm text-amber-800">
                          You don't have any sites assigned to your account.
                          Please contact your administrator to assign sites before creating a PTW.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : sites.length === 1 ? (
                  // SINGLE SITE - SHOW AS PRE-SELECTED
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border-2 border-green-500 rounded-lg bg-green-50">
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">{sites[0].name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-green-700">
                          {sites[0].site_code && (
                            <span>Code: {sites[0].site_code}</span>
                          )}
                          {sites[0].location && (
                            <span>• {sites[0].location}</span>
                          )}
                        </div>
                      </div>
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                    </div>
                    <p className="flex items-center gap-1 text-xs text-slate-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      This is your assigned site. To work on other sites, contact your administrator.
                    </p>
                  </div>
                ) : (
                  // MULTIPLE SITES - SHOW DROPDOWN
                  <>
                    <Select
                      value={formData.site_id.toString()}
                      onValueChange={(value) => {
                        const siteId = parseInt(value);
                        console.log('📍 Site selected - ID:', siteId);
                        const selectedSite = sites.find(s => s.id === siteId);
                        console.log('📍 Selected site:', selectedSite);
                        setFormData({ ...formData, site_id: siteId });
                        loadSiteApprovers(siteId);
                      }}
                    >
                      <SelectTrigger id="site">
                        <SelectValue placeholder="Select site from your assigned sites" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{site.name}</span>
                              {(site.site_code || site.location) && (
                                <span className="text-xs text-slate-500">
                                  {site.site_code && `Code: ${site.site_code}`}
                                  {site.site_code && site.location && ' • '}
                                  {site.location}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <Check className="w-3 h-3" />
                      {sites.length} sites assigned to you - Select one to proceed
                    </p>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="location">Work Location / Area</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A, Floor 3, Room 205"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Specify the exact location within the site where work will be performed
                </p>
              </div>
            </div>

            {/* FIXED: Issue Department - Now Dropdown */}
            <div>
              <Label htmlFor="issueDepartment">Issue Department *</Label>
              <Select
                value={formData.issueDepartment}
                onValueChange={(value) => setFormData({ ...formData, issueDepartment: value })}
              >
                <SelectTrigger id="issueDepartment">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHS">WHS</SelectItem>
                  <SelectItem value="SLP">SLP</SelectItem>
                  <SelectItem value="RME">RME</SelectItem>
                  <SelectItem value="Ops Tech IT">Ops Tech IT</SelectItem>
                  <SelectItem value="Operation">Operation</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Select the department that is issuing this permit
              </p>
            </div>

            {/* Work Description */}
            <div>
              <Label htmlFor="workDescription">Work Description</Label>
              <Textarea
                id="workDescription"
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                placeholder="Describe the work to be performed..."
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
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    // Reset end date if it becomes invalid
                    if (formData.endDate && newStartDate > formData.endDate) {
                      setFormData(prev => ({ ...prev, startDate: newStartDate, endDate: '' }));
                    } else {
                      setFormData({ ...formData, startDate: newStartDate });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  // Prevent past time if start date is today
                  min={formData.startDate === new Date().toISOString().split('T')[0]
                    ? new Date().toTimeString().slice(0, 5)
                    : undefined}
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
                  min={formData.startDate || new Date().toISOString().split('T')[0]} // End date cannot be before start date
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  // If dates are same, end time must be after start time
                  min={formData.startDate === formData.endDate ? formData.startTime : undefined}
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* Issuer Signature */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Issuer Signature *</h3>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowSignature(true)}
                  variant="outline"
                  type="button"
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

        {/* STEP 2: Issued To & Workers */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Issued To & Workers Assignment</h2>

            <div className="p-6 space-y-4 border-2 border-orange-200 rounded-lg bg-orange-50">
              <h3 className="flex items-center gap-2 font-medium text-slate-900">
                <FileText className="w-5 h-5 text-orange-600" />
                Issued To (Permit Recipient)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="issuedToName">Vendor Name *</Label>
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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Workers Assignment</h3>
              <p className="text-slate-600">Select the workers who will be performing this work</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={workerSelectionMode === 'existing'}
                    onCheckedChange={(checked) => setWorkerSelectionMode(checked ? 'existing' : 'new')}
                  />
                  <p className="text-sm font-medium text-slate-700">Existing Workers</p>
                </div>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={workerSelectionMode === 'new'}
                    onCheckedChange={(checked) => setWorkerSelectionMode(checked ? 'new' : 'existing')}
                  />
                  <p className="text-sm font-medium text-slate-700">Add New Workers</p>
                </div>
              </div>

              {workerSelectionMode === 'existing' && (
                <div className="p-4 overflow-y-auto border rounded-lg border-slate-200 max-h-96">
                  <div className="space-y-2">
                    {workers.length > 0 ? (
                      workers.map((worker) => (
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
                                  selectedWorkers: prev.selectedWorkers.filter((id: number) => id !== worker.id)
                                }));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{worker.full_name}</p>
                            <p className="text-xs text-slate-500">{worker.email}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-center text-slate-500">No workers available. Please add new workers below.</p>
                    )}
                  </div>
                </div>
              )}

              {workerSelectionMode === 'new' && (
                <div className="space-y-4">
                  <Button onClick={addNewWorker} variant="outline" className="gap-2" type="button">
                    <FileText className="w-4 h-4" />
                    Add New Worker
                  </Button>

                  {/* Display Added Workers with Input Fields + Training Evidence */}
                  {newWorkers.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">
                        Added Workers ({newWorkers.length})
                      </h4>

                      {newWorkers.map((worker, index) => (
                        <div
                          key={index}
                          className="p-6 border-2 rounded-lg border-slate-200 bg-slate-50 space-y-4"
                        >
                          {/* Worker Info Header with Delete Button */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-slate-900">
                                {worker.name || `New Worker ${index + 1}`}
                              </h5>
                              <p className="text-sm text-slate-600">{worker.role}</p>
                            </div>
                            <Button
                              onClick={() => removeNewWorker(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* ✅ WORKER INPUT FIELDS - THIS WAS MISSING */}
                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Name Input */}
                            <div>
                              <Label>Worker Name *</Label>
                              <Input
                                value={worker.name}
                                onChange={(e) => updateNewWorker(index, 'name', e.target.value)}
                                placeholder="Full name"
                                className="bg-white"
                              />
                            </div>

                            {/* Role Select */}
                            <div>
                              <Label>Role *</Label>
                              <Select
                                value={worker.role}
                                onValueChange={(value) => updateNewWorker(index, 'role', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Technician">Technician</SelectItem>
                                  <SelectItem value="Contract_Worker">Contract Worker</SelectItem>
                                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                                  <SelectItem value="Engineer">Engineer</SelectItem>
                                  <SelectItem value="Worker">Worker</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Company Name Input */}
                            <div>
                              <Label>Company Name *</Label>
                              <Input
                                value={worker.companyName}
                                onChange={(e) => updateNewWorker(index, 'companyName', e.target.value)}
                                placeholder="Company name"
                                className="bg-white"
                              />
                            </div>

                            {/* Phone Input */}
                            <div>
                              <Label>Phone Number *</Label>
                              <Input
                                value={worker.phone}
                                onChange={(e) => updateNewWorker(index, 'phone', e.target.value)}
                                placeholder="+91 XXXXXXXXXX"
                                className="bg-white"
                              />
                            </div>

                            {/* Email Input - Full Width */}
                            <div className="md:col-span-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={worker.email}
                                onChange={(e) => updateNewWorker(index, 'email', e.target.value)}
                                placeholder="email@example.com"
                                className="bg-white"
                              />
                            </div>
                          </div>

                          {/* ⭐ TRAINING EVIDENCE UPLOAD SECTION */}
                          <div className="mt-4 p-4 border-2 border-dashed rounded-lg border-green-300 bg-green-50">
                            {/* Header with Upload Button */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-green-600" />
                                <h6 className="font-medium text-slate-900">
                                  Training Evidence / Certificate
                                </h6>
                              </div>
                              <Button
                                onClick={() => {
                                  setCurrentWorkerIndex(index);
                                  setCaptureType('worker');
                                  setShowCameraModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                              >
                                <Camera className="w-4 h-4" />
                                Take Photo
                              </Button>
                            </div>

                            {/* Evidence Count / Status */}
                            {worker.trainingEvidences && worker.trainingEvidences.length > 0 ? (
                              <p className="text-sm text-green-700 mb-3">
                                {worker.trainingEvidences.length} image(s) uploaded
                              </p>
                            ) : (
                              <p className="text-sm text-slate-600 mb-3">
                                No training evidence uploaded yet. Upload training certificates or photos.
                              </p>
                            )}

                            {/* Evidence Thumbnails Grid */}
                            {worker.trainingEvidences && worker.trainingEvidences.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-3">
                                {worker.trainingEvidences.map((evidence) => (
                                  <div
                                    key={evidence.id}
                                    className="relative group bg-white border-2 border-slate-200 rounded-lg overflow-hidden"
                                  >
                                    {/* Image Preview */}
                                    <div className="relative aspect-square">
                                      <img
                                        src={evidence.preview}
                                        alt="Training evidence"
                                        className="w-full h-full object-cover"
                                      />
                                      {/* Delete Button Overlay */}
                                      <button
                                        onClick={() => handleRemoveTrainingEvidence(index, evidence.id)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                        type="button"
                                      >
                                        <X className="w-4 h-4 text-white" />
                                      </button>
                                    </div>

                                    {/* Caption Input */}
                                    <div className="p-2">
                                      <Input
                                        value={evidence.caption || ''}
                                        onChange={(e) =>
                                          handleUpdateEvidenceCaption(index, evidence.id, e.target.value)
                                        }
                                        placeholder="Add caption..."
                                        className="text-xs"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Upload Instructions */}
                            <div className="flex items-start gap-2 p-3 bg-green-100 rounded">
                              <ImageIcon className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                              <div className="text-xs text-green-800">
                                <p className="font-medium">Upload Guidelines:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                  <li>Use camera to capture clear photos</li>
                                  <li>Ensure good lighting and focus</li>
                                  <li>Capture training certificates, safety induction proof, or ID cards</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Hazards - Side by Side Layout */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Hazard Identification & Control Measures
            </h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* LEFT: Hazard Identification */}
              <div className="p-6 border-2 border-orange-200 rounded-xl bg-orange-50">
                <h3 className="mb-4 text-lg font-semibold text-orange-900">
                  Identified Hazards *
                </h3>
                <p className="mb-4 text-sm text-orange-700">
                  Select all hazards that apply to this work
                </p>

                <div className="space-y-3">
                  {[
                    'Fall from height',
                    'Electrical shock',
                    'Fire hazard',
                    'Toxic gases',
                    'Slips and trips',
                    'Moving machinery',
                    'Hot surfaces',
                    'Confined space',
                  ].map((hazard, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.selectedHazards.includes(index + 1)
                        ? 'border-orange-500 bg-white shadow-md'
                        : 'border-orange-200 hover:border-orange-300 bg-white'
                        }`}
                    >
                      <Checkbox
                        checked={formData.selectedHazards.includes(index + 1)}
                        onCheckedChange={() => {
                          const hazardId = index + 1;
                          setFormData((prev) => ({
                            ...prev,
                            selectedHazards: prev.selectedHazards.includes(hazardId)
                              ? prev.selectedHazards.filter((id) => id !== hazardId)
                              : [...prev.selectedHazards, hazardId],
                          }));
                        }}
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {hazard}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Selected Hazards Summary */}
                {formData.selectedHazards.length > 0 && (
                  <div className="p-3 mt-4 border-2 border-orange-300 rounded-lg bg-orange-100">
                    <p className="mb-2 text-sm font-semibold text-orange-900">
                      Selected: {formData.selectedHazards.length} hazard(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedHazards.map((id) => {
                        const hazardNames = [
                          'Fall from height',
                          'Electrical shock',
                          'Fire hazard',
                          'Toxic gases',
                          'Slips and trips',
                          'Moving machinery',
                          'Hot surfaces',
                          'Confined space',
                        ];
                        return (
                          <span
                            key={id}
                            className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-200 rounded-full"
                          >
                            {hazardNames[id - 1]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other Hazards */}
                <div className="mt-4">
                  <Label htmlFor="otherHazards" className="text-orange-900">
                    Other Hazards
                  </Label>
                  <Textarea
                    id="otherHazards"
                    value={formData.otherHazards}
                    onChange={(e) =>
                      setFormData({ ...formData, otherHazards: e.target.value })
                    }
                    placeholder="Describe any other hazards..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* RIGHT: Control Measures */}
              <div className="p-6 border-2 border-blue-200 rounded-xl bg-blue-50">
                <h3 className="mb-4 text-lg font-semibold text-blue-900">
                  Control Measures *
                </h3>
                <p className="mb-4 text-sm text-blue-700">
                  Describe measures to mitigate identified hazards
                </p>

                <Textarea
                  id="controlMeasures"
                  value={formData.controlMeasures}
                  onChange={(e) =>
                    setFormData({ ...formData, controlMeasures: e.target.value })
                  }
                  placeholder="Examples:
• Use fall protection equipment
• Implement lockout/tagout procedures
• Ensure proper ventilation
• Use appropriate PPE
• Establish safety barriers
• Conduct safety briefings"
                  rows={20}
                  className="font-mono text-sm"
                />

                <div className="p-3 mt-4 border-2 border-blue-300 rounded-lg bg-blue-100">
                  <p className="text-sm font-semibold text-blue-900">
                    💡 Safety Note:
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    List all safety measures, procedures, and precautions required
                    for this work. Be specific and comprehensive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PPE & SWMS with Evidence Upload */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              PPE Requirements & SWMS Upload
            </h2>

            {/* PPE Selection */}
            <div>
              <Label>Required Personal Protective Equipment (PPE) *</Label>
              <p className="mb-4 text-sm text-slate-500">
                Select all required PPE for this work
              </p>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  'Safety Helmet',
                  'Safety Vest',
                  'Safety Gloves',
                  'Safety Boots',
                  'Safety Goggles',
                  'Face Mask',
                  'Ear Protection',
                  'Safety Harness',
                ].map((ppeName, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const mockId = index + 1;
                      setFormData((prev) => ({
                        ...prev,
                        selectedPPE: prev.selectedPPE.includes(mockId)
                          ? prev.selectedPPE.filter((id: number) => id !== mockId)
                          : [...prev.selectedPPE, mockId],
                      }));
                    }}
                    className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all hover:shadow-lg ${formData.selectedPPE.includes(index + 1)
                      ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                      : 'border-slate-200 hover:border-orange-300 bg-white'
                      }`}
                  >
                    <div className="text-4xl">
                      {index === 0 && '⛑️'}
                      {index === 1 && '🦺'}
                      {index === 2 && '🧤'}
                      {index === 3 && '👢'}
                      {index === 4 && '🥽'}
                      {index === 5 && '😷'}
                      {index === 6 && '🎧'}
                      {index === 7 && '🪢'}
                    </div>
                    <span
                      className={`text-sm font-semibold text-center ${formData.selectedPPE.includes(index + 1)
                        ? 'text-orange-900'
                        : 'text-slate-700'
                        }`}
                    >
                      {ppeName}
                    </span>
                    {formData.selectedPPE.includes(index + 1) && (
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-600 rounded-full">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Upload Section */}
            <div className="p-6 border-2 border-purple-200 rounded-xl bg-purple-50">
              <h3 className="mb-4 text-lg font-semibold text-purple-900">
                📸 Upload Evidence (PPE, Barricading, Tool Condition)
              </h3>
              <p className="mb-4 text-sm text-purple-700">
                Add photos with automatic timestamp and location tracking
              </p>

              {/* Upload Button - Camera Only */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <Button
                  type="button"
                  onClick={() => {
                    setCaptureType('evidence');
                    setShowCameraModal(true);
                  }}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </Button>
                <p className="text-xs text-center text-purple-600">
                  📱 On mobile: Opens camera directly<br />
                  💻 On desktop: Opens file picker
                </p>
              </div>

              {/* Camera input - FIXED: Not hidden completely, just visually hidden */}
              {/* Camera inputs removed - using CameraModal */}

              {/* Evidence Gallery */}
              {formData.evidences.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-900">
                    Uploaded Evidence ({formData.evidences.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {formData.evidences.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="relative p-3 bg-white border-2 border-purple-200 rounded-lg shadow-sm group"
                      >
                        {/* Image Preview */}
                        <div className="relative mb-2 overflow-hidden rounded-lg aspect-video">
                          <img
                            src={evidence.preview}
                            alt="Evidence"
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeEvidence(evidence.id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full 
                         opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(evidence.timestamp).toLocaleString()}</span>
                          </div>
                          {evidence.latitude && evidence.longitude && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {evidence.latitude.toFixed(6)}, {evidence.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Category Selector */}
                        <select
                          value={evidence.category}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              evidences: prev.evidences.map((ev) =>
                                ev.id === evidence.id
                                  ? {
                                    ...ev,
                                    category: e.target.value as Evidence['category'],
                                  }
                                  : ev
                              ),
                            }));
                          }}
                          className="w-full px-2 py-1 mt-2 text-xs border rounded border-slate-300"
                        >
                          <option value="ppe">PPE</option>
                          <option value="barricading">Barricading</option>
                          <option value="tool_condition">Tool Condition</option>
                          <option value="other">Other</option>
                        </select>

                        {/* Description Input */}
                        <Input
                          placeholder="Add description..."
                          value={evidence.description}
                          onChange={(e) =>
                            updateEvidenceDescription(evidence.id, e.target.value)
                          }
                          className="mt-2 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.evidences.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed rounded-lg border-purple-300 bg-purple-50">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                  <p className="text-sm text-purple-600">
                    No evidence uploaded yet. Click "Take Photo" above to capture images.
                  </p>
                </div>
              )}
            </div>

            {/* SWMS Upload */}
            <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="mb-4 text-lg font-medium text-blue-900">
                Safe Work Method Statement (SWMS)
              </h3>

              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, swmsMode: 'file' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${formData.swmsMode === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 border border-blue-300'
                    }`}
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, swmsMode: 'text' })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${formData.swmsMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 border border-blue-300'
                    }`}
                >
                  Enter Text
                </button>
              </div>

              {formData.swmsMode === 'file' ? (
                <div>
                  <Label htmlFor="swmsFile">Upload SWMS Document</Label>
                  <Input
                    id="swmsFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        swmsFile: e.target.files?.[0] || null,
                      })
                    }
                    className="mt-2"
                  />
                  {formData.swmsFile && (
                    <p className="mt-2 text-sm text-blue-700">
                      ✓ {formData.swmsFile.name}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="swmsText">SWMS Text</Label>
                  <Textarea
                    id="swmsText"
                    value={formData.swmsText}
                    onChange={(e) =>
                      setFormData({ ...formData, swmsText: e.target.value })
                    }
                    placeholder="Enter Safe Work Method Statement..."
                    rows={8}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}




        {/* STEP 5: Work Requirements Checklist - COMPLETE VERSION */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Work Requirements Checklist</h2>
            <p className="text-sm text-slate-600">
              Complete the following safety requirements checklist for selected permit types
            </p>

            {/* Show selected categories badge */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Selected Permit Categories:</p>
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((cat: PermitType) => (
                  <span
                    key={cat}
                    className={`px-3 py-1 text-sm font-semibold rounded-lg border ${getCategoryBadgeColor(cat)}`}
                  >
                    {cat.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Check if categories are selected */}
            {formData.categories.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-600 font-medium">No permit categories selected</p>
                <p className="text-sm text-slate-500 mt-1">Please go back to Step 1 and select at least one category.</p>
              </div>
            ) : (
              <>
                {/* CATEGORY-SPECIFIC QUESTIONS */}
                <div className="p-6 border rounded-lg border-slate-200">
                  <div className="space-y-6">
                    {/* FILTER: Show ONLY questions for selected categories */}
                    {formData.categories.map((category: PermitType) => {

                      const categoryQuestions = checklistQuestions.filter(
                        q => q.permit_type === category
                      );

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
                              const isTextInput = question.response_type === 'text';

                              return (
                                <div key={question.id}>
                                  {isTextInput ? (
                                    // TEXT INPUT for other text fields (if any)
                                    <div className="py-4 border-b border-slate-100">
                                      <Label
                                        htmlFor={`text-${question.id}`}
                                        className="block mb-2 text-sm font-medium text-slate-900"
                                      >
                                        {question.question_text}
                                        <span className="ml-1 text-red-500 font-bold">*</span>
                                        <span className="ml-2 text-xs text-slate-500 font-normal">(Required)</span>
                                      </Label>
                                      <Input
                                        id={`text-${question.id}`}
                                        type="text"
                                        value={formData.checklistTextResponses[question.id] || ''}
                                        onChange={(e) => {
                                          const newValue = e.target.value;
                                          setFormData(prev => ({
                                            ...prev,
                                            checklistTextResponses: {
                                              ...prev.checklistTextResponses,
                                              [question.id]: newValue
                                            }
                                          }));
                                        }}
                                        placeholder="Enter your response here..."
                                        required
                                        className="max-w-md"
                                        autoComplete="off"
                                      />
                                    </div>
                                  ) : (
                                    // YES/NO/NA BUTTONS
                                    <>
                                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                        <span className="text-sm text-slate-700">
                                          {question.question_text}
                                          {question.is_mandatory && <span className="ml-1 text-red-500">*</span>}
                                        </span>
                                        <div className="flex gap-2">
                                          {(['Yes', 'No', 'N/A'] as ChecklistResponse[]).map((option) => (
                                            <button
                                              key={option}
                                              type="button"
                                              onClick={() => {
                                                setFormData(prev => ({
                                                  ...prev,
                                                  checklistResponses: {
                                                    ...prev.checklistResponses,
                                                    [question.id]: option
                                                  }
                                                }));
                                              }}
                                              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${formData.checklistResponses[question.id] === option
                                                ? option === 'Yes'
                                                  ? 'bg-green-500 text-white'
                                                  : option === 'No'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-slate-500 text-white'
                                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                              {option}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Remarks field appears when "No" is selected */}
                                      {formData.checklistResponses[question.id] === 'No' && (
                                        <div className="mt-2 mb-4 ml-4">
                                          <Label className="text-sm font-medium text-slate-700 mb-1 block">
                                            Remarks (Required for "No" response)
                                            <span className="ml-1 text-red-500">*</span>
                                          </Label>
                                          <Input
                                            placeholder="Please provide detailed remarks explaining why the answer is No..."
                                            value={formData.checklistRemarks[question.id] || ''}
                                            onChange={(e) => {
                                              setFormData(prev => ({
                                                ...prev,
                                                checklistRemarks: {
                                                  ...prev.checklistRemarks,
                                                  [question.id]: e.target.value
                                                }
                                              }));
                                            }}
                                            className="bg-red-50 border-red-300"
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-slate-500 italic">
                              No additional checklist questions for this category.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* DYNAMIC PERSONNEL FIELDS BASED ON PERMIT TYPE */}
                <PersonnelFields
                  selectedCategories={formData.categories}
                  formData={formData}
                  setFormData={setFormData}
                />
              </>
            )}
          </div>
        )
        }

        {/* STEP 6: Approvers */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Select Approvers</h2>

            {/* ⭐ HIGH-RISK WARNING */}
            {requiresSiteLeaderApproval && (
              <div className="flex items-start gap-3 p-4 border-2 border-red-200 rounded-lg bg-red-50">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">High-Risk Permit - Site Leader Required</p>
                  <p className="text-sm text-red-700">
                    This permit requires approval from all three approvers due to {selectedHighRiskCount} high-risk work types.
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600"></p>
            <h2 className="text-xl font-semibold text-slate-900">Select Approvers</h2>

            {/* ⭐ ADD THIS MESSAGE */}
            <p className="text-sm text-slate-600">
              {formData.area_manager_id || formData.safety_officer_id || formData.site_leader_id ? (
                <span className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  Approvers have been pre-selected based on site configuration. You can change them if needed.
                </span>
              ) : (
                'Please select at least one approver for this permit'
              )}
            </p>

            <div className="space-y-4">
              {/* Area Manager - REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Area Manager <span className="text-red-500">*</span>
                  {/* ⭐ ADD THIS INDICATOR */}
                  {formData.area_manager_id && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✓ Pre-selected
                    </span>
                  )}
                </label>
                <select
                  value={formData.area_manager_id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    area_manager_id: parseInt(e.target.value) || ''
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Area Manager --</option>
                  {areaManagers.map((am) => (
                    <option key={am.id} value={am.id}>
                      {am.full_name} ({am.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Safety Officer - OPTIONAL */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Safety Officer
                  {formData.safety_officer_id && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✓ Pre-selected
                    </span>
                  )}
                </label>
                <select
                  value={formData.safety_officer_id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    safety_officer_id: parseInt(e.target.value) || ''
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Safety Officer --</option>
                  {safetyOfficers.map((so) => (
                    <option key={so.id} value={so.id}>
                      {so.full_name} ({so.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Site Leader - CONDITIONAL REQUIRED/OPTIONAL */}
              <div className={requiresSiteLeaderApproval ? 'p-4 border-2 border-red-200 rounded-lg bg-red-50' : ''}>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Site Leader {requiresSiteLeaderApproval && (
                    <span className="text-red-500">* (Required for High-Risk)</span>
                  )}
                  {formData.site_leader_id && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✓ Pre-selected
                    </span>
                  )}
                </label>
                <select
                  value={formData.site_leader_id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    site_leader_id: parseInt(e.target.value) || ''
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Site Leader --</option>
                  {siteLeaders.map((sl) => (
                    <option key={sl.id} value={sl.id}>
                      {sl.full_name} ({sl.email})
                    </option>
                  ))}
                </select>

                {/* ⭐ HIGH-RISK WARNING */}
                {requiresSiteLeaderApproval && !formData.site_leader_id && (
                  <p className="mt-2 text-xs text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Site Leader approval is mandatory for permits with 2 or more high-risk work types
                  </p>
                )}
              </div>
            </div>

            {/* ⭐ ADD THIS INFO BOX */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Approvers are automatically selected based on the site you chose.
                However, you can change them if needed. At least Area Manager is required to proceed.
              </p>
            </div>
          </div>
        )
        }

        {/* STEP 7: Review - Keep existing code */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Review & Submit</h2>

            <div className="p-6 space-y-4 rounded-lg bg-slate-50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Permit Initiator</p>
                  <p className="font-medium text-slate-900">{formData.permitInitiator || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Permit Categories</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.categories.map((cat: PermitType) => (
                      <span key={cat} className={`px-2 py-1 text-xs font-semibold rounded border ${getCategoryBadgeColor(cat)}`}>
                        {cat.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Site</p>
                  <p className="font-medium text-slate-900">
                    {sites.find(s => s.id === formData.site_id)?.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Issue Department</p>
                  <p className="font-medium text-slate-900">{formData.issueDepartment || 'Not set'}</p>
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
                  <p className="text-sm text-slate-500">Approvers</p>
                  <p className="text-sm font-medium text-slate-700">
                    Area Manager required, others optional
                  </p>
                </div>
              </div>
            </div>
            {/* ====== NEW SECTION: Safety Observation Link & QR Code ====== */}
            <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {/* QR Code Placeholder */}

                  <img
                    src="/QR.png"
                    alt="Safety Observations QR Code"
                    className="w-50 h-40 object-contain"
                    onError={(e) => {
                      // Fallback if image not found
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div class="text-xs text-blue-600 text-center p-2">QR Code</div>';
                      }
                    }}
                  />

                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Safety Observations</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Report safety concerns or observations during work execution
                  </p>
                  <a
                    href="https://atoz.amazon.work/safety_observations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Submit Safety Observation
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-blue-600 mt-2">
                    Scan the QR code or click the link above to access the safety observation system
                  </p>
                </div>
              </div>
            </div>
            {/* ====== END NEW SECTION ====== */}


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

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-slate-200">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 1 || isSubmitting}
            type="button"
          >
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={isSubmitting} type="button">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!formData.declaration || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
              type="button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit PTW'}
            </Button>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <DigitalSignature
          title="Issuer Digital Signature"
          onSave={handleSignatureSave}
          onCancel={() => setShowSignature(false)}
        />
      )}
      {/* ⭐ NEW: Camera Capture Modal */}
      {showCameraModal && (
        <CameraModal
          isOpen={showCameraModal}
          onClose={() => {
            setShowCameraModal(false);
            setCurrentWorkerIndex(null);
          }}
          onCapture={(blob) => {
            if (captureType === 'worker' && currentWorkerIndex !== null) {
              handlePhotoCaptured(currentWorkerIndex, blob);
            } else if (captureType === 'evidence') {
              handleEvidenceCaptured(blob);
            }
          }}
        />
      )}
    </div>
  );
}