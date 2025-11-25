// src/types/auth.types.ts
// Updated to support role mapping

export type DatabaseRole = 
  | 'Admin' 
  | 'Approver_Safety' 
  | 'Approver_AreaManager' 
  | 'Requester';

export type FrontendRole = 'Admin' | 'Supervisor' | 'Worker';

export interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: DatabaseRole | string;  // Database role (original)
  frontendRole?: FrontendRole;   // Mapped role for UI
  department?: string;
  signature_url?: string;
  created_at?: string;
}

export interface LoginCredentials {
  login_id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}