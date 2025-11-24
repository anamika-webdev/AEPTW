// src/services/site.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface Site {
  id: number;
  site_code: string;
  name: string;
  address?: string;
}

interface SitesResponse {
  success: boolean;
  data?: Site[];
  sites?: Site[];  // Support both response formats
}

class SiteService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  async getAll(): Promise<{ sites: Site[] }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sites`, this.getAuthHeaders());
      
      // Handle different response formats
      const sites = response.data.data || response.data.sites || response.data || [];
      
      return { sites };
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Site> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sites/${id}`, this.getAuthHeaders());
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching site ${id}:`, error);
      throw error;
    }
  }

  async create(siteData: Omit<Site, 'id'>): Promise<Site> {
    try {
      const response = await axios.post(`${API_BASE_URL}/sites`, siteData, this.getAuthHeaders());
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  }

  async update(id: number, siteData: Partial<Site>): Promise<Site> {
    try {
      const response = await axios.put(`${API_BASE_URL}/sites/${id}`, siteData, this.getAuthHeaders());
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating site ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/sites/${id}`, this.getAuthHeaders());
    } catch (error) {
      console.error(`Error deleting site ${id}:`, error);
      throw error;
    }
  }
}

export const siteService = new SiteService();
export default siteService;