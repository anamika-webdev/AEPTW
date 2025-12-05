// frontend/src/components/supervisor/ClosePTWModal.tsx
// COMPLETE VERSION WITH DIGITAL SIGNATURE CANVAS

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { X, AlertTriangle, CheckCircle, PenTool, RotateCcw } from 'lucide-react';

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
  onSubmit: (closureData: ClosureData) => void;
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
  onSubmit,
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  if (!isOpen || !permit) return null;

  const handleCheckboxChange = (field: keyof ClosureData) => {
    setClosureData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setClosureData(prev => ({ ...prev, supervisor_signature: '' }));
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

    if (!hasSignature) {
      alert('Please provide your digital signature before closing.');
      return;
    }

    // Save signature as base64
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png');
      const dataToSubmit = {
        ...closureData,
        supervisor_signature: signatureData
      };
      onSubmit(dataToSubmit);
    }
  };

  const allChecklistComplete = 
    closureData.housekeeping_done &&
    closureData.tools_removed &&
    closureData.locks_removed &&
    closureData.area_restored;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Close PTW</h2>
              <p className="text-sm text-gray-600">{permit.permit_serial}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* PTW Details */}
          <div className="p-4 space-y-2 rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">PTW Details</h3>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Location:</span> {permit.work_location}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Work:</span> {permit.work_description}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Closure Checklist <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 transition-colors border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.housekeeping_done}
                  onChange={() => handleCheckboxChange('housekeeping_done')}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Housekeeping completed</span>
                  <p className="text-sm text-gray-600">Work area cleaned and organized</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 transition-colors border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.tools_removed}
                  onChange={() => handleCheckboxChange('tools_removed')}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">All tools removed</span>
                  <p className="text-sm text-gray-600">Equipment cleared from site</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 transition-colors border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.locks_removed}
                  onChange={() => handleCheckboxChange('locks_removed')}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Locks/Tags removed</span>
                  <p className="text-sm text-gray-600">All LOTO devices removed</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 transition-colors border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={closureData.area_restored}
                  onChange={() => handleCheckboxChange('area_restored')}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Area restored to normal</span>
                  <p className="text-sm text-gray-600">Returned to operational state</p>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Completion Notes (Optional)
            </label>
            <textarea
              value={closureData.completion_notes}
              onChange={(e) => setClosureData({ ...closureData, completion_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Details about completed work..."
              rows={3}
            />
          </div>

          {/* Incidents */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Safety Issues (Optional)
            </label>
            <textarea
              value={closureData.safety_incidents}
              onChange={(e) => setClosureData({ ...closureData, safety_incidents: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Report any incidents..."
              rows={2}
            />
          </div>

          {/* Digital Signature */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Digital Signature <span className="text-red-500">*</span>
            </label>
            <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PenTool className="w-4 h-4" />
                  <span>Sign with mouse or touchpad</span>
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 transition-colors border border-gray-300 rounded hover:bg-gray-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full bg-white border-2 border-gray-300 rounded cursor-crosshair"
              />
              {hasSignature && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Signature captured</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 border-l-4 border-red-400 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Important</p>
                <p className="mt-1 text-sm text-red-700">
                  Closing this PTW is final and cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!allChecklistComplete || !hasSignature}
              className={`flex-1 ${
                allChecklistComplete && hasSignature
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