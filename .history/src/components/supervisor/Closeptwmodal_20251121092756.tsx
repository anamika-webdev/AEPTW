import { useState } from 'react';
import { X, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { DigitalSignature } from '../shared/DigitalSignature';

interface ClosePTWModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClosePTW: (data: ClosePTWData) => void;
  ptwNumber: string;
  location: string;
  workDescription: string;
}

export interface ClosePTWData {
  completionNotes: string;
  safetyIssues: string;
  allWorkCompleted: boolean;
  areaCleanedUp: boolean;
  toolsRemoved: boolean;
  hazardsEliminated: boolean;
  supervisorSignature: string;
}

export function ClosePTWModal({
  isOpen,
  onClose,
  onClosePTW,
  ptwNumber,
  location,
  workDescription,
}: ClosePTWModalProps) {
  const [formData, setFormData] = useState<ClosePTWData>({
    completionNotes: '',
    safetyIssues: '',
    allWorkCompleted: false,
    areaCleanedUp: false,
    toolsRemoved: false,
    hazardsEliminated: false,
    supervisorSignature: '',
  });

  const [showSignature, setShowSignature] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.completionNotes.trim()) {
      newErrors.completionNotes = 'Completion notes are required';
    }

    if (!formData.allWorkCompleted) {
      newErrors.allWorkCompleted = 'Please confirm all work is completed';
    }

    if (!formData.areaCleanedUp) {
      newErrors.areaCleanedUp = 'Please confirm area is cleaned up';
    }

    if (!formData.toolsRemoved) {
      newErrors.toolsRemoved = 'Please confirm all tools are removed';
    }

    if (!formData.hazardsEliminated) {
      newErrors.hazardsEliminated = 'Please confirm all hazards are eliminated';
    }

    if (!formData.supervisorSignature) {
      newErrors.supervisorSignature = 'Supervisor signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onClosePTW(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      completionNotes: '',
      safetyIssues: '',
      allWorkCompleted: false,
      areaCleanedUp: false,
      toolsRemoved: false,
      hazardsEliminated: false,
      supervisorSignature: '',
    });
    setErrors({});
    onClose();
  };

  const handleSignatureSave = (signature: string) => {
    setFormData({ ...formData, supervisorSignature: signature });
    setShowSignature(false);
  };

  const allChecklistChecked =
    formData.allWorkCompleted &&
    formData.areaCleanedUp &&
    formData.toolsRemoved &&
    formData.hazardsEliminated;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl text-slate-900">Close PTW</h2>
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
            {/* PTW Details */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-3">PTW Details</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Location:</span> {location}
                </div>
                <div>
                  <span className="font-medium">Work Description:</span> {workDescription}
                </div>
              </div>
            </div>

            {/* Completion Checklist */}
            <div>
              <Label className="mb-3 block">
                Completion Checklist <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.allWorkCompleted
                      ? 'border-green-500 bg-green-50'
                      : errors.allWorkCompleted
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={formData.allWorkCompleted}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allWorkCompleted: !!checked })
                    }
                  />
                  <div>
                    <p className="text-slate-900 font-medium">All work has been completed</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Confirm that all tasks specified in the work description are finished
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.areaCleanedUp
                      ? 'border-green-500 bg-green-50'
                      : errors.areaCleanedUp
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={formData.areaCleanedUp}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, areaCleanedUp: !!checked })
                    }
                  />
                  <div>
                    <p className="text-slate-900 font-medium">Work area has been cleaned up</p>
                    <p className="text-sm text-slate-600 mt-1">
                      All debris, materials, and waste have been removed from the work area
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.toolsRemoved
                      ? 'border-green-500 bg-green-50'
                      : errors.toolsRemoved
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={formData.toolsRemoved}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, toolsRemoved: !!checked })
                    }
                  />
                  <div>
                    <p className="text-slate-900 font-medium">All tools and equipment removed</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Tools, equipment, and machinery have been removed from the site
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.hazardsEliminated
                      ? 'border-green-500 bg-green-50'
                      : errors.hazardsEliminated
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={formData.hazardsEliminated}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hazardsEliminated: !!checked })
                    }
                  />
                  <div>
                    <p className="text-slate-900 font-medium">All hazards have been eliminated</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Temporary hazards created during work have been removed or secured
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Completion Notes */}
            <div>
              <Label htmlFor="completionNotes">
                Completion Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="completionNotes"
                value={formData.completionNotes}
                onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
                placeholder="Provide details about the completed work, any observations, or handover notes..."
                rows={4}
                className={errors.completionNotes ? 'border-red-500' : ''}
              />
              {errors.completionNotes && (
                <p className="text-sm text-red-500 mt-1">{errors.completionNotes}</p>
              )}
            </div>

            {/* Safety Issues (Optional) */}
            <div>
              <Label htmlFor="safetyIssues">Safety Issues or Incidents (Optional)</Label>
              <Textarea
                id="safetyIssues"
                value={formData.safetyIssues}
                onChange={(e) => setFormData({ ...formData, safetyIssues: e.target.value })}
                placeholder="Report any safety issues, near misses, or incidents that occurred during the work..."
                rows={3}
              />
              <p className="text-sm text-slate-500 mt-1">
                Leave blank if no incidents occurred
              </p>
            </div>

            {/* Supervisor Signature */}
            <div>
              <Label>
                Supervisor Signature <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2">
                {formData.supervisorSignature ? (
                  <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Signature Captured</span>
                      <Button
                        onClick={() => setShowSignature(true)}
                        variant="outline"
                        size="sm"
                      >
                        Update Signature
                      </Button>
                    </div>
                    <img
                      src={formData.supervisorSignature}
                      alt="Supervisor Signature"
                      className="h-20 bg-white border border-green-200 rounded"
                    />
                  </div>
                ) : (
                  <div>
                    <Button
                      onClick={() => setShowSignature(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Add Supervisor Signature
                    </Button>
                    {errors.supervisorSignature && (
                      <p className="text-sm text-red-500 mt-1">{errors.supervisorSignature}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900 mb-1">Important</p>
                  <p className="text-sm text-orange-800">
                    Closing this PTW is a final action. Once closed, the permit cannot be reopened.
                    Ensure all work is complete and all safety requirements are met before closing.
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
              disabled={!allChecklistChecked || !formData.supervisorSignature}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Close PTW
            </Button>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <DigitalSignature
          onSave={handleSignatureSave}
          onClose={() => setShowSignature(false)}
          title="Supervisor Signature"
        />
      )}
    </>
  );
}