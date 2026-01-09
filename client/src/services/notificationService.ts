import api from './api';
import { Notification } from '../types';

export const notificationService = {
  async getNotifications(includeRead: boolean = false): Promise<Notification[]> {
    const params = includeRead ? { includeRead: 'true' } : {};
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  async markAsRead(id: number) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};
