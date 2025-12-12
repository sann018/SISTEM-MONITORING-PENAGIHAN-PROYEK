import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

interface DurationPickerProps {
  value: number | string;
  onChange: (value: number) => void;
  label?: string;
}

export default function DurationPicker({ value, onChange, label = "Durasi (hari)" }: DurationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(String(value || "7"));
  const [error, setError] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setError("");
  };

  const handleConfirm = () => {
    const numValue = parseInt(inputValue, 10);
    
    if (!inputValue || isNaN(numValue)) {
      setError("Harap masukkan angka yang valid");
      return;
    }

    if (numValue < 1) {
      setError("Durasi minimal 1 hari");
      return;
    }

    if (numValue > 365) {
      setError("Durasi maksimal 365 hari");
      return;
    }

    onChange(numValue);
    setIsOpen(false);
  };

  const handleQuickSelect = (days: number) => {
    setInputValue(String(days));
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-bold text-gray-900">{label}</label>
      
      {/* Trigger Button */}
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full border-2 border-green-400 bg-green-50 hover:bg-green-100 text-gray-900 font-semibold h-9 md:h-10 px-3 py-2 rounded-lg text-sm md:text-base transition-colors flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          <span>{value || "7"} hari</span>
        </div>
        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
      </Button>

      <p className="text-xs text-gray-600">Durasi proyek dalam hari (1-365 hari)</p>

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border-2 border-gray-300 shadow-2xl p-6 md:p-8 max-w-sm w-[90%] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Atur Durasi Proyek</h2>
              <p className="text-sm text-gray-600 mt-1">Masukkan berapa hari estimasi pengerjaan proyek</p>
            </div>

            {/* Input Field */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="number"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  min="1"
                  max="365"
                  autoFocus
                  placeholder="Masukkan jumlah hari"
                  className={`w-full border-2 rounded-lg h-12 px-4 py-2 text-base md:text-lg font-semibold text-center transition-colors ${
                    error
                      ? "border-red-500 bg-red-50 text-red-900"
                      : "border-green-400 bg-green-50 text-gray-900 focus:border-green-600"
                  } focus:outline-none`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium text-sm md:text-base">
                  hari
                </span>
              </div>

              {error && (
                <p className="text-red-600 text-xs md:text-sm font-semibold mt-2 flex items-center gap-1">
                  ⚠️ {error}
                </p>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className="mb-6">
              <p className="text-xs md:text-sm font-semibold text-gray-700 mb-3">Pilihan Cepat:</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 7, 14, 30, 60, 90, 180].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleQuickSelect(days)}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs md:text-sm transition-all duration-200 ${
                      parseInt(inputValue) === days
                        ? "bg-green-600 text-white border-2 border-green-700"
                        : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-xs md:text-sm text-blue-900">
                <strong>💡 Tips:</strong> Durasi akan digunakan untuk menghitung countdown timer saat proyek dimulai.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
