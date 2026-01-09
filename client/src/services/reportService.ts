import api from './api';

export interface ReportData {
  title: string;
  category: 'bug' | 'feature' | 'other';
  description: string;
}

export interface Report extends ReportData {
  id: number;
  userId: number;
  status: 'pending' | 'resolved';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const reportService = {
  async createReport(data: ReportData) {
    const response = await api.post('/reports', data);
    return response.data;
  },

  async getReports(params?: { page?: number; limit?: number; status?: string; category?: string }) {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  async deleteReport(id: number) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};
