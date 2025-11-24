import api from './api';

export const siteService = {
  getAll: async () => {
    const response = await api.get('/sites');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/sites/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/sites', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/sites/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/sites/${id}`);
    return response.data;
  },
};