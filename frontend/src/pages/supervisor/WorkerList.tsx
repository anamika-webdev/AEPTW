// frontend/src/pages/supervisor/WorkerList.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Filter,
  Download,
  MoreVertical,
  X
} from 'lucide-react';

interface Worker {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  assignedPermits: number;
  completedPermits: number;
  joinedDate: string;
}

export default function WorkerList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New worker form
  const [newWorker, setNewWorker] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeId: '',
  });

  // Mock data
  const [workers, setWorkers] = useState<Worker[]>([
    {
      id: 1,
      employeeId: 'EMP1001',
      name: 'Gaurav Shukla',
      email: 'john.doe@company.com',
      phone: '+1 234-567-8901',
      department: 'Maintenance',
      position: 'Technician',
      status: 'active',
      assignedPermits: 5,
      completedPermits: 23,
      joinedDate: '2023-01-15',
    },
    {
      id: 2,
      employeeId: 'EMP1002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      phone: '+1 234-567-8902',
      department: 'Production',
      position: 'Operator',
      status: 'active',
      assignedPermits: 3,
      completedPermits: 18,
      joinedDate: '2023-02-20',
    },
    {
      id: 3,
      employeeId: 'EMP1003',
      name: 'arnav kumar',
      email: 'mike.johnson@company.com',
      phone: '+1 234-567-8903',
      department: 'Maintenance',
      position: 'Senior Technician',
      status: 'active',
      assignedPermits: 7,
      completedPermits: 45,
      joinedDate: '2022-08-10',
    },
    {
      id: 4,
      employeeId: 'EMP1004',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      phone: '+1 234-567-8904',
      department: 'Quality',
      position: 'Inspector',
      status: 'active',
      assignedPermits: 2,
      completedPermits: 12,
      joinedDate: '2023-03-05',
    },
    {
      id: 5,
      employeeId: 'EMP1005',
      name: 'Tom Brown',
      email: 'tom.brown@company.com',
      phone: '+1 234-567-8905',
      department: 'Warehouse',
      position: 'Forklift Operator',
      status: 'inactive',
      assignedPermits: 0,
      completedPermits: 8,
      joinedDate: '2023-06-15',
    },
    {
      id: 6,
      employeeId: 'EMP1006',
      name: 'Alex Lee',
      email: 'alex.lee@company.com',
      phone: '+1 234-567-8906',
      department: 'Engineering',
      position: 'Engineer',
      status: 'active',
      assignedPermits: 4,
      completedPermits: 31,
      joinedDate: '2022-11-20',
    },
  ]);

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = filterDepartment === 'all' || worker.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || worker.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = ['all', ...Array.from(new Set(workers.map(w => w.department)))];

  const handleAddWorker = () => {
    if (!newWorker.name || !newWorker.email || !newWorker.phone || !newWorker.department || !newWorker.position) {
      alert('Please fill in all required fields');
      return;
    }

    const worker: Worker = {
      id: workers.length + 1,
      employeeId: newWorker.employeeId || `EMP${1000 + workers.length + 1}`,
      name: newWorker.name,
      email: newWorker.email,
      phone: newWorker.phone,
      department: newWorker.department,
      position: newWorker.position,
      status: 'active',
      assignedPermits: 0,
      completedPermits: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setWorkers([...workers, worker]);
    setShowAddModal(false);
    setNewWorker({
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      employeeId: '',
    });
  };

  const handleDeleteWorker = (id: number) => {
    if (confirm('Are you sure you want to delete this worker?')) {
      setWorkers(workers.filter(w => w.id !== id));
    }
  };

  return (
    <div className="min-h-screen p-4 bg-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and assign workers to permits
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Worker
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Workers</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{workers.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="mt-1 text-3xl font-bold text-green-600">
                    {workers.filter(w => w.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <User className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="mt-1 text-3xl font-bold text-orange-600">
                    {workers.reduce((sum, w) => sum + w.assignedPermits, 0)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="mt-1 text-3xl font-bold text-purple-600">
                    {workers.reduce((sum, w) => sum + w.completedPermits, 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workers Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Worker</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Department</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Permits</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No workers found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((worker) => (
                      <tr key={worker.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-gradient-to-br from-orange-600 to-amber-600">
                              <span className="text-sm font-bold">
                                {worker.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{worker.name}</p>
                              <p className="text-xs text-gray-500">{worker.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{worker.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{worker.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{worker.department}</p>
                            <p className="text-sm text-gray-500">{worker.position}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                            ${worker.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }
                          `}>
                            {worker.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Assigned:</span>
                              <span className="font-semibold text-orange-600">{worker.assignedPermits}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Completed:</span>
                              <span className="font-semibold text-green-600">{worker.completedPermits}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWorker(worker.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
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
        {filteredWorkers.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredWorkers.length}</span> of{' '}
              <span className="font-medium">{workers.length}</span> workers
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

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Worker</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    value={newWorker.employeeId}
                    onChange={(e) => setNewWorker({ ...newWorker, employeeId: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                    placeholder="Gaurav Shukla"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    placeholder="john.doe@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    placeholder="+1 234-567-8900"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Department *</label>
                  <select
                    value={newWorker.department}
                    onChange={(e) => setNewWorker({ ...newWorker, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Position *</label>
                  <input
                    type="text"
                    value={newWorker.position}
                    onChange={(e) => setNewWorker({ ...newWorker, position: e.target.value })}
                    placeholder="Technician"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWorker} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Worker
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
