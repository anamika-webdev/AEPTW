// src/components/shared/StatusBadge.tsx
import React from 'react';
import { PermitStatus } from '../../types';

interface StatusBadgeProps {
  status: PermitStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<PermitStatus, { label: string; className: string }> = {
  Draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  Pending_Approval: {
    label: 'Pending Approval',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  Active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  Extension_Requested: {
    label: 'Extension Requested',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  Suspended: {
    label: 'Suspended',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  Closed: {
    label: 'Closed',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  Cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  Rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.className} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
};