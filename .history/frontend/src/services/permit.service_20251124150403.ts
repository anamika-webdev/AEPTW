// src/services/permit.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface PermitStats {
  total: number;
  draft: number;
  pending: number;
  active: number;
  closed: number;
  rejected: number;
}

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

interface PermitsResponse {
  success: boolean;
  permits: Permit[];
}

class PermitService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  async getAll(filters?: { created_by?: number; status?: string }): Promise<PermitsResponse> {
    try {
      let url = `${API_BASE_URL}/permits`;
      const params = new URLSearchParams();
      
      if (filters?.created_by) {
        params.append('created_by', filters.created_by.toString());
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching permits:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Permit> {
    try {
      const response = await axios.get(`${API_BASE_URL}/permits/${id}`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching permit ${id}:`, error);
      throw error;
    }
  }

  async getStats(): Promise<PermitStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/permits/stats`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching permit stats:', error);
      throw error;
    }
  }

  async create(permitData: Partial<Permit>): Promise<Permit> {
    try {
      const response = await axios.post(`${API_BASE_URL}/permits`, permitData, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating permit:', error);
      throw error;
    }
  }

  async update(id: number, permitData: Partial<Permit>): Promise<Permit> {
    try {
      const response = await axios.put(`${API_BASE_URL}/permits/${id}`, permitData, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error updating permit ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/permits/${id}`, this.getAuthHeaders());
    } catch (error) {
      console.error(`Error deleting permit ${id}:`, error);
      throw error;
    }
  }

  async approve(id: number, comments?: string): Promise<Permit> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/permits/${id}/approve`,
        { comments },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving permit ${id}:`, error);
      throw error;
    }
  }

  async reject(id: number, reason: string): Promise<Permit> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/permits/${id}/reject`,
        { reason },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error rejecting permit ${id}:`, error);
      throw error;
    }
  }

  async close(id: number, closureData: any): Promise<Permit> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/permits/${id}/close`,
        closureData,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error closing permit ${id}:`, error);
      throw error;
    }
  }
}

export const permitService = new PermitService();
export default permitService;