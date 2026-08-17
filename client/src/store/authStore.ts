import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(name, email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  googleLogin: async (credential: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.googleAuth(credential);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Continue logout even if API fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const user = await authService.updateProfile(updates);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  clearError: () => set({ error: null }),
}));
