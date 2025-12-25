import { useState, useEffect } from "react";
import { Clock, Edit2, Check, X } from "lucide-react";
import DurationPicker from "@/components/DurationPicker";
import { toast } from "sonner";
import "./ProjectTimer.css";

interface ProjectTimerProps {
  projectId: string;
  projectName: string;
  estimasiDurasi?: number | string; // Durasi estimasi dalam hari
  tanggalMulai?: string; // Tanggal mulai (YYYY-MM-DD)
  statusProcurement?: string; // Status untuk mengecek apakah selesai
  onUpdateDuration?: (projectId: string, durasi: number, tanggalMulai: string) => Promise<void>;
}

interface TimeRemaining {
  hari: number;
  jam: number;
  menit: number;
  detik: number;
  isExpired: boolean;
}

export function ProjectTimer({
  projectId,
  projectName,
  estimasiDurasi = 0,
  tanggalMulai = new Date().toISOString().split("T")[0],
  statusProcurement = "",
  onUpdateDuration,
}: ProjectTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hari: 0,
    jam: 0,
    menit: 0,
    detik: 0,
    isExpired: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editDurasi, setEditDurasi] = useState<string>(String(estimasiDurasi || ""));
  const [editTanggalMulai, setEditTanggalMulai] = useState(tanggalMulai);
  const [isLoading, setIsLoading] = useState(false);

  // Hitung sisa waktu
  const calculateTimeRemaining = () => {
    const durasi = parseInt(String(estimasiDurasi)) || 0;
    
    if (durasi === 0 || !tanggalMulai) {
      setTimeRemaining({
        hari: 0,
        jam: 0,
        menit: 0,
        detik: 0,
        isExpired: true,
      });
      return;
    }

    // Tanggal target = tanggal mulai + durasi hari
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durasi);

    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) {
      // Hitung waktu yang sudah terlewat
      const overdueDiff = Math.abs(diff);
      const hari = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
      const jam = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const menit = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
      const detik = Math.floor((overdueDiff % (1000 * 60)) / 1000);

      setTimeRemaining({
        hari,
        jam,
        menit,
        detik,
        isExpired: true,
      });
    } else {
      const hari = Math.floor(diff / (1000 * 60 * 60 * 24));
      const jam = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const menit = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const detik = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({
        hari,
        jam,
        menit,
        detik,
        isExpired: false,
      });
    }
  };

  // Update timer setiap detik
  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [estimasiDurasi, tanggalMulai]);

  const handleSave = async () => {
    if (!editDurasi || isNaN(parseInt(editDurasi))) {
      toast.error("Durasi harus berupa angka");
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateDuration?.(projectId, parseInt(editDurasi), editTanggalMulai);
      toast.success("Durasi proyek berhasil diperbarui");
      setIsEditing(false);
    } catch (error) {
      toast.error("Gagal memperbarui durasi proyek");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditDurasi(String(estimasiDurasi || ""));
    setEditTanggalMulai(tanggalMulai);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-white border-2 border-green-300 rounded-lg shadow-lg">
        <div className="flex-1">
          <DurationPicker
            value={editDurasi}
            onChange={(value) => setEditDurasi(String(value))}
            label="Durasi (hari)"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={editTanggalMulai}
            onChange={(e) => setEditTanggalMulai(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <Check size={16} />
            Simpan
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <X size={16} />
            Batal
          </button>
        </div>
      </div>
    );
  }

  const isWarning = timeRemaining.hari <= 2 && !timeRemaining.isExpired;
  const isDanger = timeRemaining.hari === 0 && !timeRemaining.isExpired;
  const isOverdue = timeRemaining.isExpired;

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer group ${
        isOverdue
          ? "bg-red-100 border-red-300 hover:bg-red-200"
          : isDanger
          ? "bg-red-100 border-red-300 hover:bg-red-200"
          : isWarning
          ? "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
          : "bg-blue-100 border-blue-300 hover:bg-blue-200"
      }`}
      onClick={() => setIsEditing(true)}
      title={`Klik untuk mengubah durasi. Mulai: ${tanggalMulai}`}
    >
      <div className="flex items-center gap-2 flex-1">
        <Clock
          className={`h-4 w-4 flex-shrink-0 ${
            isOverdue
              ? "text-red-600 animate-pulse"
              : isDanger
              ? "text-red-600"
              : isWarning
              ? "text-yellow-600"
              : "text-blue-600"
          }`}
        />
        <div className="text-xs md:text-sm font-bold">
          {isOverdue ? (
            <div className="flex flex-col animate-blink">
              <span className="text-red-700 font-extrabold">⏱️ Melewati Batas</span>
              <span className="text-red-600 text-xs font-semibold">
                -{timeRemaining.hari}h -{timeRemaining.jam}j -{timeRemaining.menit}m -{timeRemaining.detik}d
              </span>
            </div>
          ) : (
            <span
              className={
                isDanger
                  ? "text-red-700"
                  : isWarning
                  ? "text-yellow-700"
                  : "text-blue-700"
              }
            >
              {timeRemaining.hari}h {timeRemaining.jam}j {timeRemaining.menit}m{" "}
              {timeRemaining.detik}d
            </span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="text-gray-600 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Edit2 size={14} />
      </button>
    </div>
  );
}
