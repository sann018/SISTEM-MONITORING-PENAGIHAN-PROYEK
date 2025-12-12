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
   * Get all penagihan with filters and pagination
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
   * Get penagihan by ID
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
   * Create new penagihan
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
   * Update penagihan
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
   * Delete penagihan
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
   * Get statistics
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
   * Import data from Excel
   */
  /**
 * Import data from Excel
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
   * Download Excel template
   */
  async downloadTemplate(): Promise<void> {
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
  }
}

export default new PenagihanService();
