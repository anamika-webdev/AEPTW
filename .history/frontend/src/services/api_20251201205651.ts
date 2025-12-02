// frontend/src/services/api.ts - COMPLETE & FIXED VERSION
// This ensures all API calls correctly fetch data from the admin database

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Site,
  Vendor,
  Permit,
  MasterHazard,
  MasterPPE,
  MasterChecklistQuestion,
  ApiResponse,
  CreatePermitFormData,
  SupervisorDashboardStats,
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized - token may be invalid');
    }
    
    return Promise.reject(error);
  }
);

// ============= Authentication APIs =============
export const authAPI = {
  login: async (login_id: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { login_id, password });
    return response.data;
  },

  register: async (userData: {
    login_id: string;
    full_name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// ============= Dashboard APIs =============
export const dashboardAPI = {
  // Get supervisor dashboard stats from admin DB
  getSupervisorStats: async (): Promise<ApiResponse<SupervisorDashboardStats>> => {
    const response = await api.get('/dashboard/supervisor/stats');
    return response.data;
  },

  // Get admin dashboard stats
  getAdminStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

// ============= Sites APIs (from Admin DB) =============
export const sitesAPI = {
  getAll: async (filters?: any): Promise<ApiResponse<Site[]>> => {
    const response = await api.get('/sites', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Site>> => {
    const response = await api.get(`/sites/${id}`);
    return response.data;
  },

  create: async (siteData: Omit<Site, 'id'>): Promise<ApiResponse<Site>> => {
    const response = await api.post('/sites', siteData);
    return response.data;
  },

  update: async (id: number, siteData: Partial<Site>): Promise<ApiResponse<Site>> => {
    const response = await api.put(`/sites/${id}`, siteData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/sites/${id}`);
    return response.data;
  },
};

// ============= Users APIs (from Admin DB) =============
export const usersAPI = {
  // Get all users, optionally filtered by role
  getAll: async (role?: string): Promise<ApiResponse<User[]>> => {
    const url = role ? `/users?role=${role}` : '/users';
    const response = await api.get(url);
    return response.data;
  },

  // Get workers specifically (role = 'Worker' or 'Requester')
  getWorkers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/workers');
    return response.data;
  },

  // Get users by specific role for approvers
  getApprovers: async (approverRole: 'Approver_AreaManager' | 'Approver_Safety' | 'Approver_SiteLeader'): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/users?role=${approverRole}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: Omit<User, 'id'>): Promise<ApiResponse<User>> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// ============= Vendors APIs (from Admin DB) =============
export const vendorsAPI = {
  getAll: async (filters?: any): Promise<ApiResponse<Vendor[]>> => {
    const response = await api.get('/vendors', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Vendor>> => {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },

  create: async (vendorData: Omit<Vendor, 'id'>): Promise<ApiResponse<Vendor>> => {
    const response = await api.post('/vendors', vendorData);
    return response.data;
  },

  update: async (id: number, vendorData: Partial<Vendor>): Promise<ApiResponse<Vendor>> => {
    const response = await api.put(`/vendors/${id}`, vendorData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  },
};

// ============= Permits APIs =============
export const permitsAPI = {
  // Get all permits (admin view)
  getAll: async (filters?: any): Promise<ApiResponse<Permit[]>> => {
    const response = await api.get('/permits', { params: filters });
    return response.data;
  },

  // Get permits created by the logged-in supervisor
  getMySupervisorPermits: async (): Promise<ApiResponse<Permit[]>> => {
    const response = await api.get('/permits/my-supervisor-permits');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Permit>> => {
    const response = await api.get(`/permits/${id}`);
    return response.data;
  },

  create: async (permitData: CreatePermitFormData): Promise<ApiResponse<Permit>> => {
    const response = await api.post('/permits', permitData);
    return response.data;
  },

  update: async (id: number, permitData: Partial<Permit>): Promise<ApiResponse<Permit>> => {
    const response = await api.put(`/permits/${id}`, permitData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/permits/${id}`);
    return response.data;
  },

  // Approve permit
  approve: async (id: number, approvalData: any): Promise<ApiResponse<Permit>> => {
    const response = await api.post(`/permits/${id}/approve`, approvalData);
    return response.data;
  },

  // Reject permit
  reject: async (id: number, rejectionData: any): Promise<ApiResponse<Permit>> => {
    const response = await api.post(`/permits/${id}/reject`, rejectionData);
    return response.data;
  },

  // Close permit
  close: async (id: number, closeData: any): Promise<ApiResponse<Permit>> => {
    const response = await api.post(`/permits/${id}/close`, closeData);
    return response.data;
  },

  // Request extension
  requestExtension: async (id: number, extensionData: any): Promise<ApiResponse<Permit>> => {
    const response = await api.post(`/permits/${id}/request-extension`, extensionData);
    return response.data;
  },
};

// ============= Master Data APIs (from Admin DB) =============
export const masterDataAPI = {
  // Get all hazards
  getHazards: async (permit_type?: string): Promise<ApiResponse<MasterHazard[]>> => {
    const url = permit_type ? `/master/hazards?permit_type=${permit_type}` : '/master/hazards';
    const response = await api.get(url);
    return response.data;
  },

  // Get all PPE items
  getPPE: async (ppe_type?: string): Promise<ApiResponse<MasterPPE[]>> => {
    const url = ppe_type ? `/master/ppe?ppe_type=${ppe_type}` : '/master/ppe';
    const response = await api.get(url);
    return response.data;
  },

  // Get checklist questions
  getChecklistQuestions: async (permit_type?: string): Promise<ApiResponse<MasterChecklistQuestion[]>> => {
    const url = permit_type 
      ? `/master/checklist-questions?permit_type=${permit_type}` 
      : '/master/checklist-questions';
    const response = await api.get(url);
    return response.data;
  },

  // Create hazard
  createHazard: async (hazardData: Omit<MasterHazard, 'id'>): Promise<ApiResponse<MasterHazard>> => {
    const response = await api.post('/master/hazards', hazardData);
    return response.data;
  },

  // Create PPE
  createPPE: async (ppeData: Omit<MasterPPE, 'id'>): Promise<ApiResponse<MasterPPE>> => {
    const response = await api.post('/master/ppe', ppeData);
    return response.data;
  },

  // Create checklist question
  createChecklistQuestion: async (questionData: Omit<MasterChecklistQuestion, 'id'>): Promise<ApiResponse<MasterChecklistQuestion>> => {
    const response = await api.post('/master/checklist-questions', questionData);
    return response.data;
  },
};

// ============= File Upload APIs =============
export const uploadAPI = {
  uploadSWMS: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('swms', file);

    const response = await api.post('/uploads/swms', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadSignature: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('signature', file);

    const response = await api.post('/uploads/signature', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ============= Admin APIs =============
export const adminAPI = {
  // Get all users (admin view)
  getUsers: async (filters?: any): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  // Create user (admin only)
  createUser: async (userData: any): Promise<ApiResponse<User>> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  // Update user (admin only)
  updateUser: async (id: number, userData: any): Promise<ApiResponse<User>> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Get admin stats
  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export const permitsAPI = {
  // ... existing methods ...
  
  // Request extension
  requestExtension: async (id: number, extensionData: {
    new_end_time: string;
    reason: string;
  }): Promise<ApiResponse<Permit>> => {
    const response = await api.post(`/permits/${id}/request-extension`, extensionData);
    return response.data;
  },

  // Close permit
  close: async (id: number, closeData: {
    housekeeping_done: boolean;
    tools_removed: boolean;
    locks_removed: boolean;
    area_restored: boolean;
    remarks: string;
  }): Promise<ApiResponse<Permit>> => {
    const response = await api.post(`/permits/${id}/close`, closeData);
    return response.data;
  },
};

export default api;