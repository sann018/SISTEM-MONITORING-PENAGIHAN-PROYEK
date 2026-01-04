import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/Badge";
import { PriorityBadge, PrioritySourceBadge } from "@/components/PriorityBadge";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { EditableStatusCell } from "@/components/EditableStatusCell";
import { EditableNumberCell } from "@/components/EditableNumberCell";
import { ProjectTimer } from "@/components/ProjectTimer";
import ExcelUploadDialog from "@/components/ExcelUploadDialog";
import { PageHeader } from "@/components/PageHeader";
import { Menu, ArrowLeft, X } from "lucide-react";
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
import { Eye, Pencil, Trash2, Plus, Upload, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { normalizeStatusText } from "@/lib/status";
import { useAuth } from "@/contexts/AuthContext";
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
  estimasi_durasi_hari?: number | string;
  tanggal_mulai?: string;
  dibuat_pada?: string;
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

function ProjectsContent() {
  const { user } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "completed" | "ongoing" | "delayed" | "not-recon">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [tableContextLabel, setTableContextLabel] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Extract available years and months from PID (format: PID-YYYY-MMM)
  const availableYears = Array.from(new Set(
    projects
      .map(p => {
        const match = p.pid?.match(/PID-(\d{4})-/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
  )).sort((a, b) => b!.localeCompare(a!)) as string[];

  // Get available months for selected year
  const availableMonths = selectedYear === "all" ? [] : Array.from(new Set(
    projects
      .filter(p => {
        const yearMatch = p.pid?.match(/PID-(\d{4})-/);
        return yearMatch && yearMatch[1] === selectedYear;
      })
      .map(p => {
        const monthMatch = p.pid?.match(/PID-\d{4}-(\d{3})/);
        if (monthMatch) {
          const monthNum = parseInt(monthMatch[1], 10);
          return monthNum > 0 && monthNum <= 12 ? monthNum.toString() : null;
        }
        return null;
      })
      .filter(Boolean)
  )).sort((a, b) => parseInt(a!) - parseInt(b!)) as string[];

  // Helper: Convert month number to name
  const getMonthName = (month: string): string => {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthNum = parseInt(month, 10);
    return monthNum >= 1 && monthNum <= 12 ? monthNames[monthNum - 1] : month;
  };
  
  // Check if user is viewer (read-only)
  const isReadOnly = user?.role === 'viewer';
  
  // =====================================
  // LETAKKAN STATE INI DI SINI
  // =====================================
  const [isDeleting, setIsDeleting] = useState(false);  // ← Loading state

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekapBoqOptions = ["Sudah Rekap", "Belum Rekap"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];

  // =====================================
  // Helpers: dashboard card filter parity
  // =====================================
  const isCompletedProject = (project: Project): boolean => {
    const ct = project.status_ct?.toLowerCase().trim() || "";
    const ut = project.status_ut?.toLowerCase().trim() || "";
    const boq = project.rekap_boq?.toLowerCase().trim() || "";
    const rekon = project.rekon_material?.toLowerCase().trim() || "";
    const alignment = project.pelurusan_material?.toLowerCase().trim() || "";
    const procurement = project.status_procurement?.toLowerCase().trim() || "";

    return (
      ct === "sudah ct" &&
      ut === "sudah ut" &&
      boq === "sudah rekap" &&
      rekon === "sudah rekon" &&
      alignment === "sudah lurus" &&
      procurement === "otw reg"
    );
  };

  const isProcurementPrerequisitesDone = (project: Project): boolean => {
    const ct = project.status_ct?.toLowerCase().trim() || "";
    const ut = project.status_ut?.toLowerCase().trim() || "";
    const boq = project.rekap_boq?.toLowerCase().trim() || "";
    const rekon = project.rekon_material?.toLowerCase().trim() || "";
    const alignment = project.pelurusan_material?.toLowerCase().trim() || "";

    return (
      ct === "sudah ct" &&
      ut === "sudah ut" &&
      boq === "sudah rekap" &&
      rekon === "sudah rekon" &&
      alignment === "sudah lurus"
    );
  };

  // =====================================
  // useEffect untuk handle filter dari URL params dan navigation state
  // =====================================
  useEffect(() => {
    // Priority 1: Check URL params (for refresh persistence)
    const focusPidParam = searchParams.get('pid');
    const filterParam = searchParams.get('filter');
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (focusPidParam) {
      // Jika ada PID di URL, fokuskan ke PID tersebut
      setFilterType('all');
      setSelectedYear('all');
      setSelectedMonth('all');
      setSearchTerm(focusPidParam);
      setTableContextLabel(`Data Proyek ${focusPidParam}`);
      return;
    }

    if (filterParam) {
      // Restore filter dari URL
      const filter = filterParam as "all" | "completed" | "ongoing" | "delayed" | "not-recon";
      setFilterType(filter);

      const labelMap: Record<typeof filter, string> = {
        all: "Data Total Proyek",
        completed: "Data Selesai Penuh",
        ongoing: "Data Sedang Berjalan",
        delayed: "Data Tertunda",
        "not-recon": "Data Belum Rekon",
      };
      
      if (filter !== 'all') {
        setTableContextLabel(labelMap[filter] ?? null);
      } else {
        setTableContextLabel(null);
      }

      // Restore year/month if available
      if (yearParam && yearParam !== 'all') {
        setSelectedYear(yearParam);
        if (monthParam && monthParam !== 'all') {
          setSelectedMonth(monthParam);
        }
      }
      return;
    }

    // Priority 2: Check navigation state (for first-time navigation from dashboard)
    const state = location.state as { filter?: string; focusPid?: string } | null;

    if (state?.focusPid) {
      // Dari Dashboard (klik proyek prioritas), fokuskan ke 1 PID saja
      setFilterType('all');
      setSelectedYear('all');
      setSelectedMonth('all');
      setSearchTerm(state.focusPid);
      setTableContextLabel(`Data Proyek ${state.focusPid}`);
      
      // Update URL dengan PID
      setSearchParams({ pid: state.focusPid });
      return;
    }

    if (state?.filter) {
      // Dari Dashboard (klik card statistics)
      const filter = state.filter as "all" | "completed" | "ongoing" | "delayed" | "not-recon";
      setFilterType(filter);

      const labelMap: Record<typeof filter, string> = {
        all: "Data Total Proyek",
        completed: "Data Selesai Penuh",
        ongoing: "Data Sedang Berjalan",
        delayed: "Data Tertunda",
        "not-recon": "Data Belum Rekon",
      };
      
      if (filter !== 'all') {
        setTableContextLabel(labelMap[filter] ?? null);
        // Update URL dengan filter
        setSearchParams({ filter });
      } else {
        setTableContextLabel(null);
        setSearchParams({});
      }
      return;
    }

    // Default: no filter
    setTableContextLabel(null);
  }, [location.state, searchParams, setSearchParams]);

  // =====================================
  // Function: Reset semua filter
  // =====================================
  const handleResetFilter = () => {
    setFilterType('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSearchTerm('');
    setTableContextLabel(null);
    
    // Clear URL params
    setSearchParams({});
    
    // Clear navigation state
    navigate('/projects', { replace: true, state: null });
    
    toast.success("Filter direset, menampilkan semua data");
  };

  // =====================================
  // Function: Check if any filter is active
  // =====================================
  const hasActiveFilter = (): boolean => {
    return (
      searchTerm.trim() !== '' ||
      filterType !== 'all' ||
      selectedYear !== 'all' ||
      selectedMonth !== 'all' ||
      tableContextLabel !== null
    );
  };

  // =====================================
  // useEffect untuk fetch projects
  // =====================================
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // Dropdown prioritas sekarang pakai Radix (auto flip/shift), tidak perlu manual close.

  // =====================================
  // FUNCTION: fetchProjects
  // =====================================
  const fetchProjects = async () => {
    try {
      const cardFilterMap: Record<typeof filterType, any> = {
        all: undefined,
        completed: 'sudah_penuh',
        ongoing: 'sedang_berjalan',
        delayed: 'tertunda',
        'not-recon': 'belum_rekon',
      };

      const card_filter = cardFilterMap[filterType];

      // Fetch ALL data (bukan pagination default 15)
      // IMPORTANT: gunakan sorting stabil supaya saat prioritas berubah, baris tidak "loncat" ke atas
      const response = await penagihanService.getAll({
        per_page: 1000,
        sort_by: 'dibuat_pada',
        sort_order: 'desc',
        ...(card_filter ? { card_filter } : {}),
      });
      const mappedData = response.data.map((item: any) => ({
        id: item.pid || '-',  // ✅ Gunakan PID sebagai ID (primary key)
        nama_proyek: item.nama_proyek || '-',
        nama_mitra: item.nama_mitra || '-',
        pid: item.pid || '-',
        jenis_po: item.jenis_po || '-',
        nomor_po: item.nomor_po || '-',
        phase: item.phase || '-',
        status_ct: normalizeStatusText(item.status_ct) || 'Belum CT',
        status_ut: normalizeStatusText(item.status_ut) || 'Belum UT',
        rekap_boq: normalizeStatusText(item.rekap_boq) || 'Belum Rekap',
        rekon_nilai: item.rekon_nilai || '0',
        rekon_material: normalizeStatusText(item.rekon_material) || 'Belum Rekon',
        pelurusan_material: normalizeStatusText(item.pelurusan_material) || 'Belum Lurus',
        status_procurement: normalizeStatusText(item.status_procurement) || 'Antri Periv',
        estimasi_durasi_hari: item.estimasi_durasi_hari || 7,
        tanggal_mulai: item.tanggal_mulai || new Date().toISOString().split('T')[0],
        dibuat_pada: item.dibuat_pada,
        prioritas: item.prioritas ?? null,
        prioritas_label: item.prioritas_label ?? null,
      }));
      
      console.log('Fetched projects with prioritas:', mappedData.slice(0, 5).map(p => ({ pid: p.pid, prioritas: p.prioritas })));
      setProjects(mappedData);
    } catch (error) {
      toast.error("Gagal memuat data proyek");
      console.error(error);
    }
  };

  // =====================================
  // FUNCTION: filtered projects
  // =====================================
  const getFilteredByCategory = (projectsToFilter: Project[]) => {
    switch (filterType) {
      case "completed":
        // Selesai penuh: SEMUA 6 status harus selesai (parity dengan backend card-statistics)
        return projectsToFilter.filter(isCompletedProject);

      case "ongoing":
        // Sedang berjalan: minimal 1 status belum selesai, DAN bukan tertunda
        return projectsToFilter.filter((project) => {
          const procurement = project.status_procurement?.toLowerCase().trim() || "";
          return procurement !== "revisi mitra" && !isCompletedProject(project);
        });

      case "delayed":
        // Tertunda: Status Procurement = Revisi Mitra
        return projectsToFilter.filter((project) => {
          const procurement = project.status_procurement?.toLowerCase().trim() || "";
          return procurement === "revisi mitra";
        });

      case "not-recon":
        // Belum Rekon: Rekap BOQ = "Belum Rekap" (bisa overlap)
        return projectsToFilter.filter((project) => {
          const boq = project.rekap_boq?.toLowerCase().trim() || "";
          return boq === "belum rekap";
        });

      case "all":
      default:
        return projectsToFilter;
    }
  };

  // Filter by search terms (support comma or semicolon separated)
  const searchFilteredProjects = projects.filter((project) => {
    if (!searchTerm.trim()) return true;
    
    // Split by comma or semicolon, trim whitespace
    const searchTerms = searchTerm
      .split(/[,;]/) // Split by comma or semicolon
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0);
    
    // Check if any search term matches any field
    return searchTerms.some(term =>
      project.nama_proyek.toLowerCase().includes(term) ||
      project.nama_mitra.toLowerCase().includes(term) ||
      project.pid.toLowerCase().includes(term) ||
      project.nomor_po.toLowerCase().includes(term) ||
      project.phase.toLowerCase().includes(term)
    );
  });
  
  // Filter by year and month from PID (format: PID-YYYY-MMM)
  const yearMonthFilteredProjects = searchFilteredProjects.filter(project => {
    const pidMatch = project.pid?.match(/PID-(\d{4})-(\d{3})/);
    if (!pidMatch) return selectedYear === "all" && selectedMonth === "all";
    
    const projectYear = pidMatch[1];
    const projectMonthNum = parseInt(pidMatch[2], 10);
    
    // Validate month number
    if (projectMonthNum < 1 || projectMonthNum > 12) {
      return selectedYear === "all" && selectedMonth === "all";
    }
    
    // Check year filter
    if (selectedYear !== "all" && projectYear !== selectedYear) {
      return false;
    }
    
    // Check month filter
    if (selectedMonth !== "all" && projectMonthNum.toString() !== selectedMonth) {
      return false;
    }
    
    return true;
  });
  
  const filteredProjects = getFilteredByCategory(yearMonthFilteredProjects);

  // =====================================
  // FUNCTION: handleDurationUpdate
  // =====================================
  const handleDownloadExcel = async () => {
    try {
      toast.info("Mengunduh data Excel...");
      const response = await penagihanService.exportToExcel();
      
      // Create blob from response
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      link.download = `Daftar_Proyek_${currentDate}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Data Excel berhasil diunduh!");
    } catch (error: any) {
      // Detailed error logging
      console.error("Error downloading Excel:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // Try to parse blob error
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          console.error("Blob error content:", text);
          const errorData = JSON.parse(text);
          toast.error(errorData.message || "Gagal mengunduh data Excel");
          return;
        } catch {
          // If parsing fails, use default message
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || "Gagal mengunduh data Excel";
      toast.error(errorMessage);
    }
  };

  const handleDurationUpdate = async (
    projectId: string,
    durasi: number,
    tanggalMulai: string
  ) => {
    try {
      await penagihanService.update(projectId, {
        estimasi_durasi_hari: durasi,
        tanggal_mulai: tanggalMulai
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId 
            ? { 
                ...p, 
                estimasi_durasi_hari: durasi,
                tanggal_mulai: tanggalMulai
              } 
            : p
        )
      );

      toast.success("Durasi proyek berhasil diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui durasi proyek");
      throw error;
    }
  };

  // FUNCTION: handleStatusUpdate
  // =====================================
  const handleStatusUpdate = async (
    projectId: string,
    column: string,
    newValue: string
  ) => {
    try {
      const projectToUpdate = projects.find(p => p.id === projectId);
      if (!projectToUpdate) throw new Error('Project not found');

      // Map frontend columns to backend field names
      const fieldMapping: Record<string, string> = {
        'status_ct': 'status_ct',
        'status_ut': 'status_ut',
        'rekap_boq': 'rekap_boq',
        'rekon_material': 'rekon_material',
        'pelurusan_material': 'pelurusan_material',
        'status_procurement': 'status_procurement'
      };

      const backendField = fieldMapping[column] || column;

      const updated = await penagihanService.update(projectId, {
        [backendField]: newValue
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                [column]: newValue,
                // Sync procurement if backend auto-changed it (e.g., Revisi Mitra)
                ...(updated?.status_procurement
                  ? { status_procurement: normalizeStatusText(updated.status_procurement) }
                  : {}),
              }
            : p
        )
      );

      toast.success("Status berhasil diperbarui");
    } catch (error) {
      console.error(error);
      const message = (error as any)?.response?.data?.message || "Gagal memperbarui status";
      toast.error(message);
      throw error;
    }
  };

  // =====================================
  // FUNCTION: handleNumberUpdate (untuk Rekon Nilai)
  // =====================================
  const handleNumberUpdate = async (
    projectId: string,
    column: string,
    newValue: string
  ) => {
    try {
      const updated = await penagihanService.update(projectId, {
        [column]: newValue
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                [column]: newValue,
                ...(updated?.status_procurement
                  ? { status_procurement: normalizeStatusText(updated.status_procurement) }
                  : {}),
              }
            : p
        )
      );

      toast.success("Nilai berhasil diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui nilai");
      throw error;
    }
  };

  // =====================================
  // FUNCTION: handleSetPriority
  // =====================================
  const handleSetPriority = async (projectId: string, priorityValue: number | null) => {
    try {
      const project = projects.find(p => p.id === projectId);
      const projectName = project?.nama_proyek || 'Proyek';

      const updated = await penagihanService.setPrioritize(projectId, priorityValue);

      // Update UI langsung (tanpa refresh manual)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                prioritas: updated?.prioritas ?? priorityValue,
                prioritas_label: updated?.prioritas_label ?? (priorityValue ? `Prioritas ${priorityValue}` : null),
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
      
      await fetchProjects();
      // Sync data dari server
    } catch (error: any) {
      const message = error?.response?.data?.message || "Gagal mengatur prioritas";
      toast.error(message);
      console.error('Error setting priority:', error);
    }
  };

  // =====================================
  // FUNCTION: getStatusVariant
  // =====================================
  const getStatusVariant = (status: string): string => {
    if (!status) return "default";
    
    const statusLower = status.toLowerCase().trim();

    // STATUS SELESAI / COMPLETED - HIJAU ✅
    if (statusLower === "sudah ct") return "sudah-ct";
    if (statusLower === "sudah ut") return "sudah-ut";
    if (statusLower === "sudah lurus") return "sudah-lurus";
    if (statusLower === "sudah rekon") return "sudah-rekon";
    if (statusLower === "sudah rekap") return "sudah-rekap";
    if (statusLower === "otw reg") return "otw-reg";

    // STATUS PROSES - KUNING/ORANGE ⏳
    if (statusLower === "proses periv") return "proses-periv";
    if (statusLower === "sekuler ttd") return "sekuler-ttd";
    if (statusLower === "scan dokumen mitra") return "scan-dokumen";

    // STATUS PENDING / BELUM - MERAH/PINK ❌
    if (statusLower === "belum ct") return "belum-ct";
    if (statusLower === "belum ut") return "belum-ut";
    if (statusLower === "belum lurus") return "belum-lurus";
    if (statusLower === "belum rekon") return "belum-rekon";
    if (statusLower === "belum rekap") return "belum-rekap";
    if (statusLower === "antri periv") return "antri-periv";
    if (statusLower === "revisi mitra") return "revisi-mitra";

    return "default";
  };

  // =====================================
  // LETAKKAN FUNCTION handleDelete DI SINI
  // =====================================
  const handleDelete = async () => {
    if (!deleteId) return;  // ← Validate ID

    setIsDeleting(true);
    try {
      // ✅ Delete dari database
      await penagihanService.delete(deleteId);

      // ✅ Update local state
      setProjects((prevProjects) =>
        prevProjects.filter((p) => p.id !== deleteId)
      );

      // ✅ Show success message
      toast.success("Proyek berhasil dihapus");
      setDeleteId(null);
    } catch (error) {
      // ✅ Handle error
      console.error(error);
      toast.error("Gagal menghapus proyek");
    } finally {
      setIsDeleting(false);
    }
  };

  // =====================================
  // JSX RETURN
  // =====================================
  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Daftar Penagihan Proyek" />

      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            {!isReadOnly && (
              <>
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
                >
                  <Upload className="w-5 h-5" />
                  Tambah Excel
                </Button>
                <Button
                  onClick={() => navigate("/projects/add")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Proyek
                </Button>
                <Button
                  onClick={handleDownloadExcel}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
                >
                  <Upload className="w-5 h-5" />
                  Unduh Excel
                </Button>
              </>
            )}
          </div>

          {/* Search and Filter Row */}
          <div className="flex gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Cari proyek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 border-2 border-gray-300 rounded-lg pl-12 pr-12 text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => {
                const newYear = e.target.value;
                setSelectedYear(newYear);
                setSelectedMonth("all"); // Reset month when year changes
                
                // Update URL params
                if (newYear === "all") {
                  searchParams.delete("year");
                  searchParams.delete("month");
                } else {
                  searchParams.set("year", newYear);
                  searchParams.delete("month");
                }
                setSearchParams(searchParams);
              }}
              className="h-12 px-4 border-2 border-gray-300 rounded-lg bg-red-600 text-white font-bold cursor-pointer hover:bg-red-700 transition-all"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Month Filter (only show when year is selected) */}
            {selectedYear !== "all" && availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  setSelectedMonth(newMonth);
                  
                  // Update URL params
                  if (newMonth === "all") {
                    searchParams.delete("month");
                  } else {
                    searchParams.set("month", newMonth);
                  }
                  setSearchParams(searchParams);
                }}
                className="h-12 px-4 border-2 border-gray-300 rounded-lg bg-red-500 text-white font-bold cursor-pointer hover:bg-red-600 transition-all"
              >
                <option value="all">Semua Bulan</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)} ({month.padStart(2, '0')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {tableContextLabel && (
            <div className="mb-3 flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border-2 border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                {tableContextLabel}
              </div>
              {hasActiveFilter() && (
                <Button
                  onClick={handleResetFilter}
                  variant="outline"
                  className="inline-flex items-center gap-2 border-2 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Semua Data
                </Button>
              )}
            </div>
          )}

          {/* Projects Table */}
          <div className="flex-1 min-h-0 rounded-lg shadow-lg bg-white overflow-hidden">
            <div className="h-full overflow-auto">
              <table className="w-full text-sm" style={{ minWidth: '1800px' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-red-600 text-white">
                    <th className="px-4 py-3 text-center font-bold" style={{ minWidth: '150px' }}>Timer</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '150px' }}>Nama Proyek</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '150px' }}>Nama Mitra</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '100px' }}>PID</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '100px' }}>Jenis PO</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '120px' }}>Nomor PO</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '100px' }}>Phase</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '100px' }}>Status CT</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '100px' }}>Status UT</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '120px' }}>Rekap BOQ</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '130px' }}>Rekon Nilai</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '140px' }}>Rekon Material</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '160px' }}>Pelurusan Material</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ minWidth: '180px' }}>Status Procurement</th>
                    {!isReadOnly && (
                      <th className="px-4 py-3 text-center font-bold" style={{ minWidth: '120px' }}>Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={isReadOnly ? 14 : 15} className="px-4 py-8 text-center text-gray-500">
                        <p className="text-gray-600 font-medium mb-2">Tidak ada data proyek</p>
                        {!isReadOnly && (
                          <Button 
                            variant="link" 
                            onClick={() => navigate("/projects/add")}
                            className="text-red-600 hover:text-red-700"
                          >
                            Tambah proyek pertama
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-center" style={{ minWidth: '150px' }}>
                          <ProjectTimer
                            key={`timer-${project.id}-${project.estimasi_durasi_hari}-${project.tanggal_mulai}`}
                            projectId={project.id}
                            projectName={project.nama_proyek}
                            estimasiDurasi={Number(project.estimasi_durasi_hari) || 7}
                            tanggalMulai={project.tanggal_mulai || new Date().toISOString().split('T')[0]}
                            statusProcurement={project.status_procurement}
                            onUpdateDuration={handleDurationUpdate}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '180px' }}>
                          {project.nama_proyek}
                        </td>
                        <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '150px' }}>{project.nama_mitra}</td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ minWidth: '100px' }}>{project.pid}</td>
                        <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '120px' }}>{project.jenis_po}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '120px' }}>{project.nomor_po}</td>
                        <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '100px' }}>{project.phase}</td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="status_ct"
                            value={project.status_ct}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.status_ct)}
                            options={statusCtOptions}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="status_ut"
                            value={project.status_ut}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.status_ut)}
                            options={statusUtOptions}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="rekap_boq"
                            value={project.rekap_boq}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.rekap_boq)}
                            options={rekapBoqOptions}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableNumberCell
                            projectId={project.id}
                            column="rekon_nilai"
                            value={project.rekon_nilai}
                            onUpdate={handleNumberUpdate}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="rekon_material"
                            value={project.rekon_material}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.rekon_material)}
                            options={rekonMaterialOptions}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="pelurusan_material"
                            value={project.pelurusan_material}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.pelurusan_material)}
                            options={materialAlignmentOptions}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="status_procurement"
                            value={project.status_procurement}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.status_procurement)}
                            options={procurementOptions}
                            disabledOptions={
                              isProcurementPrerequisitesDone(project)
                                ? []
                                : ["Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"]
                            }
                            disabled={isReadOnly}
                          />
                        </td>
                        {!isReadOnly && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/projects/edit/${project.id}`)}
                                className="hover:bg-yellow-100 p-2"
                                title="Edit proyek"
                              >
                                <Pencil className="h-4 w-4 text-yellow-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(project.id)}
                                className="hover:bg-red-100 p-2"
                                title="Hapus proyek"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                              {/* Tombol Priority dengan Dropdown Modern */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                      project.prioritas
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                    }`}
                                    title="Atur prioritas"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
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
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alert Dialog untuk Delete */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="border-2 border-red-300 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 text-xl">
                Konfirmasi Hapus Proyek
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-700">
                Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat 
                dibatalkan dan semua data yang terkait akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={isDeleting}
                className="border-gray-300 hover:bg-gray-100"
              >
                Batal
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isDeleting ? "Menghapus..." : "Hapus Proyek"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Excel Upload Dialog */}
        <ExcelUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUploadSuccess={fetchProjects}
        />
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ProjectsContent />
    </SidebarProvider>
  );
}
