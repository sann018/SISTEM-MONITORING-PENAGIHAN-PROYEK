import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import penagihanService from "@/services/penagihanService";
import { getErrorMessage } from "@/utils/errors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Notifikasi {
  id_notifikasi: number;
  judul: string;
  isi_notifikasi: string;
  jenis_notifikasi: string;
  status: 'pending' | 'terkirim' | 'dibaca' | 'gagal';
  prioritas: number;
  link_terkait?: string;
  metadata?: {
    pid?: string;
    nama_proyek?: string;
    progress_persen?: number;
    days_to_deadline?: number;
    tanggal_jatuh_tempo?: string;
    [key: string]: unknown;
  };
  waktu_dibuat: string;
  waktu_dibaca?: string;
}

interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

// Helper untuk icon berdasarkan jenis
const getNotificationIcon = (jenis: string, prioritas: number) => {
  if (prioritas === 1 || prioritas === 4) {
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  }
  
  switch (jenis) {
    case 'prioritas_berubah':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'jatuh_tempo':
    case 'h_minus_7':
    case 'h_minus_5':
    case 'h_minus_3':
    case 'h_minus_1':
      return <Clock className="h-5 w-5 text-orange-600" />;
    case 'lunas':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'revisi_mitra':
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'error':
      return <X className="h-5 w-5 text-red-600" />;
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

// Helper untuk background color
const getNotificationBgColor = (status: string, prioritas: number) => {
  if (status === 'dibaca') {
    return 'bg-gray-50';
  }

  if (prioritas === 1 || prioritas === 4) {
    return 'bg-red-50 border-l-4 border-red-600';
  }

  if (prioritas === 2 || prioritas === 3) {
    return 'bg-orange-50 border-l-4 border-orange-500';
  }
  
  return 'bg-white border-l-4 border-blue-500';
};

// Helper untuk warna progress
const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};

const getProgressTextColor = (progress: number) => {
  if (progress >= 80) return 'text-green-700 bg-green-50 border-green-200';
  if (progress >= 50) return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-red-700 bg-red-50 border-red-200';
};

// Helper untuk warna badge jenis notifikasi
const getJenisBadgeColor = (jenis: string, prioritas: number) => {
  if (prioritas === 1 || prioritas === 4) return 'bg-red-100 text-red-800 border-red-300';
  if (prioritas === 2 || prioritas === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
  
  switch (jenis) {
    case 'prioritas_berubah':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'jatuh_tempo':
    case 'h_minus_1':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'h_minus_3':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'h_minus_5':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'h_minus_7':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'lunas':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper untuk label jenis
const getJenisLabel = (jenis: string) => {
  const labels: Record<string, string> = {
    'jatuh_tempo': 'Jatuh Tempo',
    'h_minus_7': 'Reminder H-7',
    'h_minus_5': 'Reminder H-5',
    'h_minus_3': 'Reminder H-3',
    'h_minus_1': 'Reminder H-1',
    'prioritas_berubah': 'Proyek Prioritas',
    'lunas': 'Lunas',
    'revisi_mitra': 'Revisi Mitra',
    'status_berubah': 'Status Berubah',
    'proyek_baru': 'Proyek Baru',
    'reminder': 'Reminder',
    'info': 'Informasi',
    'warning': 'Peringatan',
    'error': 'Error',
  };
  return labels[jenis] || jenis;
};

function NotificationsContent() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [prioritizingId, setPrioritizingId] = useState<number | null>(null);

  const isReadOnly = user?.role === 'viewer';

  const extractPid = (notif: Notifikasi): string | null => {
    const pidFromMeta = notif.metadata?.pid;
    if (typeof pidFromMeta === 'string' && pidFromMeta.trim()) return pidFromMeta.trim();

    const combined = `${notif.judul ?? ''} ${notif.isi_notifikasi ?? ''} ${notif.link_terkait ?? ''}`;
    const match = combined.match(/PID-[A-Za-z0-9._-]+/);
    return match ? match[0] : null;
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '15',
        ...(filter !== 'all' && { status: filter === 'unread' ? 'terkirim' : 'dibaca' }),
      });

      const response = await fetch(`${API_BASE_URL}/notifikasi?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal memuat notifikasi');
      }

      const data = await response.json();
      setNotifications(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, token]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user, navigate, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifikasi/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menandai notifikasi sebagai dibaca');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id_notifikasi === id 
            ? { ...notif, status: 'dibaca', waktu_dibaca: new Date().toISOString() }
            : notif
        )
      );

      toast.success('Notifikasi ditandai sudah dibaca');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Gagal menandai notifikasi');
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm('Hapus notifikasi ini?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifikasi/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus notifikasi');
      }

      setNotifications(prev => prev.filter(n => n.id_notifikasi !== id));
      toast.success('Notifikasi dihapus');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const handleNotificationClick = (notif: Notifikasi) => {
    // Mark as read if unread
    if (notif.status !== 'dibaca') {
      markAsRead(notif.id_notifikasi);
    }
  };

  const handleViewProject = (notif: Notifikasi) => {
    const pid = extractPid(notif);
    if (!pid) {
      toast.error('PID proyek tidak ditemukan pada notifikasi ini');
      return;
    }

    if (notif.status !== 'dibaca') {
      markAsRead(notif.id_notifikasi);
    }
    navigate('/projects', { state: { focusPid: pid } });
  };

  const handleUrgentPrioritize = async (notif: Notifikasi) => {
    if (isReadOnly) {
      toast.error('Akses ditolak. Viewer tidak bisa mengubah prioritas.');
      return;
    }

    const pid = extractPid(notif);
    if (!pid) {
      toast.error('PID proyek tidak ditemukan pada notifikasi ini');
      return;
    }

    try {
      setPrioritizingId(notif.id_notifikasi);
      await penagihanService.setPrioritize(pid, 1);
      toast.success(`Proyek ${pid} berhasil dijadikan urgent (Prioritas 1)`);

      if (notif.status !== 'dibaca') {
        markAsRead(notif.id_notifikasi);
      }
      navigate('/projects', { state: { focusPid: pid } });
    } catch (error: unknown) {
      console.error('Error prioritizing project from notification:', error);
        toast.error(getErrorMessage(error, 'Gagal memprioritaskan proyek'));
    } finally {
      setPrioritizingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Notifikasi" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0 h-full">
          <div className="w-full max-w-none min-h-full">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8 min-h-full">
              <div className="sticky top-0 z-10 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-gray-100">
                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 rounded-xl shadow-md">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-red-600">Notifikasi</h1>
                    <p className="text-gray-600 text-sm mt-1">Kelola notifikasi Anda</p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mt-4 bg-white rounded-xl shadow-sm p-4 flex gap-2 border border-gray-100">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setFilter('all'); setCurrentPage(1); }}
                    className={filter === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Semua
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setFilter('unread'); setCurrentPage(1); }}
                    className={filter === 'unread' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Belum Dibaca
                  </Button>
                  <Button
                    variant={filter === 'read' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setFilter('read'); setCurrentPage(1); }}
                    className={filter === 'read' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Sudah Dibaca
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4">

                {/* Notifications List */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      (() => {
                        const pid = extractPid(notif);

                        return (
                      <div
                        key={notif.id_notifikasi}
                        className={`${getNotificationBgColor(notif.status, notif.prioritas)} rounded-xl shadow-sm p-4 transition-all hover:shadow-md border border-gray-100`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.jenis_notifikasi, notif.prioritas)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-gray-900 ${notif.status !== 'dibaca' ? 'font-bold' : ''}`}>
                            {notif.judul}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`flex-shrink-0 text-xs font-semibold ${getJenisBadgeColor(notif.jenis_notifikasi, notif.prioritas)}`}
                          >
                            {getJenisLabel(notif.jenis_notifikasi)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notif.isi_notifikasi}
                        </p>

                        {typeof notif.metadata?.progress_persen === 'number' && (
                          <div className="mb-3 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold px-2 py-0.5 rounded-md border ${getProgressTextColor(notif.metadata.progress_persen)}`}>
                                Progress: {Math.max(0, Math.min(100, Math.round(notif.metadata.progress_persen)))}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(notif.metadata.progress_persen)} transition-all duration-300`}
                                style={{ width: `${Math.max(0, Math.min(100, Math.round(notif.metadata.progress_persen)))}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(notif.waktu_dibuat), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </span>
                          {notif.status === 'dibaca' && notif.waktu_dibaca && (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-600" />
                              Dibaca
                            </span>
                          )}
                        </div>

                        {pid && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-mono text-gray-600">PID: {pid}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProject(notif);
                                }}
                              >
                                Detail
                              </Button>
                              {!isReadOnly && (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={prioritizingId === notif.id_notifikasi}
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUrgentPrioritize(notif);
                                  }}
                                >
                                  {prioritizingId === notif.id_notifikasi ? 'Memproses...' : 'Jadikan Urgent'}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex gap-1">
                        {notif.status !== 'dibaca' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id_notifikasi);
                            }}
                            className="h-8 w-8"
                            title="Tandai sudah dibaca"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id_notifikasi);
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                        );
                      })()
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                  <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100">
                    <div className="text-sm text-gray-600">
                      Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} notifikasi
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

export default function Notifications() {
  return (
    <SidebarProvider>
      <NotificationsContent />
    </SidebarProvider>
  );
}
