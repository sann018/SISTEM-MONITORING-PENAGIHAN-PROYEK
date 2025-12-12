import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface EditableNumberCellProps {
  value: string | number;
  columnName: string;
  projectId: string;
  onUpdate: (projectId: string, column: string, newValue: string) => Promise<void>;
}

export function EditableNumberCell({
  value,
  columnName,
  projectId,
  onUpdate,
}: EditableNumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(String(value || ""));
  const [isLoading, setIsLoading] = useState(false);

  // Format angka dengan pemisah ribuan (Indonesia: 1.000.000,00)
  const formatNumber = (num: string | number): string => {
    if (!num) return "0";
    const numStr = String(num).replace(/\D/g, ""); // Hapus karakter non-digit
    // Format: 1.000.000 (tanpa desimal untuk sekarang)
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSave = async () => {
    if (newValue === String(value)) {
      setIsEditing(false);
      return;
    }

    // Validasi: hanya angka dan koma (untuk desimal)
    const cleanValue = newValue.replace(/\./g, "").replace(/,/g, "");
    if (!/^\d+$/.test(cleanValue)) {
      toast.error("Hanya masukkan angka. Gunakan koma (,) untuk desimal");
      setNewValue(String(value || ""));
      return;
    }

    setIsLoading(true);
    try {
      // Simpan hanya angka (hapus semua pemisah)
      const numericValue = cleanValue;
      await onUpdate(projectId, columnName, numericValue);
      toast.success(`${columnName} berhasil diperbarui`);
      setIsEditing(false);
    } catch (error) {
      toast.error(`Gagal memperbarui ${columnName}`);
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

  // Format input untuk menampilkan dengan pemisah ribuan saat mengetik (Indonesia format)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Pisahkan input menjadi integer dan desimal (jika ada)
    const parts = val.split(",");
    let integerPart = parts[0].replace(/\D/g, ""); // Hanya digit untuk bagian integer
    let decimalPart = parts[1] ? parts[1].replace(/\D/g, "").substring(0, 2) : ""; // Max 2 digit desimal
    
    // Format integer part dengan pemisah ribuan
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    // Gabungkan kembali
    if (decimalPart) {
      val = `${integerPart},${decimalPart}`;
    } else {
      val = integerPart;
    }
    
    setNewValue(val);
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
        <p className="text-[9px] text-gray-500">Format: 1.000.000 atau 1.000.000,50</p>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="border border-gray-300 rounded px-2 md:px-3 py-1 bg-blue-50 text-blue-900 font-medium inline-block text-[10px] md:text-xs cursor-pointer hover:bg-blue-100 transition-colors font-mono"
      title="Klik untuk mengedit - Format: 1.000.000 atau 1.000.000,50"
    >
      Rp {formatNumber(value)}
    </div>
  );
}
