// src/lib/mockData.ts
import { PermitWithDetails, User, Site, DashboardStats } from '../types';

export const mockUser: User = {
  id: 1,
  login_id: 'supervisor1',
  full_name: 'John Supervisor',
  email: 'john.supervisor@amazon.com',
  role: 'Requester',
  department: 'Operations',
  created_at: new Date().toISOString(),
};

export const mockSites: Site[] = [
  {
    id: 1,
    site_code: 'DEL4',
    name: 'Amazon DEL4 Fulfillment Center',
    address: 'Gurugram, India',
  },
  {
    id: 2,
    site_code: 'HYD1',
    name: 'Amazon HYD1 Campus',
    address: 'Hyderabad, India',
  },
];

export const mockPermits: PermitWithDetails[] = [
  {
    id: 1,
    permit_serial: 'PTW-DEL4-2024-001',
    site_id: 1,
    created_by_user_id: 1,
    permit_type: 'Hot_Work',
    work_location: 'Building A - Floor 2',
    work_description: 'Welding work on conveyor system',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    receiver_name: 'Mike Worker',
    status: 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    site: mockSites[0],
    creator: mockUser,
    team_members: [
      {
        id: 1,
        permit_id: 1,
        worker_name: 'Mike Worker',
        worker_role: 'Worker',
        badge_id: 'AMZ-1234',
        is_qualified: true,
      },
      {
        id: 2,
        permit_id: 1,
        worker_name: 'Sarah Supervisor',
        worker_role: 'Supervisor',
        badge_id: 'AMZ-5678',
        is_qualified: true,
      },
    ],
  },
  {
    id: 2,
    permit_serial: 'PTW-DEL4-2024-002',
    site_id: 1,
    created_by_user_id: 1,
    permit_type: 'Height',
    work_location: 'Building B - Roof Access',
    work_description: 'HVAC maintenance work',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    receiver_name: 'Tom Technician',
    status: 'Pending_Approval',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    site: mockSites[0],
    creator: mockUser,
    team_members: [
      {
        id: 3,
        permit_id: 2,
        worker_name: 'Tom Technician',
        worker_role: 'Worker',
        badge_id: 'AMZ-9012',
        is_qualified: true,
      },
    ],
  },
  {
    id: 3,
    permit_serial: 'PTW-HYD1-2024-003',
    site_id: 2,
    created_by_user_id: 1,
    permit_type: 'Electrical',
    work_location: 'Data Center - Server Room 1',
    work_description: 'Electrical panel upgrade',
    start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    receiver_name: 'Alex Electrician',
    status: 'Closed',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    site: mockSites[1],
    creator: mockUser,
    team_members: [
      {
        id: 4,
        permit_id: 3,
        worker_name: 'Alex Electrician',
        worker_role: 'Worker',
        badge_id: 'AMZ-3456',
        is_qualified: true,
      },
    ],
  },
];

export const mockDashboardStats: DashboardStats = {
  total: mockPermits.length,
  active: mockPermits.filter(p => p.status === 'Active').length,
  pending: mockPermits.filter(p => p.status === 'Pending_Approval').length,
  closed: mockPermits.filter(p => p.status === 'Closed').length,
  expiringSoon: mockPermits.filter(p => {
    if (p.status !== 'Active') return false;
    const endTime = new Date(p.end_time);
    const now = new Date();
    const hoursRemaining = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining <= 2 && hoursRemaining > 0;
  }).length,
};

// Helper function to get permits by status
export function getPermitsByStatus(status: string): PermitWithDetails[] {
  return mockPermits.filter(permit => permit.status === status);
}

// Helper function to get active permits
export function getActivePermits(): PermitWithDetails[] {
  return mockPermits.filter(permit => permit.status === 'Active');
}

// Helper function to get pending permits
export function getPendingPermits(): PermitWithDetails[] {
  return mockPermits.filter(permit => permit.status === 'Pending_Approval');
}