// frontend/src/pages/admin/UserManagement.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  site: string;
  role: 'Worker' | 'Supervisor';
  avatar: string;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'workers' | 'supervisors'>('workers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    type: 'Worker',
    fullName: '',
    email: '',
    phone: '',
    site: '',
  });

  const [users, setUsers] = useState<User[]>([
    // Supervisors
    { id: 1, name: 'Priya Sharma', email: 'priya.sharma@telecom.in', phone: '+91-98765-43210', site: 'Mumbai Data Center', role: 'Supervisor', avatar: 'P' },
    { id: 2, name: 'Rajesh Kumar', email: 'rajesh.kumar@telecom.in', phone: '+91-98765-43211', site: 'Bangalore Tech Park', role: 'Supervisor', avatar: 'R' },
    { id: 3, name: 'Anita Desai', email: 'anita.desai@telecom.in', phone: '+91-98765-43212', site: 'Delhi Telecom Hub', role: 'Supervisor', avatar: 'A' },
    
    // Workers
    { id: 4, name: 'Amit Patel', email: 'amit.patel@telecom.in', phone: '+91-98765-43220', site: 'Mumbai Data Center', role: 'Worker', avatar: 'A' },
    { id: 5, name: 'Vikram Singh', email: 'vikram.singh@telecom.in', phone: '+91-98765-43221', site: 'Mumbai Data Center', role: 'Worker', avatar: 'V' },
    { id: 6, name: 'Suresh Reddy', email: 'suresh.reddy@telecom.in', phone: '+91-98765-43222', site: 'Bangalore Tech Park', role: 'Worker', avatar: 'S' },
    { id: 7, name: 'Karthik Iyer', email: 'karthik.iyer@telecom.in', phone: '+91-98765-43223', site: 'Bangalore Tech Park', role: 'Worker', avatar: 'K' },
    { id: 8, name: 'Ramesh Gupta', email: 'ramesh.gupta@telecom.in', phone: '+91-98765-43224', site: 'Delhi Telecom Hub', role: 'Worker', avatar: 'R' },
    { id: 9, name: 'Arun Nair', email: 'arun.nair@telecom.in', phone: '+91-98765-43225', site: 'Delhi Telecom Hub', role: 'Worker', avatar: 'A' },
  ]);

  const workers = users.filter(u => u.role === 'Worker');
  const supervisors = users.filter(u => u.role === 'Supervisor');

  const handleAddUser = () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone || !newUser.site) {
      alert('Please fill in all required fields');
      return;
    }

    const user: User = {
      id: users.length + 1,
      name: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      site: newUser.site,
      role: newUser.type as 'Worker' | 'Supervisor',
      avatar: newUser.fullName.charAt(0).toUpperCase(),
    };

    setUsers([...users, user]);
    setShowAddModal(false);
    setNewUser({
      type: 'Worker',
      fullName: '',
      email: '',
      phone: '',
      site: '',
    });
  };

  const handleDeleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const displayUsers = activeTab === 'workers' ? workers : supervisors;

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage supervisors and workers
            </p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'workers'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Workers ({workers.length})
            </button>
            <button
              onClick={() => setActiveTab('supervisors')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'supervisors'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Supervisors ({supervisors.length})
            </button>
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayUsers.map((user) => (
            <Card key={user.id} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 text-white bg-blue-600 rounded-full shrink-0">
                    <span className="text-lg font-bold">{user.avatar}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{user.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{user.site}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {displayUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No {activeTab} found</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">User Type</label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({...newUser, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Worker">Worker</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  placeholder="e.g., Rajesh Kumar"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="e.g., john.doe@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="e.g., +1-555-0100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Assigned Site</label>
                <select
                  value={newUser.site}
                  onChange={(e) => setNewUser({...newUser, site: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a site</option>
                  <option value="Mumbai Data Center">Mumbai Data Center</option>
                  <option value="Bangalore Tech Park">Bangalore Tech Park</option>
                  <option value="Delhi Telecom Hub">Delhi Telecom Hub</option>
                  <option value="Hyderabad IT Campus">Hyderabad IT Campus</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700">
                  Add User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}