import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

// Create a local storage mock for the Node test environment
class StorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

global.localStorage = new StorageMock() as any;
global.sessionStorage = new StorageMock() as any;

vi.mock('../services/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  };
});

describe('useAuthStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state manually
    useAuthStore.setState({
      currentUser: null,
      loading: false,
      initialized: false
    });
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should start with initial null user state', () => {
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.initialized).toBe(false);
  });

  it('should successfully update currentUser state on successful login', async () => {
    const mockUser = {
      id: '12345',
      name: 'Test Admin',
      email: 'admin@taskflow.com',
      role: 'admin' as const,
      team: 'Management',
      avatar: '',
      productivity: 100,
      completionRate: 90,
      performanceScore: 9.5
    };

    // Mock API post method
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        token: 'mock-jwt-token',
        ...mockUser
      }
    });

    const loginPromise = useAuthStore.getState().login('admin@taskflow.com', 'password123', true);
    
    // Check loading state
    expect(useAuthStore.getState().loading).toBe(true);

    const user = await loginPromise;

    expect(user).toEqual(mockUser);
    expect(useAuthStore.getState().currentUser).toEqual(mockUser);
    expect(useAuthStore.getState().loading).toBe(false);
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(localStorage.getItem('taskflow_user')).toContain('Test Admin');
  });

  it('should fail and throw error on invalid credentials login', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid email or password'
        }
      }
    });

    await expect(
      useAuthStore.getState().login('admin@taskflow.com', 'wrong', false)
    ).rejects.toThrow('Invalid email or password');

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('should successfully clear credentials on logout', async () => {
    // Set mock user first
    const mockUser = {
      id: '12345',
      name: 'Test Admin',
      email: 'admin@taskflow.com',
      role: 'admin' as const,
      team: 'Management',
      avatar: '',
      productivity: 100,
      completionRate: 90,
      performanceScore: 9.5
    };
    useAuthStore.setState({ currentUser: mockUser });
    localStorage.setItem('token', 'some-token');

    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
