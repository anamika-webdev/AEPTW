// frontend/src/components/supervisor/SupervisorDashboard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Clock, CheckCircle, AlertCircle, XCircle, PlayCircle } from 'lucide-react';

interface SupervisorDashboardProps {
  onNavigate?: (page: string) => void;
}

export function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  // Mock data - replace with actual API calls
  const stats = {
    totalWorkers: 2,
    ptwIssued: 11,
    initiated: 2,
    approved: 2,
    inProgress: 1,
    closed: 1
  };

  const initiatedPTWs = [
    { number: 'PTW-2024-006', category: 'Electrical', location: 'Cooling Plant - Chiller Area', workers: 1, startDate: '2024-11-21', status: 'Initiated' },
    { number: 'PTW-2024-012', category: 'Height', location: 'External Wall - North Side', workers: 1, startDate: '2024-11-26', status: 'Initiated' }
  ];

  const approvedPTWs = [
    { number: 'PTW-2024-001', category: 'Height', location: 'Tower A - Rooftop', workers: 2, startDate: '2024-11-18', status: 'Approved' },
    { number: 'PTW-2024-011', category: 'Confined Space', location: 'Water Tank - Rooftop', workers: 2, startDate: '2024-11-25', status: 'Approved' }
  ];

  const inProgressPTWs = [
    { number: 'PTW-2024-008', category: 'Hot Work', location: 'Equipment Room - Floor 3', workers: 2, startDate: '2024-11-20', status: 'In Progress', actions: true }
  ];

  const closedPTWs = [
    { number: 'PTW-2024-014', category: 'Hot Work', location: 'Loading Bay', workers: 1, startDate: '2024-11-12', status: 'Closed' }
  ];

  const allPermits = [
    { ptw: 'PTW-2024-001', category: 'Height', workDescription: 'Antenna installation and maintenance work', location: 'Tower A - Rooftop', workers: 'Amit Patel\nVikram Singh', startDate: '2024-11-18', endDate: '2024-11-18', status: 'Approved', color: 'green' },
    { ptw: 'PTW-2024-003', category: 'Hot Work', workDescription: 'Welding and pipe fitting operations', location: 'Generator Room', workers: 'Amit Patel', startDate: '2024-11-19', endDate: '2024-11-19', status: 'Pending', color: 'yellow' },
    { ptw: 'PTW-2024-006', category: 'Electrical', workDescription: 'Electrical motor maintenance', location: 'Cooling Plant - Chiller Area', workers: 'Vikram Singh', startDate: '2024-11-21', endDate: '2024-11-21', status: 'Initiated', color: 'orange' },
    { ptw: 'PTW-2024-008', category: 'Hot Work', workDescription: 'Metal fabrication and welding for cable trays', location: 'Equipment Room - Floor 3', workers: 'Amit Patel\nVikram Singh', startDate: '2024-11-20', endDate: '2024-11-20', status: 'In Progress', color: 'blue' },
    { ptw: 'PTW-2024-009', category: 'General', workDescription: 'Parking lot resurfacing', location: 'Parking Area', workers: 'Amit Patel', startDate: '2024-11-22', endDate: '2024-11-23', status: 'Rejected', color: 'red' },
    { ptw: 'PTW-2024-010', category: 'Electrical', workDescription: 'Circuit breaker replacement', location: 'Distribution Board - Basement', workers: 'Vikram Singh', startDate: '2024-11-05', endDate: '2024-11-05', status: 'Expired', color: 'gray' },
    { ptw: 'PTW-2024-011', category: 'Confined Space', workDescription: 'Water tank cleaning and inspection', location: 'Water Tank - Rooftop', workers: 'Amit Patel\nVikram Singh', startDate: '2024-11-25', endDate: '2024-11-25', status: 'Approved', color: 'green' },
    { ptw: 'PTW-2024-012', category: 'Height', workDescription: 'Facade cleaning and maintenance', location: 'External Wall - North Side', workers: 'Vikram Singh', startDate: '2024-11-26', endDate: '2024-11-26', status: 'Initiated', color: 'orange' },
    { ptw: 'PTW-2024-013', category: 'General', workDescription: 'Interior renovation and painting', location: 'Lobby Area', workers: 'Amit Patel', startDate: '2024-11-21', endDate: '2024-11-08', status: 'Pending', color: 'yellow' },
    { ptw: 'PTW-2024-014', category: 'Hot Work', workDescription: 'Steel gate repair and welding', location: 'Loading Bay', workers: 'Amit Patel', startDate: '2024-11-12', endDate: '2024-11-12', status: 'Closed', color: 'purple' },
    { ptw: 'PTW-2024-015', category: 'Electrical', workDescription: 'Generator maintenance and load testing', location: 'Backup Generator Room', workers: 'Vikram Singh', startDate: '2024-11-16', endDate: '2024-11-17', status: 'Completed', color: 'purple' }
  ];

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'Initiated': 'bg-orange-100 text-orange-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Closed': 'bg-purple-100 text-purple-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Expired': 'bg-gray-100 text-gray-800',
      'Completed': 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        ● {status}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const styles: { [key: string]: string } = {
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'Height': 'bg-orange-100 text-orange-800',
      'Hot Work': 'bg-red-100 text-red-800',
      'Confined Space': 'bg-purple-100 text-purple-800',
      'General': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${styles[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Manage workers and create PTW permits</p>
          </div>
          <Button 
            onClick={() => onNavigate?.('create-permit')}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create New PTW
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Workers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWorkers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">PTW Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ptwIssued}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Initiated</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.initiated}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
                <PlayCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                </div>
                <XCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Initiated PTWs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Initiated PTWs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">PTW Number</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Workers</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Start Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {initiatedPTWs.map((ptw, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.number}</td>
                      <td className="px-4 py-3">{getCategoryBadge(ptw.category)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.workers}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.startDate}</td>
                      <td className="px-4 py-3">{getStatusBadge(ptw.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Approved PTWs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Approved PTWs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">PTW Number</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Workers</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Start Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {approvedPTWs.map((ptw, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.number}</td>
                      <td className="px-4 py-3">{getCategoryBadge(ptw.category)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.workers}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.startDate}</td>
                      <td className="px-4 py-3">{getStatusBadge(ptw.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* In Progress PTWs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">In Progress PTWs</h2>
              <p className="text-sm text-gray-500">Click buttons to extend or close permits</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">PTW Number</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Workers</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Start Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inProgressPTWs.map((ptw, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.number}</td>
                      <td className="px-4 py-3">{getCategoryBadge(ptw.category)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.workers}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.startDate}</td>
                      <td className="px-4 py-3">{getStatusBadge(ptw.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-blue-600">
                            <PlayCircle className="w-4 h-4 mr-1" />
                            In Progress
                          </Button>
                          <Button variant="outline" size="sm" className="text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Extend
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <XCircle className="w-4 h-4 mr-1" />
                            Close
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Closed PTWs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Closed PTWs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">PTW Number</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Workers</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Start Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {closedPTWs.map((ptw, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.number}</td>
                      <td className="px-4 py-3">{getCategoryBadge(ptw.category)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ptw.workers}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.startDate}</td>
                      <td className="px-4 py-3">{getStatusBadge(ptw.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* PTW Extended */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">PTW Extended</h2>
              </div>
              <span className="text-sm font-medium text-gray-600">Total: 0</span>
            </div>
            <div className="p-8 text-center text-gray-500">
              No extended permits
            </div>
          </CardContent>
        </Card>

        {/* All Permits */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">All Permits</h2>
                <p className="text-sm text-gray-500">Comprehensive view of all PTW permits with status highlights</p>
              </div>
              <span className="text-sm font-medium text-gray-600">Total: {allPermits.length}</span>
            </div>

            {/* Status Color Guide */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="mb-2 text-xs font-semibold text-gray-700">Status Color Guide:</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span> Initiated</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Pending</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Approved</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> In Progress</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Completed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Closed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Rejected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-500 rounded-full"></span> Expired</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">PTW #</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Work Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Workers</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Start Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">End Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allPermits.map((ptw, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{ptw.ptw}</td>
                      <td className="px-4 py-3">{getCategoryBadge(ptw.category)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.workDescription}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-pre-line">{ptw.workers}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.startDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ptw.endDate}</td>
                      <td className="px-4 py-3">{getStatusBadge(ptw.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}