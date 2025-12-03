// frontend/src/components/supervisor/NameInputField.tsx
// ⚡ SOLUTION 1: Separate component that doesn't re-render with parent

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface NameInputFieldProps {
  questionId: number;
  label: string;
  initialValue?: string;
  onSave: (value: string) => void;
}

export default function NameInputField({ 
  questionId, 
  label, 
  initialValue = '', 
  onSave 
}: NameInputFieldProps) {
  // Local state - NOT affected by parent re-renders
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update parent ONLY when user leaves the field (onBlur)
  const handleBlur = () => {
    if (value !== initialValue) {
      onSave(value);
      console.log(`💾 Saved ${label}:`, value);
    }
  };

  // Handle Enter key to also save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur(); // Trigger blur to save
    }
  };

  return (
    <div className="py-4 space-y-2 border-b border-slate-200">
      <Label 
        htmlFor={`name-${questionId}`} 
        className="text-sm font-medium text-slate-900"
      >
        {label} <span className="text-red-500">*</span>
      </Label>
      <Input
        ref={inputRef}
        id={`name-${questionId}`}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Enter full name..."
        required
        className="w-full max-w-lg text-base"
        autoComplete="off"
      />
      {value && value.length < 2 && (
        <p className="text-xs text-amber-600">
          Please enter a valid full name (at least 2 characters)
        </p>
      )}
    </div>
  );
}