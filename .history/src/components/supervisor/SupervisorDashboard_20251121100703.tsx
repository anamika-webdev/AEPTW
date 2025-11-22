import { useState } from 'react';
import { Users, FileText, Clock, CheckCircle, PlayCircle, XCircle, CalendarClock, X as CloseIcon } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { StatusBadge } from '../shared/StatusBadge';
import { Button } from '../ui/button';
import { mockPTWs, mockWorkers, type PTW } from '../../lib/mockData';
import type { CurrentPage } from '../../App';
import { ExtendPTWModal, type ExtendPTWData } from './ExtendPTWModal';
import { ClosePTWModal, type ClosePTWData } from './ClosePTWModal';

interface SupervisorDashboardProps {
  onNavigate: (page: CurrentPage) => void;
  onPTWSelect: (ptwId: string) => void;
}

export function SupervisorDashboard({ onNavigate, onPTWSelect }: SupervisorDashboardProps) {
  const [ptwData, setPTWData] = useState<PTW[]>(mockPTWs);
  
  // Modal states
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);

  // Filter PTWs by supervisor (in real app, filter by logged-in supervisor)
  const myPTWs = ptwData.filter(ptw => ptw.issuer === 'Priya Sharma');
  const initiatedPTWs = myPTWs.filter(ptw => ptw.status === 'initiated');
  const pendingPTWs = myPTWs.filter(ptw => ptw.status === 'pending');
  const approvedPTWs = myPTWs.filter(ptw => ptw.status === 'approved');
  const inProgressPTWs = myPTWs.filter(ptw => ptw.status === 'in-progress');
  const closedPTWs = myPTWs.filter(ptw => ptw.status === 'closed');
  const completedPTWs = myPTWs.filter(ptw => ptw.status === 'completed');
  const rejectedPTWs = myPTWs.filter(ptw => ptw.status === 'rejected');
  const expiredPTWs = myPTWs.filter(ptw => ptw.status === 'expired');
  const extendedPTWs = myPTWs.filter(ptw => ptw.status === 'extended');
  const myWorkers = mockWorkers.filter(w => w.site === 'Mumbai Data Center');

  const handleExtendPTWClick = (ptwId: string) => {
    const ptw = ptwData.find(p => p.id === ptwId);
    if (ptw) {
      setSelectedPTW(ptw);
      setExtendModalOpen(true);
    }
  };

  const handleClosePTWClick = (ptwId: string) => {
    const ptw = ptwData.find(p => p.id === ptwId);
    if (ptw) {
      setSelectedPTW(ptw);
      setCloseModalOpen(true);
    }
  };

  const handleExtendPTW = (data: ExtendPTWData) => {
    if (!selectedPTW) return;

    // Update PTW with extended status
    const updatedPTWs = ptwData.map(ptw => {
      if (ptw.id === selectedPTW.id) {
        return {
          ...ptw,
          status: 'extended' as const,
          endDate: data.newEndDate,
          extensionData: {
            originalEndDate: ptw.endDate,
            newEndDate: data.newEndDate,
            newEndTime: data.newEndTime,
            reason: data.extensionReason,
            completionPercentage: data.estimatedCompletion,
            extendedAt: new Date().toISOString(),
            extendedBy: 'Priya Sharma',
          },
        };
      }
      return ptw;
    });

    setPTWData(updatedPTWs);
    alert(`✅ PTW ${selectedPTW.ptwNumber} has been extended successfully!\n\nNew End Date: ${data.newEndDate}\nNew End Time: ${data.newEndTime}\n\nThe PTW has been moved to the "PTW Extended" section.`);
    setExtendModalOpen(false);
    setSelectedPTW(null);
  };

  const handleClosePTW = (data: ClosePTWData) => {
    if (!selectedPTW) return;

    // Update PTW with closed status
    const updatedPTWs = ptwData.map(ptw => {
      if (ptw.id === selectedPTW.id) {
        return {
          ...ptw,
          status: 'closed' as const,
          closureData: {
            completionNotes: data.completionNotes,
            safetyIssues: data.safetyIssues,
            closedAt: new Date().toISOString(),
            closedBy: 'Priya Sharma',
            supervisorSignature: data.supervisorSignature,
          },
        };
      }
      return ptw;
    });

    setPTWData(updatedPTWs);
    alert(`✅ PTW ${selectedPTW.ptwNumber} has been closed successfully!\n\nAll work has been completed and documented.\n\nThe PTW has been moved to the "Closed PTWs" section.`);
    setCloseModalOpen(false);
    setSelectedPTW(null);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'General': 'bg-slate-100 text-slate-700',
      'Height': 'bg-orange-100 text-orange-700',
      'Electrical': 'bg-yellow-100 text-yellow-700',
      'Hot Work': 'bg-red-100 text-red-700',
      'Confined Space': 'bg-purple-100 text-purple-700',
    };
    return colors[category as keyof typeof colors] || 'bg-blue-100 text-blue-700';
  };

  const PTWTable = ({ ptws, emptyMessage, showCloseButton = false }: { ptws: typeof myPTWs; emptyMessage: string; showCloseButton?: boolean }) => (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        {ptws.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs text-slate-600">PTW Number</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Category</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Location</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Workers</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Start Date</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Status</th>
                {showCloseButton && (
                  <th className="px-3 py-3 text-left text-xs text-slate-600">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ptws.map((ptw) => (
                <tr
                  key={ptw.id}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-3 py-3 text-sm text-slate-900" onClick={() => onPTWSelect(ptw.id)}>{ptw.ptwNumber}</td>
                  <td className="px-3 py-3" onClick={() => onPTWSelect(ptw.id)}>
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ptw.category)}`}>
                      {ptw.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600" onClick={() => onPTWSelect(ptw.id)}>{ptw.location}</td>
                  <td className="px-3 py-3 text-sm text-slate-600" onClick={() => onPTWSelect(ptw.id)}>{ptw.assignedWorkers.length}</td>
                  <td className="px-3 py-3 text-sm text-slate-600" onClick={() => onPTWSelect(ptw.id)}>{ptw.startDate}</td>
                  <td className="px-3 py-3" onClick={() => onPTWSelect(ptw.id)}>
                    <StatusBadge status={ptw.status} />
                  </td>
                  {showCloseButton && (
                    <td className="px-3 py-3">
                      <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleClosePTWClick(ptw.id); }}>
                        Close
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-center py-8">{emptyMessage}</p>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {ptws.length > 0 ? (
          ptws.map((ptw) => (
            <button
              key={ptw.id}
              onClick={() => onPTWSelect(ptw.id)}
              className="w-full text-left p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-slate-900">{ptw.ptwNumber}</p>
                <StatusBadge status={ptw.status} />
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ptw.category)}`}>
                    {ptw.category}
                  </span>
                </div>
                <p>📍 {ptw.location}</p>
                <p>👥 {ptw.assignedWorkers.length} workers</p>
                <p>📅 {ptw.startDate}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-slate-500 text-center py-8">{emptyMessage}</p>
        )}
      </div>
    </>
  );

  // In Progress PTW Table with Direct Action Buttons
  const InProgressPTWTable = ({ ptws, emptyMessage }: { ptws: typeof myPTWs; emptyMessage: string }) => (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        {ptws.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs text-slate-600">PTW Number</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Category</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Location</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Workers</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Start Date</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Status</th>
                <th className="px-3 py-3 text-left text-xs text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ptws.map((ptw) => (
                <tr key={ptw.id} className="hover:bg-slate-50">
                  <td 
                    className="px-3 py-3 text-sm text-slate-900 cursor-pointer"
                    onClick={() => onPTWSelect(ptw.id)}
                  >
                    {ptw.ptwNumber}
                  </td>
                  <td 
                    className="px-3 py-3 cursor-pointer"
                    onClick={() => onPTWSelect(ptw.id)}
                  >
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ptw.category)}`}>
                      {ptw.category}
                    </span>
                  </td>
                  <td 
                    className="px-3 py-3 text-sm text-slate-600 cursor-pointer"
                    onClick={() => onPTWSelect(ptw.id)}
                  >
                    {ptw.location}
                  </td>
                  <td 
                    className="px-3 py-3 text-sm text-slate-600 cursor-pointer"
                    onClick={() => onPTWSelect(ptw.id)}
                  >
                    {ptw.assignedWorkers.length}
                  </td>
                  <td 
                    className="px-3 py-3 text-sm text-slate-600 cursor-pointer"
                    onClick={() => onPTWSelect(ptw.id)}
                  >
                    {ptw.startDate}
                  </td>
                  <td 
                    className="px-3 py-3 cursor-pointer"
                    onClick={() => onPTWSelect(ptw.id)}
                  >
                    <StatusBadge status={ptw.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExtendPTWClick(ptw.id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1.5"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        Extend
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClosePTWClick(ptw.id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors flex items-center gap-1.5"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-center py-8">{emptyMessage}</p>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {ptws.length > 0 ? (
          ptws.map((ptw) => (
            <div
              key={ptw.id}
              className="p-4 bg-slate-50 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => onPTWSelect(ptw.id)}
                  className="text-left flex-1"
                >
                  <p className="text-slate-900 font-medium">{ptw.ptwNumber}</p>
                </button>
                <StatusBadge status={ptw.status} />
              </div>
              
              <button
                onClick={() => onPTWSelect(ptw.id)}
                className="w-full text-left mb-3"
              >
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ptw.category)}`}>
                      {ptw.category}
                    </span>
                  </div>
                  <p>📍 {ptw.location}</p>
                  <p>👥 {ptw.assignedWorkers.length} workers</p>
                  <p>📅 {ptw.startDate}</p>
                </div>
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExtendPTWClick(ptw.id);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarClock className="w-4 h-4" />
                  Extend
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClosePTWClick(ptw.id);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <CloseIcon className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-8">{emptyMessage}</p>
        )}
      </div>
    </>
  );

  // All Permits Table
  const AllPermitsTable = ({ ptws }: { ptws: typeof myPTWs }) => (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="px-3 py-3 text-left text-xs text-slate-600">PTW #</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">Category</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">Work Description</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">Location</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">Workers</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">Start Date</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">End Date</th>
              <th className="px-3 py-3 text-left text-xs text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ptws.map((ptw) => {
              const getRowColor = () => {
                switch (ptw.status) {
                  case 'initiated': return 'bg-slate-50 hover:bg-slate-100';
                  case 'pending': return 'bg-yellow-50 hover:bg-yellow-100';
                  case 'approved': return 'bg-green-50 hover:bg-green-100';
                  case 'in-progress': return 'bg-blue-50 hover:bg-blue-100';
                  case 'completed': return 'bg-purple-50 hover:bg-purple-100';
                  case 'closed': return 'bg-gray-50 hover:bg-gray-100';
                  case 'rejected': return 'bg-red-50 hover:bg-red-100';
                  case 'expired': return 'bg-orange-50 hover:bg-orange-100';
                  case 'extended': return 'bg-indigo-50 hover:bg-indigo-100';
                  default: return 'hover:bg-slate-50';
                }
              };

              return (
                <tr
                  key={ptw.id}
                  onClick={() => onPTWSelect(ptw.id)}
                  className={`cursor-pointer transition-colors ${getRowColor()}`}
                >
                  <td className="px-3 py-3 text-sm text-slate-900">{ptw.ptwNumber}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ptw.category)}`}>
                      {ptw.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700 max-w-xs truncate">
                    {ptw.workDescription}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{ptw.location}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      {ptw.assignedWorkers.slice(0, 2).map((worker, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-slate-200">
                          {worker}
                        </span>
                      ))}
                      {ptw.assignedWorkers.length > 2 && (
                        <span className="text-xs text-slate-500">+{ptw.assignedWorkers.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{ptw.startDate}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{ptw.endDate}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={ptw.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {ptws.map((ptw) => {
          const getCardColor = () => {
            switch (ptw.status) {
              case 'initiated': return 'border-l-4 border-l-slate-400 bg-slate-50';
              case 'pending': return 'border-l-4 border-l-yellow-400 bg-yellow-50';
              case 'approved': return 'border-l-4 border-l-green-400 bg-green-50';
              case 'in-progress': return 'border-l-4 border-l-blue-400 bg-blue-50';
              case 'completed': return 'border-l-4 border-l-purple-400 bg-purple-50';
              case 'closed': return 'border-l-4 border-l-gray-400 bg-gray-50';
              case 'rejected': return 'border-l-4 border-l-red-400 bg-red-50';
              case 'expired': return 'border-l-4 border-l-orange-400 bg-orange-50';
              case 'extended': return 'border-l-4 border-l-indigo-400 bg-indigo-50';
              default: return 'border-l-4 border-l-slate-200';
            }
          };

          return (
            <button
              key={ptw.id}
              onClick={() => onPTWSelect(ptw.id)}
              className={`w-full text-left p-4 rounded-lg transition-all ${getCardColor()}`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-slate-900">{ptw.ptwNumber}</p>
                <StatusBadge status={ptw.status} />
              </div>
              <div className="mb-2">
                <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ptw.category)}`}>
                  {ptw.category}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-3">{ptw.workDescription}</p>
              <div className="space-y-1 text-xs text-slate-600">
                <div>📍 {ptw.location}</div>
                <div>👥 {ptw.assignedWorkers.join(', ')}</div>
                <div>📅 {ptw.startDate} - {ptw.endDate}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-2">Supervisor Dashboard</h1>
          <p className="text-slate-600">Manage workers and create PTW permits</p>
        </div>
        <Button
          onClick={() => onNavigate('create-ptw')}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
        >
          <FileText className="w-4 h-4" />
          Create New PTW
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <button onClick={() => onNavigate('worker-list')} className="text-left">
          <StatCard
            title="Total Workers"
            value={myWorkers.length}
            icon={Users}
            color="blue"
          />
        </button>
        <div>
          <StatCard
            title="PTW Issued"
            value={myPTWs.length}
            icon={FileText}
            color="green"
          />
        </div>
        <div>
          <StatCard
            title="Initiated"
            value={initiatedPTWs.length}
            icon={PlayCircle}
            color="slate"
          />
        </div>
        <div>
          <StatCard
            title="Approved"
            value={approvedPTWs.length}
            icon={CheckCircle}
            color="green"
          />
        </div>
        <div>
          <StatCard
            title="In Progress"
            value={inProgressPTWs.length}
            icon={Clock}
            color="blue"
          />
        </div>
        <div>
          <StatCard
            title="Closed"
            value={closedPTWs.length}
            icon={XCircle}
            color="purple"
          />
        </div>
      </div>

      {/* Initiated PTWs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <h3 className="text-slate-900 mb-4">Initiated PTWs</h3>
        <PTWTable ptws={initiatedPTWs} emptyMessage="No initiated permits" />
      </div>

      {/* Approved PTWs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <h3 className="text-slate-900 mb-4">Approved PTWs</h3>
        <PTWTable ptws={approvedPTWs} emptyMessage="No approved permits" />
      </div>

      {/* In Progress PTWs with Direct Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-slate-900">In Progress PTWs</h3>
          <span className="text-sm text-slate-500">Click buttons to extend or close permits</span>
        </div>
        <InProgressPTWTable ptws={inProgressPTWs} emptyMessage="No permits in progress" />
      </div>

      {/* Closed PTWs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <h3 className="text-slate-900 mb-4">Closed PTWs</h3>
        <PTWTable ptws={closedPTWs} emptyMessage="No closed permits" />
      </div>

      {/* PTW Extended Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-indigo-600" />
              PTW Extended
            </h3>
            <p className="text-sm text-slate-500 mt-1">Permits that have been extended beyond original end date</p>
          </div>
          <div className="text-sm text-slate-600">
            Total: <span className="font-semibold text-indigo-600">{extendedPTWs.length}</span>
          </div>
        </div>
        <PTWTable ptws={extendedPTWs} emptyMessage="No extended permits" showCloseButton />
      </div>

      {/* All Permits - Comprehensive View */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-900">All Permits</h3>
            <p className="text-sm text-slate-500 mt-1">Comprehensive view of all PTW permits with status highlights</p>
          </div>
          <div className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{myPTWs.length}</span>
          </div>
        </div>

        {/* Color Legend */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-700 mb-2">Status Color Guide:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              <span>Initiated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span>Closed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span>Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
              <span>Extended</span>
            </div>
          </div>
        </div>

        <AllPermitsTable ptws={myPTWs} />
      </div>

      {/* Modals */}
      {selectedPTW && (
        <>
          <ExtendPTWModal
            isOpen={extendModalOpen}
            onClose={() => {
              setExtendModalOpen(false);
              setSelectedPTW(null);
            }}
            onExtend={handleExtendPTW}
            ptwNumber={selectedPTW.ptwNumber}
            currentEndDate={selectedPTW.endDate}
            currentEndTime="17:00"
          />

          <ClosePTWModal
            isOpen={closeModalOpen}
            onClose={() => {
              setCloseModalOpen(false);
              setSelectedPTW(null);
            }}
            onClosePTW={handleClosePTW}
            ptwNumber={selectedPTW.ptwNumber}
            location={selectedPTW.location}
            workDescription={selectedPTW.workDescription}
          />
        </>
      )}
    </div>
  );
}