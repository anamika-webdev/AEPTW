// src/components/supervisor/ExtendPTWModal.tsx
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X, AlertCircle, Calendar, Clock as ClockIcon } from 'lucide-react';

interface PermitWithDetails {
  id: number;
  permit_serial: string;
  start_time: string;
  end_time: string;
}

interface ExtendPTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: PermitWithDetails | null;
  onExtendPTW: (permitId: number, extensionData: ExtensionData) => void;
}

export interface ExtensionData {
  new_end_date: string;
  new_end_time: string;
  reason: string;
  current_completion: string;
}

export const ExtendPTWModal: React.FC<ExtendPTWModalProps> = ({
  isOpen,
  onClose,
  permit,
  onExtendPTW,
}) => {
  const [extensionData, setExtensionData] = useState<ExtensionData>({
    new_end_date: '',
    new_end_time: '',
    reason: '',
    current_completion: '',
  });

  if (!isOpen || !permit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!extensionData.new_end_date || !extensionData.new_end_time || !extensionData.reason || !extensionData.current_completion) {
      alert('Please fill in all required fields');
      return;
    }

    onExtendPTW(permit.id, extensionData);
    
    // Reset form
    setExtensionData({
      new_end_date: '',
      new_end_time: '',
      reason: '',
      current_completion: '',
    });
    onClose();
  };

  const formatDate = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    });
  };

  const formatTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Extend PTW
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
          {/* Current End Date & Time */}
          <div className="p-4 rounded-lg bg-gray-50">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Current End Date & Time
            </label>
            <div className="flex items-center gap-3 text-sm text-gray-900">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Date: {formatDate(permit.end_time)}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-900">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>Time: {formatTime(permit.end_time)}</span>
            </div>
          </div>

          {/* New End Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={extensionData.new_end_date}
                onChange={(e) => setExtensionData({ ...extensionData, new_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="dd-mm-yyyy"
                required
              />
              <Calendar className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
            </div>
          </div>

          {/* New End Time */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New End Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={extensionData.new_end_time}
                onChange={(e) => setExtensionData({ ...extensionData, new_end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="--:--"
                required
              />
              <ClockIcon className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
            </div>
          </div>

          {/* Reason for Extension */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Reason for Extension <span className="text-red-500">*</span>
            </label>
            <textarea
              value={extensionData.reason}
              onChange={(e) => setExtensionData({ ...extensionData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why the work requires additional time..."
              rows={3}
              required
            />
          </div>

          {/* Current Work Completion */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Current Work Completion (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={extensionData.current_completion}
              onChange={(e) => setExtensionData({ ...extensionData, current_completion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 65"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the percentage of work completed so far
            </p>
          </div>

          {/* Important Notice 
          <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Important Notice</p>
                <p className="mt-1 text-sm text-yellow-700">
                  Extending this PTW will require re-approval from safety personnel. All workers will be 
                  notified of the extension via email and SMS.
                </p>
              </div>
            </div>
          </div>*/}

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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Extend PTW
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};