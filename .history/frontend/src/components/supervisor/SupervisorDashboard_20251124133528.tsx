// src/components/supervisor/SupervisorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { StatCard } from '../shared/StatCard';
import { StatusBadge } from '../shared/StatusBadge';
import { Button } from '../ui/button';
import { mockPermits, mockDashboardStats, getActivePermits, getPendingPermits } from '../../lib/mockData';
import { useAppContext } from '../../App';
import { ExtendPTWModal } from './ExtendPTWModal';
import { ClosePTWModal, ClosureData } from './ClosePTWModal';
import { PermitWithDetails, PermitType } from '../../types';

type FilterType = 'all' | 'active' | 'pending' | 'expiring';
type TabType = 'overview' | 'active' | 'pending' | 'team';

export const SupervisorDashboard: React.FC = () => {
  const { currentUser } = useAppContext();
  const [permits, setPermits] = useState<PermitWithDetails[]>(mockPermits);
  const [filteredPermits, setFilteredPermits] = useState<PermitWithDetails[]>(mockPermits);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [extendModalOpen, setExtendModalOpen] = useState<boolean>(false);
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);
  const [selectedPermit, setSelectedPermit] = useState<PermitWithDetails | null>(null);

  // Filter permits based on selected filter and search
  useEffect(() => {
    let filtered = [...permits];

    // Apply status filter
    switch (selectedFilter) {
      case 'active':
        filtered = filtered.filter((p: PermitWithDetails) => p.status === 'Active');
        break;
      case 'pending':
        filtered = filtered.filter((p: PermitWithDetails) => p.status === 'Pending_Approval');
        break;
      case 'expiring':
        filtered = filtered.filter((p: PermitWithDetails) => {
          if (p.status !== 'Active') return false;
          const endTime = new Date(p.end_time);
          const now = new Date();
          const hoursRemaining = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursRemaining <= 2 && hoursRemaining > 0;
        });
        break;
      default:
        // all - no filter
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((p: PermitWithDetails) =>
        p.permit_serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.work_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.work_description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPermits(filtered);
  }, [permits, selectedFilter, searchQuery]);

  // Calculate stats
  const stats = {
    total: permits.length,
    active: permits.filter((p: PermitWithDetails) => p.status === 'Active').length,
    pending: permits.filter((p: PermitWithDetails) => p.status === 'Pending_Approval').length,
    expiringSoon: permits.filter((p: PermitWithDetails) => {
      if (p.status !== 'Active') return false;
      const endTime = new Date(p.end_time);
      const now = new Date();
      const hoursRemaining = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursRemaining <= 2 && hoursRemaining > 0;
    }).length,
  };

  const handleExtendPTW = (permitId: number, newEndTime: string, reason: string): void => {
    console.log('Extending permit:', permitId, newEndTime, reason);
    // In real app, call API to request extension
    alert(`Extension request submitted for permit #${permitId}`);
  };

  const handleClosePTW = (permitId: number, closureData: ClosureData): void => {
    console.log('Closing permit:', permitId, closureData);
    // In real app, call API to close permit
    setPermits(prevPermits =>
      prevPermits.map(p =>
        p.id === permitId ? { ...p, status: 'Closed' as const } : p
      )
    );
    alert(`Permit #${permitId} closed successfully!`);
  };

  const openExtendModal = (permit: PermitWithDetails): void => {
    setSelectedPermit(permit);
    setExtendModalOpen(true);
  };

  const openCloseModal = (permit: PermitWithDetails): void => {
    setSelectedPermit(permit);
    setCloseModalOpen(true);
  };

  const getPermitTypeColor = (type: PermitType): string => {
    const colors: Record<PermitType, string> = {
      General: 'bg-gray-100 text-gray-800',
      Height: 'bg-blue-100 text-blue-800',
      Hot_Work: 'bg-red-100 text-red-800',
      Electrical: 'bg-yellow-100 text-yellow-800',
      Confined_Space: 'bg-purple-100 text-purple-800',
    };
    return colors[type];
  };

  const formatPermitType = (type: PermitType): string => {
    return type.replace(/_/g, ' ');
  };

  const calculateTimeRemaining = (endTime: string): string => {
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m remaining`;
    }
    return `${diffMins}m remaining`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Supervisor Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {currentUser?.full_name || 'Supervisor'}
              </p>
            </div>
            <Button variant="primary">
              + Create New Permit
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Permits"
            value={stats.total}
            color="blue"
            onClick={() => setSelectedFilter('all')}
          />
          <StatCard
            title="Active Permits"
            value={stats.active}
            color="green"
            onClick={() => setSelectedFilter('active')}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            color="yellow"
            onClick={() => setSelectedFilter('pending')}
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            color="red"
            subtitle="< 2 hours remaining"
            onClick={() => setSelectedFilter('expiring')}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex px-6 -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Permits ({stats.active})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'team'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Members
              </button>
            </nav>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by permit ID, location, or description..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'active' ? 'success' : 'outline'}
                  onClick={() => setSelectedFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={selectedFilter === 'pending' ? 'warning' : 'outline'}
                  onClick={() => setSelectedFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={selectedFilter === 'expiring' ? 'danger' : 'outline'}
                  onClick={() => setSelectedFilter('expiring')}
                >
                  Expiring
                </Button>
              </div>
            </div>
          </div>

          {/* Permits List */}
          <div className="p-6">
            {filteredPermits.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No permits found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPermits.map((permit: PermitWithDetails) => (
                  <div
                    key={permit.id}
                    className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {permit.permit_serial}
                          </h3>
                          <StatusBadge status={permit.status} />
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Type:</span>{' '}
                            <span className={`px-2 py-0.5 rounded ${getPermitTypeColor(permit.permit_type)}`}>
                              {formatPermitType(permit.permit_type)}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Location:</span> {permit.work_location}
                          </p>
                          <p>
                            <span className="font-medium">Description:</span> {permit.work_description}
                          </p>
                          <p>
                            <span className="font-medium">Site:</span> {permit.site?.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {permit.status === 'Active' && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500">Time Remaining</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {calculateTimeRemaining(permit.end_time)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team Members */}
                    {permit.team_members && permit.team_members.length > 0 && (
                      <div className="pt-3 mb-3 border-t border-gray-100">
                        <p className="mb-2 text-xs font-medium text-gray-500">Team Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {permit.team_members.map((worker, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs text-blue-700 rounded-md bg-blue-50"
                            >
                              {worker.worker_name} ({worker.worker_role})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {permit.status === 'Active' && (
                        <>
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => openExtendModal(permit)}
                          >
                            Extend
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => openCloseModal(permit)}
                          >
                            Close
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExtendPTWModal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        permit={selectedPermit}
        onExtend={handleExtendPTW}
      />
      
      <ClosePTWModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        permit={selectedPermit}
        onClosePTW={handleClosePTW}
      />
    </div>
  );
};