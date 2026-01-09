import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Clock, Edit2, Check, X, CircleCheck } from "lucide-react";
import DurationPicker from "@/components/DurationPicker";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "./ProjectTimer.css";

interface ProjectTimerProps {
  projectId: string;
  projectName: string;
  estimasiDurasi?: number | string;
  tanggalMulai?: string;
  statusProcurement?: string;
  onUpdateDuration?: (projectId: string, durasi: number, tanggalMulai: string) => Promise<void>;
  disabled?: boolean;
  timerSelesaiPada?: string | null;
  onSetTimerComplete?: (projectId: string, selesai: boolean) => Promise<void>;
}

interface TimeRemaining {
  hari: number;
  jam: number;
  menit: number;
  detik: number;
  isExpired: boolean;
}

// ✅ OPTIMIZED: Wrapped with React.memo to prevent unnecessary re-renders
export const ProjectTimer = memo(function ProjectTimer({
  projectId,
  projectName,
  estimasiDurasi = 0,
  tanggalMulai = new Date().toISOString().split("T")[0],
  statusProcurement = "",
  onUpdateDuration,
  disabled = false,
  timerSelesaiPada,
  onSetTimerComplete,
}: ProjectTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hari: 0,
    jam: 0,
    menit: 0,
    detik: 0,
    isExpired: false,
  });

  const [open, setOpen] = useState(false);
  const [editDurasi, setEditDurasi] = useState<string>(String(estimasiDurasi || ""));
  const [editTanggalMulai, setEditTanggalMulai] = useState(tanggalMulai);
  const [isLoading, setIsLoading] = useState(false);
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);

  // Sync editable fields from props when popover is closed
  useEffect(() => {
    if (open) return;
    setEditDurasi(String(estimasiDurasi || ""));
    setEditTanggalMulai(tanggalMulai);
  }, [estimasiDurasi, tanggalMulai, open]);

  // Hitung sisa waktu
  const calculateTimeRemaining = useCallback(() => {
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
  }, [estimasiDurasi, tanggalMulai]);

  const isTimerCompleted = Boolean(timerSelesaiPada);

  const tanggalMulaiDisplay = useMemo(() => {
    return String(tanggalMulai || "").split("T")[0] || "-";
  }, [tanggalMulai]);

  const selesaiDisplay = useMemo(() => {
    if (!timerSelesaiPada) return null;
    const raw = String(timerSelesaiPada).split("T")[0];
    const [y, m, d] = raw.split("-");
    if (y && m && d) return `${d}-${m}-${y}`;
    return raw || null;
  }, [timerSelesaiPada]);

  const daysElapsed = useMemo(() => {
    const start = new Date(tanggalMulai);
    if (Number.isNaN(start.getTime())) return 0;

    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [tanggalMulai]);

  // Update timer setiap detik
  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  const handleSave = async () => {
    if (!editDurasi || isNaN(parseInt(editDurasi))) {
      toast.error("Durasi harus berupa angka");
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateDuration?.(projectId, parseInt(editDurasi), editTanggalMulai);
      toast.success("Durasi proyek berhasil diperbarui");
      setOpen(false);
    } catch (error) {
      toast.error("Gagal memperbarui durasi proyek");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!onSetTimerComplete) return;
    if (disabled) return;

    setIsTogglingComplete(true);
    try {
      await onSetTimerComplete(projectId, !isTimerCompleted);
    } finally {
      setIsTogglingComplete(false);
    }
  };

  const handleCancel = () => {
    setEditDurasi(String(estimasiDurasi || ""));
    setEditTanggalMulai(tanggalMulai);
    setOpen(false);
  };

  const isWarning = timeRemaining.hari <= 2 && !timeRemaining.isExpired;
  const isDanger = timeRemaining.hari === 0 && !timeRemaining.isExpired;
  const isOverdue = timeRemaining.isExpired;

  const TimerChip = (
    <div className="flex items-center justify-between gap-2 w-full">
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
              <span className="text-red-700 font-extrabold">Melewati Batas</span>
              <span className="text-red-600 text-xs font-semibold">
                -{timeRemaining.hari}h -{timeRemaining.jam}j -{timeRemaining.menit}m -{timeRemaining.detik}d
              </span>
            </div>
          ) : (
            <span className={isDanger ? "text-red-700" : isWarning ? "text-yellow-700" : "text-blue-700"}>
              {timeRemaining.hari}h {timeRemaining.jam}j {timeRemaining.menit}m {timeRemaining.detik}d
            </span>
          )}
        </div>
      </div>

      {isTimerCompleted ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-green-200 px-2 py-0.5 text-[10px] font-bold text-green-800 flex-shrink-0 whitespace-nowrap">
          <CircleCheck className="h-3 w-3" />
          Selesai{selesaiDisplay ? ` ${selesaiDisplay}` : ""}
        </span>
      ) : null}

      {!disabled && (
        <span className="text-gray-600 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Edit2 size={14} />
        </span>
      )}
    </div>
  );

  const chipClassName = `flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all group w-full ${
    disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
  } ${
    isOverdue
      ? "bg-red-100 border-red-300 hover:bg-red-200"
      : isDanger
        ? "bg-red-100 border-red-300 hover:bg-red-200"
        : isWarning
          ? "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
          : "bg-blue-100 border-blue-300 hover:bg-blue-200"
  }`;

  if (disabled) {
    return (
      <div className={chipClassName} title="Mode baca saja">
        {TimerChip}
      </div>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setEditDurasi(String(estimasiDurasi || ""));
          setEditTanggalMulai(tanggalMulai);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={chipClassName}
          onClick={(e) => e.stopPropagation()}
          title={`Klik untuk mengubah durasi. Mulai: ${tanggalMulaiDisplay}${selesaiDisplay ? ` | Selesai: ${selesaiDisplay}` : ''}`}
        >
          {TimerChip}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-[320px] sm:w-[380px] p-0 bg-transparent border-0 shadow-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          className="flex flex-col gap-3 p-4 bg-white border-2 border-green-300 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1">
            <DurationPicker
              value={editDurasi}
              onChange={(value) => setEditDurasi(String(value))}
              label="Durasi (hari)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={editTanggalMulai}
              onChange={(e) => setEditTanggalMulai(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
            />
          </div>

          {!disabled && onSetTimerComplete ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isTogglingComplete}
                onClick={handleToggleComplete}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                  isTimerCompleted
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isTogglingComplete
                  ? "Memproses..."
                  : isTimerCompleted
                    ? "Batalkan Tanda Selesai"
                    : "Tandai Selesai"}
              </button>
            </div>
          ) : null}

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
      </PopoverContent>
    </Popover>
  );
});
