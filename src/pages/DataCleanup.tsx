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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface CleanupStats {
  aktivitas_sistem: number;
  log_aktivitas: number;
  notifikasi: number;
  total: number;
  cutoff_date: string;
}

function DataCleanupContent() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[] | null>(null);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [cleaningType, setCleaningType] = useState<string | null>(null);

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
        const response = await fetch(`${API_BASE_URL}/cleanup/available-years`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Gagal mengambil daftar tahun');
        }

        const payload = await response.json();
        const years = Array.isArray(payload?.data?.years)
          ? payload.data.years.map((y: any) => parseInt(String(y), 10)).filter((y: number) => Number.isFinite(y))
          : [];

        const uniqueSortedYears = Array.from(new Set<number>(years)).sort((a, b) => b - a);
        setAvailableYears(uniqueSortedYears);

        // Jika tahun terpilih tidak ada di opsi, set ke tahun terbaru yang tersedia.
        if (uniqueSortedYears.length > 0 && !uniqueSortedYears.includes(tahun)) {
          setTahun(uniqueSortedYears[0]);
        }
      } catch (error: any) {
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
      
      const response = await fetch(`${API_BASE_URL}/cleanup/stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ bulan, tahun }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil statistik');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error(error.message || 'Gagal mengambil statistik');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCleanup = async (type: 'aktivitas-sistem' | 'log-aktivitas' | 'notifikasi' | 'all') => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data ${type === 'all' ? 'SEMUA' : type}?\n\nData yang dihapus TIDAK DAPAT dikembalikan!`)) {
      return;
    }

    try {
      setLoading(true);
      setCleaningType(type);

      const response = await fetch(`${API_BASE_URL}/cleanup/${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ bulan, tahun }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data');
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      console.error('Error cleanup:', error);
      toast.error(error.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
      setCleaningType(null);
    }
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
                      Sistem akan menghapus data <strong>HANYA pada bulan dan tahun yang dipilih</strong>.
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
                      Pilih Bulan & Tahun
                    </CardTitle>
                    <CardDescription>
                      Pilih bulan dan tahun spesifik untuk menghapus data pada periode tersebut
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Bulan
                        </label>
                        <select
                          value={bulan}
                          onChange={(e) => setBulan(parseInt(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                        >
                          {bulanOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tahun
                        </label>
                        <select
                          value={tahun}
                          onChange={(e) => setTahun(parseInt(e.target.value))}
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
                        Data sampai dengan: <strong>{new Date(stats.cutoff_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Aktivitas Sistem */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Activity className="h-8 w-8 text-blue-600" />
                            <Badge variant="secondary" className="text-blue-700">
                              {stats.aktivitas_sistem.toLocaleString('id-ID')}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900">Aktivitas Sistem</h3>
                          <p className="text-sm text-gray-600">Data perubahan CRUD</p>
                        </div>

                        {/* Log Aktivitas */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <History className="h-8 w-8 text-green-600" />
                            <Badge variant="secondary" className="text-green-700">
                              {stats.log_aktivitas.toLocaleString('id-ID')}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900">Log Aktivitas</h3>
                          <p className="text-sm text-gray-600">Data akses pengguna</p>
                        </div>

                        {/* Notifikasi */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Bell className="h-8 w-8 text-yellow-600" />
                            <Badge variant="secondary" className="text-yellow-700">
                              {stats.notifikasi.toLocaleString('id-ID')}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                          <p className="text-sm text-gray-600">Data notifikasi lama</p>
                        </div>

                        {/* Total */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Database className="h-8 w-8 text-red-600" />
                            <Badge variant="destructive">
                              {stats.total.toLocaleString('id-ID')}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900">Total Data</h3>
                          <p className="text-sm text-gray-600">Semua data akan dihapus</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button
                          onClick={() => handleCleanup('aktivitas-sistem')}
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
                          onClick={() => handleCleanup('log-aktivitas')}
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
                          onClick={() => handleCleanup('notifikasi')}
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
                          onClick={() => handleCleanup('all')}
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
                    <p>• Lakukan backup database secara berkala sebelum melakukan pembersihan.</p>
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
