import { create } from 'zustand';
import api from '../services/api';

export interface Comment {
  id?: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface HistoryItem {
  user: string;
  action: string;
  timestamp: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string;
  assignedToId: any; // User object or ID
  assignedBy?: string;
  assignedById?: any;
  projectId?: any; // Project object or ID
  progress: number;
  category: string;
  deadline: string;
  creator: string;
  labels: string[];
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryItem[];
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  pages: number;
  fetchTasks: (filters?: Record<string, any>) => Promise<void>;
  createTask: (taskData: Partial<TaskItem>) => Promise<TaskItem>;
  updateTask: (id: string, taskData: Partial<TaskItem>) => Promise<TaskItem>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (id: string, comment: Comment) => Promise<TaskItem>;
  uploadAttachment: (id: string, file: File) => Promise<TaskItem>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,

  fetchTasks: async (filters = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/tasks', { params: filters });
      
      // Handle both paginated object and simple list array fallback format
      if (res.data && typeof res.data === 'object' && 'tasks' in res.data) {
        set({
          tasks: res.data.tasks,
          page: res.data.page,
          limit: res.data.limit,
          total: res.data.total,
          pages: res.data.pages,
          error: null
        });
      } else {
        set({
          tasks: Array.isArray(res.data) ? res.data : [],
          page: 1,
          limit: res.data.length || 10,
          total: res.data.length || 0,
          pages: 1,
          error: null
        });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message || 'Failed to fetch tasks' });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (taskData) => {
    set({ loading: true });
    try {
      const res = await api.post('/tasks', taskData);
      const newTask = res.data;
      set(state => ({ tasks: [...state.tasks, newTask] }));
      return newTask;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to create task');
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const res = await api.put(`/tasks/${id}`, taskData);
      const updatedTask = res.data;
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
      }));
      return updatedTask;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to update task');
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to delete task');
    }
  },

  addComment: async (id, comment) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    const updatedComments = [...(task.comments || []), comment];
    return await get().updateTask(id, { comments: updatedComments });
  },

  uploadAttachment: async (id, file) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    // Simulate file reading/base64 generation locally
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const newAttach: Attachment = {
            name: file.name,
            url: reader.result as string, // Store image URL or base64 data
            uploadedAt: new Date().toISOString()
          };
          const updatedAttachments = [...(task.attachments || []), newAttach];
          const res = await get().updateTask(id, { attachments: updatedAttachments });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }
}));
