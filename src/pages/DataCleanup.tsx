import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import {
  Trash2,
  AlertTriangle,
  Calendar,
  Database,
  TrendingDown,
  Activity,
  Bell,
  History,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import api from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CleanupStats {
  aktivitas_sistem: number;
  log_aktivitas: number;
  notifikasi: number;
  total: number;
  cutoff_date: string;
  mode?: 'day' | 'week' | 'month' | 'year';
  date_range?: string;
  range_start?: string;
  range_end?: string;
}

type CleanupMode = 'day' | 'week' | 'month' | 'year';

function getLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function DataCleanupContent() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [mode, setMode] = useState<CleanupMode>('month');
  const [date, setDate] = useState<string>(() => getLocalDateInputValue(new Date()));
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[] | null>(null);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [cleaningType, setCleaningType] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingType, setPendingType] = useState<'aktivitas-sistem' | 'log-aktivitas' | 'notifikasi' | 'all' | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isSuperAdmin) {
      toast.error('Akses ditolak: Hanya super_admin yang dapat mengakses halaman ini');
      navigate('/dashboard');
      return;
    }
  }, [user, navigate, isSuperAdmin]);

  useEffect(() => {
    const fetchAvailableYears = async () => {
      if (!token || !isSuperAdmin) return;

      try {
        setLoadingYears(true);
        const res = await api.get('/cleanup/available-years');
        const payload = res?.data;
        const years = Array.isArray(payload?.data?.years)
          ? payload.data.years
              .map((y: unknown) => parseInt(String(y), 10))
              .filter((y: number) => Number.isFinite(y))
          : [];

        const uniqueSortedYears = Array.from(new Set<number>(years)).sort((a, b) => b - a);
        setAvailableYears(uniqueSortedYears);

        // Jika tahun terpilih tidak ada di opsi, set ke tahun terbaru yang tersedia.
        if (uniqueSortedYears.length > 0 && !uniqueSortedYears.includes(tahun)) {
          setTahun(uniqueSortedYears[0]);
        }
      } catch (error: unknown) {
        console.error('Error fetching available years:', error);
        // Fallback: biarkan dropdown menggunakan list statis.
        setAvailableYears(null);
      } finally {
        setLoadingYears(false);
      }
    };

    fetchAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isSuperAdmin]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      const payload =
        mode === 'day' || mode === 'week'
          ? { mode, date }
          : mode === 'year'
            ? { mode, tahun }
            : { mode, bulan, tahun };

      const res = await api.post('/cleanup/stats', payload);
      setStats(res?.data?.data ?? null);
    } catch (error: unknown) {
      console.error('Error fetching stats:', error);
      toast.error(getErrorMessage(error, 'Gagal mengambil statistik'));
    } finally {
      setLoadingStats(false);
    }
  };

  const requestCleanup = async (type: 'aktivitas-sistem' | 'log-aktivitas' | 'notifikasi' | 'all') => {
    try {
      setLoading(true);
      setCleaningType(type);

      const payload =
        mode === 'day' || mode === 'week'
          ? { mode, date }
          : mode === 'year'
            ? { mode, tahun }
            : { mode, bulan, tahun };

      const res = await api.delete(`/cleanup/${type}`, {
        data: payload,
      });

      toast.success(res?.data?.message ?? 'Berhasil menghapus data');

      // Refresh stats
      await fetchStats();
    } catch (error: unknown) {
      console.error('Error cleanup:', error);
      toast.error(getErrorMessage(error, 'Gagal menghapus data'));
    } finally {
      setLoading(false);
      setCleaningType(null);
    }
  };

  const getCountForType = (type: 'aktivitas-sistem' | 'log-aktivitas' | 'notifikasi' | 'all'): number => {
    if (!stats) return 0;
    switch (type) {
      case 'aktivitas-sistem':
        return stats.aktivitas_sistem;
      case 'log-aktivitas':
        return stats.log_aktivitas;
      case 'notifikasi':
        return stats.notifikasi;
      case 'all':
        return stats.total;
    }
  };

  const openConfirm = (type: 'aktivitas-sistem' | 'log-aktivitas' | 'notifikasi' | 'all') => {
    setPendingType(type);
    setConfirmOpen(true);
  };

  const handleConfirmCleanup = async () => {
    if (!pendingType) return;
    setConfirmOpen(false);
    await requestCleanup(pendingType);
    setPendingType(null);
  };

  if (!user || !isSuperAdmin) return null;

  const bulanOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const fallbackTahunOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const tahunOptions = (availableYears && availableYears.length > 0) ? availableYears : fallbackTahunOptions;

  const modeOptions: Array<{ value: CleanupMode; label: string; description: string }> = [
    { value: 'day', label: 'Per Hari', description: 'Hapus data pada 1 hari yang dipilih' },
    { value: 'week', label: 'Per Minggu', description: 'Hapus data pada minggu dari tanggal yang dipilih' },
    { value: 'month', label: 'Per Bulan', description: 'Hapus data pada bulan & tahun yang dipilih' },
    { value: 'year', label: 'Per Tahun', description: 'Hapus data pada 1 tahun yang dipilih' },
  ];

  const handleModeChange = (nextMode: CleanupMode) => {
    setMode(nextMode);
    setStats(null);
  };

  const periodLabel = stats?.date_range
    ? stats.date_range
    : mode === 'year'
      ? `${tahun}`
      : mode === 'month'
        ? `${bulanOptions.find((b) => b.value === bulan)?.label} ${tahun}`
        : date;

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Pembersihan Data" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full max-w-none">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8">
              <div className="sticky top-0 z-10 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-gray-100">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 rounded-xl shadow-md">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-red-600">Pembersihan Data Lama</h1>
                    <p className="text-gray-600 text-sm mt-1">Hapus data lama untuk menjaga performa database</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">

              {/* Warning Alert */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Peringatan Penting!</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Sistem akan menghapus data <strong>HANYA pada periode yang dipilih</strong>.
                      Data yang dihapus <strong>TIDAK DAPAT</strong> dikembalikan. Pastikan Anda telah membackup data penting sebelum melakukan pembersihan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Date Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-red-600" />
                      Pilih Periode
                    </CardTitle>
                    <CardDescription>
                      Pilih mode periode untuk menghapus data secara aman dan terkontrol
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
                        <select
                          value={mode}
                          onChange={(e) => handleModeChange(e.target.value as CleanupMode)}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                        >
                          {modeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {modeOptions.find((o) => o.value === mode)?.description}
                        </p>
                      </div>

                      {(mode === 'day' || mode === 'week') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                              setDate(e.target.value);
                              setStats(null);
                            }}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {mode === 'week' ? 'Pilih tanggal, sistem akan mengambil minggu-nya' : 'Pilih tanggal yang akan dibersihkan'}
                          </p>
                        </div>
                      )}

                      {mode === 'month' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bulan</label>
                          <select
                            value={bulan}
                            onChange={(e) => {
                              setBulan(parseInt(e.target.value));
                              setStats(null);
                            }}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                          >
                            {bulanOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {(mode === 'month' || mode === 'year') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Tahun</label>
                          <select
                            value={tahun}
                            onChange={(e) => {
                              setTahun(parseInt(e.target.value));
                              setStats(null);
                            }}
                            disabled={loadingYears}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                          >
                            {tahunOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          {loadingYears && (
                            <p className="text-xs text-gray-500 mt-1">Memuat daftar tahun...</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-end">
                        <Button
                          onClick={fetchStats}
                          disabled={loadingStats}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {loadingStats ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Mengecek...
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Cek Data
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Display */}
                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik Data yang Akan Dihapus</CardTitle>
                      <CardDescription>
                        <span>
                          Periode: <strong>{stats.date_range ?? periodLabel}</strong> • Data sampai dengan:{' '}
                          <strong>
                            {new Date(stats.cutoff_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </strong>
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Aktivitas Sistem */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Activity className="h-6 w-6 text-blue-700" />
                                <h3 className="font-semibold text-gray-900">Aktivitas Sistem</h3>
                              </div>
                              <p className="text-sm text-gray-600">Data perubahan CRUD</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Jumlah</div>
                              <div className="text-3xl font-extrabold text-blue-700 leading-none">
                                {stats.aktivitas_sistem.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Log Aktivitas */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <History className="h-6 w-6 text-green-700" />
                                <h3 className="font-semibold text-gray-900">Log Aktivitas</h3>
                              </div>
                              <p className="text-sm text-gray-600">Data akses pengguna</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Jumlah</div>
                              <div className="text-3xl font-extrabold text-green-700 leading-none">
                                {stats.log_aktivitas.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notifikasi */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Bell className="h-6 w-6 text-yellow-700" />
                                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                              </div>
                              <p className="text-sm text-gray-600">Data notifikasi lama</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Jumlah</div>
                              <div className="text-3xl font-extrabold text-yellow-800 leading-none">
                                {stats.notifikasi.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Database className="h-6 w-6 text-red-700" />
                                <h3 className="font-semibold text-gray-900">Total Data</h3>
                              </div>
                              <p className="text-sm text-gray-600">Semua data akan dihapus</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Jumlah</div>
                              <div className="text-3xl font-extrabold text-red-700 leading-none">
                                {stats.total.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button
                          onClick={() => openConfirm('aktivitas-sistem')}
                          disabled={loading || stats.aktivitas_sistem === 0}
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          {cleaningType === 'aktivitas-sistem' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Hapus Aktivitas
                        </Button>

                        <Button
                          onClick={() => openConfirm('log-aktivitas')}
                          disabled={loading || stats.log_aktivitas === 0}
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          {cleaningType === 'log-aktivitas' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Hapus Log
                        </Button>

                        <Button
                          onClick={() => openConfirm('notifikasi')}
                          disabled={loading || stats.notifikasi === 0}
                          variant="outline"
                          className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                        >
                          {cleaningType === 'notifikasi' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Hapus Notifikasi
                        </Button>

                        <Button
                          onClick={() => openConfirm('all')}
                          disabled={loading || stats.total === 0}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {cleaningType === 'all' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Hapus Semua
                        </Button>
                      </div>

                      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Penghapusan Data</AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-2">
                                <div>
                                    Anda akan menghapus data untuk periode <strong>{periodLabel}</strong>.
                                </div>
                                <div>
                                  Jumlah data yang akan dihapus:{' '}
                                  <strong className="text-red-700">
                                    {pendingType ? getCountForType(pendingType).toLocaleString('id-ID') : '0'}
                                  </strong>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Data yang dihapus tidak dapat dikembalikan.
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                void handleConfirmCleanup();
                              }}
                              disabled={
                                loading ||
                                !pendingType ||
                                (pendingType ? getCountForType(pendingType) === 0 : true)
                              }
                            >
                              {pendingType === 'all' ? 'Hapus Semua' : 'Hapus'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                )}

                {/* Info Box */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-900 text-lg">💡 Tips Pembersihan Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-blue-800">
                    <p>• <strong>Aktivitas Sistem:</strong> Berisi log perubahan data (CRUD operations). Disarankan menyimpan minimal 6 bulan terakhir.</p>
                    <p>• <strong>Log Aktivitas:</strong> Berisi log akses dan navigasi pengguna. Disarankan menyimpan minimal 3 bulan terakhir.</p>
                    <p>• <strong>Notifikasi:</strong> Berisi notifikasi kepada pengguna. Disarankan menyimpan minimal 1 bulan terakhir.</p>
                    <p>• Pertimbangkan untuk melakukan pembersihan secara rutin setiap bulan untuk menjaga performa optimal.</p>
                  </CardContent>
                </Card>
              </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DataCleanup() {
  return (
    <SidebarProvider>
      <DataCleanupContent />
    </SidebarProvider>
  );
}
