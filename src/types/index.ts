// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  status?: number;
}

// Common Types
export interface SelectOption {
  value: string | number;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface FilterParams {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  status?: 'pending' | 'dibayar' | 'terlambat' | 'batal';
}

// Penagihan Types
export interface Penagihan {
  id: number;
  nama_proyek: string;
  nama_mitra: string;
  pid: string;
  nomor_po: string;
  phase: string;
  status_ct: string;
  status_ut: string;
  rekon_nilai: number;
  rekon_material: string;
  pelurusan_material: string;
  status_procurement: string;
  estimasi_durasi_hari?: number;
  tanggal_mulai?: string;
  status: 'pending' | 'dibayar' | 'terlambat' | 'batal';
  tanggal_invoice?: string | null;
  tanggal_jatuh_tempo?: string | null;
  catatan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PenagihanFormData {
  nama_proyek: string;
  nama_mitra: string;
  pid: string;
  nomor_po: string;
  phase: string;
  status_ct?: string;
  status_ut?: string;
  rekon_nilai: number;
  rekon_material?: string;
  pelurusan_material?: string;
  status_procurement?: string;
  estimasi_durasi_hari?: number;
  tanggal_mulai?: string;
  tanggal_invoice?: string;
  tanggal_jatuh_tempo?: string;
  catatan?: string;
}

export interface PenagihanStatistics {
  total_penagihan: number;
  total_nilai: number;
  total_dibayar: number;
  total_pending: number;
  total_terlambat: number;
}
