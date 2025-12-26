import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Activity as ActivityIcon, Clock, User, FileText, ChevronLeft, ChevronRight, Menu, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ActivityLog {
  id: number;
  nama_pengguna: string;
  aksi: string;
  deskripsi: string;
  waktu_aksi: string;
  tipe: 'login' | 'edit' | 'create' | 'delete';
  tabel_yang_diubah?: string;
  ip_address?: string;
  user_id?: number;
  foto_profile?: string;
  perubahan_detail?: {
    [key: string]: {
      nilai_lama: string | number | null;
      nilai_baru: string | number | null;
      nama_field: string;
    }
  };
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-blue-100 text-blue-800 border-blue-300';
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <User className="w-5 h-5" />;
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

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const fetchActivities = async (page: number = 1) => {
    if (!token) return;

    // Check if user is super admin or admin
    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      toast.error("Akses ditolak. Hanya Super Admin dan Admin yang dapat melihat aktivitas sistem.");
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/aktivitas?page=${page}&per_page=20`;
      
      if (filterType) {
        url += `&tipe=${filterType}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
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
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat aktivitas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check permission first - allow super_admin and admin
    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      navigate("/dashboard");
      return;
    }
    
    fetchActivities(1);
  }, [user, token, navigate]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1);
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
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <ActivityIcon className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-red-600">
                  Aktivitas Sistem
                </h1>
                <p className="text-gray-600 text-sm mt-1">Riwayat aktivitas pengguna dan sistem</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cari Aktivitas
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
                  <option value="login">Login</option>
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

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">Memuat aktivitas...</p>
              </div>
            )}

            {/* Activity Timeline */}
            {!loading && activities.length > 0 && (
              <div className="space-y-4 mt-8">
                {activities.map((activity) => {
                  const { date, time } = formatDateTime(activity.waktu_aksi);
                  const isExpanded = expandedId === activity.id;
                  const hasChanges = activity.perubahan_detail && Object.keys(activity.perubahan_detail).length > 0;
                  
                  return (
                    <div
                      key={activity.id}
                      className={`rounded-lg border-2 overflow-hidden transition-all ${getActivityColor(activity.tipe)}`}
                    >
                      {/* Main Activity Card */}
                      <div className="p-4 hover:shadow-md transition-all">
                        <div className="flex gap-4">
                          {/* Profile Photo */}
                          <div className="flex-shrink-0">
                            {activity.foto_profile ? (
                              <img 
                                src={activity.foto_profile} 
                                alt={activity.nama_pengguna}
                                className="w-12 h-12 rounded-full object-cover border-2 border-current"
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(activity.tipe)} border-2`}>
                                {getActivityIcon(activity.tipe)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2">
                              <div className="min-w-0">
                                <h3 className="font-bold text-lg">{activity.aksi}</h3>
                                <p className="text-sm font-semibold opacity-80">oleh {activity.nama_pengguna}</p>
                                {activity.tabel_yang_diubah && (
                                  <p className="text-xs opacity-60 mt-1">Tabel: {activity.tabel_yang_diubah}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-sm font-semibold whitespace-nowrap">
                                  <Clock className="w-4 h-4" />
                                  {time}
                                </div>
                                <p className="text-xs opacity-70 mt-1 whitespace-nowrap">{date}</p>
                                {activity.ip_address && (
                                  <p className="text-xs opacity-60 mt-1">IP: {activity.ip_address}</p>
                                )}
                              </div>
                            </div>
                            <p className="text-sm opacity-90 mb-2">{activity.deskripsi}</p>

                            {/* Expand Button for Details */}
                            {hasChanges && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                                className="flex items-center gap-2 text-xs font-semibold opacity-70 hover:opacity-100 transition-all"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Sembunyikan Detail Perubahan
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Lihat Detail Perubahan ({Object.keys(activity.perubahan_detail || {}).length})
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Section */}
                      {isExpanded && hasChanges && (
                        <div className="border-t-2 bg-black bg-opacity-5 p-4 space-y-3">
                          <h4 className="font-bold text-sm mb-3 opacity-80">Detail Perubahan:</h4>
                          {Object.entries(activity.perubahan_detail || {}).map(([key, change]) => (
                            <div key={key} className="bg-white bg-opacity-40 rounded-lg p-3 space-y-2">
                              <p className="font-semibold text-sm">{change.nama_field}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs opacity-70 font-semibold">Nilai Lama:</p>
                                  <div className="bg-red-100 bg-opacity-50 p-2 rounded text-sm break-words">
                                    {change.nilai_lama ? (
                                      <span className="font-mono">{String(change.nilai_lama)}</span>
                                    ) : (
                                      <span className="italic opacity-60">-</span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs opacity-70 font-semibold">Nilai Baru:</p>
                                  <div className="bg-green-100 bg-opacity-50 p-2 rounded text-sm break-words">
                                    {change.nilai_baru ? (
                                      <span className="font-mono font-bold">{String(change.nilai_baru)}</span>
                                    ) : (
                                      <span className="italic opacity-60">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

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
