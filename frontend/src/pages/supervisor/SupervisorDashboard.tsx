import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { permitService } from '@/services/permit.service';
import { userService } from '@/services/user.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FileText, Users, Clock, CheckCircle, Plus, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStats {
  totalPermits: number;
  activePermits: number;
  pendingApprovals: number;
  draftPermits: number;
  assignedWorkers: number;
}

export default function SupervisorDashboard({ onNavigate, onPTWSelect }: any) {
  const [stats, setStats] = useState<DashboardStats>({
    totalPermits: 0,
    activePermits: 0,
    pendingApprovals: 0,
    draftPermits: 0,
    assignedWorkers: 0,
  });
  const [recentPermits, setRecentPermits] = useState<any[]>([]);
  const [permitStatusData, setPermitStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Fetch permits created by this supervisor
      const [permitsRes, workersRes] = await Promise.all([
        permitService.getAll({ created_by: currentUser.id }),
        userService.getByRole('Worker'),
      ]);

      const permits = permitsRes.permits || [];
      const workers = workersRes.users || [];

      // Calculate stats
      const activePermits = permits.filter((p: any) => p.status === 'Active').length;
      const pendingApprovals = permits.filter((p: any) => p.status === 'Pending_Approval').length;
      const draftPermits = permits.filter((p: any) => p.status === 'Draft').length;

      setStats({
        totalPermits: permits.length,
        activePermits,
        pendingApprovals,
        draftPermits,
        assignedWorkers: workers.length,
      });

      // Status distribution
      const statusCount: any = {
        'Active': 0,
        'Pending': 0,
        'Draft': 0,
        'Closed': 0,
      };

      permits.forEach((p: any) => {
        if (p.status === 'Active') statusCount['Active']++;
        else if (p.status === 'Pending_Approval') statusCount['Pending']++;
        else if (p.status === 'Draft') statusCount['Draft']++;
        else if (p.status === 'Closed') statusCount['Closed']++;
      });

      const statusData = Object.keys(statusCount).map((key) => ({
        name: key,
        value: statusCount[key],
      }));

      setPermitStatusData(statusData);

      // Recent permits
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

  const COLORS = ['#10b981', '#f59e0b', '#6b7280', '#3b82f6'];

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Active': 'bg-green-100 text-green-800',
      'Pending_Approval': 'bg-yellow-100 text-yellow-800',
      'Draft': 'bg-gray-100 text-gray-800',
      'Closed': 'bg-orange-100 text-orange-800',
      'Rejected': 'bg-red-100 text-red-800',
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
          <h1 className="text-3xl font-bold text-slate-900">Supervisor Dashboard</h1>
          <p className="mt-1 text-slate-600">Manage permits and workers</p>
        </div>
        <Button onClick={() => onNavigate('create-permit')} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Permit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              My Permits
            </CardTitle>
            <FileText className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalPermits}</div>
            <p className="mt-1 text-xs text-slate-500">Total created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activePermits}</div>
            <p className="mt-1 text-xs text-slate-500">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending
            </CardTitle>
            <Clock className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="mt-1 text-xs text-slate-500">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Drafts
            </CardTitle>
            <AlertCircle className="w-5 h-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.draftPermits}</div>
            <p className="mt-1 text-xs text-slate-500">Not submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Workers
            </CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.assignedWorkers}</div>
            <Button 
              variant="ghost" 
              className="h-auto p-0 mt-2 text-xs"
              onClick={() => onNavigate('worker-list')}
            >
              View Workers →
            </Button>
            
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Ready to create a new permit?</h3>
              <p className="mt-1 text-sm text-green-700">Fill out the safety checklist and assign workers</p>
            </div>
            <Button onClick={() => onNavigate('create-permit')} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Permit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Permit Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {permitStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={permitStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {permitStatusData.map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Active', value: stats.activePermits, fill: '#10b981' },
                  { name: 'Pending', value: stats.pendingApprovals, fill: '#f59e0b' },
                  { name: 'Draft', value: stats.draftPermits, fill: '#6b7280' },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Permits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Permits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPermits.length > 0 ? (
              recentPermits.map((permit) => (
                <div
                  key={permit.id}
                  className="flex items-center justify-between p-4 transition-colors rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
                  onClick={() => onPTWSelect(permit.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{permit.permit_serial}</p>
                      <p className="text-sm text-slate-600">{permit.work_location}</p>
                      <p className="mt-1 text-xs text-slate-500">
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
              <div className="py-8 text-center text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No permits created yet</p>
                <Button 
                  className="mt-4" 
                  onClick={() => onNavigate('create-permit')}
                >
                  Create Your First Permit
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}