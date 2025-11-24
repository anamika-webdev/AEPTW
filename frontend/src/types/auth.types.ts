export interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Worker';
  site_id?: number;
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