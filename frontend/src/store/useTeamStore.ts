import { create } from 'zustand';
import api from '../services/api';
import { UserProfile } from './useAuthStore';

interface TeamState {
  team: UserProfile[];
  loading: boolean;
  error: string | null;
  fetchTeam: (filters?: Record<string, any>) => Promise<void>;
  addMember: (memberData: Partial<UserProfile>) => Promise<UserProfile>;
  removeMember: (id: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set) => ({
  team: [],
  loading: false,
  error: null,

  fetchTeam: async (filters = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/users', { params: filters });
      set({ team: Array.isArray(res.data) ? res.data : [], error: null });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message || 'Failed to fetch team members' });
    } finally {
      set({ loading: false });
    }
  },

  addMember: async (memberData) => {
    set({ loading: true });
    try {
      // Admins register users via user post endpoint
      const res = await api.post('/users', memberData);
      const newMember = res.data;
      set(state => ({ team: [...state.team, newMember] }));
      return newMember;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to add team member');
    } finally {
      set({ loading: false });
    }
  },

  removeMember: async (id) => {
    try {
      await api.delete(`/users/${id}`);
      set(state => ({
        team: state.team.filter(u => u.id !== id)
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to remove team member');
    }
  }
}));
