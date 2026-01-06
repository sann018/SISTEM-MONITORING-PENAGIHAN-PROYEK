import api from './api';
import { authStorage } from '@/lib/authStorage';
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
      authStorage.setToken(token);
      authStorage.setUserRaw(JSON.stringify(user));
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
      authStorage.setToken(token);
      authStorage.setUserRaw(JSON.stringify(user));
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
      authStorage.clear();
    }
  }

  /**
   * [🔐 AUTH_SYSTEM] Dapatkan data user yang sedang login dari server
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/user');
    
    if (response.data.success && response.data.data) {
      authStorage.setUserRaw(JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error('Failed to get user data');
  }

  /**
   * [🔐 AUTH_SYSTEM] Cek apakah user sudah ter-autentikasi
   */
  isAuthenticated(): boolean {
    return !!authStorage.getToken();
  }

  /**
   * [🔐 AUTH_SYSTEM] Ambil data user dari localStorage
   */
  getStoredUser(): User | null {
    const userStr = authStorage.getUserRaw();
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return authStorage.getToken();
  }
}

export default new AuthService();
