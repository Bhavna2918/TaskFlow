import { create } from 'zustand';
import api from '../services/api';

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'task_assigned' | 'deadline_near' | 'status_updated' | 'completed' | 'announcement';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addRealTimeNotification: (notif: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/notifications');
      set({ notifications: Array.isArray(res.data) ? res.data : [], error: null });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message || 'Failed to fetch notifications' });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? res.data : n)
      }));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
    }
  },

  addRealTimeNotification: (notif) => {
    set(state => {
      // Avoid duplication
      if (state.notifications.some(n => n.id === notif.id)) return state;
      return { notifications: [notif, ...state.notifications] };
    });
  }
}));
