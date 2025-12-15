// frontend/src/pages/approver/EditPTW.tsx
// Comprehensive Edit PTW with ALL fields from original CreatePTW form

import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Save, AlertCircle, FileText, MapPin,
    Users, Shield, CheckSquare, X, Upload, PenTool
} from 'lucide-react';
import { permitsAPI, masterDataAPI, sitesAPI, uploadAPI } from '../../services/api';
import SignatureCanvas from 'react-signature-canvas';

type PermitType = 'General' | 'Hot_Work' | 'Electrical' | 'Height' | 'Confined_Space';
type ChecklistResponse = 'Yes' | 'No' | 'NA';

interface EditPTWProps {
    permitId: number;
    onBack: () => void;
    onSave?: () => void;
}

export default function EditPTW({ permitId, onBack, onSave }: EditPTWProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [permit, setPermit] = useState<any>(null);

    // Master Data
    const [sites, setSites] = useState<any[]>([]);
    const [hazards, setHazards] = useState<any[]>([]);
    const [ppe, setPpe] = useState<any[]>([]);

    const [checklistQuestions, setChecklistQuestions] = useState<any[]>([]);

    // Form State - Matching CreatePTW exactly
    const [formData, setFormData] = useState({
        // Permit Categories
        categories: [] as PermitType[],

        // Basic Details
        site_id: 0,
        work_location: '',
        work_description: '',
        start_time: '',
        end_time: '',
        issue_department: '',

        // Permit Initiator
        permit_initiator: '',
        permit_initiator_contact: '',

        // Issued To
        receiver_name: '',
        receiver_contact: '',

        // Hazards & Controls
        selectedHazards: [] as number[],
        control_measures: '',
        other_hazards: '',

        // PPE
        selectedPPE: [] as number[],

        // Team Members
        teamMembers: [] as any[],

        // SWMS
        swms_file_url: '',
        swms_text: '',
        swmsMode: 'file' as 'file' | 'text',
        swmsFile: null as File | null,

        // Checklist
        checklistResponses: {} as Record<number, ChecklistResponse>,
        checklistRemarks: {} as Record<number, string>,
        checklistTextResponses: {} as Record<number, string>,

        // Signatures
        issuer_signature: '',
        area_manager_signature: '',
        safety_officer_signature: '',
        site_leader_signature: '',
    });

    // Signature canvas refs
    const issuerSignatureRef = useRef<SignatureCanvas>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [currentSignatureField, setCurrentSignatureField] = useState<string>('');

    useEffect(() => {
        loadData();
    }, [permitId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load permit details
            const permitRes = await permitsAPI.getById(permitId);
            if (permitRes.success && permitRes.data) {
                const p = permitRes.data as any; // Use any to access extended properties
                setPermit(p);

                // Parse datetime for input fields
                const startDate = new Date(p.start_time);
                const endDate = new Date(p.end_time);

                // Parse permit categories
                const categories: PermitType[] = [];
                if (p.permit_type) categories.push(p.permit_type as PermitType);
                if (p.permit_types) {
                    const types = Array.isArray(p.permit_types) ? p.permit_types : JSON.parse(p.permit_types || '[]');
                    types.forEach((t: string) => {
                        if (!categories.includes(t as PermitType)) {
                            categories.push(t as PermitType);
                        }
                    });
                }

                // Build checklist responses from database
                const checklistResp: Record<number, ChecklistResponse> = {};
                const checklistRem: Record<number, string> = {};
                const checklistText: Record<number, string> = {};

                if (p.checklist_responses && Array.isArray(p.checklist_responses)) {
                    p.checklist_responses.forEach((cr: any) => {
                        checklistResp[cr.question_id] = cr.response;
                        if (cr.remarks) {
                            checklistRem[cr.question_id] = cr.remarks;
                            // If remarks contain text, treat as text response
                            if (cr.remarks.length > 10) {
                                checklistText[cr.question_id] = cr.remarks;
                            }
                        }
                    });
                }

                setFormData({
                    categories,
                    site_id: p.site_id || 0,
                    work_location: p.work_location || '',
                    work_description: p.work_description || '',
                    start_time: startDate.toISOString().slice(0, 16),
                    end_time: endDate.toISOString().slice(0, 16),
                    issue_department: p.issue_department || '',
                    permit_initiator: p.permit_initiator || '',
                    permit_initiator_contact: p.permit_initiator_contact || '',
                    receiver_name: p.receiver_name || '',
                    receiver_contact: p.receiver_contact || '',
                    selectedHazards: p.hazards?.map((h: any) => h.hazard_id) || [],
                    control_measures: p.control_measures || '',
                    other_hazards: p.other_hazards || '',
                    selectedPPE: p.ppe?.map((pp: any) => pp.ppe_id) || [],
                    teamMembers: p.team_members?.map((tm: any) => ({
                        id: tm.id,
                        name: tm.worker_name || tm.name || '',
                        designation: tm.worker_role || tm.designation || '',
                        contact: tm.contact_number || tm.contact || '',
                        worker_id: tm.worker_id || null,
                        company_name: tm.company_name || '',
                        badge_id: tm.badge_id || ''
                    })) || [],
                    swms_file_url: p.swms_file_url || '',
                    swms_text: p.swms_text || '',
                    swmsMode: p.swms_file_url ? 'file' : 'text',
                    swmsFile: null,
                    checklistResponses: checklistResp,
                    checklistRemarks: checklistRem,
                    checklistTextResponses: checklistText,
                    issuer_signature: p.issuer_signature || '',
                    area_manager_signature: p.area_manager_signature || '',
                    safety_officer_signature: p.safety_officer_signature || '',
                    site_leader_signature: p.site_leader_signature || '',
                });
            }

            // Load master data
            const [sitesRes, hazardsRes, ppeRes, checklistRes] = await Promise.all([
                sitesAPI.getAll(),
                masterDataAPI.getHazards(),
                masterDataAPI.getPPE(),
                masterDataAPI.getChecklistQuestions(),
            ]);

            if (sitesRes.success && sitesRes.data) setSites(sitesRes.data);
            if (hazardsRes.success && hazardsRes.data) setHazards(hazardsRes.data);
            if (ppeRes.success && ppeRes.data) setPpe(ppeRes.data);
            if (checklistRes.success && checklistRes.data) setChecklistQuestions(checklistRes.data);

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load permit data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleCategory = (category: PermitType) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
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

    const addTeamMember = () => {
        const newMember = {
            id: Date.now(),
            name: '',
            designation: '',
            contact: '',
            worker_id: null
        };
        setFormData(prev => ({
            ...prev,
            teamMembers: [...prev.teamMembers, newMember]
        }));
    };

    const updateTeamMember = (id: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.map(member =>
                member.id === id ? { ...member, [field]: value } : member
            )
        }));
    };

    const removeTeamMember = (id: number) => {
        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.filter(member => member.id !== id)
        }));
    };

    const handleChecklistResponse = (questionId: number, response: ChecklistResponse) => {
        setFormData(prev => ({
            ...prev,
            checklistResponses: {
                ...prev.checklistResponses,
                [questionId]: response
            }
        }));
    };

    const handleChecklistRemarks = (questionId: number, remarks: string) => {
        setFormData(prev => ({
            ...prev,
            checklistRemarks: {
                ...prev.checklistRemarks,
                [questionId]: remarks
            }
        }));
    };

    const handleChecklistTextResponse = (questionId: number, text: string) => {
        setFormData(prev => ({
            ...prev,
            checklistTextResponses: {
                ...prev.checklistTextResponses,
                [questionId]: text
            }
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, swmsFile: file }));
        }
    };

    const openSignatureModal = (field: string) => {
        setCurrentSignatureField(field);
        setShowSignatureModal(true);
    };

    const saveSignature = () => {
        if (issuerSignatureRef.current && !issuerSignatureRef.current.isEmpty()) {
            const signatureData = issuerSignatureRef.current.toDataURL('image/png');
            setFormData(prev => ({
                ...prev,
                [currentSignatureField]: signatureData
            }));
            setShowSignatureModal(false);
            issuerSignatureRef.current.clear();
        } else {
            alert('Please provide a signature');
        }
    };

    const clearSignature = () => {
        if (issuerSignatureRef.current) {
            issuerSignatureRef.current.clear();
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (formData.categories.length === 0) {
            alert('Please select at least one permit category');
            return;
        }
        if (!formData.work_description.trim()) {
            alert('Work description is required');
            return;
        }
        if (!formData.work_location.trim()) {
            alert('Work location is required');
            return;
        }
        if (!formData.start_time || !formData.end_time) {
            alert('Start and end times are required');
            return;
        }

        setIsSaving(true);
        try {
            // Upload new SWMS file if provided
            let swmsUrl = formData.swms_file_url;
            if (formData.swmsFile) {
                const uploadRes = await uploadAPI.uploadSWMS(formData.swmsFile);
                if (uploadRes.success && uploadRes.data) {
                    swmsUrl = uploadRes.data.url;
                }
            }

            // Prepare checklist responses
            const checklistResponses = Object.entries(formData.checklistResponses).map(([questionId, response]) => ({
                question_id: parseInt(questionId),
                response,
                remarks: formData.checklistRemarks[parseInt(questionId)] || formData.checklistTextResponses[parseInt(questionId)] || undefined,
            }));

            // Transform team members to backend format
            const teamMembersForBackend = formData.teamMembers.map(member => ({
                worker_name: member.name,
                worker_role: member.designation,
                contact_number: member.contact,
                company_name: member.company_name || null,
                badge_id: member.badge_id || null,
                worker_id: member.worker_id || null
            }));

            const updateData = {
                permit_type: formData.categories[0],
                permit_types: formData.categories,
                site_id: formData.site_id,
                work_description: formData.work_description,
                work_location: formData.work_location,
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString(),
                issue_department: formData.issue_department,
                permit_initiator: formData.permit_initiator,
                permit_initiator_contact: formData.permit_initiator_contact,
                receiver_name: formData.receiver_name,
                receiver_contact: formData.receiver_contact,
                control_measures: formData.control_measures,
                other_hazards: formData.other_hazards,
                hazard_ids: formData.selectedHazards,
                ppe_ids: formData.selectedPPE,
                team_members: teamMembersForBackend,
                swms_file_url: swmsUrl,
                swms_text: formData.swms_text,
                checklist_responses: checklistResponses,
                issuer_signature: formData.issuer_signature,
                area_manager_signature: formData.area_manager_signature,
                safety_officer_signature: formData.safety_officer_signature,
                site_leader_signature: formData.site_leader_signature,
            };


            console.log('📤 Sending update data:', updateData);
            const response = await permitsAPI.update(permitId, updateData as any);

            if (response.success) {
                alert('PTW updated successfully!');
                if (onSave) {
                    onSave();
                } else {
                    onBack();
                }
            } else {
                alert(response.message || 'Failed to update PTW');
            }
        } catch (error: any) {
            console.error('Error updating PTW:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error message:', error.response?.data?.message);
            console.error('Error details:', error.response?.data?.error);
            alert(error.response?.data?.message || error.response?.data?.error || 'Failed to update PTW. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryBadgeColor = (category: PermitType) => {
        const colors = {
            General: 'bg-blue-100 text-blue-700 border-blue-300',
            Hot_Work: 'bg-red-100 text-red-700 border-red-300',
            Electrical: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            Height: 'bg-purple-100 text-purple-700 border-purple-300',
            Confined_Space: 'bg-orange-100 text-orange-700 border-orange-300',
        };
        return colors[category] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Loading permit details...</p>
                </div>
            </div>
        );
    }

    // Filter checklist by selected categories
    const relevantChecklist = checklistQuestions.filter(q =>
        q.permit_type === 'General' || formData.categories.includes(q.permit_type as PermitType)
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Edit PTW</h1>
                            <p className="text-sm text-slate-600">{permit?.permit_serial}</p>
                        </div>
                    </div>
                </div>

                {/* Alert Banner */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-medium">Edit Mode - All Fields Available</p>
                        <p>You can modify all PTW details including categories, hazards, PPE, team, checklist, and SWMS.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Section 1: Permit Categories */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Permit Categories
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {(['General', 'Hot_Work', 'Electrical', 'Height', 'Confined_Space'] as PermitType[]).map(category => (
                                <label
                                    key={category}
                                    className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.categories.includes(category)
                                        ? getCategoryBadgeColor(category) + ' border-current'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.categories.includes(category)}
                                        onChange={() => toggleCategory(category)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">{category.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Basic Details */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Basic Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Site *
                                </label>
                                <select
                                    value={formData.site_id}
                                    onChange={(e) => handleInputChange('site_id', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value={0}>Select Site</option>
                                    {sites.map(site => (
                                        <option key={site.id} value={site.id}>
                                            {site.name} - {site.site_code}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Work Location *
                                </label>
                                <input
                                    type="text"
                                    value={formData.work_location}
                                    onChange={(e) => handleInputChange('work_location', e.target.value)}
                                    placeholder="e.g., Building A - Floor 2"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Work Description *
                                </label>
                                <textarea
                                    value={formData.work_description}
                                    onChange={(e) => handleInputChange('work_description', e.target.value)}
                                    placeholder="Describe the work to be performed"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Start Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    End Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Issue Department
                                </label>
                                <input
                                    type="text"
                                    value={formData.issue_department}
                                    onChange={(e) => handleInputChange('issue_department', e.target.value)}
                                    placeholder="Department issuing the permit"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Permit Initiator
                                </label>
                                <input
                                    type="text"
                                    value={formData.permit_initiator}
                                    onChange={(e) => handleInputChange('permit_initiator', e.target.value)}
                                    placeholder="Name of permit initiator"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Initiator Contact
                                </label>
                                <input
                                    type="text"
                                    value={formData.permit_initiator_contact}
                                    onChange={(e) => handleInputChange('permit_initiator_contact', e.target.value)}
                                    placeholder="Contact information"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Receiver Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.receiver_name}
                                    onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                                    placeholder="Person receiving the permit"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Receiver Contact
                                </label>
                                <input
                                    type="text"
                                    value={formData.receiver_contact}
                                    onChange={(e) => handleInputChange('receiver_contact', e.target.value)}
                                    placeholder="Contact number or email"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Team Members */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Team Members
                            </h2>
                            <button
                                onClick={addTeamMember}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                                Add Member
                            </button>
                        </div>

                        {formData.teamMembers.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">
                                No team members added yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {formData.teamMembers.map((member) => (
                                    <div key={member.id} className="p-4 border border-slate-200 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <input
                                                type="text"
                                                value={member.name || ''}
                                                onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                                placeholder="Name"
                                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={member.designation || ''}
                                                onChange={(e) => updateTeamMember(member.id, 'designation', e.target.value)}
                                                placeholder="Designation"
                                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={member.contact || ''}
                                                onChange={(e) => updateTeamMember(member.id, 'contact', e.target.value)}
                                                placeholder="Contact"
                                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <button
                                                onClick={() => removeTeamMember(member.id)}
                                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 4: Hazards */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Hazards & Control Measures
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            {hazards.map(hazard => (
                                <label key={hazard.id} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedHazards.includes(hazard.id)}
                                        onChange={() => toggleHazard(hazard.id)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-slate-700">{hazard.name}</span>
                                </label>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Other Hazards
                                </label>
                                <textarea
                                    value={formData.other_hazards}
                                    onChange={(e) => handleInputChange('other_hazards', e.target.value)}
                                    placeholder="Describe any additional hazards not listed above"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Control Measures *
                                </label>
                                <textarea
                                    value={formData.control_measures}
                                    onChange={(e) => handleInputChange('control_measures', e.target.value)}
                                    placeholder="Describe the control measures to mitigate identified hazards"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: PPE */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5" />
                            Personal Protective Equipment (PPE)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {ppe.map(ppeItem => (
                                <label key={ppeItem.id} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedPPE.includes(ppeItem.id)}
                                        onChange={() => togglePPE(ppeItem.id)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-slate-700">{ppeItem.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Section 6: SWMS */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Safe Work Method Statement (SWMS)
                        </h2>

                        <div className="mb-4 flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={formData.swmsMode === 'file'}
                                    onChange={() => handleInputChange('swmsMode', 'file')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Upload File</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={formData.swmsMode === 'text'}
                                    onChange={() => handleInputChange('swmsMode', 'text')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Enter Text</span>
                            </label>
                        </div>

                        {formData.swmsMode === 'file' ? (
                            <div>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {formData.swms_file_url && (
                                    <p className="mt-2 text-sm text-blue-600">
                                        ✓ Current: <a href={formData.swms_file_url} target="_blank" rel="noopener noreferrer" className="underline">View File</a>
                                    </p>
                                )}
                                {formData.swmsFile && (
                                    <p className="mt-2 text-sm text-green-600">
                                        ✓ New file selected: {formData.swmsFile.name}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <textarea
                                value={formData.swms_text}
                                onChange={(e) => handleInputChange('swms_text', e.target.value)}
                                placeholder="Enter Safe Work Method Statement text..."
                                rows={6}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        )}
                    </div>

                    {/* Section 7: Checklist */}
                    {relevantChecklist.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5" />
                                Work Requirements Checklist
                            </h2>

                            <div className="space-y-4">
                                {relevantChecklist.map(question => (
                                    <div key={question.id} className="p-4 border border-slate-200 rounded-lg">
                                        <p className="text-sm font-medium text-slate-900 mb-3">{question.question_text}</p>

                                        {question.response_type === 'Yes/No/NA' ? (
                                            <div className="flex gap-4">
                                                {(['Yes', 'No', 'NA'] as ChecklistResponse[]).map(option => (
                                                    <label key={option} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            checked={formData.checklistResponses[question.id] === option}
                                                            onChange={() => handleChecklistResponse(question.id, option)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formData.checklistTextResponses[question.id] || ''}
                                                onChange={(e) => handleChecklistTextResponse(question.id, e.target.value)}
                                                placeholder="Enter response"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        )}

                                        {question.requires_remarks && (
                                            <textarea
                                                value={formData.checklistRemarks[question.id] || ''}
                                                onChange={(e) => handleChecklistRemarks(question.id, e.target.value)}
                                                placeholder="Additional remarks (if any)"
                                                rows={2}
                                                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 8: Signatures */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <PenTool className="w-5 h-5" />
                            Signatures
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Issuer Signature
                                </label>
                                {formData.issuer_signature ? (
                                    <div className="border border-slate-300 rounded-lg p-2">
                                        <img src={formData.issuer_signature} alt="Issuer Signature" className="h-20" />
                                        <button
                                            type="button"
                                            onClick={() => openSignatureModal('issuer_signature')}
                                            className="mt-2 text-sm text-blue-600 hover:underline"
                                        >
                                            Update Signature
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => openSignatureModal('issuer_signature')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Add Signature
                                    </button>
                                )}
                            </div>

                            {/* Show other signatures if they exist (read-only) */}
                            {formData.area_manager_signature && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Area Manager Signature
                                    </label>
                                    <div className="border border-slate-300 rounded-lg p-2">
                                        <img src={formData.area_manager_signature} alt="Area Manager Signature" className="h-20" />
                                    </div>
                                </div>
                            )}

                            {formData.safety_officer_signature && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Safety Officer Signature
                                    </label>
                                    <div className="border border-slate-300 rounded-lg p-2">
                                        <img src={formData.safety_officer_signature} alt="Safety Officer Signature" className="h-20" />
                                    </div>
                                </div>
                            )}

                            {formData.site_leader_signature && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Site Leader Signature
                                    </label>
                                    <div className="border border-slate-300 rounded-lg p-2">
                                        <img src={formData.site_leader_signature} alt="Site Leader Signature" className="h-20" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pb-6">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Digital Signature</h3>
                        <div className="border-2 border-slate-300 rounded-lg">
                            <SignatureCanvas
                                ref={issuerSignatureRef}
                                canvasProps={{
                                    className: 'signature-canvas w-full h-48',
                                    style: { width: '100%', height: '200px' }
                                }}
                            />
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                onClick={clearSignature}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                Clear
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSignatureModal(false)}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveSignature}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Signature
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}