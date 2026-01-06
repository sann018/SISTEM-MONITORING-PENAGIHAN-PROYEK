import api from './api';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  FilterParams,
  Penagihan,
  PenagihanFormData,
  PenagihanStatistics
  
} from '../types';

class PenagihanService {
  private baseUrl = '/penagihan';

  /**
   * [💡 API_SERVICE] Dapatkan list semua penagihan dengan filter dan paginasi
   */
  async getAll(params?: FilterParams): Promise<PaginatedResponse<Penagihan>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Penagihan>>>(
      this.baseUrl,
      { params }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal memuat data proyek');
  }

  /**
   * [💡 API_SERVICE] Dapatkan detail penagihan berdasarkan ID
   * @param id - PID (string) or numeric ID
   */
  async getById(id: number | string): Promise<Penagihan> {
    const response = await api.get<ApiResponse<Penagihan>>(
      `${this.baseUrl}/${id}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal memuat data proyek');
  }

  /**
   * [💡 API_SERVICE] Buat penagihan baru
   */
  async create(data: PenagihanFormData): Promise<Penagihan> {
    const response = await api.post<ApiResponse<Penagihan>>(
      this.baseUrl,
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal membuat data proyek');
  }

  /**
   * [💡 API_SERVICE] Update data penagihan
   * @param id - PID (string) or numeric ID
   */
  async update(id: number | string, data: Partial<PenagihanFormData>): Promise<Penagihan> {
    const response = await api.put<ApiResponse<Penagihan>>(
      `${this.baseUrl}/${id}`,
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal memperbarui data proyek');
  }

  /**
   * [💡 API_SERVICE] Hapus penagihan berdasarkan ID
   * @param id - PID (string) or numeric ID
   */
  async delete(id: number | string): Promise<void> {
    const response = await api.delete<ApiResponse>(
      `${this.baseUrl}/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Gagal menghapus data proyek');
    }
  }

  /**
   * [💡 API_SERVICE] [🗑️ BULK_DELETE] Hapus SEMUA data proyek
   * Membutuhkan konfirmasi "DELETE_ALL_PROJECTS" untuk keamanan
   * HANYA SUPER ADMIN yang bisa mengakses
   */
  async deleteAll(
    confirmation: string, 
    excludePrioritized: boolean = false
  ): Promise<{ total_deleted: number; kept_count?: number }> {
    const response = await api.delete<ApiResponse<{ total_deleted: number; kept_count?: number }>>(
      `${this.baseUrl}/delete-all`,
      { data: { confirmation, exclude_prioritized: excludePrioritized } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal menghapus semua proyek');
  }

  /**
   * [💡 API_SERVICE] [🗑️ BULK_DELETE] Hapus data proyek terpilih (selected)
   * Menghapus multiple data berdasarkan array PID
   * HANYA SUPER ADMIN yang bisa mengakses
   */
  async deleteSelected(pids: string[]): Promise<{ total_deleted: number }> {
    const response = await api.delete<ApiResponse<{ total_deleted: number }>>(
      `${this.baseUrl}/delete-selected`,
      { data: { pids } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal menghapus proyek terpilih');
  }

  /**
   * [💡 API_SERVICE] [📄 PROJECT_MANAGEMENT] Hitung statistik dashboard penagihan
   */
  async getStatistics(): Promise<PenagihanStatistics> {
    const response = await api.get<ApiResponse<PenagihanStatistics>>(
      `${this.baseUrl}/statistics`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal memuat statistik');
  }

  /**
   * [💡 API_SERVICE] [📊 CARD_STATISTICS] Hitung statistik untuk card di dashboard
   * Menghitung dari SEMUA data proyek (bukan hanya prioritas)
   */
  async getCardStatistics(): Promise<any> {
    const response = await api.get<ApiResponse<any>>(
      `${this.baseUrl}/card-statistics`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal memuat statistik kartu');
  }

  /**
   * [💡 API_SERVICE] [📑 EXCEL_OPERATIONS] Import data penagihan dari file Excel
   * Upload file ke server dan kembalikan hasil import (success/failed count)
   */
  async importExcel(file: File): Promise<{ success_count: number; failed_count: number; errors: any }> {
    const formData = new FormData();
    formData.append('file', file);

    // ✅ CRITICAL: Harus POST, bukan GET!
    const response = await api.post<{
      success: boolean;
      message: string;
      success_count: number;
      failed_count: number;
      // legacy / fallback
      errors?: any;
      // detail untuk modal validasi
      validation_details?: {
        invalid_headers?: string[];
        expected_headers?: Array<{
          kolom: string;
          wajib: boolean;
          format: string;
          contoh: string;
          alternatif: string[];
          catatan?: string;
        }>;
        duplicate_pids?: Array<{ pid: string; existing_project?: string | null }>;
        suggestions?: string[];
      };
      detailed_errors?: Array<{
        row: number;
        errors: string[];
        values?: Record<string, any>;
      }>;
    }>(
      '/penagihan/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  /**
   * [📡 API_SERVICE] [📤 EXCEL_OPERATIONS] Export data penagihan ke file Excel
   * Download sebagai blob dengan format spreadsheet
   */
  async exportToExcel(): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/export`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Export invoices to Excel
   */
  async exportExcel(params?: FilterParams): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * [📡 API_SERVICE] [📤 EXCEL_OPERATIONS] Download template Excel untuk import
   * Template kosong dengan header siap diisi oleh user
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await api.get('/penagihan/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_invoice.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // [📤 EXCEL_OPERATIONS] Parse blob error response untuk error handling
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          console.error('[📤 EXCEL_OPERATIONS] Download template error (parsed):', errorData);
          throw new Error(errorData.message || 'Gagal mengunduh template');
        } catch (parseError) {
          console.error('[📤 EXCEL_OPERATIONS] Download template error (raw):', text);
          throw new Error('Gagal mengunduh template: ' + text);
        }
      }
      
      // [📤 EXCEL_OPERATIONS] Log error detail untuk troubleshooting
      console.error('[📤 EXCEL_OPERATIONS] Download template error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      throw error;
    }
  }

  /**
   * Set/unset prioritas manual untuk proyek
   * @param id - PID (string) or numeric ID
   * @param prioritas - 1, 2, 3, atau null untuk hapus prioritas
   */
  async setPrioritize(id: number | string, prioritas: number | null): Promise<Penagihan> {
    const response = await api.put<ApiResponse<Penagihan>>(
      `${this.baseUrl}/${id}/prioritize`,
      { 
        prioritas: prioritas
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal mengatur prioritas');
  }

  /**
   * [🎯 PRIORITY_SYSTEM] Auto-assign prioritas 2 untuk proyek yang mendekati deadline
   * @returns Jumlah proyek yang di-update dan di-clear
   */
  async autoPrioritize(): Promise<{ updated: number; cleared: number }> {
    const response = await api.post<ApiResponse<{ updated: number; cleared: number }>>(
      `${this.baseUrl}/auto-prioritize`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal menjalankan auto-prioritize');
  }

  /**
   * [🎯 PRIORITY_SYSTEM] Dapatkan proyek prioritas untuk dashboard
   */
  async getDashboardPrioritized(params?: FilterParams): Promise<PaginatedResponse<Penagihan>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Penagihan>>>(
      this.baseUrl,
      { params: { ...params, dashboard: true } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Gagal memuat proyek prioritas');
  }
}

export default new PenagihanService();
