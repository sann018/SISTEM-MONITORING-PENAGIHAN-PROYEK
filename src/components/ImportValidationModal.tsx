import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  FileSpreadsheet,
  Download,
  Copy
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DuplicatePid {
  row: number;
  pid: string;
  nama_proyek: string;
  reason?: string;
  existing_project?: string;
}

interface DetailedError {
  row: number;
  error: string;
  message?: string;
  details?: string[];
  suggestions?: string[];
  data?: unknown;
  data_preview?: unknown;
}

interface ExpectedHeader {
  kolom: string;
  wajib: boolean;
  format: string;
  contoh: string;
  alternatif: string[];
  catatan?: string;
}

interface ValidationDetails {
  total_rows_processed: number;
  duplicate_pids?: DuplicatePid[];
  detailed_errors?: DetailedError[];
  has_valid_data: boolean;
  invalid_headers?: string[];
  expected_headers?: ExpectedHeader[];
}

interface ImportValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success: boolean;
  message: string;
  successCount?: number;
  failedCount?: number;
  suggestions?: string[];
  validationDetails?: ValidationDetails;
  duplicatePids?: DuplicatePid[];
  detailedErrors?: DetailedError[];
  warnings?: string[];
}

export default function ImportValidationModal({
  open,
  onOpenChange,
  success,
  message,
  successCount = 0,
  failedCount = 0,
  suggestions = [],
  validationDetails,
  duplicatePids = [],
  detailedErrors = [],
  warnings = [],
}: ImportValidationModalProps) {
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  // Merge duplicates and errors from both sources
  const allDuplicates = [
    ...(validationDetails?.duplicate_pids || []),
    ...duplicatePids
  ];
  
  const allErrors = [
    ...(validationDetails?.detailed_errors || []),
    ...detailedErrors
  ];

  const hasIssues = allDuplicates.length > 0 || allErrors.length > 0 || warnings.length > 0;

  const copyHeaders = () => {
    if (!validationDetails?.expected_headers) return;

    // Copy dengan format yang lebih friendly
    const headerText = validationDetails.expected_headers
      .map(h => h.alternatif[0])
      .join('\t');
    navigator.clipboard.writeText(headerText);
    setCopiedHeaders(true);
    toast.success("Header berhasil disalin ke clipboard");
    
    setTimeout(() => setCopiedHeaders(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {success ? (
              hasIssues ? (
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              )
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-bold">
                {success ? (hasIssues ? "Import Berhasil dengan Peringatan" : "Import Berhasil") : "Import Gagal"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">Berhasil</span>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900 mt-1">{successCount}</div>
            </div>
            
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700 font-medium">Gagal</span>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900 mt-1">{failedCount}</div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Saran Perbaikan:</h3>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">Peringatan:</h3>
                  <ul className="space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-800">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate PIDs */}
          {allDuplicates.length > 0 && (
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    PID Duplikat ({allDuplicates.length})
                  </h3>
                  <p className="text-sm text-orange-800 mb-3">
                    ⚠️ Data berikut tidak diimport karena PID sudah terdaftar di database:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allDuplicates.map((dup, index) => (
                      <div key={index} className="text-sm bg-white rounded p-3 border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-orange-900 font-bold bg-orange-100 px-2 py-1 rounded">
                              {dup.pid}
                            </span>
                            <Badge variant="outline" className="text-xs bg-white">Baris {dup.row}</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 font-semibold min-w-[80px]">Di Excel:</span>
                            <span className="text-gray-700">{dup.nama_proyek}</span>
                          </div>
                          
                          {dup.existing_project && (
                            <div className="flex items-start gap-2 pt-1 border-t border-orange-100">
                              <span className="text-orange-600 font-semibold min-w-[80px]">Di Database:</span>
                              <span className="text-orange-800">{dup.existing_project}</span>
                            </div>
                          )}
                          
                          {dup.reason && (
                            <div className="flex items-start gap-2 mt-1 pt-1 border-t border-orange-100">
                              <span className="text-orange-500 flex-shrink-0">💡</span>
                              <span className="text-orange-700 italic">{dup.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-300">
                    <p className="text-xs text-orange-800 font-semibold">
                      🔑 Solusi: Ubah PID di file Excel Anda agar tidak bentrok dengan data yang sudah ada
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Errors */}
          {allErrors.length > 0 && (
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Error Detail ({allErrors.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allErrors.map((err, index) => (
                      <div key={index} className="text-sm bg-white rounded p-3 border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs bg-red-100">Baris {err.row}</Badge>
                          <span className="text-red-800 font-semibold text-xs">{err.error}</span>
                        </div>
                        
                        {err.details && err.details.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {err.details.map((detail, idx) => (
                              <div key={idx} className="text-xs text-red-700 flex items-start gap-1">
                                <span className="text-red-500 flex-shrink-0">•</span>
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {err.data_preview && (
                          <div className="mt-2 pt-2 border-t border-red-100">
                            <div className="text-xs text-gray-600 space-y-0.5">
                              {Object.entries(err.data_preview).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-semibold text-gray-700">{key}:</span>
                                  <span className="font-mono text-gray-600">{String(value) || '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {err.message && (
                          <div className="mt-2 text-xs text-gray-600 italic">
                            {err.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expected Headers */}
          {validationDetails?.expected_headers && (
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-900">Format Header yang Benar</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyHeaders}
                      className="h-7 text-xs"
                    >
                      {copiedHeaders ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Salin Header
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {validationDetails.expected_headers.map((header, index) => (
                      <div key={index} className="text-xs bg-white rounded p-3 border border-purple-200">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-purple-900 font-bold bg-purple-100 px-2 py-1 rounded">
                              {header.kolom}
                            </code>
                            {header.wajib && (
                              <Badge variant="destructive" className="text-[10px] h-5">WAJIB</Badge>
                            )}
                          </div>
                          <span className="text-gray-600 text-xs">{header.format}</span>
                        </div>
                        
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 font-semibold min-w-[60px]">Contoh:</span>
                            <code className="text-gray-700 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                              {header.contoh}
                            </code>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 font-semibold min-w-[60px]">Header:</span>
                            <div className="flex flex-wrap gap-1">
                              {header.alternatif.map((alt, idx) => (
                                <code key={idx} className="text-gray-600 font-mono bg-gray-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {alt}
                                </code>
                              ))}
                            </div>
                          </div>
                          
                          {header.catatan && (
                            <div className="flex items-start gap-2 mt-1 pt-1 border-t border-purple-100">
                              <span className="text-purple-600 flex-shrink-0">💡</span>
                              <span className="text-purple-700">{header.catatan}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
                    <p className="text-xs text-purple-800 font-semibold">
                      ✨ Header Excel fleksibel - gunakan salah satu format yang tercantum
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      💡 Case-insensitive: "Nama Proyek", "nama_proyek", atau "NAMA PROYEK" semua diterima
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invalid Headers Warning */}
          {validationDetails?.invalid_headers && validationDetails.invalid_headers.length > 0 && (
            <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Header Tidak Dikenali
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {validationDetails.invalid_headers.map((header, index) => (
                      <Badge key={index} variant="outline" className="bg-white text-yellow-800 border-yellow-300">
                        {header}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700">
                    Header di atas tidak sesuai dengan format yang diharapkan dan akan diabaikan saat import.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Template Reminder */}
          {!success && (
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">
                    Download template Excel untuk memastikan format yang benar
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Gunakan tombol "Download Template" di dialog import
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            variant={success ? "default" : "outline"}
            className={success ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            {success ? "Tutup" : "Coba Lagi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
