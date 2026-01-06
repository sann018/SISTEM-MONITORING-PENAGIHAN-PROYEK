import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { 
  History,
  LogIn,
  LogOut,
  Eye,
  Download,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface LogAktivitas {
  id_log: number;
  id_pengguna: number | null;
  nama_pengguna?: string;
  foto_profile?: string | null;
  aksi: string;
  deskripsi: string | null;
  path: string | null;
  method: string | null;
  status_code: number | null;
  alamat_ip: string;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  waktu_kejadian: string;
}

interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

// Helper untuk icon berdasarkan aksi
const getActionIcon = (aksi: string) => {
  switch (aksi) {
    case 'login':
      return <LogIn className="h-4 w-4 text-green-600" />;
    case 'logout':
      return <LogOut className="h-4 w-4 text-gray-600" />;
    case 'download_laporan':
    case 'export_excel':
    case 'export_pdf':
    case 'download_dokumen':
      return <Download className="h-4 w-4 text-blue-600" />;
    case 'search':
    case 'filter':
      return <SearchIcon className="h-4 w-4 text-purple-600" />;
    default:
      return <Eye className="h-4 w-4 text-gray-600" />;
  }
};

// Helper untuk device icon
const getDeviceIcon = (deviceType: string | null) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="h-4 w-4 text-gray-500" />;
    case 'tablet':
      return <Tablet className="h-4 w-4 text-gray-500" />;
    case 'desktop':
      return <Monitor className="h-4 w-4 text-gray-500" />;
    default:
      return <Globe className="h-4 w-4 text-gray-500" />;
  }
};

// Helper untuk action label
const getActionLabel = (aksi: string) => {
  const labels: Record<string, string> = {
    'login': 'Login',
    'logout': 'Logout',
    'login_gagal': 'Login Gagal',
    'akses_dashboard': 'Akses Dashboard',
    'akses_proyek': 'Akses Proyek',
    'akses_laporan': 'Akses Laporan',
    'akses_pengguna': 'Akses Pengguna',
    'akses_profile': 'Akses Profile',
    'lihat_detail_proyek': 'Lihat Detail',
    'download_laporan': 'Download Laporan',
    'export_excel': 'Export Excel',
    'export_pdf': 'Export PDF',
    'search': 'Pencarian',
    'filter': 'Filter Data',
  };
  return labels[aksi] || aksi.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getBackendBaseUrl = () => {
  return API_BASE_URL.replace(/\/?api\/?$/, '');
};

const getPhotoUrl = (fotoProfile: string | undefined | null): string | null => {
  if (!fotoProfile) return null;

  // Full URL already
  if (/^https?:\/\//i.test(fotoProfile)) return fotoProfile;

  const baseUrl = getBackendBaseUrl();

  // Absolute path on backend
  if (fotoProfile.startsWith('/')) return `${baseUrl}${fotoProfile}`;

  // Plain path/filename
  return `${baseUrl}/${fotoProfile}`;
};

const getInitials = (name: string | undefined | null): string => {
  const safe = (name || '').trim();
  if (!safe) return 'U';
  return safe
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

function LogAktivitasContent() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAksi, setFilterAksi] = useState("");

  // Check if super_admin
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isSuperAdmin) {
      toast.error('Akses ditolak: Hanya super_admin yang dapat melihat log aktivitas');
      navigate('/dashboard');
      return;
    }

    fetchLogs();
  }, [currentPage, filterAksi, user, navigate, isSuperAdmin]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(filterAksi && { aksi: filterAksi }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`${API_BASE_URL}/log-aktivitas?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal memuat log aktivitas');
      }

      const data = await response.json();
      setLogs(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Gagal memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  if (!user || !isSuperAdmin) return null;

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Log Aktivitas" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full max-w-none">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8">
              <div className="sticky top-0 z-10 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-gray-100">
                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 rounded-xl shadow-md">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-red-600">Log Aktivitas</h1>
                    <p className="text-gray-600 text-sm mt-1">Riwayat akses dan navigasi pengguna</p>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Cari pengguna, IP, atau deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSearch}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <SearchIcon className="h-4 w-4 mr-2" />
                        Cari
                      </Button>
                    </div>
                    <select
                      value={filterAksi}
                      onChange={(e) => { setFilterAksi(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-2 border rounded-lg bg-white text-sm"
                    >
                      <option value="">Semua Aksi</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                      <option value="download_laporan">Download</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">

                {/* Logs Table */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Tidak ada log aktivitas</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Pengguna
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Aksi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Detail
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map((log) => (
                        <tr key={log.id_log} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {format(new Date(log.waktu_kejadian), 'dd MMM yyyy', { locale: id })}
                            <br />
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.waktu_kejadian), 'HH:mm:ss', { locale: id })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const photoUrl = getPhotoUrl(log.foto_profile);
                                const name = log.nama_pengguna || 'Anonymous';
                                const initials = getInitials(log.nama_pengguna);

                                if (photoUrl) {
                                  return (
                                    <img
                                      src={photoUrl}
                                      alt={name}
                                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  );
                                }

                                return (
                                  <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                                    {initials}
                                  </div>
                                );
                              })()}

                              <div>
                                <div className="font-medium text-gray-900">
                                  {log.nama_pengguna || 'Anonymous'}
                                </div>
                                {log.id_pengguna && (
                                  <div className="text-xs text-gray-500">ID: {log.id_pengguna}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              {getActionIcon(log.aksi)}
                              <span>{getActionLabel(log.aksi)}</span>
                            </Badge>
                            {log.method && (
                              <div className="text-xs text-gray-500 mt-1">
                                {log.method} {log.status_code && `• ${log.status_code}`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                            <div className="truncate" title={log.deskripsi || log.path || '-'}>
                              {log.deskripsi || log.path || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(log.device_type)}
                              <span className="text-xs">
                                {log.device_type || 'Unknown'}
                              </span>
                            </div>
                            {log.browser && (
                              <div className="text-xs text-gray-500 mt-1">
                                {log.browser} • {log.os || 'Unknown OS'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                            {log.alamat_ip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                  <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100">
                    <div className="text-sm text-gray-600">
                      Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} log
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page ? 'bg-red-600 hover:bg-red-700' : ''}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                        disabled={currentPage === pagination.last_page}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogAktivitas() {
  return (
    <SidebarProvider>
      <LogAktivitasContent />
    </SidebarProvider>
  );
}
