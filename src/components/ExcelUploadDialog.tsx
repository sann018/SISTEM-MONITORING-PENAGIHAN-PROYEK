import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, X, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import penagihanService from "@/services/penagihanService";
import ImportValidationModal from "@/components/ImportValidationModal";

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

interface ValidationDetails {
  total_rows_processed: number;
  duplicate_pids?: Array<{
    row: number;
    pid: string;
    nama_proyek: string;
    existing_project?: string;
  }>;
  detailed_errors?: Array<{
    row: number;
    error: string;
    message?: string;
    suggestions?: string[];
    details?: string[];
    data?: unknown;
    data_preview?: unknown;
  }>;
  has_valid_data: boolean;
  invalid_headers?: string[];
  expected_headers?: Array<{
    kolom: string;
    wajib: boolean;
    format: string;
    contoh: string;
    alternatif: string[];
    catatan?: string;
  }>;
}

interface ImportResponse {
  success?: boolean;
  message?: string;
  success_count?: number;
  failed_count?: number;
  suggestions?: string[];
  validation_details?: ValidationDetails;
  duplicate_pids?: Array<{
    row: number;
    pid: string;
    nama_proyek: string;
  }>;
  detailed_errors?: Array<{
    row: number;
    error: string;
    data: unknown;
  }>;
  warnings?: string[];
}

export default function ExcelUploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: ExcelUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Validation Modal State
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => {
    const err = error as {
      message?: string;
      response?: { status?: number; statusText?: string; data?: unknown };
    };

    if (typeof err?.message === 'string' && err.message && err.message !== 'Network Error') {
      return err.message;
    }

    const status = err?.response?.status;
    if (status === 403) return 'Akses ditolak. Anda tidak memiliki permission.';
    if (status === 401) return 'Sesi Anda telah berakhir. Silakan login kembali.';
    if (status === 500) return 'Terjadi kesalahan server. Silakan coba lagi.';

    return fallback;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('File harus berformat Excel (.xlsx, .xls) atau CSV');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await penagihanService.downloadTemplate();
      toast.success("Template berhasil diunduh");
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { status?: number; statusText?: string; data?: unknown };
      };

      console.error('Download template error:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        message: err?.message,
        data: err?.response?.data,
      });

      toast.error(getErrorMessage(error, 'Gagal mengunduh template'));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const result = await penagihanService.importExcel(selectedFile) as ImportResponse;

      // Store result for validation modal
      setImportResult(result);
      
      // Show validation modal with details
      setValidationModalOpen(true);

      // Close upload dialog
      setSelectedFile(null);
      onOpenChange(false);
      
      // Refresh data if successful
      if (result.success === true && onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error: unknown) {
      console.error('Upload error:', error);

      const err = error as {
        message?: string;
        response?: { data?: unknown };
      };

      const errorData = err?.response?.data;
      const payload =
        typeof errorData === 'object' && errorData !== null
          ? (errorData as Record<string, unknown>)
          : null;

      // If we have detailed validation info, show modal
      if (payload && ('validation_details' in payload || 'suggestions' in payload)) {
        setImportResult(payload as unknown as ImportResponse);
        setValidationModalOpen(true);
        setSelectedFile(null);
        onOpenChange(false);
      } else {
        // Fallback to toast error
        const errorMessage =
          (payload && typeof payload.message === 'string' ? payload.message : undefined) ||
          (typeof err?.message === 'string' ? err.message : undefined) ||
          'Gagal mengupload file';

        setUploadError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Import Data dari Excel
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Upload file Excel yang berisi data invoice. Download template terlebih dahulu jika diperlukan.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Template Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Template Excel</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download template untuk format yang benar
                </p>
                <Button
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingTemplate ? "Mendownload..." : "Download"}
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <label
              htmlFor="file-upload"
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer block"
            >
              <div className="flex flex-col items-center text-center">
                <Upload className="w-12 h-12 text-blue-500 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Klik untuk upload atau drag & drop
                </p>
                <p className="text-xs text-gray-500">
                  Excel (.xlsx, .xls) atau CSV
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRemoveFile}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {uploadError && (
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 mb-1">Import Gagal</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={uploading}
          >
            Batal
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
      
      {/* Validation Modal */}
      {importResult && (
        <ImportValidationModal
          open={validationModalOpen}
          onOpenChange={setValidationModalOpen}
          success={importResult.success}
          message={importResult.message}
          successCount={importResult.success_count}
          failedCount={importResult.failed_count}
          suggestions={importResult.suggestions}
          validationDetails={importResult.validation_details}
          duplicatePids={importResult.duplicate_pids}
          detailedErrors={importResult.detailed_errors}
          warnings={importResult.warnings}
        />
      )}
    </Dialog>
  );
}
