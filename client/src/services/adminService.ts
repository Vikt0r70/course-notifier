import api from './api';

export const adminService = {
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  async getUsers(params: any = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  async deleteUser(id: number) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async toggleEmailVerification(id: number) {
    const response = await api.put(`/admin/users/${id}/verify`);
    return response.data;
  },

  async getAllWatchlists(params: any = {}) {
    const response = await api.get('/admin/watchlists', { params });
    return response.data.data;
  },

  async runScraper() {
    const response = await api.post('/admin/scraper/run');
    return response.data;
  },

  async getScraperLogs(limit = 10) {
    const response = await api.get('/admin/scraper/logs', { params: { limit } });
    return response.data.data;
  },

  async getSettings() {
    const response = await api.get('/admin/settings');
    return response.data.data;
  },

  async updateSettings(key: string, value: string) {
    const response = await api.put('/admin/settings', { key, value });
    return response.data;
  },

  async sendTestEmail(email: string) {
    const response = await api.post('/admin/email/test', { email });
    return response.data;
  },

  async triggerNotificationCheck() {
    const response = await api.post('/admin/notifications/check');
    return response.data;
  },

  // SMTP Settings
  async getSmtpSettings() {
    const response = await api.get('/admin/smtp');
    return response.data.data;
  },

  async updateSmtpSettings(settings: Record<string, string>) {
    const response = await api.put('/admin/smtp', settings);
    return response.data;
  },

  // Server Logs
  async getServerLogs(limit = 100, level?: string) {
    const response = await api.get('/admin/logs/server', { params: { limit, level } });
    return response.data.data;
  },

  async clearServerLogs() {
    const response = await api.delete('/admin/logs/server');
    return response.data;
  },

  // Database Logs/Stats
  async getDatabaseLogs() {
    const response = await api.get('/admin/logs/database');
    return response.data.data;
  },

  // Scraper Status (real-time)
  async getScraperStatus() {
    const response = await api.get('/admin/scraper/status');
    return response.data.data;
  },

  // Watch All Courses (Admin feature)
  async getWatchAllCoursesStatus() {
    const response = await api.get('/admin/watch-all-status');
    return response.data.data;
  },

  async toggleWatchAllCourses() {
    const response = await api.post('/admin/toggle-watch-all');
    return response.data;
  },
};
