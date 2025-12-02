// src/components/supervisor/ClosePTWModal.tsx
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface PermitWithDetails {
  id: number;
  permit_serial: string;
  work_location: string;
  work_description: string;
}

interface ClosePTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: PermitWithDetails | null;
  onClosePTW: (permitId: number, closureData: ClosureData) => void;
}

export interface ClosureData {
  housekeeping_done: boolean;
  tools_removed: boolean;
  locks_removed: boolean;
  area_restored: boolean;
  completion_notes: string;
  safety_incidents: string;
  supervisor_signature: string;
}

export const ClosePTWModal: React.FC<ClosePTWModalProps> = ({
  isOpen,
  onClose,
  permit,
  onClosePTW,
}) => {
  const [closureData, setClosureData] = useState<ClosureData>({
    housekeeping_done: false,
    tools_removed: false,
    locks_removed: false,
    area_restored: false,
    completion_notes: '',
    safety_incidents: '',
    supervisor_signature: '',
  });

  if (!isOpen || !permit) return null;

  const handleCheckboxChange = (field: keyof ClosureData) => {
    setClosureData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allChecked = 
      closureData.housekeeping_done &&
      closureData.tools_removed &&
      closureData.locks_removed &&
      closureData.area_restored;

    if (!allChecked) {
      alert('All checklist items must be completed before closing the permit.');
      return;
    }

    if (!closureData.supervisor_signature) {
      alert('Please add supervisor signature before closing.');
      return;
    }

    onClosePTW(permit.id, closureData);
    
    // Reset form
    setClosureData({
      housekeeping_done: false,
      tools_removed: false,
      locks_removed: false,
      area_restored: false,
      completion_notes: '',
      safety_incidents: '',
      supervisor_signature: '',
    });
    onClose();
  };

  const allChecklistComplete = 
    closureData.housekeeping_done &&
    closureData.tools_removed &&
    closureData.locks_removed &&
    closureData.area_restored;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Close PTW
              </h2>
              <p className="text-sm text-gray-600">{permit.permit_serial}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* PTW Details */}
          <div className="p-4 space-y-2 rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">PTW Details</h3>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Location:</span> {permit.work_location || 'Equipment Room - Floor 3'}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Work Description:</span> {permit.work_description || 'Metal fabrication and welding for cable trays'}
            </div>
          </div>

          {/* Completion Checklist */}
          <div>
            <label className="block mb-3 text-sm font-medium text-gray-700">
              Completion Checklist <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-3">
              {/* All work has been completed */}
              <label className="flex items-start gap-3 p-3 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.housekeeping_done}
                  onChange={() => handleCheckboxChange('housekeeping_done')}
                  className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">All work has been completed</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Confirm that all tasks specified in the work description are finished
                  </p>
                </div>
              </label>

              {/* Work area has been cleaned up */}
              <label className="flex items-start gap-3 p-3 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.tools_removed}
                  onChange={() => handleCheckboxChange('tools_removed')}
                  className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Work area has been cleaned up</p>
                  <p className="mt-1 text-xs text-gray-500">
                    All debris, materials, and waste have been removed from the work area
                  </p>
                </div>
              </label>

              {/* All tools and equipment removed */}
              <label className="flex items-start gap-3 p-3 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.locks_removed}
                  onChange={() => handleCheckboxChange('locks_removed')}
                  className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">All tools and equipment removed</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Tools, equipment, and machinery have been removed from the site
                  </p>
                </div>
              </label>

              {/* All hazards have been eliminated */}
              <label className="flex items-start gap-3 p-3 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.area_restored}
                  onChange={() => handleCheckboxChange('area_restored')}
                  className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">All hazards have been eliminated</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Temporary hazards created during work have been removed or secured
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Completion Notes */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Completion Notes <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={closureData.completion_notes}
              onChange={(e) => setClosureData({ ...closureData, completion_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide details about the completed work, any observations, or handover notes..."
              rows={3}
            />
          </div>

          {/* Safety Issues or Incidents */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Safety Issues or Incidents (Optional)
            </label>
            <textarea
              value={closureData.safety_incidents}
              onChange={(e) => setClosureData({ ...closureData, safety_incidents: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Report any safety issues, near misses, or incidents that occurred during the work..."
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank if no incidents occurred
            </p>
          </div>

          {/* Supervisor Signature */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Supervisor Signature <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              onClick={() => {
                // This would open a signature pad in real implementation
                const signature = prompt('Enter your name to sign:');
                if (signature) {
                  setClosureData({ ...closureData, supervisor_signature: signature });
                }
              }}
              variant="outline"
              className="w-full"
            >
              {closureData.supervisor_signature ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Signed by: {closureData.supervisor_signature}</span>
                </div>
              ) : (
                'Add Supervisor Signature'
              )}
            </Button>
          </div>

          {/* Important Warning */}
          <div className="p-4 border-l-4 border-red-400 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Important</p>
                <p className="mt-1 text-sm text-red-700">
                  Closing this PTW is a final action. Once closed, the permit cannot be reopened. Ensure all 
                  work is complete and all safety requirements are met before closing.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!allChecklistComplete || !closureData.supervisor_signature}
              className={`flex-1 ${
                allChecklistComplete && closureData.supervisor_signature
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Close PTW
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};