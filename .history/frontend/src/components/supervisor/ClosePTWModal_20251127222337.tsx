// src/components/supervisor/ClosePTWModal.tsx
import React, { useState } from 'react';

/**
 * PermitWithDetails was not exported from '../../types'.
 * Define a local type here to match the properties used by this component.
 * Extend or adjust this definition if additional fields are required.
 */
interface PermitWithDetails {
  id: number;
  permit_serial: string;
  work_location: string;
  // add other fields as needed
}

import { Button } from '../ui/button';

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
  remarks: string;
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
    remarks: '',
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

    if (allChecked) {
      onClosePTW(permit.id, closureData);
      // Reset form
      setClosureData({
        housekeeping_done: false,
        tools_removed: false,
        locks_removed: false,
        area_restored: false,
        remarks: '',
      });
      onClose();
    } else {
      alert('All checklist items must be completed before closing the permit.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Close Permit
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Permit Serial
            </label>
            <input
              type="text"
              value={permit.permit_serial}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Work Location
            </label>
            <input
              type="text"
              value={permit.work_location}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div className="pt-4 space-y-3 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Closure Checklist *
            </p>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={closureData.housekeeping_done}
                onChange={() => handleCheckboxChange('housekeeping_done')}
                className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Housekeeping completed (area cleaned)
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={closureData.tools_removed}
                onChange={() => handleCheckboxChange('tools_removed')}
                className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                All tools and equipment removed
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={closureData.locks_removed}
                onChange={() => handleCheckboxChange('locks_removed')}
                className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                All locks and tags removed (LOTO)
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={closureData.area_restored}
                onChange={() => handleCheckboxChange('area_restored')}
                className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Work area restored to normal condition
              </span>
            </label>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Additional Remarks
            </label>
            <textarea
              value={closureData.remarks}
              onChange={(e) => setClosureData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
              placeholder="Any additional notes about work completion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              fullWidth
            >
              Close Permit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};