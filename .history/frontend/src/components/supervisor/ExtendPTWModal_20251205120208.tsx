// frontend/src/components/supervisor/ExtendPTWModal.tsx
// FIXED VERSION - Correct prop interface
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X, Calendar, Clock as ClockIcon, AlertCircle } from 'lucide-react';

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
  onSubmit: (extensionData: ExtensionData) => void;  // Changed from onExtendPTW
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
  onSubmit,  // Changed from onExtendPTW
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

    // Call onSubmit instead of onExtendPTW
    onSubmit(extensionData);
    
    // Reset form
    setExtensionData({
      new_end_date: '',
      new_end_time: '',
      reason: '',
      current_completion: '',
    });
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
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Extend PTW</h2>
            <p className="mt-1 text-sm text-gray-600">
              Request extension for {permit?.permit_serial}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Details */}
          <div className="p-4 rounded-lg bg-blue-50">
            <p className="mb-2 text-sm font-medium text-blue-900">Current Schedule</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Start:</span>{' '}
                <span className="font-medium text-blue-900">
                  {formatDate(permit.start_time)} {formatTime(permit.start_time)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">End:</span>{' '}
                <span className="font-medium text-blue-900">
                  {formatDate(permit.end_time)} {formatTime(permit.end_time)}
                </span>
              </div>
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

          {/* Important Notice */}
          <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Important Notice</p>
                <p className="mt-1 text-sm text-yellow-700">
                  Extension request will be sent for approval. The PTW status will change to "Extension Requested".
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