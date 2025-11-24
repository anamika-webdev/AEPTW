import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { userService } from '@/services/user.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Users, Search, Mail, HardHat } from 'lucide-react';

interface Worker {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  site_id?: number;
  created_at: string;
}

export default function WorkerList({ onNavigate: _onNavigate }: any) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    const filtered = workers.filter(worker =>
      worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.login_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWorkers(filtered);
  }, [searchTerm, workers]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const response = await userService.getByRole('Worker');
      setWorkers(response.users || []);
      setFilteredWorkers(response.users || []);
    } catch (error) {
      console.error('Failed to load workers:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-slate-900">Workers</h1>
          <p className="mt-1 text-slate-600">View all workers in the system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Workers
            </CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{workers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active
            </CardTitle>
            <HardHat className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{workers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available
            </CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{workers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
            <Input
              placeholder="Search workers by name, email, or login ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkers.map((worker) => (
          <Card key={worker.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                  <span className="text-xl font-bold text-white">
                    {worker.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{worker.full_name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    <code className="px-2 py-1 rounded bg-slate-100">{worker.login_id}</code>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{worker.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <HardHat className="w-4 h-4" />
                <span>Worker</span>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  Available
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No workers found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}