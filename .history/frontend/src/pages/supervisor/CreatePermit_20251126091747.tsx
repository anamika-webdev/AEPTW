// frontend/src/pages/supervisor/CreatePermit.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText } from 'lucide-react';

interface CreatePermitProps {
  onBack: () => void;
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

  const generalRequirements = [
    'Work area inspected and clear of hazards',
    'Emergency procedures reviewed with workers',
    'Workers trained for the specific task',
    'First aid kit available nearby',
  ];

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
                        type="radio"
                        checked={formData.workerType === 'existing'}
                        onChange={() => handleInputChange('workerType', 'existing')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Existing Workers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.workerType === 'new'}
                        onChange={() => handleInputChange('workerType', 'new')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">New Workers</span>
                    </label>
                  </div>

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

                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="mb-4 font-semibold text-gray-900">General Requirements</h3>
                  
                  <div className="space-y-4">
                    {generalRequirements.map((question, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-900">{question}</span>
                        <div className="flex gap-2">
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
                      <p className="text-sm font-semibold text-gray-900">{formData.selectedWorkers.length} workers</p>
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