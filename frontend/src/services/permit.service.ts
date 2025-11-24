import api from './api';
import { Permit, CreatePermitData } from '../types/permit.types';

export const permitService = {
  getAll: async (params?: any) => {
    const response = await api.get('/permits', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/permits/${id}`);
    return response.data;
  },

  create: async (data: CreatePermitData) => {
    const response = await api.post('/permits', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Permit>) => {
    const response = await api.put(`/permits/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/permits/${id}`);
    return response.data;
  },

  approve: async (id: number) => {
    const response = await api.post(`/permits/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, reason: string) => {
    const response = await api.post(`/permits/${id}/reject`, { reason });
    return response.data;
  },
};