import { useState } from 'react';
import { X, CalendarClock, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface ExtendPTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: (data: ExtendPTWData) => void;
  ptwNumber: string;
  currentEndDate: string;
  currentEndTime: string;
}

export interface ExtendPTWData {
  newEndDate: string;
  newEndTime: string;
  extensionReason: string;
  estimatedCompletion: string;
}

export function ExtendPTWModal({
  isOpen,
  onClose,
  onExtend,
  ptwNumber,
  currentEndDate,
  currentEndTime,
}: ExtendPTWModalProps) {
  const [formData, setFormData] = useState<ExtendPTWData>({
    newEndDate: '',
    newEndTime: '',
    extensionReason: '',
    estimatedCompletion: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newEndDate) {
      newErrors.newEndDate = 'New end date is required';
    } else if (formData.newEndDate <= currentEndDate) {
      newErrors.newEndDate = 'New end date must be after current end date';
    }

    if (!formData.newEndTime) {
      newErrors.newEndTime = 'New end time is required';
    }

    if (!formData.extensionReason.trim()) {
      newErrors.extensionReason = 'Extension reason is required';
    }

    if (!formData.estimatedCompletion.trim()) {
      newErrors.estimatedCompletion = 'Estimated completion percentage is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onExtend(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      newEndDate: '',
      newEndTime: '',
      extensionReason: '',
      estimatedCompletion: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl text-slate-900">Extend PTW</h2>
              <p className="text-sm text-slate-600">{ptwNumber}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current End Date/Time Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 mb-2">Current End Date & Time</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <span className="font-medium">Date:</span> {currentEndDate}
              </div>
              <div>
                <span className="font-medium">Time:</span> {currentEndTime}
              </div>
            </div>
          </div>

          {/* New End Date */}
          <div>
            <Label htmlFor="newEndDate">
              New End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newEndDate"
              type="date"
              value={formData.newEndDate}
              onChange={(e) => setFormData({ ...formData, newEndDate: e.target.value })}
              min={currentEndDate}
              className={errors.newEndDate ? 'border-red-500' : ''}
            />
            {errors.newEndDate && (
              <p className="text-sm text-red-500 mt-1">{errors.newEndDate}</p>
            )}
          </div>

          {/* New End Time */}
          <div>
            <Label htmlFor="newEndTime">
              New End Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newEndTime"
              type="time"
              value={formData.newEndTime}
              onChange={(e) => setFormData({ ...formData, newEndTime: e.target.value })}
              className={errors.newEndTime ? 'border-red-500' : ''}
            />
            {errors.newEndTime && (
              <p className="text-sm text-red-500 mt-1">{errors.newEndTime}</p>
            )}
          </div>

          {/* Extension Reason */}
          <div>
            <Label htmlFor="extensionReason">
              Reason for Extension <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="extensionReason"
              value={formData.extensionReason}
              onChange={(e) => setFormData({ ...formData, extensionReason: e.target.value })}
              placeholder="Explain why the work requires additional time..."
              rows={4}
              className={errors.extensionReason ? 'border-red-500' : ''}
            />
            {errors.extensionReason && (
              <p className="text-sm text-red-500 mt-1">{errors.extensionReason}</p>
            )}
          </div>

          {/* Estimated Completion */}
          <div>
            <Label htmlFor="estimatedCompletion">
              Current Work Completion (%) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="estimatedCompletion"
              type="number"
              min="0"
              max="100"
              value={formData.estimatedCompletion}
              onChange={(e) => setFormData({ ...formData, estimatedCompletion: e.target.value })}
              placeholder="e.g., 65"
              className={errors.estimatedCompletion ? 'border-red-500' : ''}
            />
            {errors.estimatedCompletion && (
              <p className="text-sm text-red-500 mt-1">{errors.estimatedCompletion}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">
              Enter the percentage of work completed so far
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">Important Notice</p>
                <p className="text-sm text-yellow-800">
                  Extending this PTW will require re-approval from safety personnel. All workers
                  will be notified of the extension via email and SMS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <CalendarClock className="w-4 h-4" />
            Extend PTW
          </Button>
        </div>
      </div>
    </div>
  );
}