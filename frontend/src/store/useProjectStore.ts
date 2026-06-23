import { create } from 'zustand';
import api from '../services/api';

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  creator: any;
  members: any[];
  tasks: any[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: ProjectItem[];
  loading: boolean;
  error: string | null;
  fetchProjects: (filters?: Record<string, any>) => Promise<void>;
  createProject: (projectData: Partial<ProjectItem>) => Promise<ProjectItem>;
  updateProject: (id: string, projectData: Partial<ProjectItem>) => Promise<ProjectItem>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async (filters = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/projects', { params: filters });
      
      // Handle potential pagination format or raw array list
      if (res.data && typeof res.data === 'object' && 'projects' in res.data) {
        set({ projects: res.data.projects, error: null });
      } else {
        set({ projects: Array.isArray(res.data) ? res.data : [], error: null });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message || 'Failed to fetch projects' });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (projectData) => {
    set({ loading: true });
    try {
      const res = await api.post('/projects', projectData);
      const newProj = res.data;
      set(state => ({ projects: [...state.projects, newProj] }));
      return newProj;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to create project');
    } finally {
      set({ loading: false });
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const res = await api.put(`/projects/${id}`, projectData);
      const updatedProj = res.data;
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProj : p)
      }));
      return updatedProj;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to update project');
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      set(state => ({
        projects: state.projects.filter(p => p.id !== id)
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to delete project');
    }
  }
}));
