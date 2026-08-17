import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async googleAuth(credential: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/google', { credential });
    return data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  async updateProfile(updates: { name?: string; avatar?: string }) {
    const { data } = await api.patch('/auth/profile', updates);
    return data.user;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
};
