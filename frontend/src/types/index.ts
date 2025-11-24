// src/types/index.ts

export type PermitType = 'General' | 'Height' | 'Hot_Work' | 'Electrical' | 'Confined_Space';
export type PermitStatus = 'Draft' | 'Pending_Approval' | 'Active' | 'Extension_Requested' | 'Suspended' | 'Closed' | 'Cancelled' | 'Rejected';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type WorkerRole = 'Supervisor' | 'Fire_Watcher' | 'Entrant' | 'Worker' | 'Standby';
export type UserRole = 'Requester' | 'Approver_AreaManager' | 'Approver_Safety' | 'Admin';

export interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  signature_url?: string;
  created_at: string;
}

export interface Site {
  id: number;
  site_code: string;
  name: string;
  address?: string;
}

export interface Vendor {
  id: number;
  company_name: string;
  contact_person?: string;
  license_number?: string;
}

export interface Permit {
  id: number;
  permit_serial: string;
  site_id: number;
  created_by_user_id: number;
  vendor_id?: number;
  permit_type: PermitType;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  receiver_name: string;
  receiver_signature_path?: string;
  receiver_signed_at?: string;
  status: PermitStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PermitWithDetails extends Permit {
  site?: Site;
  creator?: User;
  vendor?: Vendor;
  team_members?: TeamMember[];
  approvals?: PermitApproval[];
}

export interface TeamMember {
  id: number;
  permit_id: number;
  worker_name: string;
  worker_role: WorkerRole;
  badge_id?: string;
  is_qualified: boolean;
}

export interface PermitApproval {
  id: number;
  permit_id: number;
  approver_user_id: number;
  role: 'Area_Manager' | 'Safety_Officer' | 'Site_Lead';
  status: ApprovalStatus;
  comments?: string;
  signature_path?: string;
  approved_at?: string;
  approver?: User;
}

export interface PermitExtension {
  id: number;
  permit_id: number;
  requested_by_user_id: number;
  original_end_time: string;
  new_end_time: string;
  reason: string;
  approved_by_user_id?: number;
  status: ApprovalStatus;
  requested_at: string;
  approved_at?: string;
}

export interface PermitClosure {
  id: number;
  permit_id: number;
  closed_at: string;
  closed_by_user_id: number;
  housekeeping_done: boolean;
  tools_removed: boolean;
  locks_removed: boolean;
  area_restored: boolean;
  remarks?: string;
}

export interface MasterHazard {
  id: number;
  name: string;
  category: string;
  icon_url?: string;
}

export interface MasterPPE {
  id: number;
  name: string;
  icon_url?: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  closed: number;
  expiringSoon: number;
}