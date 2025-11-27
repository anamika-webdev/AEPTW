// frontend/src/pages/admin/AllPermits.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Calendar } from 'lucide-react';

interface Permit {
  id: string;
  number: string;
  category: 'Height' | 'Electrical' | 'Hot Work' | 'Confined Space' | 'General';
  site: string;
  location: string;
  workDescription: string;
  issuer: string;
  date: string;
  createdDate: string;
  status: 'Approved' | 'In Progress' | 'Pending' | 'Completed' | 'Initiated' | 'Closed' | 'Rejected' | 'Expired';
}

export default function AllPermits() {
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const permits: Permit[] = [
    { id: '1', number: 'PTW-2024-001', category: 'Height', site: 'Mumbai Data Center', location: 'Tower A - Rooftop', workDescription: 'Antenna installation and maintenance work', issuer: 'Priya Sharma', date: '2024-11-18', createdDate: 'Created 2024-11-17', status: 'Approved' },
    { id: '2', number: 'PTW-2024-002', category: 'Electrical', site: 'Bangalore Tech Park', location: 'Server Room - UPS Area', workDescription: 'UPS battery replacement and testing', issuer: 'Rajesh Kumar', date: '2024-11-18', createdDate: 'Created 2024-11-17', status: 'In Progress' },
    { id: '3', number: 'PTW-2024-003', category: 'Hot Work', site: 'Mumbai Data Center', location: 'Generator Room', workDescription: 'Welding and pipe fitting operations', issuer: 'Priya Sharma', date: '2024-11-19', createdDate: 'Created 2024-11-18', status: 'Pending' },
    { id: '4', number: 'PTW-2024-004', category: 'Confined Space', site: 'Delhi Telecom Hub', location: 'Underground Cable Duct', workDescription: 'Cable duct inspection and cleaning', issuer: 'Anita Desai', date: '2024-11-20', createdDate: 'Created 2024-11-18', status: 'Approved' },
    { id: '5', number: 'PTW-2024-005', category: 'General', site: 'Bangalore Tech Park', location: 'Main Entrance - Security Gate', workDescription: 'General maintenance and painting', issuer: 'Rajesh Kumar', date: '2024-11-15', createdDate: 'Created 2024-11-16', status: 'Completed' },
    { id: '6', number: 'PTW-2024-006', category: 'Electrical', site: 'Mumbai Data Center', location: 'Cooling Plant - Chiller Area', workDescription: 'Electrical motor maintenance', issuer: 'Priya Sharma', date: '2024-11-21', createdDate: 'Created 2024-11-19', status: 'Initiated' },
    { id: '7', number: 'PTW-2024-007', category: 'Height', site: 'Delhi Telecom Hub', location: 'Communication Tower - Level 5', workDescription: 'Tower maintenance and inspection', issuer: 'Anita Desai', date: '2024-11-10', createdDate: 'Created 2024-11-20', status: 'Closed' },
    { id: '8', number: 'PTW-2024-008', category: 'Hot Work', site: 'Mumbai Data Center', location: 'Equipment Room - Floor 3', workDescription: 'Metal fabrication and welding for cable trays', issuer: 'Priya Sharma', date: '2024-11-20', createdDate: 'Created 2024-11-19', status: 'In Progress' },
    { id: '9', number: 'PTW-2024-009', category: 'General', site: 'Mumbai Data Center', location: 'Parking Area', workDescription: 'Parking lot resurfacing', issuer: 'Priya Sharma', date: '2024-11-22', createdDate: 'Created 2024-11-20', status: 'Rejected' },
    { id: '10', number: 'PTW-2024-010', category: 'Electrical', site: 'Mumbai Data Center', location: 'Distribution Board - Basement', workDescription: 'Circuit breaker replacement', issuer: 'Priya Sharma', date: '2024-11-05', createdDate: 'Created 2024-11-20', status: 'Expired' },
    { id: '11', number: 'PTW-2024-011', category: 'Confined Space', site: 'Mumbai Data Center', location: 'Water Tank - Rooftop', workDescription: 'Water tank cleaning and inspection', issuer: 'Priya Sharma', date: '2024-11-25', createdDate: 'Created 2024-11-20', status: 'Approved' },
    { id: '12', number: 'PTW-2024-012', category: 'Height', site: 'Mumbai Data Center', location: 'External Wall - North Side', workDescription: 'Facade cleaning and maintenance', issuer: 'Priya Sharma', date: '2024-11-26', createdDate: 'Created 2024-11-20', status: 'Initiated' },
    { id: '13', number: 'PTW-2024-013', category: 'General', site: 'Mumbai Data Center', location: 'Utility Area', workDescription: 'Interior renovation and painting', issuer: 'Priya Sharma', date: '2024-11-27', createdDate: 'Created 2024-11-20', status: 'Pending' },
    { id: '14', number: 'PTW-2024-014', category: 'Hot Work', site: 'Mumbai Data Center', location: 'Loading Bay', workDescription: 'Steel gate repair and welding', issuer: 'Priya Sharma', date: '2024-11-12', createdDate: 'Created 2024-11-11', status: 'Closed' },
    { id: '15', number: 'PTW-2024-015', category: 'Electrical', site: 'Mumbai Data Center', location: 'Backup Generator Room', workDescription: 'Generator maintenance and load testing', issuer: 'Priya Sharma', date: '2024-11-16', createdDate: 'Created 2024-11-11', status: 'Completed' },
  ];

  const getCategoryBadge = (category: string) => {
    const styles = {
      'Height': 'bg-purple-100 text-purple-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'Hot Work': 'bg-red-100 text-red-800',
      'Confined Space': 'bg-orange-100 text-orange-800',
      'General': 'bg-blue-100 text-blue-800',
    };
    return styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Approved': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'Initiated': 'bg-orange-100 text-orange-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Expired': 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const filteredPermits = permits.filter(permit => {
    const matchesSite = filterSite === 'all' || permit.site === filterSite;
    const matchesStatus = filterStatus === 'all' || permit.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || permit.category === filterCategory;
    return matchesSite && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Permits</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage all PTW permits across all sites
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">Filters</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Site</label>
                <select
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sites</option>
                  <option value="Mumbai Data Center">Mumbai Data Center</option>
                  <option value="Bangalore Tech Park">Bangalore Tech Park</option>
                  <option value="Delhi Telecom Hub">Delhi Telecom Hub</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Initiated">Initiated</option>
                  <option value="Closed">Closed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Height">Height</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Hot Work">Hot Work</option>
                  <option value="Confined Space">Confined Space</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Date Range</label>
                <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <span>Select dates</span>
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredPermits.length} permits
        </div>

        {/* Permits Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">PTW Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Site & Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Work Description</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Issuer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-left text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPermits.map((permit) => (
                    <tr key={permit.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{permit.number}</p>
                          <p className="text-xs text-gray-500">{permit.createdDate}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${getCategoryBadge(permit.category)}`}>
                          {permit.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{permit.site}</p>
                          <p className="text-xs text-gray-500">{permit.location}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{permit.workDescription}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{permit.issuer}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{permit.date}</p>
                          <p className="text-xs text-gray-500">to {permit.date}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(permit.status)}`}>
                          • {permit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}