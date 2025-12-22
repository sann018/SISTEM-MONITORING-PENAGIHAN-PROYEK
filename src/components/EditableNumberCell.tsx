import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface EditableNumberCellProps {
  projectId: string;
  column: string;
  value: string | number;
  onUpdate: (projectId: string, column: string, newValue: string) => Promise<void>;
}

export function EditableNumberCell({
  projectId,
  column,
  value,
  onUpdate,
}: EditableNumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(String(value || ""));
  const [isLoading, setIsLoading] = useState(false);

  // Format angka dengan pemisah ribuan tanpa desimal (Rp 1.000.000)
  const formatCurrency = (num: string | number): string => {
    if (!num) return "Rp 0";
    const numStr = String(num).replace(/\D/g, ""); // Hapus karakter non-digit
    const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Rp ${formatted}`;
  };

  const handleSave = async () => {
    if (newValue === String(value)) {
      setIsEditing(false);
      return;
    }

    // Validasi: hanya angka
    const cleanValue = newValue.replace(/\./g, "");
    if (!/^\d+$/.test(cleanValue)) {
      toast.error("Hanya masukkan angka");
      setNewValue(String(value || ""));
      return;
    }

    setIsLoading(true);
    try {
      // Simpan hanya angka (hapus semua pemisah)
      await onUpdate(projectId, column, cleanValue);
      toast.success("Nilai berhasil diperbarui");
      setIsEditing(false);
    } catch (error) {
      toast.error("Gagal memperbarui nilai");
      setNewValue(String(value || ""));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewValue(String(value || ""));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Format input untuk menampilkan dengan pemisah ribuan saat mengetik
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Hanya ambil digit
    let numericValue = val.replace(/\D/g, "");
    
    // Format dengan pemisah ribuan
    if (numericValue) {
      numericValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    setNewValue(numericValue);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Contoh: 1.000.000 atau 1.000.000,50"
            className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm w-[140px] md:w-[160px] font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[9px] text-gray-500">Format: 1.000.000</p>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="border border-gray-300 rounded px-2 md:px-3 py-1 bg-blue-50 text-blue-900 font-medium inline-block text-[10px] md:text-xs cursor-pointer hover:bg-blue-100 transition-colors font-mono whitespace-nowrap"
      title="Klik untuk mengedit"
    >
      {formatCurrency(value)}
    </div>
  );
}
