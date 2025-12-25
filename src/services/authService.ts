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
   * [🔐 AUTH_SYSTEM] User login dan simpan token ke localStorage
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
   * [🔐 AUTH_SYSTEM] Daftar user baru dan simpan token ke localStorage
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
   * [🔐 AUTH_SYSTEM] User logout dan hapus token dari localStorage
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
   * [🔐 AUTH_SYSTEM] Dapatkan data user yang sedang login dari server
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
   * [🔐 AUTH_SYSTEM] Cek apakah user sudah ter-autentikasi
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * [🔐 AUTH_SYSTEM] Ambil data user dari localStorage
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
