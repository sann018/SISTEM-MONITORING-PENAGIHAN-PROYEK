import { useState, memo } from "react";
import { Check, X } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { normalizeStatusText } from "@/lib/status";

interface EditableStatusCellProps {
  projectId: string;
  column: string;
  value: string;
  onUpdate: (projectId: string, column: string, newValue: string) => Promise<void>;
  variant: string;
  options?: string[];
  disabledOptions?: string[];
  disabled?: boolean;
}

// ✅ OPTIMIZED: Wrapped with React.memo to prevent unnecessary re-renders
export const EditableStatusCell = memo(function EditableStatusCell({
  projectId,
  column,
  value,
  onUpdate,
  variant,
  options = [],
  disabledOptions = [],
  disabled = false, // NEW: Default false
}: EditableStatusCellProps) {
  const normalizedValue = normalizeStatusText(value) || value;
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(normalizedValue);
  const [isLoading, setIsLoading] = useState(false);

  // =====================================
  // LETAKKAN getStatusVariant DI SINI
  // =====================================
  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    if (!status) return "default";
    
    const statusLower = status.toLowerCase().trim();

    // STATUS SELESAI / COMPLETED - HIJAU ✅
    if (statusLower === "sudah ct") return "sudah-ct";
    if (statusLower === "sudah ut") return "sudah-ut";
    if (statusLower === "sudah lurus") return "sudah-lurus";
    if (statusLower === "sudah rekon") return "sudah-rekon";
    if (statusLower === "sudah rekap") return "sudah-rekap";
    if (statusLower === "otw reg") return "otw-reg";

    // STATUS PROSES - KUNING/ORANGE ⏳
    if (statusLower === "proses periv") return "proses-periv";
    if (statusLower === "sekuler ttd") return "sekuler-ttd";
    if (statusLower === "scan dokumen mitra") return "scan-dokumen";

    // STATUS PENDING / BELUM - MERAH/PINK ❌
    if (statusLower === "belum ct") return "belum-ct";
    if (statusLower === "belum ut") return "belum-ut";
    if (statusLower === "belum lurus") return "belum-lurus";
    if (statusLower === "belum rekon") return "belum-rekon";
    if (statusLower === "belum rekap") return "belum-rekap";
    if (statusLower === "antri periv") return "antri-periv";
    if (statusLower === "revisi mitra") return "revisi-mitra";

    return "default";
  };

  const handleSave = async () => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(projectId, column, newValue);
      toast.success(`Status berhasil diperbarui`);
      setIsEditing(false);
    } catch (error) {
      toast.error(`Gagal memperbarui status`);
      setNewValue(value);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewValue(normalizedValue);
  };

  if (!isEditing) {
    return (
      <div
        className={`hover:opacity-80 hover:scale-105 transition-all duration-200 inline-block ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
        onClick={() => {
          if (disabled) return;
          setNewValue(normalizedValue);
          setIsEditing(true);
        }}
        title={disabled ? 'Read-only mode' : 'Click to edit'}
      >
        <Badge variant={getStatusVariant(value)}>
          {normalizedValue}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg border-2 border-gray-300 w-fit">
      <Select value={newValue} onValueChange={setNewValue}>
        <SelectTrigger className="h-8 border-0 focus:border-0 focus:ring-0 rounded w-auto min-w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              disabled={disabledOptions.includes(option) && option !== normalizedValue}
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="p-1 hover:bg-green-100 rounded transition-all duration-200 hover:scale-125 active:scale-95 disabled:opacity-50"
        title="Simpan"
      >
        <Check className="h-4 w-4 text-green-600 font-bold" />
      </button>
      <button
        onClick={handleCancel}
        disabled={isLoading}
        className="p-1 hover:bg-red-100 rounded transition-all duration-200 hover:scale-125 active:scale-95 disabled:opacity-50"
        title="Batal"
      >
        <X className="h-4 w-4 text-red-600 font-bold" />
      </button>
    </div>
  );
});
