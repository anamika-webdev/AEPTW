import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { permitService } from '@/services/permit.service';
import { siteService } from '@/services/site.service';
import { userService } from '@/services/user.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  FileText, 
  Users, 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
  totalPermits: number;
  activePermits: number;
  pendingApprovals: number;
  completedPermits: number;
  totalSites: number;
  totalUsers: number;
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
}

export default function AdminDashboard({ onNavigate, onPTWSelect }: any) {
  const [stats, setStats] = useState<DashboardStats>({
    totalPermits: 0,
    activePermits: 0,
    pendingApprovals: 0,
    completedPermits: 0,
    totalSites: 0,
    totalUsers: 0,
  });
  const [permitTypeData, setPermitTypeData] = useState<PermitTypeData[]>([]);
  const [recentPermits, setRecentPermits] = useState<RecentPermit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [permitsRes, sitesRes, usersRes] = await Promise.all([
        permitService.getAll(),
        siteService.getAll(),
        userService.getAll(),
      ]);

      const permits = permitsRes.permits || [];
      const sites = sitesRes.sites || [];
      const users = usersRes.users || [];

      // Calculate stats
      const activePermits = permits.filter((p: any) => p.status === 'Active').length;
      const pendingApprovals = permits.filter((p: any) => p.status === 'Pending_Approval').length;
      const completedPermits = permits.filter((p: any) => p.status === 'Closed').length;

      setStats({
        totalPermits: permits.length,
        activePermits,
        pendingApprovals,
        completedPermits,
        totalSites: sites.length,
        totalUsers: users.length,
      });

      // Permit type distribution
      const typeCount: any = {};
      permits.forEach((p: any) => {
        typeCount[p.permit_type] = (typeCount[p.permit_type] || 0) + 1;
      });

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const typeData = Object.keys(typeCount).map((key, index) => ({
        name: key.replace('_', ' '),
        value: typeCount[key],
        color: colors[index % colors.length],
      }));

      setPermitTypeData(typeData);

      // Recent permits (last 5)
      const recent = permits
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentPermits(recent);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of all EPTW operations</p>
        </div>
        <Button onClick={() => onNavigate('all-permits')}>
          View All Permits
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Permits
            </CardTitle>
            <FileText className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalPermits}</div>
            <p className="text-xs text-slate-500 mt-1">All time permits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Permits
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activePermits}</div>
            <p className="text-xs text-slate-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending Approvals
            </CardTitle>
            <Clock className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Completed
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.completedPermits}</div>
            <p className="text-xs text-slate-500 mt-1">Successfully closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Sites
            </CardTitle>
            <Building2 className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSites}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => onNavigate('site-management')}
            >
              Manage Sites →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Users
            </CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalUsers}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => onNavigate('user-management')}
            >
              Manage Users →
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">
              Safety Alert
            </CardTitle>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {stats.activePermits + stats.pendingApprovals}
            </div>
            <p className="text-xs text-orange-700 mt-1">Permits require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permit Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Type Distribution</CardTitle>
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
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No permit data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Active', value: stats.activePermits, fill: '#10b981' },
                  { name: 'Pending', value: stats.pendingApprovals, fill: '#f59e0b' },
                  { name: 'Completed', value: stats.completedPermits, fill: '#3b82f6' },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Permits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Permits</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate('all-permits')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPermits.length > 0 ? (
              recentPermits.map((permit) => (
                <div
                  key={permit.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => onPTWSelect(permit.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{permit.permit_serial}</p>
                      <p className="text-sm text-slate-600">{permit.work_location}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {permit.permit_type.replace('_', ' ')} • {new Date(permit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                    {permit.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No recent permits found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}