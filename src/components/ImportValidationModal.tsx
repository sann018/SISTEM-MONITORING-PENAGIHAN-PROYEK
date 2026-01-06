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
}

interface DetailedError {
  row: number;
  error: string;
  data: any;
}

interface ValidationDetails {
  total_rows_processed: number;
  duplicate_pids?: DuplicatePid[];
  detailed_errors?: DetailedError[];
  has_valid_data: boolean;
  expected_headers?: Record<string, string>;
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

    const headerText = Object.keys(validationDetails.expected_headers).join('\t');
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
                    Data berikut tidak diimport karena PID sudah ada di database:
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allDuplicates.map((dup, index) => (
                      <div key={index} className="text-sm bg-white rounded p-2 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-orange-900 font-semibold">{dup.pid}</span>
                          <Badge variant="outline" className="text-xs">Baris {dup.row}</Badge>
                        </div>
                        <div className="text-gray-600 text-xs mt-1">{dup.nama_proyek}</div>
                      </div>
                    ))}
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allErrors.map((err, index) => (
                      <div key={index} className="text-sm bg-white rounded p-2 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">Baris {err.row}</Badge>
                        </div>
                        <div className="text-red-700 text-xs">{err.error}</div>
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
                  <div className="flex items-center justify-between mb-2">
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
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {Object.entries(validationDetails.expected_headers).map(([key, desc]) => (
                      <div key={key} className="text-xs bg-white rounded px-2 py-1.5 border border-purple-200 flex items-center justify-between">
                        <code className="font-mono text-purple-900 font-semibold">{key}</code>
                        <span className="text-gray-600 text-xs ml-2">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-700 mt-3">
                    💡 Pastikan header Excel Anda sama persis dengan format di atas (case-sensitive)
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
