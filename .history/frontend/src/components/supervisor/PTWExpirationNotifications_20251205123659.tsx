// PTWExpirationNotifications.tsx - Add this new component file
// Location: frontend/src/components/supervisor/PTWExpirationNotifications.tsx

import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, X } from 'lucide-react';

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  end_time: string;
  status: string;
}

interface PTWExpirationNotificationsProps {
  permits: Permit[];
  onViewPermit: (permit: Permit) => void;
}

interface ExpiringPermit extends Permit {
  minutesRemaining: number;
  isUrgent: boolean;
}

export function PTWExpirationNotifications({ permits, onViewPermit }: PTWExpirationNotificationsProps) {
  const [expiringPermits, setExpiringPermits] = useState<ExpiringPermit[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check for expiring permits every 30 seconds
    const checkExpiringPermits = () => {
      const now = new Date();
      const activePermits = permits.filter(p => p.status === 'Active');
      
      const expiring: ExpiringPermit[] = activePermits
        .map(permit => {
          const endTime = new Date(permit.end_time);
          const diffMs = endTime.getTime() - now.getTime();
          const minutesRemaining = Math.floor(diffMs / (1000 * 60));
          
          return {
            ...permit,
            minutesRemaining,
            isUrgent: minutesRemaining <= 10, // Red alert for last 10 minutes
          };
        })
        .filter(permit => {
          // Show notifications for permits ending in 60 minutes or less
          return permit.minutesRemaining > 0 && permit.minutesRemaining <= 60 && !dismissed.has(permit.id);
        })
        .sort((a, b) => a.minutesRemaining - b.minutesRemaining);
      
      setExpiringPermits(expiring);
    };

    checkExpiringPermits();
    const interval = setInterval(checkExpiringPermits, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [permits, dismissed]);

  const dismissNotification = (permitId: number) => {
    setDismissed(prev => new Set(prev).add(permitId));
  };

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (expiringPermits.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Summary Banner */}
      <div className="flex items-center gap-3 p-4 border-2 rounded-lg border-amber-400 bg-amber-50">
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-amber-100">
          <Bell className="w-5 h-5 text-amber-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">
            {expiringPermits.length} PTW{expiringPermits.length !== 1 ? 's' : ''} Expiring Soon
          </h3>
          <p className="text-sm text-amber-700">
            Review and extend or close these permits before expiration
          </p>
        </div>
      </div>

      {/* Individual Notifications */}
      <div className="space-y-2">
        {expiringPermits.map((permit) => (
          <div
            key={permit.id}
            className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${
              permit.isUrgent
                ? 'border-red-400 bg-red-50 animate-pulse'
                : permit.minutesRemaining <= 30
                ? 'border-orange-400 bg-orange-50'
                : 'border-yellow-400 bg-yellow-50'
            }`}
          >
            {/* Icon */}
            <div
              className={`flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full ${
                permit.isUrgent
                  ? 'bg-red-100'
                  : permit.minutesRemaining <= 30
                  ? 'bg-orange-100'
                  : 'bg-yellow-100'
              }`}
            >
              {permit.isUrgent ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Clock className="w-5 h-5 text-orange-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h4
                    className={`font-semibold ${
                      permit.isUrgent ? 'text-red-900' : 'text-amber-900'
                    }`}
                  >
                    {permit.permit_serial}
                  </h4>
                  <p className="text-sm text-slate-600">{permit.work_location}</p>
                </div>
                <button
                  onClick={() => dismissNotification(permit.id)}
                  className="flex-shrink-0 p-1 transition-colors text-slate-400 hover:text-slate-600"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    permit.isUrgent
                      ? 'bg-red-100 text-red-800'
                      : permit.minutesRemaining <= 30
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Expires in {formatTimeRemaining(permit.minutesRemaining)}
                </span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                  {permit.permit_type}
                </span>
              </div>

              {permit.isUrgent && (
                <p className="mb-2 text-sm font-semibold text-red-700">
                  ⚠️ URGENT: Less than 10 minutes remaining!
                </p>
              )}

              <button
                onClick={() => onViewPermit(permit)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  permit.isUrgent
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                View & Take Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PTWExpirationNotifications;