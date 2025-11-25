// User and Auth Types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'Admin' | 'Safety_Officer' | 'Area_Manager' | 'Requester';
  site_id?: number;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// Permit Types
export interface Permit {
  id: number;
  permit_number: string;
  permit_type: 'General' | 'Height' | 'Hot_Work' | 'Electrical' | 'Confined_Space';
  work_description: string;
  location: string;
  site_id: number;
  requester_id: number;
  vendor_id?: number;
  start_datetime: string;
  end_datetime: string;
  status: 'Draft' | 'Pending_Area_Manager' | 'Pending_Safety' | 'Approved' | 'Rejected' | 'Active' | 'Closed' | 'Cancelled';
  hazards?: string[];
  ppe_requirements?: string[];
  created_at?: string;
  updated_at?: string;
}

// Site Types
export interface Site {
  id: number;
  site_name: string;
  site_code: string;
  location: string;
  is_active: boolean;
}

// Statistics Types
export interface DashboardStats {
  totalPermits: number;
  activePermits: number;
  pendingApprovals: number;
  completedPermits: number;
}