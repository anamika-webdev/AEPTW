export interface Permit {
  id: number;
  permit_serial: string;
  site_id: number;
  created_by_user_id: number;
  vendor_id?: number;
  permit_type: 'General' | 'Height' | 'Hot_Work' | 'Electrical' | 'Confined_Space';
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  receiver_name: string;
  receiver_signature_path?: string;
  receiver_signed_at?: string;
  status: 'Draft' | 'Pending_Approval' | 'Active' | 'Extension_Requested' | 'Suspended' | 'Closed' | 'Cancelled' | 'Rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePermitData {
  site_id: number;
  vendor_id?: number;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  receiver_name: string;
}