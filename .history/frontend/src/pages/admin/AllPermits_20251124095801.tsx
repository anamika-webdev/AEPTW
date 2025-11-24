import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { permitService } from '@/services/permit.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FileText, Search, Filter, Download } from 'lucide-react';

interface Permit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  work_description: string;
  status: string;
  created_at: string;
  start_time: string;
  end_time: string;
}

export default function AllPermits({ onPTWSelect }: any) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadPermits();
  }, []);

  useEffect(() => {
    let filtered = permits.filter(permit =>
      permit.permit_serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.work_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.work_description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(permit => permit.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(permit => permit.permit_type === typeFilter);
    }

    setFilteredPermits(filtered);
  }, [searchTerm, statusFilter, typeFilter, permits]);

  const loadPermits = async () => {
    try {
      setLoading(true);
      const response = await permitService.getAll();
      setPermits(response.permits || []);
      setFilteredPermits(response.permits || []);
    } catch (error) {
      console.error('Failed to load permits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Active': 'bg-green-100 text-green-800',
      'Pending_Approval': 'bg-yellow-100 text-yellow-800',
      'Draft': 'bg-gray-100 text-gray-800',
      'Closed': 'bg-blue-100 text-blue-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Suspended': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      'General': 'bg-blue-50 text-blue-700 border-blue-200',
      'Height': 'bg-purple-50 text-purple-700 border-purple-200',
      'Hot_Work': 'bg-red-50 text-red-700 border-red-200',
      'Electrical': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Confined_Space': 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Permits</h1>
          <p className="text-slate-600 mt-1">View and manage all PTW permits</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{permits.length}</div>
            <p className="text-sm text-slate-600">Total Permits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {permits.filter(p => p.status === 'Active').length}
            </div>
            <p className="text-sm text-slate-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {permits.filter(p => p.status === 'Pending_Approval').length}
            </div>
            <p className="text-sm text-slate-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {permits.filter(p => p.status === 'Closed').length}
            </div>
            <p className="text-sm text-slate-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search permits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending_Approval">Pending Approval</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-transparent"
            >
              <option value="all">All Types</option>
              <option value="General">General</option>
              <option value="Height">Height</option>
              <option value="Hot_Work">Hot Work</option>
              <option value="Electrical">Electrical</option>
              <option value="Confined_Space">Confined Space</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Permits Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Permit ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermits.map((permit) => (
                  <tr key={permit.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <code className="text-sm font-medium">{permit.permit_serial}</code>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(permit.permit_type)}`}>
                        {permit.permit_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-900">
                      {permit.work_location}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 max-w-xs truncate">
                      {permit.work_description}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                        {permit.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {new Date(permit.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPTWSelect(permit.id)}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPermits.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No permits found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}