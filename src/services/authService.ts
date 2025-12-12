import api from './api';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse,
  User 
} from '../types';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/register', data);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/user');
    
    if (response.data.success && response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error('Failed to get user data');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export default new AuthService();
