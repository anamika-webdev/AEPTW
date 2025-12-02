// frontend/src/services/permit.service.ts - FIXED VERSION
// Remove /api/ prefix from URLs since apiService baseURL already includes it

import { apiService } from './api.service';

export interface PermitData {
  site_id: number;
  permit_type: string;
  work_location: string;
  work_description: string;
  start_time: string;
  end_time: string;
  receiver_name: string;
  team_members: Array<{
    worker_name: string;
    company_name: string;
    badge_id: string;
    worker_role: string;
    contact_number: string;
  }>;
  hazards: number[];
  other_hazards?: string;
  control_measures: string;
  ppe: number[];
  checklist_responses: Array<{
    question_id: number;
    response: 'Yes' | 'No' | 'NA';
    remarks?: string;
  }>;
  issuer_signature: string;
}

export interface PermitResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class PermitService {
  // Create new permit
  async createPermit(permitData: PermitData, swmsFile?: File | null): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix (baseURL already has it)
      const response = await apiService.post('/permits', permitData);
      
      if (swmsFile && response.success && response.data?.id) {
        await this.uploadSWMS(response.data.id, swmsFile);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create permit'
      };
    }
  }

  // Upload SWMS file
  async uploadSWMS(permitId: number, file: File): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.uploadFile(
        `/permits/${permitId}/swms`,
        file
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to upload SWMS file'
      };
    }
  }

  // Get all permits
  async getAllPermits(filters?: {
    site_id?: number;
    status?: string;
    permit_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PermitResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString());
        });
      }
      
      // ✅ FIXED: Remove /api/ prefix
      const url = `/permits${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch permits'
      };
    }
  }

  // ✅ Get permit by ID
  async getById(permitId: number): Promise<PermitResponse> {
    try {
      console.log('🔍 permitService.getById called with ID:', permitId);
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.get(`/permits/${permitId}`);
      console.log('📥 permitService.getById response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ permitService.getById error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch permit details'
      };
    }
  }

  // Approve permit
  async approvePermit(permitId: number, approvalData: {
    comments?: string;
    signature_path?: string;
  }): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.post(`/permits/${permitId}/approve`, approvalData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to approve permit'
      };
    }
  }

  // Reject permit
  async rejectPermit(permitId: number, rejectionData: {
    reason: string;
    comments?: string;
  }): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.post(`/permits/${permitId}/reject`, rejectionData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reject permit'
      };
    }
  }

  // Close permit
  async closePermit(permitId: number, closureData: {
    housekeeping_done: boolean;
    tools_removed: boolean;
    locks_removed: boolean;
    area_restored: boolean;
    remarks?: string;
  }): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.post(`/permits/${permitId}/close`, closureData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to close permit'
      };
    }
  }

  // Request extension
  async requestExtension(permitId: number, extensionData: {
    new_end_time: string;
    reason: string;
  }): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.post(`/permits/${permitId}/extension`, extensionData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to request extension'
      };
    }
  }

  // Get dashboard statistics
  async getDashboardStats(userId?: number): Promise<PermitResponse> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const url = userId ? `/permits/stats?user_id=${userId}` : '/permits/stats';
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard statistics'
      };
    }
  }

  // Export permit as PDF
  async exportPermitPDF(permitId: number): Promise<Blob> {
    try {
      // ✅ FIXED: Remove /api/ prefix
      const response = await apiService.get(`/permits/${permitId}/pdf`, {
        responseType: 'blob'
      });
      return response as unknown as Blob;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export PDF');
    }
  }
}

// Export singleton instance
export const permitService = new PermitService();