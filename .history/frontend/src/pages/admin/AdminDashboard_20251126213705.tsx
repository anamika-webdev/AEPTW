// frontend/src/pages/admin/AdminDashboard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileText,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

interface RecentPTW {
  id: string;
  number: string;
  description: string;
  site: string;
  issuer: string;
  date: string;
  status: 'Approved' | 'In Progress' | 'Pending' | 'Completed';
}

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Sites',
      value: 4,
      change: '↑ 2 new this month',
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Workers',
      value: 6,
      change: '↑ 3 active today',
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Total Supervisors',
      value: 3,
      change: '',
      icon: UserCheck,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Total PTW Issued',
      value: 15,
      change: '↑ 12% increase',
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const recentPTWs: RecentPTW[] = [
    {
      id: '1',
      number: 'PTW-2024-001',
      description: 'Antenna installation and maintenance work',
      site: 'Mumbai Data Center',
      issuer: 'Priya Sharma',
      date: '2024-11-18',
      status: 'Approved',
    },
    {
      id: '2',
      number: 'PTW-2024-002',
      description: 'UPS battery replacement and testing',
      site: 'Bangalore Tech Park',
      issuer: 'Rajesh Kumar',
      date: '2024-11-18',
      status: 'In Progress',
    },
    {
      id: '3',
      number: 'PTW-2024-003',
      description: 'Welding and pipe fitting operations',
      site: 'Mumbai Data Center',
      issuer: 'Priya Sharma',
      date: '2024-11-19',
      status: 'Pending',
    },
    {
      id: '4',
      number: 'PTW-2024-004',
      description: 'Cable duct inspection and cleaning',
      site: 'Delhi Telecom Hub',
      issuer: 'Anita Desai',
      date: '2024-11-20',
      status: 'Approved',
    },
    {
      id: '5',
      number: 'PTW-2024-005',
      description: 'General maintenance and painting',
      site: 'Bangalore Tech Park',
      issuer: 'Rajesh Kumar',
      date: '2024-11-15',
      status: 'Completed',
    },
  ];

  const categoryData = [
    { name: 'General', value: 20, color: '#3B82F6' },
    { name: 'Height', value: 20, color: '#10B981' },
    { name: 'Electrical', value: 27, color: '#F59E0B' },
    { name: 'Hot Work', value: 20, color: '#EF4444' },
    { name: 'Confined Space', value: 13, color: '#8B5CF6' },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      'Approved': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-purple-100 text-purple-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of system operations and statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-4xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <p className="mt-2 text-sm text-green-600">{stat.change}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* PTW by Category */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h2 className="mb-6 text-xl font-bold text-gray-900">PTW by Category</h2>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Pie chart segments */}
                    <circle cx="100" cy="100" r="80" fill="#3B82F6" />
                    <path d="M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z" fill="#10B981" />
                    <path d="M 100 100 L 180 100 A 80 80 0 0 1 154 164 Z" fill="#F59E0B" />
                    <path d="M 100 100 L 154 164 A 80 80 0 0 1 46 164 Z" fill="#EF4444" />
                    <path d="M 100 100 L 46 164 A 80 80 0 0 1 20 100 Z" fill="#8B5CF6" />
                    <path d="M 100 100 L 20 100 A 80 80 0 0 1 100 20 Z" fill="#3B82F6" />
                  </svg>
                  
                  {/* Labels */}
                  <div className="absolute top-0 right-0 text-sm font-medium text-teal-600">
                    Height 20%
                  </div>
                  <div className="absolute right-0 text-sm font-medium bottom-16 text-amber-600">
                    Electrical 27%
                  </div>
                  <div className="absolute left-0 text-sm font-medium text-red-600 bottom-16">
                    Hot Work 20%
                  </div>
                  <div className="absolute text-sm font-medium text-blue-600 right-8 top-20">
                    General 20%
                  </div>
                  <div className="absolute right-0 text-sm font-medium text-purple-600 bottom-32">
                    Confined Space 13%
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {categoryData.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-gray-700">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent PTWs */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent PTWs</h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentPTWs.map((ptw) => (
                  <div 
                    key={ptw.id}
                    className="p-4 transition-all border border-gray-200 rounded-lg hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{ptw.number}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(ptw.status)}`}>
                            • {ptw.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{ptw.description}</p>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}