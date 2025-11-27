// frontend/src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileText,
  MapPin,
  Calendar,
  User,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';

interface Stats {
  totalSites: number;
  newSites: number;
  totalWorkers: number;
  activeWorkers: number;
  totalSupervisors: number;
  totalPTW: number;
  ptwIncrease: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface RecentPTW {
  id: number;
  number: string;
  description: string;
  site: string;
  issuer: string;
  date: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSites: 0,
    newSites: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    totalSupervisors: 0,
    totalPTW: 0,
    ptwIncrease: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentPTWs, setRecentPTWs] = useState<RecentPTW[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setStats(data.stats);
      setCategoryData(data.categoryData);
      setRecentPTWs(data.recentPTWs);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(), 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { className: string; label: string } } = {
      'Draft': { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'Pending_Approval': { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'Active': { className: 'bg-green-100 text-green-800', label: 'Active' },
      'Extension_Requested': { className: 'bg-blue-100 text-blue-800', label: 'Extension' },
      'Suspended': { className: 'bg-red-100 text-red-800', label: 'Suspended' },
      'Closed': { className: 'bg-purple-100 text-purple-800', label: 'Closed' },
      'Cancelled': { className: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      'Rejected': { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    };

    return statusMap[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-900">Loading dashboard...</p>
          <p className="text-sm text-gray-500">Fetching real-time data from database</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time overview of system operations and statistics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-3 h-3" />
              <span>Live updates every 30s</span>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className="text-xs text-gray-500">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Sites</p>
                  <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalSites}</p>
                  {stats.newSites > 0 && (
                    <p className="flex items-center mt-2 text-sm text-green-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stats.newSites} new this month
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Workers</p>
                  <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalWorkers}</p>
                  {stats.activeWorkers > 0 && (
                    <p className="flex items-center mt-2 text-sm text-green-600">
                      <Activity className="w-3 h-3 mr-1" />
                      {stats.activeWorkers} active
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Supervisors</p>
                  <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalSupervisors}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Approvers & Safety Officers
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total PTW Issued</p>
                  <p className="mt-2 text-4xl font-bold text-gray-900">{stats.totalPTW}</p>
                  {stats.ptwIncrease > 0 && (
                    <p className="flex items-center mt-2 text-sm text-green-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stats.ptwIncrease}% increase
                    </p>
                  )}
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* PTW by Category */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h2 className="mb-6 text-xl font-bold text-gray-900">PTW by Category</h2>
              
              {categoryData.length > 0 ? (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-64 h-64">
                      <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                        {categoryData.map((cat, index) => {
                          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                          const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                          let startAngle = 0;
                          
                          for (let i = 0; i < index; i++) {
                            startAngle += (categoryData[i].value / total) * 360;
                          }
                          
                          const angle = (cat.value / total) * 360;
                          const endAngle = startAngle + angle;
                          
                          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                          const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                          
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={index}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[index % colors.length]}
                              className="transition-opacity hover:opacity-80"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    {categoryData.map((category, index) => {
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <span className="text-gray-700">
                            {category.name.replace('_', ' ')} {category.percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No permit data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent PTWs */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent PTWs</h2>
                <button 
                  onClick={() => window.location.href = '/admin/permits'}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-4">
                {recentPTWs.length > 0 ? (
                  recentPTWs.map((ptw) => {
                    const statusInfo = getStatusBadge(ptw.status);
                    return (
                      <div 
                        key={ptw.id}
                        className="p-4 transition-all border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300"
                        onClick={() => window.location.href = `/admin/permits/${ptw.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{ptw.number}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                                • {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{ptw.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{ptw.site}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{ptw.issuer}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{ptw.date}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">No recent permits</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}