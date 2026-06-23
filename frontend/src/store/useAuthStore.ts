import { create } from 'zustand';
import api from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  team: string;
  avatar: string;
  productivity: number;
  completionRate: number;
  performanceScore: number;
  employeeId?: string;
  twoFactorEnabled?: boolean;
}

interface AuthState {
  currentUser: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<UserProfile>;
  register: (name: string, email: string, password: string, role: string, team: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetUrl?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updatedFields: Partial<UserProfile>) => Promise<UserProfile>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  loading: false,
  initialized: false,

  checkSession: async () => {
    set({ loading: true });
    try {
      const storedUser = localStorage.getItem('taskflow_user') || sessionStorage.getItem('taskflow_user');
      if (storedUser) {
        set({ currentUser: JSON.parse(storedUser) });
      }

      const res = await api.get('/auth/me');
      const user = res.data;
      set({ currentUser: user });
      
      if (localStorage.getItem('taskflow_user')) {
        localStorage.setItem('taskflow_user', JSON.stringify(user));
      } else if (sessionStorage.getItem('taskflow_user')) {
        sessionStorage.setItem('taskflow_user', JSON.stringify(user));
      }
    } catch (error) {
      console.warn('Session verification failed, logging out client session');
      localStorage.removeItem('taskflow_user');
      sessionStorage.removeItem('taskflow_user');
      set({ currentUser: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  login: async (email, password, rememberMe) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...userData } = res.data;
      
      // Save token to localStorage for fallback/bearer configurations
      localStorage.setItem('token', token);
      set({ currentUser: userData });

      if (rememberMe) {
        localStorage.setItem('taskflow_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('taskflow_user', JSON.stringify(userData));
      }

      return userData;
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
      throw new Error(msg);
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password, role, team) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password, role, team });
      const { token, ...userData } = res.data;

      localStorage.setItem('token', token);
      set({ currentUser: userData });
      localStorage.setItem('taskflow_user', JSON.stringify(userData));

      return userData;
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(msg);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed on backend:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('taskflow_user');
      sessionStorage.removeItem('taskflow_user');
      set({ currentUser: null, loading: false });
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Forgot password failed';
      throw new Error(msg);
    }
  },

  resetPassword: async (token, password) => {
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        const { token: userToken, user: userData } = res.data;
        if (userToken) {
          localStorage.setItem('token', userToken);
          set({ currentUser: userData });
          localStorage.setItem('taskflow_user', JSON.stringify(userData));
        }
      }
      return res.data;
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Reset password failed';
      throw new Error(msg);
    }
  },

  updateProfile: async (updatedFields) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('Not logged in');

    try {
      const res = await api.put(`/users/${currentUser.id}`, updatedFields);
      const updatedUser = res.data;
      set({ currentUser: updatedUser });

      if (localStorage.getItem('taskflow_user')) {
        localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('taskflow_user')) {
        sessionStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Profile update failed';
      throw new Error(msg);
    }
  }
}));
