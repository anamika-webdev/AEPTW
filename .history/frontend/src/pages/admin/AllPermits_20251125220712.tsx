// frontend/src/pages/admin/AllPermits.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  MapPin,
  User,
  Clock
} from 'lucide-react';

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_description: string;
  work_location: string;
  status: string;
  created_at: string;
  valid_from: string;
  valid_to: string;
  site_name: string;
  requester_name: string;
  department: string;
}

export default function AllPermits() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSite, setFilterSite] = useState('all');

  // Mock data
  const permits: Permit[] = [
    {
      id: 1,
      permit_serial: 'PTW-2024-001',
      permit_type: 'Hot_Work',
      work_description: 'Welding work on storage tank',
      work_location: 'Warehouse A - Section 3',
      status: 'Active',
      created_at: '2024-11-25T08:00:00Z',
      valid_from: '2024-11-25T09:00:00Z',
      valid_to: '2024-11-25T17:00:00Z',
      site_name: 'Alpha Site',
      requester_name: 'John Doe',
      department: 'Maintenance',
    },
    {
      id: 2,
      permit_serial: 'PTW-2024-002',
      permit_type: 'Electrical',
      work_description: 'Circuit breaker replacement',
      work_location: 'Building B - Floor 2',
      status: 'Pending_Approval',
      created_at: '2024-11-24T10:30:00Z',
      valid_from: '2024-11-26T08:00:00Z',
      valid_to: '2024-11-26T16:00:00Z',
      site_name: 'Beta Site',
      requester_name: 'Jane Smith',
      department: 'Engineering',
    },
    {
      id: 3,
      permit_serial: 'PTW-2024-003',
      permit_type: 'Height',
      work_description: 'Roof maintenance and repair',
      work_location: 'Main Building - Roof',
      status: 'Active',
      created_at: '2024-11-23T07:00:00Z',
      valid_from: '2024-11-25T08:00:00Z',
      valid_to: '2024-11-25T16:00:00Z',
      site_name: 'Gamma Site',
      requester_name: 'Mike Johnson',
      department: 'Maintenance',
    },
    {
      id: 4,
      permit_serial: 'PTW-2024-004',
      permit_type: 'General',
      work_description: 'Equipment installation',
      work_location: 'Production Area',
      status: 'Completed',
      created_at: '2024-11-20T06:00:00Z',
      valid_from: '2024-11-20T10:00:00Z',
      valid_to: '2024-11-20T18:00:00Z',
      site_name: 'Delta Site',
      requester_name: 'Robert Chen',
      department: 'Production',
    },
    {
      id: 5,
      permit_serial: 'PTW-2024-005',
      permit_type: 'Confined_Space',
      work_description: 'Tank inspection and cleaning',
      work_location: 'Tank Farm - Tank 3',
      status: 'Pending_Approval',
      created_at: '2024-11-25T11:00:00Z',
      valid_from: '2024-11-26T09:00:00Z',
      valid_to: '2024-11-26T15:00:00Z',
      site_name: 'Alpha Site',
      requester_name: 'David Martinez',
      department: 'Quality',
    },
    {
      id: 6,
      permit_serial: 'PTW-2024-006',
      permit_type: 'Hot_Work',
      work_description: 'Pipe welding and fitting',
      work_location: 'Utility Area',
      status: 'Rejected',
      created_at: '2024-11-24T14:00:00Z',
      valid_from: '2024-11-25T08:00:00Z',
      valid_to: '2024-11-25T17:00:00Z',
      site_name: 'Beta Site',
      requester_name: 'Lisa Anderson',
      department: 'Maintenance',
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      Active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      Pending_Approval: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      Completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      Rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      Expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' },
    };
    const badge = badges[status] || badges.Pending_Approval;
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getPermitTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      General: 'text-blue-600',
      Hot_Work: 'text-red-600',
      Height: 'text-orange-600',
      Electrical: 'text-purple-600',
      Confined_Space: 'text-green-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredPermits = permits.filter(permit => {
    const matchesSearch = 
      permit.permit_serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.work_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.work_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.requester_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || permit.permit_type === filterType;
    const matchesStatus = filterStatus === 'all' || permit.status === filterStatus;
    const matchesSite = filterSite === 'all' || permit.site_name === filterSite;
    
    return matchesSearch && matchesType && matchesStatus && matchesSite;
  });

  const permitTypes = Array.from(new Set(permits.map(p => p.permit_type)));
  const sites = Array.from(new Set(permits.map(p => p.site_name)));

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Permits</h1>
            <p className="mt-2 text-sm text-gray-600">
              Complete view of all permits across all sites
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{permits.length}</p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Active</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {permits.filter(p => p.status === 'Active').length}
              </p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">
                {permits.filter(p => p.status === 'Pending_Approval').length}
              </p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Completed</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {permits.filter(p => p.status === 'Completed').length}
              </p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-600">Rejected</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {permits.filter(p => p.status === 'Rejected').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search permits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {permitTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending_Approval">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Permits Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Permit ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Description</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Requester</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Valid Period</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPermits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No permits found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPermits.map((permit) => (
                      <tr key={permit.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-mono text-sm font-semibold text-blue-600">{permit.permit_serial}</p>
                            <p className="text-xs text-gray-500">{permit.site_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${getPermitTypeColor(permit.permit_type)}`}>
                            {permit.permit_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 line-clamp-2">{permit.work_description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{permit.work_location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{permit.requester_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(permit.valid_from)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(permit.valid_from)} - {formatTime(permit.valid_to)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(permit.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredPermits.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredPermits.length}</span> of{' '}
              <span className="font-medium">{permits.length}</span> permits
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}