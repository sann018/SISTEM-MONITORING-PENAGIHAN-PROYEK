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

    throw new Error(response.data.message || 'Failed to fetch penagihan');
  }

  /**
   * [💡 API_SERVICE] Dapatkan detail penagihan berdasarkan ID
   */
  async getById(id: number): Promise<Penagihan> {
    const response = await api.get<ApiResponse<Penagihan>>(
      `${this.baseUrl}/${id}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch penagihan');
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

    throw new Error(response.data.message || 'Failed to create penagihan');
  }

  /**
   * [💡 API_SERVICE] Update data penagihan
   */
  async update(id: number, data: Partial<PenagihanFormData>): Promise<Penagihan> {
    const response = await api.put<ApiResponse<Penagihan>>(
      `${this.baseUrl}/${id}`,
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update penagihan');
  }

  /**
   * [💡 API_SERVICE] Hapus penagihan berdasarkan ID
   */
  async delete(id: number): Promise<void> {
    const response = await api.delete<ApiResponse>(
      `${this.baseUrl}/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete penagihan');
    }
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

    throw new Error(response.data.message || 'Failed to fetch statistics');
  }

  /**
   * [💡 API_SERVICE] [📑 EXCEL_OPERATIONS] Import data penagihan dari file Excel
   * Upload file ke server dan kembalikan hasil import (success/failed count)
   */
  async importExcel(file: File): Promise<{ success_count: number; failed_count: number; errors: any }> {
    const formData = new FormData();
    formData.append('file', file);

    // ✅ CRITICAL: Harus POST, bukan GET!
    const response = await api.post<{ success_count: number; failed_count: number; errors: any }>(
      '/penagihan/import',  // ✅ Endpoint
      formData,             // ✅ Data (FormData)
      {
        headers: {
          'Content-Type': 'multipart/form-data',  // ✅ Header untuk upload file
        },
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
          throw new Error(errorData.message || 'Download template failed');
        } catch (parseError) {
          console.error('[📤 EXCEL_OPERATIONS] Download template error (raw):', text);
          throw new Error('Download template failed: ' + text);
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
}

export default new PenagihanService();
