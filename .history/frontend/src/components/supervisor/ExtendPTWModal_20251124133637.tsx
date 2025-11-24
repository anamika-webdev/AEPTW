// src/components/supervisor/ExtendPTWModal.tsx
import React, { useState } from 'react';
import { PermitWithDetails } from '../../types';
import { Button } from '../ui/button';

interface ExtendPTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: PermitWithDetails | null;
  onExtend: (permitId: number, newEndTime: string, reason: string) => void;
}

export const ExtendPTWModal: React.FC<ExtendPTWModalProps> = ({
  isOpen,
  onClose,
  permit,
  onExtend,
}) => {
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen || !permit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEndTime && reason) {
      onExtend(permit.id, newEndTime, reason);
      setNewEndTime('');
      setReason('');
      onClose();
    }
  };

  const currentEndTime = new Date(permit.end_time);
  const minDateTime = new Date(currentEndTime.getTime() + 30 * 60 * 1000) // 30 minutes after current end
    .toISOString()
    .slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Extend Permit Duration
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
              Current End Time
            </label>
            <input
              type="text"
              value={new Date(permit.end_time).toLocaleString()}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              New End Time *
            </label>
            <input
              type="datetime-local"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              min={minDateTime}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Reason for Extension *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Explain why this permit needs to be extended..."
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
              variant="primary"
              fullWidth
            >
              Request Extension
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};