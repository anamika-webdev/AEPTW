// frontend/src/pages/supervisor/CreatePermit.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Trash2 } from 'lucide-react';

interface CreatePermitProps {
  onBack: () => void;
}

interface NewWorker {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export default function CreatePermit({ onBack }: CreatePermitProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    permitCategory: '',
    issueDepartment: '',
    site: '',
    jobLocation: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    workDescription: '',
    
    // Step 2: Workers
    issuedToName: '',
    issuedToContact: '',
    workerType: 'existing', // 'existing' or 'new'
    selectedWorkers: [] as number[],
    newWorkers: [] as NewWorker[],
    
    // Step 3: Hazards
    identifiedHazards: [] as string[],
    controlMeasures: '',
    otherHazards: '',
    safetyMeasures: '',
    
    // Step 4: PPE & Files
    selectedPPE: [] as string[],
    swmsFile: null as File | null,
    
    // Step 5: Requirements
    requirements: {} as { [key: string]: string },
  });

  // New worker form state
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const permitCategories = [
    { value: 'General', label: 'General' },
    { value: 'Height', label: 'Height' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Hot_Work', label: 'Hot Work' },
    { value: 'Confined_Space', label: 'Confined Space' },
  ];

  const departments = [
    { value: 'WHS', label: 'WHS' },
    { value: 'SLP', label: 'SLP' },
    { value: 'RME', label: 'RME' },
    { value: 'Ops_Tech_IT', label: 'Ops Tech IT' },
    { value: 'Operation', label: 'Operation' },
  ];

  const sites = [
    { value: '1', label: 'Alpha Site' },
    { value: '2', label: 'Beta Site' },
    { value: '3', label: 'Gamma Site' },
  ];

  const hazardsList = [
    'Fall from height',
    'Fire hazard',
    'Slips and trips',
    'Hot surfaces',
    'Electrical shock',
    'Toxic gases',
    'Moving machinery',
    'Confined space',
  ];

  const ppeItems = [
    { id: 'helmet', label: 'Safety Helmet', emoji: '⛑️' },
    { id: 'vest', label: 'Safety Vest', emoji: '🦺' },
    { id: 'gloves', label: 'Safety Gloves', emoji: '🧤' },
    { id: 'boots', label: 'Safety Boots', emoji: '🥾' },
    { id: 'glasses', label: 'Safety Glasses', emoji: '🥽' },
    { id: 'mask', label: 'Face Mask', emoji: '😷' },
    { id: 'earprotection', label: 'Ear Protection', emoji: '🎧' },
    { id: 'harness', label: 'Safety Harness', emoji: '🪢' },
  ];

  const workers = [
    { id: 1, name: 'Amit Patel', email: 'amit.patel@telecom.in', avatar: 'A' },
    { id: 2, name: 'Vikram Singh', email: 'vikram.singh@telecom.in', avatar: 'V' },
    { id: 3, name: 'Suresh Reddy', email: 'suresh.reddy@telecom.in', avatar: 'S' },
    { id: 4, name: 'Karthik Iyer', email: 'karthik.iyer@telecom.in', avatar: 'K' },
    { id: 5, name: 'Ramesh Gupta', email: 'ramesh.gupta@telecom.in', avatar: 'R' },
    { id: 6, name: 'Arun Nair', email: 'arun.nair@telecom.in', avatar: 'A' },
  ];

  // Category-specific requirements
  const requirementsByCategory = {
    General: [
      'Job Location has been checked and verified to conduct the activity.',
      'Area has been barricaded to eliminate the possibilities of unauthorize entry.',
      'Caution board has been displayed.',
      'PPE\'s available as per job requirement.',
      'Information of work has been communicated to the affected team.',
      'Tools to be inspected for safe use.',
    ],
    Hot_Work: [
      'No hot work to be carried out at site during fire impairment.',
      'Area barrication.',
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
    Electrical: [
      'Area Barrication',
      'Wiremen License',
      'Supervisory License',
      'Approved "A" class contractor.',
      'Electrical approved PPE\'s',
      'De-energized of electrical equipment.',
      'LOTO',
      'Fire fighter/first aider/AED certified person availability',
      'Insulated tools provided.',
    ],
    Height: [
      'Area Barrication',
      'Vertigo (Height Phobia)/Acrophobic',
      'Pre use inspection of scaffolding/fullbody hardness/ A typeladder / FRP ladder/ Scissor lift/Boom lift/Hydra/Crane.',
      'TPI certificate lifting tools and tackles',
      'PPE\'s must be inspected and certified.',
      'Anchorage point availability',
      'Rescue plan available.',
      'Supervision available.',
      'Bottom support of ladders/scaffolding to be available.',
    ],
    Confined_Space: [
      'Area Barrication',
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

  const steps = [
    { number: 1, title: 'Basic Info', id: 'basic' },
    { number: 2, title: 'Workers', id: 'workers' },
    { number: 3, title: 'Hazards', id: 'hazards' },
    { number: 4, title: 'PPE & Files', id: 'ppe' },
    { number: 5, title: 'Requirements', id: 'requirements' },
    { number: 6, title: 'Review', id: 'review' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleHazard = (hazard: string) => {
    setFormData(prev => ({
      ...prev,
      identifiedHazards: prev.identifiedHazards.includes(hazard)
        ? prev.identifiedHazards.filter(h => h !== hazard)
        : [...prev.identifiedHazards, hazard]
    }));
  };

  const togglePPE = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPPE: prev.selectedPPE.includes(id)
        ? prev.selectedPPE.filter(p => p !== id)
        : [...prev.selectedPPE, id]
    }));
  };

  const toggleWorker = (id: number) => {
    setFormData(prev => ({
      ...prev,
      selectedWorkers: prev.selectedWorkers.includes(id)
        ? prev.selectedWorkers.filter(w => w !== id)
        : [...prev.selectedWorkers, id]
    }));
  };

  const handleAddNewWorker = () => {
    if (!newWorkerForm.name || !newWorkerForm.phone || !newWorkerForm.email) {
      alert('Please fill in all worker fields');
      return;
    }

    const newWorker: NewWorker = {
      id: Date.now().toString(),
      name: newWorkerForm.name,
      phone: newWorkerForm.phone,
      email: newWorkerForm.email,
    };

    setFormData(prev => ({
      ...prev,
      newWorkers: [...prev.newWorkers, newWorker],
    }));

    setNewWorkerForm({ name: '', phone: '', email: '' });
  };

  const handleRemoveNewWorker = (id: string) => {
    setFormData(prev => ({
      ...prev,
      newWorkers: prev.newWorkers.filter(w => w.id !== id),
    }));
  };

  const handleRequirementChange = (question: string, answer: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [question]: answer }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, swmsFile: e.target.files![0] }));
    }
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    console.log('Submitting PTW:', formData);
    alert('Permit submitted successfully!');
    onBack();
  };

  const progressPercentage = ((currentStep - 1) / 5) * 100;

  // Get requirements based on selected category
  const getCurrentRequirements = () => {
    const category = formData.permitCategory || 'General';
    return requirementsByCategory[category as keyof typeof requirementsByCategory] || requirementsByCategory.General;
  };

  const getCategoryTitle = () => {
    const titles = {
      General: 'General Work Requirement',
      Hot_Work: 'Hot Work Requirement',
      Electrical: 'Electrical Work Requirement',
      Height: 'Height Work Requirement',
      Confined_Space: 'Confined Space Work Requirement',
    };
    return titles[formData.permitCategory as keyof typeof titles] || 'General Work Requirement';
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New PTW</h1>
            <p className="text-sm text-gray-600">Step {currentStep} of 6</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-300 bg-black rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <span className={`text-xs font-medium ${currentStep >= step.number ? 'text-black' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Permit Category *</label>
                    <select
                      value={formData.permitCategory}
                      onChange={(e) => handleInputChange('permitCategory', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {permitCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Issue department *</label>
                    <select
                      value={formData.issueDepartment}
                      onChange={(e) => handleInputChange('issueDepartment', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Issue department</option>
                      {departments.map(dept => (
                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Site *</label>
                    <select
                      value={formData.site}
                      onChange={(e) => handleInputChange('site', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select site</option>
                      {sites.map(site => (
                        <option key={site.value} value={site.value}>{site.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Job Location *</label>
                    <input
                      type="text"
                      value={formData.jobLocation}
                      onChange={(e) => handleInputChange('jobLocation', e.target.value)}
                      placeholder="e.g., Building A - Roof"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Start Time *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">End Time *</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Work Description *</label>
                  <textarea
                    value={formData.workDescription}
                    onChange={(e) => handleInputChange('workDescription', e.target.value)}
                    placeholder="Describe the work to be performed..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Add Issuer Signature
                </Button>
              </div>
            )}

            {/* Step 2: Issued To & Workers Assignment */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Issued To & Workers Assignment</h2>

                {/* Issued To Section */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Issued To (Permit Recipient)</h3>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        value={formData.issuedToName}
                        onChange={(e) => handleInputChange('issuedToName', e.target.value)}
                        placeholder="e.g., XYZ pvt ltd."
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Contact Number *</label>
                      <input
                        type="tel"
                        value={formData.issuedToContact}
                        onChange={(e) => handleInputChange('issuedToContact', e.target.value)}
                        placeholder="e.g., +91 9876543210"
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-600">
                    The person to whom this permit is issued (usually the work supervisor or contractor lead)
                  </p>
                </div>

                {/* Worker Selection */}
                <div>
                  <h3 className="mb-4 font-semibold text-gray-900">Select the workers who will be performing this work</h3>
                  
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.workerType === 'existing'}
                        onChange={() => handleInputChange('workerType', 'existing')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Existing Workers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.workerType === 'new'}
                        onChange={() => handleInputChange('workerType', 'new')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">New Workers</span>
                    </label>
                  </div>

                  {/* Existing Workers Grid */}
                  {formData.workerType === 'existing' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {workers.map((worker) => (
                        <label
                          key={worker.id}
                          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.selectedWorkers.includes(worker.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedWorkers.includes(worker.id)}
                            onChange={() => toggleWorker(worker.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex items-center justify-center w-10 h-10 text-white bg-orange-500 rounded-full">
                            <span className="font-bold">{worker.avatar}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{worker.name}</p>
                            <p className="text-sm text-gray-600">{worker.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* New Workers Form */}
                  {formData.workerType === 'new' && (
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-gray-200 rounded-lg">
                        <h4 className="mb-4 font-semibold text-gray-900">Add New Worker</h4>
                        
                        <div className="grid gap-4 mb-4 md:grid-cols-3">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Name *</label>
                            <input
                              type="text"
                              value={newWorkerForm.name}
                              onChange={(e) => setNewWorkerForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Rahul Mishra"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Phone *</label>
                            <input
                              type="tel"
                              value={newWorkerForm.phone}
                              onChange={(e) => setNewWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="e.g., +1234567890"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Email *</label>
                            <input
                              type="email"
                              value={newWorkerForm.email}
                              onChange={(e) => setNewWorkerForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="e.g., rahul.mishra@example.com"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={handleAddNewWorker}
                          variant="outline"
                          className="w-full text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Add Worker
                        </Button>
                      </div>

                      {/* List of Added New Workers */}
                      {formData.newWorkers.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Added Workers ({formData.newWorkers.length})</h4>
                          {formData.newWorkers.map((worker) => (
                            <div key={worker.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 text-white bg-orange-500 rounded-full">
                                  <span className="font-bold">{worker.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{worker.name}</p>
                                  <p className="text-sm text-gray-600">{worker.email} • {worker.phone}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveNewWorker(worker.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Hazard Identification & Control Measures */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Hazard Identification & Control Measures</h2>

                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-700">Identified Hazards *</label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {hazardsList.map((hazard) => (
                      <label
                        key={hazard}
                        className="flex items-center p-3 space-x-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.identifiedHazards.includes(hazard)}
                          onChange={() => toggleHazard(hazard)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{hazard}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Control Measures *</label>
                  <textarea
                    value={formData.controlMeasures}
                    onChange={(e) => handleInputChange('controlMeasures', e.target.value)}
                    placeholder="Describe the control measures to mitigate identified hazards..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Other Hazards *</label>
                  <textarea
                    value={formData.otherHazards}
                    onChange={(e) => handleInputChange('otherHazards', e.target.value)}
                    placeholder="Describe the other hazards to be identified..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Describe all safety measures, procedures, and precautions to be taken
                  </label>
                  <textarea
                    value={formData.safetyMeasures}
                    onChange={(e) => handleInputChange('safetyMeasures', e.target.value)}
                    placeholder="Enter detailed safety measures..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 4: PPE Requirements & SWMS Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">PPE Requirements & SWMS Upload</h2>

                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-700">
                    Required Personal Protective Equipment (PPE) *
                  </label>
                  <p className="mb-4 text-sm text-gray-600">Select all required PPE for this work</p>
                  
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {ppeItems.map((ppe) => (
                      <button
                        key={ppe.id}
                        onClick={() => togglePPE(ppe.id)}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                          formData.selectedPPE.includes(ppe.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-4xl">{ppe.emoji}</span>
                        <span className="text-sm font-medium text-center text-gray-900">{ppe.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-700">Upload SWMS Document</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload SWMS file</span>
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                        {formData.swmsFile && (
                          <p className="mt-2 text-sm font-medium text-blue-600">{formData.swmsFile.name}</p>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Work Requirements Checklist */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Work Requirements Checklist</h2>

                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Category:</strong> {formData.permitCategory || 'General'} - 
                    Complete the following requirements checklist
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">{getCategoryTitle()}</h3>
                  
                  <div className="space-y-4">
                    {getCurrentRequirements().map((question, index) => (
                      <div key={index} className="flex items-start justify-between gap-4 p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="flex-1 text-sm text-gray-900">{question}</span>
                        <div className="flex gap-2 shrink-0">
                          {['YES', 'NO', 'NA'].map((answer) => (
                            <button
                              key={answer}
                              onClick={() => handleRequirementChange(question, answer)}
                              className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                                formData.requirements[question] === answer
                                  ? answer === 'YES'
                                    ? 'bg-green-600 text-white'
                                    : answer === 'NO'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {answer}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review & Submit */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>

                {/* Summary */}
                <div className="p-6 space-y-4 rounded-lg bg-gray-50">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Category</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.permitCategory || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Site & Location</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.jobLocation || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Work Period</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formData.startDate && formData.endDate ? `${formData.startDate} to ${formData.endDate}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Assigned Workers</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formData.workerType === 'existing' 
                          ? `${formData.selectedWorkers.length} workers` 
                          : `${formData.newWorkers.length} new workers`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Hazards Identified</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.identifiedHazards.length} hazards</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">PPE Required</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.selectedPPE.length} items</p>
                    </div>
                  </div>
                </div>

                {/* Required Approvals */}
                <div>
                  <h3 className="mb-4 font-semibold text-gray-900">Required Approvals</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="mb-3 text-sm font-medium text-gray-700">Area In-Charge Signature</p>
                      <Button variant="outline" className="w-full">
                        Add Signature
                      </Button>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="mb-3 text-sm font-medium text-gray-700">Safety In-Charge Signature</p>
                      <Button variant="outline" className="w-full" disabled>
                        Add Signature
                      </Button>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg md:col-span-2">
                      <p className="mb-3 text-sm font-medium text-gray-700">Site Leader Signature</p>
                      <Button variant="outline" className="w-full">
                        Add Signature
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h3 className="mb-3 font-semibold text-gray-900">Declaration</h3>
                  <p className="text-sm text-gray-700">
                    I declare that all information provided is accurate and complete. I confirm that all necessary safety measures have been identified and will be implemented. All workers have been briefed on the hazards and control measures for this work.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6"
          >
            Previous
          </Button>

          {currentStep < 6 ? (
            <Button onClick={nextStep} className="px-6 bg-green-600 hover:bg-green-700">
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="px-8 bg-green-600 hover:bg-green-700">
              ✓ Submit PTW
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}