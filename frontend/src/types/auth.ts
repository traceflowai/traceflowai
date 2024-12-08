export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'investigator' | 'viewer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}