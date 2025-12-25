import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// [🔐 AUTH_SYSTEM] Interceptor untuk menambahkan Bearer token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Fixed: gunakan 'token' bukan 'auth_token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// [🔐 AUTH_SYSTEM] Interceptor untuk handle error responses (401, 403, dll)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[🔐 AUTH_SYSTEM] API Error:', error);
    
    // [🔐 AUTH_SYSTEM] Handle unauthorized - redirect ke login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
