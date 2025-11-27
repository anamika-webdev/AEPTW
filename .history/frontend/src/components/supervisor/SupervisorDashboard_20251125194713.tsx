// frontend/src/components/supervisor/SupervisorDashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  Plus, 
  AlertCircle,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardStats {
  totalPermits: number;
  activePermits: number;
  pendingApprovals: number;
  draftPermits: number;
  assignedWorkers: number;
  completedToday: number;
  expiringSoon: number;
}

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
  workers: string[];
}

interface Worker {
  id: number;
  name: string;
  email: string;
  phone: string;
  assignedPermits: number;
  status: 'active' | 'inactive';
}

export const SupervisorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPermits: 0,
    activePermits: 0,
    pendingApprovals: 0,
    draftPermits: 0,
    assignedWorkers: 0,
    completedToday: 0,
    expiringSoon: 0,
  });

  const [permits, setPermits] = useState<Permit[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'pending' | 'workers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(false);
      // TODO: Replace with actual API calls
      // Mock data for demonstration
      setStats({
        totalPermits: 42,
        activePermits: 15,
        pendingApprovals: 5,
        draftPermits: 3,
        assignedWorkers: 18,
        completedToday: 4,
        expiringSoon: 2,
      });

      setPermits([
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
          workers: ['John Doe', 'Mike Johnson'],
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
          workers: ['Jane Smith'],
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
          workers: ['Tom Brown', 'Sarah Wilson', 'Alex Lee'],
        },
        {
          id: 4,
          permit_serial: 'PTW-2024-004',
          permit_type: 'General',
          work_description: 'Equipment installation',
          work_location: 'Production Area',
          status: 'Active',
          created_at: '2024-11-25T06:00:00Z',
          valid_from: '2024-11-25T10:00:00Z',
          valid_to: '2024-11-25T18:00:00Z',
          workers: ['Robert Chen'],
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
          workers: ['David Martinez', 'Lisa Anderson'],
        },
      ]);

      setWorkers([
        { id: 1, name: 'John Doe', email: 'john@company.com', phone: '+1234567890', assignedPermits: 3, status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@company.com', phone: '+1234567891', assignedPermits: 2, status: 'active' },
        { id: 3, name: 'Mike Johnson', email: 'mike@company.com', phone: '+1234567892', assignedPermits: 2, status: 'active' },
        { id: 4, name: 'Sarah Wilson', email: 'sarah@company.com', phone: '+1234567893', assignedPermits: 1, status: 'active' },
        { id: 5, name: 'Tom Brown', email: 'tom@company.com', phone: '+1234567894', assignedPermits: 3, status: 'active' },
        { id: 6, name: 'Alex Lee', email: 'alex@company.com', phone: '+1234567895', assignedPermits: 1, status: 'active' },
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
      Draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      Completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      Rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
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

  const getTimeRemaining = (validTo: string) => {
    const now = new Date();
    const endTime = new Date(validTo);
    const diffMs = endTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m remaining`;
    }
    return `${diffMins}m remaining`;
  };

  const filteredPermits = permits.filter(permit => {
    const matchesSearch = permit.permit_serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permit.work_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permit.work_location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || permit.status === filterStatus;
    
    const matchesTab = activeTab === 'overview' ? true :
                      activeTab === 'active' ? permit.status === 'Active' :
                      activeTab === 'pending' ? permit.status === 'Pending_Approval' :
                      true;
    
    return matchesSearch && matchesFilter && matchesTab;
  });

  const statusData = [
    { name: 'Active', value: stats.activePermits, color: '#10b981' },
    { name: 'Pending', value: stats.pendingApprovals, color: '#f59e0b' },
    { name: 'Draft', value: stats.draftPermits, color: '#6b7280' },
  ];

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
        <div className="flex flex-col justify-between gap-4 mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back, {currentUser?.full_name || 'Supervisor'}
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New Permit
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                My Permits
              </CardTitle>
              <FileText className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalPermits}</div>
              <p className="mt-1 text-xs text-gray-500">Total created</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Now
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activePermits}</div>
              <p className="mt-1 text-xs text-gray-500">
                <span className="text-green-600">+{stats.completedToday}</span> completed today
              </p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Approval
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
                Team Members
              </CardTitle>
              <Users className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.assignedWorkers}</div>
              <p className="mt-1 text-xs text-gray-500">Workers assigned</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        {stats.expiringSoon > 0 && (
          <div className="p-4 mb-6 border-l-4 border-orange-500 rounded-lg bg-orange-50">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 text-orange-600" />
              <div>
                <h3 className="text-sm font-semibold text-orange-900">Permits Expiring Soon</h3>
                <p className="text-sm text-orange-700">
                  {stats.expiringSoon} permit(s) will expire within the next 2 hours. Review them now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Content */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6 -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="inline-block w-4 h-4 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="inline-block w-4 h-4 mr-2" />
                Active ({stats.activePermits})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="inline-block w-4 h-4 mr-2" />
                Pending ({stats.pendingApprovals})
              </button>
              <button
                onClick={() => setActiveTab('workers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'workers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline-block w-4 h-4 mr-2" />
                Workers ({stats.assignedWorkers})
              </button>
            </nav>
          </div>

          {/* Search and Filter Bar */}
          {activeTab !== 'workers' && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type="text"
                      placeholder="Search by permit ID, location, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending_Approval">Pending</option>
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Chart */}
                <div className="lg:col-span-2">
                  <h3 className="mb-4 text-lg font-semibold">Permit Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Stats</h3>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                      <span className="text-xl font-bold text-green-600">89%</span>
                    </div>
                    <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-green-600 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Avg. Approval Time</span>
                      <span className="text-xl font-bold text-blue-600">2.3h</span>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">This Week</span>
                      <span className="text-xl font-bold text-purple-600">12</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Permits created</p>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'overview' || activeTab === 'active' || activeTab === 'pending') && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">
                  {activeTab === 'active' ? 'Active Permits' : 
                   activeTab === 'pending' ? 'Pending Approvals' : 
                   'Recent Permits'}
                </h3>
                <div className="space-y-4">
                  {filteredPermits.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="w-16 h-16 mx-auto text-gray-300" />
                      <p className="mt-4 text-gray-500">No permits found</p>
                    </div>
                  ) : (
                    filteredPermits.map((permit) => (
                      <div key={permit.id} className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-mono text-lg font-semibold text-blue-600">
                                {permit.permit_serial}
                              </h4>
                              {getStatusBadge(permit.status)}
                              <span className={`text-sm font-medium ${getPermitTypeColor(permit.permit_type)}`}>
                                {permit.permit_type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="mb-2 text-gray-700">{permit.work_description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {permit.work_location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(permit.valid_from)} - {formatTime(permit.valid_from)}
                              </span>
                              {permit.status === 'Active' && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <Clock className="w-4 h-4" />
                                  {getTimeRemaining(permit.valid_to)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {permit.workers.map((worker, idx) => (
                                  <span key={idx} className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded">
                                    {worker}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {permit.status === 'Active' && (
                              <>
                                <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                                  Extend
                                </Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Close
                                </Button>
                              </>
                            )}
                            {permit.status === 'Draft' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'workers' && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Team Members</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {workers.map((worker) => (
                    <Card key={worker.id} className="transition-shadow hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                            <span className="text-lg font-bold">
                              {worker.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{worker.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              worker.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {worker.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {worker.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {worker.phone}
                          </div>
                          <div className="pt-2 mt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500">Assigned Permits</span>
                              <span className="text-lg font-bold text-blue-600">{worker.assignedPermits}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          Assign Permit
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;