import { useEffect, useState, useMemo, useCallback, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/Badge";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, SlidersHorizontal, Search, Menu } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { formatRupiahNoDecimal } from "@/lib/currency";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeStatusText } from "@/lib/status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  nama_proyek: string;
  nama_mitra: string;
  pid: string;
  jenis_po: string;
  nomor_po: string;
  phase: string;
  status_ct: string;
  status_ut: string;
  rekap_boq: string;
  rekon_nilai: string;
  rekon_material: string;
  pelurusan_material: string;
  status_procurement: string;
  prioritas?: number | null;
  prioritas_label?: string;
  priority_info?: {
    level: string;
    level_label: string;
    level_icon: string;
    level_color: string;
    source: string | null;
    source_label: string | null;
    can_override: boolean;
    score: number;
    reason: string | null;
    is_high_priority: boolean;
    is_critical: boolean;
  };
}

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  const [projects, setProjects] = useState<Project[]>([]);
  const isReadOnly = user?.role === 'viewer';
  const canBulkSetPriority = !isReadOnly && (user?.role === 'super_admin' || user?.role === 'admin');
  const [selectedPids, setSelectedPids] = useState<Set<string>>(new Set());
  const [isSettingSelectedPriority, setIsSettingSelectedPriority] = useState(false);
  const [cardStats, setCardStats] = useState({
    total_proyek: 0,
    sudah_penuh: 0,
    sedang_berjalan: 0,
    tertunda: 0,
    belum_rekon: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const normalizePid = useCallback((pid: string | number | undefined | null): string => String(pid ?? '').trim(), []);

  type DashboardProjectItem = {
    pid?: string | number | null;
    nama_proyek?: string | null;
    nama_mitra?: string | null;
    jenis_po?: string | null;
    nomor_po?: string | null;
    phase?: string | null;
    status_ct?: string | null;
    status_ut?: string | null;
    rekap_boq?: string | null;
    rekon_nilai?: string | number | null;
    rekon_material?: string | null;
    pelurusan_material?: string | null;
    status_procurement?: string | null;
    prioritas?: number | null;
    prioritas_label?: string | null;
    priority_info?: Project["priority_info"] | null;
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch dashboard prioritized projects
      const response = await penagihanService.getDashboardPrioritized();
      
      // Map data dari API ke format yang dibutuhkan
      const mappedData: Project[] = response.data.map((item: DashboardProjectItem) => {
        const pid = normalizePid(item.pid);

        return {
          id: pid,  // ✅ Gunakan PID sebagai ID (primary key)
          nama_proyek: item.nama_proyek || '',
          nama_mitra: item.nama_mitra || '',
          pid,
          jenis_po: item.jenis_po || '',
          nomor_po: item.nomor_po || '',
          phase: item.phase || '',
          status_ct: normalizeStatusText(item.status_ct) || 'Belum CT',
          status_ut: normalizeStatusText(item.status_ut) || 'Belum UT',
          rekap_boq: normalizeStatusText(item.rekap_boq) || '',
          rekon_nilai: item.rekon_nilai?.toString() || '0',
          rekon_material: normalizeStatusText(item.rekon_material) || 'Belum Rekon',
          pelurusan_material: normalizeStatusText(item.pelurusan_material) || 'Belum Lurus',
          status_procurement: normalizeStatusText(item.status_procurement) || 'Antri Periv',
          prioritas: item.prioritas ?? null,
          prioritas_label: item.prioritas_label ?? undefined,
          priority_info: item.priority_info ?? undefined,
        };
      });

      setProjects(mappedData);
    } catch (error) {
      toast.error("Gagal memuat data proyek");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [normalizePid]);

  const fetchCardStatistics = useCallback(async () => {
    try {
      const response = await penagihanService.getCardStatistics();
      setCardStats(response);
    } catch (error) {
      toast.error("Gagal memuat statistik");
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchCardStatistics();
  }, [fetchProjects, fetchCardStatistics]);

  // Dropdown prioritas pakai Radix (auto flip/shift), tidak perlu manual close.

  // ✅ OPTIMIZED: Memoized handler
  const handleSetPriority = useCallback(async (projectId: string, priorityValue: number | null) => {
    try {
      const project = projects.find(p => p.id === projectId);
      const projectName = project?.nama_proyek || 'Proyek';

      await penagihanService.setPrioritize(projectId, priorityValue);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                prioritas: priorityValue,
                prioritas_label:
                  priorityValue === 1
                    ? 'Prioritas 1'
                    : priorityValue === 2
                      ? 'Prioritas 2'
                      : priorityValue === 3
                        ? 'Prioritas 3'
                        : null,
              }
            : p
        )
      );
      
      if (priorityValue === null) {
        toast.success(`Prioritas ${projectName} berhasil dihapus`, {
          position: 'bottom-center',
          duration: 3000,
        });
      } else {
        toast.success(`${projectName} menjadi Prioritas ${priorityValue}`, {
          position: 'bottom-center',
          duration: 3000,
        });
      }
      await Promise.all([fetchProjects(), fetchCardStatistics()]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal mengatur prioritas"));
      console.error('Error setting priority:', error);
    }
  }, [projects, fetchProjects, fetchCardStatistics]);

  // =====================================
  // ✅ OPTIMIZED: Memoized helpers
  // =====================================
  const formatCurrency = useCallback((num: string | number | null | undefined): string => {
    return formatRupiahNoDecimal(num);
  }, []);

  // =====================================
  // STATISTICS FROM BACKEND (ALL DATA)
  // =====================================
  const totalProjects = cardStats.total_proyek;
  const completedProjects = cardStats.sudah_penuh;
  const ongoingProjects = cardStats.sedang_berjalan;
  const delayedProjects = cardStats.tertunda;
  const notReconProjects = cardStats.belum_rekon;

  // =====================================
  // ✅ OPTIMIZED: Navigation handlers
  // =====================================
  const handleNavigateToProjects = useCallback((filter: "all" | "completed" | "ongoing" | "delayed") => {
    navigate("/projects", { state: { filter } });
  }, [navigate]);

  // =====================================
  // ✅ OPTIMIZED: Memoized search filter
  // =====================================
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    
    const searchTerms = searchTerm
      .split(/[,;]/)
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0);
    
    return projects.filter((project) =>
      searchTerms.some(term =>
        project.nama_proyek.toLowerCase().includes(term) ||
        project.nama_mitra.toLowerCase().includes(term) ||
        project.pid.toLowerCase().includes(term) ||
        (project.prioritas_label?.toLowerCase() || '').includes(term)
      )
    );
  }, [projects, searchTerm]);

  // =====================================
  // ✅ Checkbox selection (dashboard)
  // =====================================
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allPids = new Set(filteredProjects.map((p) => normalizePid(p.pid)).filter(Boolean));
      setSelectedPids(allPids);
    } else {
      setSelectedPids(new Set());
    }
  }, [filteredProjects, normalizePid]);

  const handleSelectOne = useCallback((pid: string, checked: boolean) => {
    setSelectedPids((prev) => {
      const newSet = new Set(prev);
      const normalized = normalizePid(pid);
      if (!normalized) return newSet;
      if (checked) newSet.add(normalized);
      else newSet.delete(normalized);
      return newSet;
    });
  }, [normalizePid]);

  const isAllSelected = useMemo(() => {
    if (filteredProjects.length === 0) return false;
    return filteredProjects.every((p) => selectedPids.has(normalizePid(p.pid)));
  }, [filteredProjects, selectedPids, normalizePid]);

  const isSomeSelected = useMemo(() => {
    return selectedPids.size > 0 && !isAllSelected;
  }, [selectedPids, isAllSelected]);

  const handleSetPrioritySelected = useCallback(async (priorityValue: number | null) => {
    if (selectedPids.size === 0) {
      toast.error('Tidak ada data yang dipilih');
      return;
    }

    const pidsToUpdate = Array.from(selectedPids)
      .map((pid) => normalizePid(pid))
      .filter((pid) => pid !== '' && pid !== '-');

    if (pidsToUpdate.length === 0) {
      toast.error('Tidak ada data valid yang dipilih');
      return;
    }

    setIsSettingSelectedPriority(true);
    try {
      const result = await penagihanService.setPrioritizeSelected(pidsToUpdate, priorityValue);

      const updatingSet = new Set(pidsToUpdate);
      setProjects((prev) =>
        prev.map((p) => {
          const pid = normalizePid(p.pid);
          if (!updatingSet.has(pid)) return p;
          return {
            ...p,
            prioritas: priorityValue,
            prioritas_label:
              priorityValue === 1
                ? 'Prioritas 1'
                : priorityValue === 2
                  ? 'Prioritas 2'
                  : priorityValue === 3
                    ? 'Prioritas 3'
                    : null,
          };
        })
      );

      if (priorityValue === null) {
        toast.success(`Berhasil membatalkan prioritas untuk ${result.total_updated} proyek`, {
          position: 'bottom-center',
          duration: 3000,
        });
      } else {
        toast.success(`Berhasil set Prioritas ${priorityValue} untuk ${result.total_updated} proyek`, {
          position: 'bottom-center',
          duration: 3000,
        });
      }

      setSelectedPids(new Set());
      await Promise.all([fetchProjects(), fetchCardStatistics()]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal mengatur prioritas terpilih'));
      console.error(error);
    } finally {
      setIsSettingSelectedPriority(false);
    }
  }, [selectedPids, normalizePid, fetchProjects, fetchCardStatistics]);

  // =====================================
  // \u2705 OPTIMIZED: Memoized helper\n  // =====================================
  const getStatusVariant = useCallback((status: string): string => {
    if (!status) return "default";
    const statusLower = status.toLowerCase().trim();

    if (statusLower === "sudah ct") return "sudah-ct";
    if (statusLower === "sudah ut") return "sudah-ut";
    if (statusLower === "sudah lurus") return "sudah-lurus";
    if (statusLower === "sudah rekon") return "sudah-rekon";
    if (statusLower === "sudah rekap") return "sudah-rekap";
    if (statusLower === "otw reg") return "otw-reg";

    if (statusLower === "proses periv") return "proses-periv";
    if (statusLower === "sekuler ttd") return "sekuler-ttd";
    if (statusLower === "scan dokumen mitra") return "scan-dokumen";

    if (statusLower === "belum ct") return "belum-ct";
    if (statusLower === "belum ut") return "belum-ut";
    if (statusLower === "belum lurus") return "belum-lurus";
    if (statusLower === "belum rekon") return "belum-rekon";
    if (statusLower === "belum rekap") return "belum-rekap";
    if (statusLower === "antri periv") return "antri-periv";
    if (statusLower === "revisi mitra") return "revisi-mitra";

    return "default";
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
        <PageHeader title="Dashboard Sistem Informasi Penagihan Telkom Akses" />
        <div className="flex flex-1 px-4 pb-4">
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Dashboard Sistem Informasi Penagihan Telkom Akses" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div
              className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200"
              onClick={() => navigate("/projects", { state: { filter: "all" } })}
              title="Klik untuk melihat semua proyek"
            >
              <p className="text-gray-700 text-sm font-semibold mb-2">Total Proyek</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-blue-600">{totalProjects}</p>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div
              className="bg-green-100 border-2 border-green-300 rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200"
              onClick={() => navigate("/projects", { state: { filter: "completed" } })}
              title="Klik untuk melihat proyek yang sudah selesai penuh"
            >
              <p className="text-gray-700 text-sm font-semibold mb-2">Selesai Penuh</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-green-600">{completedProjects}</p>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div
              className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200"
              onClick={() => navigate("/projects", { state: { filter: "ongoing" } })}
              title="Klik untuk melihat proyek yang sedang berjalan"
            >
              <p className="text-gray-700 text-sm font-semibold mb-2">Sedang Berjalan</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-yellow-700">{ongoingProjects}</p>
                <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>

            <div
              className="bg-red-100 border-2 border-red-300 rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200"
              onClick={() => navigate("/projects", { state: { filter: "delayed" } })}
              title="Klik untuk melihat proyek yang tertunda (revisi mitra)"
            >
              <p className="text-gray-700 text-sm font-semibold mb-2">Tertunda</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-red-600">{delayedProjects}</p>
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div
              className="bg-orange-100 border-2 border-orange-300 rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200"
              onClick={() => navigate("/projects", { state: { filter: "not-recon" } })}
              title="Klik untuk melihat proyek yang belum rekon"
            >
              <p className="text-gray-700 text-sm font-semibold mb-2">Belum Rekon BOQ</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600">{notReconProjects}</p>
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            {/* Search Input with Icon */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
              <Input
                type="text"
                placeholder="Cari proyek... (pisahkan dengan koma untuk multiple pencarian)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 border-2 border-red-500 rounded-xl pl-12 pr-4 text-base font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all"
              />
            </div>
            {!isReadOnly && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                {canBulkSetPriority && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSettingSelectedPriority || selectedPids.size === 0}
                        className="h-12 px-4 border-2 border-red-600 text-red-600 rounded-xl font-bold w-full sm:w-auto"
                      >
                        Prioritas Terpilih ({selectedPids.size})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onSelect={() => handleSetPrioritySelected(1)}>
                        Prioritas 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleSetPrioritySelected(2)}>
                        Prioritas 2
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleSetPrioritySelected(3)}>
                        Prioritas 3
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleSetPrioritySelected(null)}>
                        Batalkan Prioritas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  onClick={() => navigate("/projects")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl h-12 text-base w-full sm:w-auto"
                >
                  Lihat Semua Proyek
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto min-h-0 rounded-lg shadow bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '2100px' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-200 border-b-2 border-red-600">
                  {canBulkSetPriority && (
                    <th className="px-4 py-3 text-center font-bold text-gray-700 bg-gray-200" style={{ minWidth: '60px' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isSomeSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 cursor-pointer accent-red-600"
                        title={isAllSelected ? 'Hapus semua pilihan' : 'Pilih semua'}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>Prioritas</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '180px' }}>Nama Proyek</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>Nama Mitra</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '100px' }}>PID</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>Jenis PO</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>Nomor PO</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '100px' }}>Phase</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>Status CT</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>Status UT</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '130px' }}>Rekap BOQ</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>Rekon Nilai</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '140px' }}>Rekon Material</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '160px' }}>Pelurusan Material</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 bg-gray-200" style={{ minWidth: '180px' }}>Status Procurement</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate('/projects', { state: { focusPid: project.pid } })}
                      title="Klik untuk membuka proyek ini di menu Project"
                    >
                      {canBulkSetPriority && (
                        <td className="px-4 py-3 text-center" style={{ minWidth: '60px' }}>
                          <input
                            type="checkbox"
                            checked={selectedPids.has(normalizePid(project.pid))}
                            onChange={(e) => handleSelectOne(project.pid, e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-red-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3" style={{ minWidth: '120px' }}>
                        <div className="relative inline-flex">
                          {isReadOnly ? (
                            project.prioritas ? (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                                project.prioritas === 1 ? 'bg-gradient-to-r from-red-500 to-red-600 text-white ring-2 ring-red-200' :
                                project.prioritas === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white ring-2 ring-orange-200' :
                                'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white ring-2 ring-yellow-200'
                              }`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                Prioritas {project.prioritas}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium text-gray-400 bg-gray-50">
                                -
                              </span>
                            )
                          ) : (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md ${
                                      project.prioritas === 1
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white ring-2 ring-red-200'
                                        : project.prioritas === 2
                                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white ring-2 ring-orange-200'
                                          : project.prioritas === 3
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white ring-2 ring-yellow-200'
                                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                    }`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {project.prioritas ? `Prioritas ${project.prioritas}` : 'Prioritas'}
                                  </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  align="end"
                                  sideOffset={8}
                                  className="w-56 rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                                >
                                  <DropdownMenuItem
                                    onSelect={() => handleSetPriority(project.id, 1)}
                                    className="py-3 px-4 gap-3 cursor-pointer data-[highlighted]:bg-red-50 focus:bg-red-50"
                                  >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900">Prioritas 1</div>
                                      <div className="text-xs text-gray-500">Prioritas tertinggi</div>
                                    </div>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onSelect={() => handleSetPriority(project.id, 2)}
                                    className="py-3 px-4 gap-3 cursor-pointer data-[highlighted]:bg-orange-50 focus:bg-orange-50"
                                  >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900">Prioritas 2</div>
                                      <div className="text-xs text-gray-500">Prioritas menengah</div>
                                    </div>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onSelect={() => handleSetPriority(project.id, 3)}
                                    className="py-3 px-4 gap-3 cursor-pointer data-[highlighted]:bg-yellow-50 focus:bg-yellow-50"
                                  >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900">Prioritas 3</div>
                                      <div className="text-xs text-gray-500">Prioritas rendah</div>
                                    </div>
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator className="my-1" />

                                  <DropdownMenuItem
                                    onSelect={() => handleSetPriority(project.id, null)}
                                    className="py-3 px-4 gap-3 cursor-pointer data-[highlighted]:bg-gray-50 focus:bg-gray-50"
                                  >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900">Hapus Prioritas</div>
                                      <div className="text-xs text-gray-500">Batalkan prioritas</div>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '180px' }}>{project.nama_proyek}</td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '150px' }}>{project.nama_mitra}</td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ minWidth: '100px' }}>{project.pid}</td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '120px' }}>{project.jenis_po}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '120px' }}>{project.nomor_po}</td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '100px' }}>{project.phase}</td>
                      <td className="px-4 py-3" style={{ minWidth: '120px' }}>
                        <div className="inline-block">
                          <Badge variant={getStatusVariant(project.status_ct) as ComponentProps<typeof Badge>['variant']}>{project.status_ct}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '120px' }}>
                        <div className="inline-block">
                          <Badge variant={getStatusVariant(project.status_ut) as ComponentProps<typeof Badge>['variant']}>{project.status_ut}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '130px' }}>
                        <div className="inline-block">
                          <Badge variant={getStatusVariant(project.rekap_boq) as ComponentProps<typeof Badge>['variant']}>{project.rekap_boq}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '150px' }}>
                        <div className="border border-gray-300 rounded px-2 md:px-3 py-1 bg-blue-50 text-blue-900 font-medium inline-block text-[10px] md:text-xs font-mono whitespace-nowrap">
                          {project.rekon_nilai ? formatCurrency(project.rekon_nilai) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '140px' }}>
                        <div className="inline-block">
                          <Badge variant={getStatusVariant(project.rekon_material) as ComponentProps<typeof Badge>['variant']}>{project.rekon_material}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '160px' }}>
                        <div className="inline-block">
                          <Badge variant={getStatusVariant(project.pelurusan_material) as ComponentProps<typeof Badge>['variant']}>{project.pelurusan_material}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '180px' }}>
                        <div className="inline-block">
                          <Badge variant={getStatusVariant(project.status_procurement) as ComponentProps<typeof Badge>['variant']}>{project.status_procurement}</Badge>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="px-4 py-3 text-center text-gray-500">
                      Tidak ada data proyek prioritas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardContent />
    </SidebarProvider>
  );
}
