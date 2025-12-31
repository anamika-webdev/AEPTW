// src/components/supervisor/WorkerList.tsx
import { useState, useEffect } from 'react';
import { Search, Mail, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { usersAPI } from '../../services/api';
import type { User as Worker } from '../../types';

interface WorkerListProps {
  onBack: () => void;
}

export function WorkerList({ onBack }: WorkerListProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [searchQuery, workers]);

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      const response = await usersAPI.getWorkers({ assignedOnly: true });
      if (response.success && response.data) {
        setWorkers(response.data);
        setFilteredWorkers(response.data);
      }
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterWorkers = () => {
    if (!searchQuery.trim()) {
      setFilteredWorkers(workers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = workers.filter(worker =>
      worker.full_name.toLowerCase().includes(query) ||
      worker.email.toLowerCase().includes(query) ||
      worker.login_id.toLowerCase().includes(query) ||
      (worker.department && worker.department.toLowerCase().includes(query))
    );
    setFilteredWorkers(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Worker List</h1>
          <p className="text-slate-600">Manage and view all workers</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-6 bg-white border rounded-xl border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Workers</p>
              <p className="text-2xl font-bold text-slate-900">{workers.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border rounded-xl border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Workers</p>
              <p className="text-2xl font-bold text-slate-900">{workers.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border rounded-xl border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Departments</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Set(workers.filter(w => w.department).map(w => w.department)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white border rounded-xl border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search workers by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Workers List */}
      <div className="overflow-hidden bg-white border rounded-xl border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                  Worker
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                  Login ID
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                  Department
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {searchQuery ? 'No workers found matching your search' : 'No workers available'}
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                          <User className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{worker.full_name}</div>
                          <div className="text-sm text-slate-500">{worker.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{worker.login_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{worker.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          {worker.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                        {worker.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
        <p className="text-sm text-orange-900">
          <span className="font-semibold">Showing:</span> {filteredWorkers.length} of {workers.length} workers
        </p>
      </div>
    </div>
  );
}