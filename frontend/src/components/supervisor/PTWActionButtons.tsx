// frontend/src/components/supervisor/PTWActionButtons.tsx
// Styled buttons matching the Figma design

import React from 'react';
import { Calendar, X } from 'lucide-react';

interface PTWActionButtonsProps {
  onExtend: () => void;
  onClose: () => void;
  showExtend?: boolean;
  showClose?: boolean;
}

export const PTWActionButtons: React.FC<PTWActionButtonsProps> = ({
  onExtend,
  onClose,
  showExtend = true,
  showClose = true,
}) => {
  return (
    <div className="flex gap-2">
      {showExtend && (
        <button
          onClick={onExtend}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 transition-all bg-white border border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300"
        >
          <Calendar className="w-4 h-4" />
          Extend
        </button>
      )}
      
      {showClose && (
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition-all bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      )}
    </div>
  );
};