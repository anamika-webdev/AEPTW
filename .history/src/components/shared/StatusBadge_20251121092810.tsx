export type PTWStatus = 'initiated' | 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'closed' | 'expired' | 'extended';

interface StatusBadgeProps {
  status: PTWStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    initiated: {
      label: 'Initiated',
      classes: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    pending: {
      label: 'Pending',
      classes: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    approved: {
      label: 'Approved',
      classes: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      label: 'Rejected',
      classes: 'bg-red-100 text-red-700 border-red-200',
    },
    'in-progress': {
      label: 'In Progress',
      classes: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    completed: {
      label: 'Completed',
      classes: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    closed: {
      label: 'Closed',
      classes: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    expired: {
      label: 'Expired',
      classes: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    extended: {
      label: 'Extended',
      classes: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${config.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
      {config.label}
    </span>
  );
}