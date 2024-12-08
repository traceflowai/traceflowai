import { create } from 'zustand';
import Cookies from 'js-cookie';
import { AuthState, LoginCredentials, User } from '../types/auth';

// Simulated API call
const mockLogin = async (credentials: LoginCredentials): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
    return {
      id: '1',
      email: credentials.email,
      name: 'Demo User',
      role: 'investigator',
    };
  }

  throw new Error('Invalid credentials');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const user = await mockLogin(credentials);
      Cookies.set('auth_token', 'mock_token', { expires: 7 });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    Cookies.remove('auth_token');
    set({ user: null, isAuthenticated: false });
  },
}));