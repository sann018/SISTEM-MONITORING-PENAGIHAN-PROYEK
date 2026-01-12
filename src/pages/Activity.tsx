import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Activity as ActivityIcon, Clock, User, FileText, ChevronLeft, ChevronRight, Menu, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ActivityLog {
  id_aktivitas: number;
  id_pengguna: number;
  nama_pengguna: string;
  aksi: string;
  tabel_target: string | null;
  id_target: string | null;
  nama_target?: string | null;
  detail_perubahan: {
    sebelum?: Record<string, unknown>;
    sesudah?: Record<string, unknown>;
    perubahan?: Array<{
      field: string;
      label: string;
      nilai_lama: unknown;
      nilai_baru: unknown;
    }>;
  } | null;
  alamat_ip: string | null;
  user_agent: string | null;
  waktu_kejadian: string;
  foto_profile?: string;
}

interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

function ActivityContent() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Helper: Get backend base URL (remove /api from end)
  const getBackendBaseUrl = () => {
    return API_BASE_URL.replace(/\/?api\/?$/, '');
  };

  // Helper: Generate photo URL dari backend
  const getPhotoUrl = (foto_profile: string | undefined | null): string | null => {
    if (!foto_profile) return null;
    
    // Jika sudah URL lengkap (http/https), gunakan langsung
    if (/^https?:\/\//i.test(foto_profile)) {
      return foto_profile;
    }
    
    const backendBaseUrl = getBackendBaseUrl();
    
    // Jika dimulai dengan '/', langsung append ke base URL
    if (foto_profile.startsWith('/')) {
      const fullUrl = `${backendBaseUrl}${foto_profile}`;
      return fullUrl;
    }
    
    // Jika hanya nama file, tambahkan '/' dan append
    const fullUrl = `${backendBaseUrl}/${foto_profile}`;
    return fullUrl;
  };

  // Helper: Generate initials dari nama
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper: Determine activity type from aksi
  const getActivityType = (aksi: string): 'create' | 'edit' | 'delete' | 'other' => {
    if (aksi.includes('membuat') || aksi.includes('create') || aksi.includes('menambah')) return 'create';
    if (aksi.includes('mengubah') || aksi.includes('edit') || aksi.includes('update')) return 'edit';
    if (aksi.includes('menghapus') || aksi.includes('delete') || aksi.includes('remove')) return 'delete';
    return 'other';
  };

  const getActivityColor = (aksi: string) => {
    const type = getActivityType(aksi);
    switch (type) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'edit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActivityBorderColor = (aksi: string) => {
    const type = getActivityType(aksi);
    switch (type) {
      case 'create':
        return 'border-green-300';
      case 'edit':
        return 'border-yellow-300';
      case 'delete':
        return 'border-red-300';
      default:
        return 'border-gray-300';
    }
  };

  const getActivityIcon = (aksi: string) => {
    const type = getActivityType(aksi);
    switch (type) {
      case 'create':
        return <FileText className="w-5 h-5" />;
      case 'edit':
        return <ActivityIcon className="w-5 h-5" />;
      case 'delete':
        return <FileText className="w-5 h-5" />;
      default:
        return <ActivityIcon className="w-5 h-5" />;
    }
  };

  const getActivityTitle = (aksi: string) => {
    // Friendly labels (tanpa mengubah rancangan UI)
    const map: Record<string, string> = {
      import_excel: 'Tambah Data Proyek dari Import Excel',
    };

    const normalized = String(aksi || '').trim();
    return (map[normalized] ?? normalized.replace(/_/g, ' '));
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      dayName: date.toLocaleDateString('id-ID', { weekday: 'long' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isIsoTimestampString = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    // Contoh: 2026-01-08T08:20:35.000000Z
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value);
  };

  const isTimeFieldChange = (change: { field: string; label?: string; nilai_lama: unknown; nilai_baru: unknown }) => {
    const field = String(change.field || '').toLowerCase();
    const label = String(change.label || '').toLowerCase();
    const timeFieldNames = new Set([
      'updated_at',
      'created_at',
      'waktu_kejadian',
      'timer_selesai_pada',
      'diperbarui_pada',
      'tanggal_diperbarui',
      'updated',
    ]);

    if (timeFieldNames.has(field)) return true;
    if (label.includes('diperbarui') || label.includes('waktu')) return true;

    return isIsoTimestampString(change.nilai_baru) || isIsoTimestampString(change.nilai_lama);
  };

  const formatTimestamp = (value: unknown) => {
    if (typeof value === 'string' && value) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
      return value;
    }
    if (value == null) return '-';
    return String(value);
  };

  const getTableLabel = (tabel: string | null) => {
    if (!tabel) return '';

    const map: Record<string, string> = {
      data_proyek: 'Data Proyek',
      pengguna: 'Pengguna',
    };

    return map[tabel] || tabel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const fetchActivities = useCallback(async (
    page: number = 1,
    overrides?: {
      filterType?: string;
      searchTerm?: string;
    }
  ) => {
    if (!token) return;

    // Check if user is super admin or admin
    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      toast.error("Akses ditolak. Hanya Super Admin dan Admin yang dapat melihat aktivitas sistem.");
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/aktivitas-sistem?page=${page}&per_page=20`;

      const effectiveFilterType = overrides?.filterType ?? filterType;
      const effectiveSearchTerm = overrides?.searchTerm ?? searchTerm;
      
      if (effectiveFilterType) {
        url += `&tipe=${effectiveFilterType}`;
      }
      
      if (effectiveSearchTerm) {
        url += `&search=${encodeURIComponent(effectiveSearchTerm)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat aktivitas');
      }

      setActivities(data.data || []);
      setPagination(data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal memuat aktivitas"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.role, navigate, filterType, searchTerm]);

  useEffect(() => {
    // Check permission first - allow super_admin and admin
    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      navigate("/dashboard");
      return;
    }
    
    fetchActivities(1);
  }, [user?.role, navigate, fetchActivities]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1);
    fetchActivities(1, { filterType: type });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchActivities(1);
  };

  const handlePreviousPage = () => {
    if (pagination && currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchActivities(newPage);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.last_page) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchActivities(newPage);
    }
  };

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Aktivitas Sistem" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0 h-full pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="w-full max-w-none min-h-full">
              <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8 min-h-full">
            <div className="sticky top-0 z-10 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-gray-100">
              {/* Header */}
              <div className="flex items-center gap-3">
                <ActivityIcon className="w-8 h-8 text-red-600" />
                <div>
                  <h1 className="text-3xl font-bold text-red-600">
                    Aktivitas Sistem
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">Riwayat aktivitas sistem</p>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cari Aktivitas Sistem
                  </label>
                  <input
                    type="text"
                    placeholder="Cari nama user atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Filter Tipe
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="create">Create</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                  >
                    Cari
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">Memuat aktivitas sistem...</p>
              </div>
            )}

            {/* Activity Timeline */}
            {!loading && activities.length > 0 && (
              <div className="space-y-4 mt-8">
                {activities.map((activity) => {
                  const { date, dayName, time } = formatDateTime(activity.waktu_kejadian);
                  const isExpanded = expandedId === activity.id_aktivitas;
                  const hasChanges = activity.detail_perubahan?.perubahan && activity.detail_perubahan.perubahan.length > 0;
                  
                  return (
                    <div
                      key={activity.id_aktivitas}
                      className={`rounded-2xl border-2 border-l-8 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow ${getActivityBorderColor(activity.aksi)}`}
                    >
                      {/* Main Activity Card */}
                      <div className="p-5">
                        <div className="flex gap-4">
                          {/* Profile Photo */}
                          <div className="flex-shrink-0 relative">
                            {(() => {
                              const photoUrl = getPhotoUrl(activity.foto_profile);
                              const hasPhoto = photoUrl !== null;
                              
                              return (
                                <>
                                  {hasPhoto && (
                                    <img 
                                      src={photoUrl} 
                                      alt={activity.nama_pengguna}
                                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                                      onError={(e) => {
                                        // Hide image, show initials
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const initialsDiv = target.nextElementSibling as HTMLDivElement;
                                        if (initialsDiv) {
                                          initialsDiv.classList.remove('hidden');
                                        }
                                      }}
                                    />
                                  )}
                                  <div 
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(activity.aksi)} border font-bold text-lg ${hasPhoto ? 'hidden' : ''}`}
                                    title={activity.nama_pengguna}
                                  >
                                    {getInitials(activity.nama_pengguna)}
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row items-start lg:items-start lg:justify-between gap-3 mb-2">
                              {/* Kiri: Judul + actor */}
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-2xl capitalize leading-tight text-gray-900">
                                  {getActivityTitle(activity.aksi)}
                                </h3>
                                <p className="text-base font-semibold text-gray-600">oleh {activity.nama_pengguna}</p>
                              </div>

                              {/* Tengah: Info target (pill) */}
                              <div className="w-full lg:flex-1 flex flex-col items-center gap-2">
                                {activity.tabel_target && (
                                  <div className="w-full max-w-2xl rounded-xl bg-green-100 border border-green-300 px-5 py-3 text-center shadow-sm">
                                    <div
                                      className="font-semibold text-base sm:text-lg text-green-900 leading-snug truncate"
                                      title={`Tabel ${getTableLabel(activity.tabel_target)}${activity.id_target ? ` : ${activity.id_target}` : ''}`}
                                    >
                                      Tabel {getTableLabel(activity.tabel_target)}
                                      {activity.id_target ? ` : ${activity.id_target}` : ''}
                                    </div>
                                  </div>
                                )}

                                {activity.nama_target && (activity.tabel_target === 'data_proyek' || activity.tabel_target === 'pengguna') && (
                                  <div className="w-full max-w-2xl rounded-xl bg-red-100 border border-red-300 px-5 py-3 text-center shadow-sm">
                                    <div
                                      className="font-semibold text-base sm:text-lg text-red-900 leading-snug truncate"
                                      title={`${activity.tabel_target === 'data_proyek' ? 'Proyek' : 'Pengguna'} : ${activity.nama_target}`}
                                    >
                                      {activity.tabel_target === 'data_proyek' ? 'Proyek' : 'Pengguna'} : {activity.nama_target}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Kanan: waktu */}
                              <div className="text-right flex-shrink-0 w-full lg:w-auto">
                                <div className="flex items-center justify-end gap-1 text-base font-semibold whitespace-nowrap">
                                  <Clock className="w-4 h-4" />
                                  {time}
                                </div>
                                <p className="text-sm text-gray-600 mt-1 whitespace-nowrap">{date}</p>
                                <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{dayName}</p>
                                {activity.alamat_ip && (
                                  <p className="text-sm text-gray-600 mt-1 whitespace-nowrap">IP: {activity.alamat_ip}</p>
                                )}
                              </div>
                            </div>

                            {/* Expand Button for Details */}
                            {hasChanges && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : activity.id_aktivitas)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Sembunyikan Detail Perubahan
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Lihat Detail Perubahan ({activity.detail_perubahan?.perubahan?.length || 0})
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Section */}
                      {isExpanded && hasChanges && activity.detail_perubahan?.perubahan && (
                        <div className="border-t bg-gray-50 p-5 space-y-3">
                          <h4 className="font-bold text-sm mb-3 text-gray-700">Detail Perubahan:</h4>
                          {activity.detail_perubahan.perubahan.map((change, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 space-y-2 border border-gray-100">
                              <p className="font-semibold text-sm text-gray-800">{change.label || change.field}</p>
                              {isTimeFieldChange(change) ? (
                                <div className="bg-green-50 p-3 rounded-lg text-sm break-words border border-green-100">
                                  <span className="font-mono font-bold">{formatTimestamp(change.nilai_baru ?? change.nilai_lama)}</span>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600 font-semibold">Nilai Lama:</p>
                                    <div className="bg-red-50 p-3 rounded-lg text-sm break-words border border-red-100">
                                      {change.nilai_lama != null ? (
                                        <span className="font-mono">{String(change.nilai_lama)}</span>
                                      ) : (
                                        <span className="italic opacity-60">-</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600 font-semibold">Nilai Baru:</p>
                                    <div className="bg-green-50 p-3 rounded-lg text-sm break-words border border-green-100">
                                      {change.nilai_baru != null ? (
                                        <span className="font-mono font-bold">{String(change.nilai_baru)}</span>
                                      ) : (
                                        <span className="italic opacity-60">-</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            </div>

            {/* Empty State */}
            {!loading && activities.length === 0 && (
              <div className="text-center py-12">
                <ActivityIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-semibold">Tidak ada aktivitas ditemukan</p>
                <p className="text-gray-500 text-sm mt-2">Mulai dengan melakukan perubahan di sistem</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination && pagination.last_page > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {pagination.from} hingga {pagination.to} dari {pagination.total} aktivitas
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Sebelumnya
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          fetchActivities(page);
                        }}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'border-2 border-gray-300 hover:border-red-500'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === pagination.last_page}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500 transition-all"
                  >
                    Selanjutnya
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Activity() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ActivityContent />
    </SidebarProvider>
  );
}
