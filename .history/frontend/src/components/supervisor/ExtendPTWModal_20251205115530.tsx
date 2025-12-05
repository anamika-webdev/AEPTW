// frontend/src/components/supervisor/ExtendPTWModal.tsx
import React, { useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';

export interface ExtensionData {
  new_end_time: string;
  reason: string;
}

interface ExtendPTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExtensionData) => void;
  permit: {
    id: number;
    permit_serial: string;
    work_location: string;
    work_description?: string;
    end_time: string;
  };
}

export const ExtendPTWModal: React.FC<ExtendPTWModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  permit
}) => {
  const [extensionData, setExtensionData] = useState<ExtensionData>({
    new_end_time: '',
    reason: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!extensionData.new_end_time) {
      alert('Please select a new end time');
      return;
    }

    if (!extensionData.reason.trim()) {
      alert('Please provide a reason for the extension');
      return;
    }

    // Validate new end time is after current end time
    const currentEnd = new Date(permit.end_time);
    const newEnd = new Date(extensionData.new_end_time);

    if (newEnd <= currentEnd) {
      alert('New end time must be after the current end time');
      return;
    }

    onSubmit(extensionData);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Request PTW Extension</h2>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* PTW Details */}
          <div className="p-4 space-y-2 rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Current PTW Details</h3>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Location:</span> {permit.work_location}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Current End Time:</span> {formatDateTime(permit.end_time)}
            </div>
          </div>

          {/* New End Time */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={extensionData.new_end_time}
              onChange={(e) => setExtensionData({ ...extensionData, new_end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Select the new end date and time for this permit
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Reason for Extension <span className="text-red-500">*</span>
            </label>
            <textarea
              value={extensionData.reason}
              onChange={(e) => setExtensionData({ ...extensionData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Explain why you need to extend this permit..."
              rows={4}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide a clear explanation for the extension request
            </p>
          </div>

          {/* Warning */}
          <div className="p-4 border-l-4 border-orange-400 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Extension Request</p>
                <p className="mt-1 text-sm text-orange-700">
                  This request will be sent to the approving authorities for review. Work can continue 
                  while the extension is being reviewed.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              Request Extension
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};