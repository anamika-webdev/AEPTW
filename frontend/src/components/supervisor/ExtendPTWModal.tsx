// frontend/src/components/supervisor/ExtendPTWModal.tsx
// UPDATED VERSION - Shows approvers who will be requested

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X, Calendar, Clock as ClockIcon, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface PermitWithDetails {
  id: number;
  permit_serial: string;
  start_time: string;
  end_time: string;
  site_leader_name?: string;
  safety_officer_name?: string;
  site_leader_id?: number;
  safety_officer_id?: number;
}

interface ExtendPTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: PermitWithDetails | null;
  onSubmit: (extensionData: ExtensionData) => void;
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
  onSubmit,
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

    // Validation: Check if new end date/time is in the future
    const now = new Date();
    const newEndDateTime = new Date(`${extensionData.new_end_date}T${extensionData.new_end_time}`);

    if (newEndDateTime <= now) {
      alert('New end date and time must be in the future');
      return;
    }

    // Validation: Check if new end date/time is after current end date
    const currentEndDateTime = new Date(permit.end_time);
    if (newEndDateTime <= currentEndDateTime) {
      alert('New end date and time must be after the current permit end time');
      return;
    }

    // Call onSubmit
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

  // Check which approvers are assigned
  const hasSiteLeader = permit.site_leader_id && permit.site_leader_name;
  const hasSafetyOfficer = permit.safety_officer_id && permit.safety_officer_name;
  const hasApprovers = hasSiteLeader || hasSafetyOfficer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
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
          <div className="p-4 rounded-lg bg-orange-50">
            <p className="mb-2 text-sm font-medium text-orange-900">Current Schedule</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-orange-700">Start:</span>{' '}
                <span className="font-medium text-orange-900">
                  {formatDate(permit.start_time)} {formatTime(permit.start_time)}
                </span>
              </div>
              <div>
                <span className="text-orange-700">End:</span>{' '}
                <span className="font-medium text-orange-900">
                  {formatDate(permit.end_time)} {formatTime(permit.end_time)}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Approvers Section */}
          {hasApprovers && (
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-700" />
                <p className="text-sm font-semibold text-blue-900">
                  Extension Approval Required From:
                </p>
              </div>
              <div className="space-y-2">
                {hasSiteLeader && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Site Leader / Senior Ops
                      </p>
                      <p className="text-xs text-gray-600">{permit.site_leader_name}</p>
                    </div>
                  </div>
                )}
                {hasSafetyOfficer && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Safety In-charge
                      </p>
                      <p className="text-xs text-gray-600">{permit.safety_officer_name}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 p-2 mt-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> All approvers listed above must approve your extension request
                  before the permit end time can be extended. You will be notified when they review your request.
                </p>
              </div>
            </div>
          )}

          {/* Warning if no approvers */}
          {!hasApprovers && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">No approvers assigned</p>
                <p className="text-xs mt-1">
                  This PTW does not have Site Leader or Safety Officer assigned.
                  The extension will be processed automatically.
                </p>
              </div>
            </div>
          )}

          {/* New End Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                value={extensionData.new_end_date}
                onChange={(e) => setExtensionData({ ...extensionData, new_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                // Prevent past time if selected date is today
                min={extensionData.new_end_date === new Date().toISOString().split('T')[0]
                  ? new Date().toTimeString().slice(0, 5)
                  : undefined}
                value={extensionData.new_end_time}
                onChange={(e) => setExtensionData({ ...extensionData, new_end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Explain why the work requires additional time..."
              rows={3}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide a clear justification for the extension request
            </p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., 65"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the percentage of work completed so far
            </p>
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
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {hasApprovers ? 'Request Extension' : 'Extend PTW'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendPTWModal;