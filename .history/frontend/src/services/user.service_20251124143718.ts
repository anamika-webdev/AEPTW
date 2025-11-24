// src/services/user.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: 'Requester' | 'Approver_AreaManager' | 'Approver_Safety' | 'Admin' | 'Worker' | 'Supervisor';
  department?: string;
  signature_url?: string;
  site_id?: number;
  created_at: string;
}

interface UsersResponse {
  success: boolean;
  users: User[];
}

class UserService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  async getAll(): Promise<UsersResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getByRole(role: string): Promise<UsersResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users?role=${role}`, 
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching users by role ${role}:`, error);
      throw error;
    }
  }

  async getById(id: number): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  async create(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`, this.getAuthHeaders());
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;