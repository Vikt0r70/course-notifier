import api from './api';
import { User, NotificationSettings } from '../types';

export const authService = {
  async register(data: any) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<User>) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  async resendVerification() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  async verifyOtp(userId: number, otp: string) {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  async resendOtp(userId: number) {
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyPasswordResetOtp(userId: number, otp: string) {
    const response = await api.post('/auth/verify-password-reset-otp', { userId, otp });
    return response.data;
  },

  async resendPasswordResetOtp(userId: number) {
    const response = await api.post('/auth/resend-password-reset-otp', { userId });
    return response.data;
  },

  async resetPasswordWithOtp(userId: number, newPassword: string) {
    const response = await api.post('/auth/reset-password-otp', { userId, newPassword });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Global notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get('/auth/notification-settings');
    return response.data.data;
  },

  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    const response = await api.put('/auth/notification-settings', settings);
    return response.data;
  },
};
