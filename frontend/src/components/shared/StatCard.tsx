// src/components/shared/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'orange' | 'green' | 'yellow' | 'red' | 'gray';
  subtitle?: string;
  onClick?: () => void;
}

const colorClasses = {
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'orange',
  subtitle,
  onClick,
}) => {
  const colorClass = colorClasses[color];
  const isClickable = !!onClick;

  return (
    <div
      className={`border rounded-lg p-4 ${colorClass} ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
        }`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs opacity-70">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 opacity-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};