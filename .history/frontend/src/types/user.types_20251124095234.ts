export interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Worker';
  site_id?: number;
  created_at?: string;
}

export interface CreateUserData {
  login_id: string;
  full_name: string;
  email: string;
  password: string;
  role: string;
  site_id?: number;
}