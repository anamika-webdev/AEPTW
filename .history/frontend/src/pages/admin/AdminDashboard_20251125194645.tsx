// frontend/src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AdminDashboardProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface DashboardStats {
  totalPermits: number;
  activePermits: number;
  pendingApprovals: number;
  completedPermits: number;
  totalSites: number;
  totalUsers: number;
  todayPermits: number;
  expiringSoon: number;
}

interface PermitTypeData {
  name: string;
  value: number;
  color: string;
}

interface RecentPermit {
  id: number;
  permit_serial: string;
  permit_type: string;
  work_location: string;
  status: string;
  created_at: string;
  site_name?: string;
  requester_name?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentPage, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPermits: 0,
    activePermits: 0,
    pendingApprovals: 0,
    completedPermits: 0,
    totalSites: 0,
    totalUsers: 0,
    todayPermits: 0,
    expiringSoon: 0,
  });

  const [permitTypeData, setPermitTypeData] = useState<PermitTypeData[]>([]);
  const [recentPermits, setRecentPermits] = useState<RecentPermit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(false);
      // TODO: Replace with actual API calls
      // Mock data for demonstration
      setStats({
        totalPermits: 248,
        activePermits: 45,
        pendingApprovals: 12,
        completedPermits: 191,
        totalSites: 4,
        totalUsers: 156,
        todayPermits: 8,
        expiringSoon: 5,
      });

      setPermitTypeData([
        { name: 'General Work', value: 78, color: '#3b82f6' },
        { name: 'Hot Work', value: 52, color: '#ef4444' },
        { name: 'Height Work', value: 45, color: '#f59e0b' },
        { name: 'Electrical', value: 38, color: '#8b5cf6' },
        { name: 'Confined Space', value: 35, color: '#10b981' },
      ]);

      setRecentPermits([
        {
          id: 1,
          permit_serial: 'PTW-2024-001',
          permit_type: 'Hot_Work',
          work_location: 'Warehouse A - Section 3',
          status: 'Active',
          created_at: '2024-11-25T08:00:00Z',
          site_name: 'Alpha Site',
          requester_name: 'Gaurav Shukla',
        },
        {
          id: 2,
          permit_serial: 'PTW-2024-002',
          permit_type: 'Electrical',
          work_location: 'Building B - Floor 2',
          status: 'Pending_Approval',
          created_at: '2024-11-25T09:30:00Z',
          site_name: 'Beta Site',
          requester_name: 'Jane Smith',
        },
        {
          id: 3,
          permit_serial: 'PTW-2024-003',
          permit_type: 'Height',
          work_location: 'Main Building - Roof',
          status: 'Active',
          created_at: '2024-11-25T10:15:00Z',
          site_name: 'Gamma Site',
          requester_name: 'arnav kumar',
        },
        {
          id: 4,
          permit_serial: 'PTW-2024-004',
          permit_type: 'General',
          work_location: 'Storage Facility',
          status: 'Completed',
          created_at: '2024-11-24T14:00:00Z',
          site_name: 'Delta Site',
          requester_name: 'Sarah Wilson',
        },
        {
          id: 5,
          permit_serial: 'PTW-2024-005',
          permit_type: 'Confined_Space',
          work_location: 'Tank Area',
          status: 'Pending_Approval',
          created_at: '2024-11-25T11:45:00Z',
          site_name: 'Alpha Site',
          requester_name: 'Tom Brown',
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete system overview and management
          </p>
        </div>

        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Permits
              </CardTitle>
              <FileText className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalPermits}</div>
              <p className="mt-1 text-xs text-gray-500">
                <span className="text-green-600">+{stats.todayPermits}</span> today
              </p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Permits
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activePermits}</div>
              <p className="mt-1 text-xs text-gray-500">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Approvals
              </CardTitle>
              <Clock className="w-5 h-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
              <p className="mt-1 text-xs text-gray-500">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.completedPermits}</div>
              <p className="mt-1 text-xs text-gray-500">Successfully closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Sites
              </CardTitle>
              <Building2 className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalSites}</div>
              <Button
                variant="link"
                className="h-auto p-0 mt-2 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => onNavigate('site-management')}
              >
                Manage Sites →
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="w-5 h-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
              <Button
                variant="link"
                className="h-auto p-0 mt-2 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => onNavigate('user-management')}
              >
                Manage Users →
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">
                Expiring Soon
              </CardTitle>
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.expiringSoon}</div>
              <p className="mt-1 text-xs text-orange-700">Permits expiring within 24h</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Permit Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Permit Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {permitTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={permitTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {permitTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Permit Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { month: 'Jul', permits: 45 },
                  { month: 'Aug', permits: 52 },
                  { month: 'Sep', permits: 48 },
                  { month: 'Oct', permits: 58 },
                  { month: 'Nov', permits: 45 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="permits" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Permits Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <CardTitle className="text-lg font-semibold">Recent Permits</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('all-permits')}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  View All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-left text-gray-600 uppercase border-b">
                    <th className="px-4 py-3">Permit ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentPermits.map((permit) => (
                    <tr key={permit.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 font-mono font-semibold text-blue-600">
                        {permit.permit_serial}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${getPermitTypeColor(permit.permit_type)}`}>
                          {permit.permit_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{permit.work_location}</td>
                      <td className="px-4 py-4 text-gray-600">{permit.site_name}</td>
                      <td className="px-4 py-4 text-gray-600">{permit.requester_name}</td>
                      <td className="px-4 py-4 text-gray-500">
                        <div>{formatDate(permit.created_at)}</div>
                        <div className="text-xs">{formatTime(permit.created_at)}</div>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(permit.status)}</td>
                      <td className="px-4 py-4">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
          <Card className="transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => onNavigate('site-management')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Sites</h3>
                <p className="text-xs text-gray-500">Add, edit, or remove sites</p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => onNavigate('user-management')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-xs text-gray-500">Supervisors and workers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => onNavigate('all-permits')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">All Permits</h3>
                <p className="text-xs text-gray-500">View and filter all PTWs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;