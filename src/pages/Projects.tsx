import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/Badge";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { EditableStatusCell } from "@/components/EditableStatusCell";
import { EditableNumberCell } from "@/components/EditableNumberCell";
import { ProjectTimer } from "@/components/ProjectTimer";
import ExcelUploadDialog from "@/components/ExcelUploadDialog";
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
import { useAuth } from "@/contexts/AuthContext";

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
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "completed" | "ongoing" | "delayed" | "not-recon">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  
  // Extract available years from projects
  const availableYears = Array.from(new Set(
    projects
      .map(p => {
        const match = p.nomor_po?.match(/PO-(\d{4})-/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
  )).sort((a, b) => b!.localeCompare(a!)) as string[];
  
  // Check if user is viewer (read-only)
  const isReadOnly = user?.role === 'viewer';
  
  // =====================================
  // LETAKKAN STATE INI DI SINI
  // =====================================
  const [isDeleting, setIsDeleting] = useState(false);  // ← Loading state

  const navigate = useNavigate();
  const location = useLocation();

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekapBoqOptions = ["Sudah Rekap", "Belum Rekap"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];

  // =====================================
  // useEffect untuk handle filter dari navigation state
  // =====================================
  useEffect(() => {
    const state = location.state as { filter?: string } | null;
    if (state?.filter) {
      setFilterType(state.filter as "all" | "completed" | "ongoing" | "delayed" | "not-recon");
    }
  }, [location.state]);

  // =====================================
  // useEffect untuk fetch projects
  // =====================================
  useEffect(() => {
    fetchProjects();
  }, []);

  // =====================================
  // FUNCTION: fetchProjects
  // =====================================
  const fetchProjects = async () => {
    try {
      const response = await penagihanService.getAll();
      setProjects(response.data.map((item: any) => ({
        id: item.id.toString(),
        nama_proyek: item.nama_proyek || '-',
        nama_mitra: item.nama_mitra || '-',
        pid: item.pid || '-',
        jenis_po: item.jenis_po || '-',
        nomor_po: item.nomor_po || '-',
        phase: item.phase || '-',
        status_ct: item.status_ct || 'Belum CT',
        status_ut: item.status_ut || 'Belum UT',
        rekap_boq: item.rekap_boq || 'Belum Rekap',
        rekon_nilai: item.rekon_nilai || '0',
        rekon_material: item.rekon_material || 'Belum Rekon',
        pelurusan_material: item.pelurusan_material || 'Belum Lurus',
        status_procurement: item.status_procurement || 'Antri Periv',
        estimasi_durasi_hari: item.estimasi_durasi_hari || 7,
        tanggal_mulai: item.tanggal_mulai || new Date().toISOString().split('T')[0],
        dibuat_pada: item.dibuat_pada,
      })));
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
        // Selesai penuh: Status CT = Sudah CT, Status UT = Sudah UT, Status Procurement = OTW Reg atau Sekuler TTD
        return projectsToFilter.filter((project) => {
          const statusCt = project.status_ct?.toLowerCase().trim() || "";
          const statusUt = project.status_ut?.toLowerCase().trim() || "";
          const procurement = project.status_procurement?.toLowerCase().trim() || "";
          return (
            statusCt === "sudah ct" &&
            statusUt === "sudah ut" &&
            (procurement === "otw reg" || procurement === "sekuler ttd")
          );
        });

      case "ongoing":
        // Sedang berjalan: Bukan selesai penuh dan bukan tertunda
        return projectsToFilter.filter((project) => {
          const statusCt = project.status_ct?.toLowerCase().trim() || "";
          const statusUt = project.status_ut?.toLowerCase().trim() || "";
          const procurement = project.status_procurement?.toLowerCase().trim() || "";
          
          const isCompleted =
            statusCt === "sudah ct" &&
            statusUt === "sudah ut" &&
            (procurement === "otw reg" || procurement === "sekuler ttd");
          
          const isDelayed = procurement === "revisi mitra";
          
          return !isCompleted && !isDelayed;
        });

      case "delayed":
        // Tertunda: Status Procurement = Revisi Mitra
        return projectsToFilter.filter((project) => {
          const procurement = project.status_procurement?.toLowerCase().trim() || "";
          return procurement === "revisi mitra";
        });

      case "not-recon":
        // Belum Rekon: Rekon Material bukan "Sudah Rekon"
        return projectsToFilter.filter((project) => {
          const rekonMaterial = project.rekon_material?.toLowerCase().trim() || "";
          return rekonMaterial !== "sudah rekon";
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
  
  // Filter by year
  const yearFilteredProjects = selectedYear === "all" 
    ? searchFilteredProjects
    : searchFilteredProjects.filter(project => {
        const match = project.nomor_po?.match(/PO-(\d{4})-/);
        return match && match[1] === selectedYear;
      });
  
  const filteredProjects = getFilteredByCategory(yearFilteredProjects);

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
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Gagal mengunduh data Excel");
    }
  };

  const handleDurationUpdate = async (
    projectId: string,
    durasi: number,
    tanggalMulai: string
  ) => {
    try {
      await penagihanService.update(parseInt(projectId), {
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

      await penagihanService.update(parseInt(projectId), {
        [backendField]: newValue
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId ? { ...p, [column]: newValue } : p
        )
      );

      toast.success("Status berhasil diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui status");
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
      await penagihanService.update(parseInt(projectId), {
        [column]: newValue
      });

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId ? { ...p, [column]: newValue } : p
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
      await penagihanService.delete(parseInt(deleteId));

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
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '80px' }}>
      <TopBar title="Project" />
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: '144px', height: 'calc(100vh - 80px)' }}>
        <TopBar />

        <div className="flex-1 flex flex-col overflow-hidden p-8">
          {/* Header Section with fixed height */}
          <div className="flex-shrink-0 space-y-6 mb-6">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-red-600">Daftar Penagihan Proyek</h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isReadOnly && (
              <>
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
                >
                  <Upload className="w-5 h-5" />
                  Import Excel
                </Button>
                <Button
                  onClick={() => navigate("/projects/add")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Proyek
                </Button>
              </>
            )}
            <Button
              onClick={handleDownloadExcel}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
            >
              <Upload className="w-5 h-5" />
              Download Excel
            </Button>
          </div>

          {/* Search Box with Year Filter */}
          <div className="flex items-center justify-between gap-4">
            {/* Search Input with Icon */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
              <Input
                placeholder="Cari proyek... (pisahkan dengan koma untuk multiple pencarian)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 border-2 border-red-500 rounded-xl pl-12 pr-4 text-base font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all"
              />
            </div>
            
            {/* Year Filter with Icon and Red Style */}
            <div className="relative ml-auto">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-12 pl-12 pr-8 border-2 border-red-500 bg-red-500 text-white rounded-xl text-base font-bold cursor-pointer hover:bg-red-600 transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          </div>

          {/* Projects Table */}
          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '2000px' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-red-600 text-white">
                    <th className="px-4 py-3 text-center font-bold bg-red-600" style={{ minWidth: '150px' }}>Timer</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '180px' }}>Nama Proyek</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '150px' }}>Nama Mitra</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '100px' }}>PID</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '120px' }}>Jenis PO</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '120px' }}>Nomor PO</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '100px' }}>Phase</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '120px' }}>Status CT</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '120px' }}>Status UT</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '130px' }}>Rekap BOQ</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '150px' }}>Rekon Nilai</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '140px' }}>Rekon Material</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '160px' }}>Pelurusan Material</th>
                    <th className="px-4 py-3 text-left font-bold bg-red-600" style={{ minWidth: '180px' }}>Status Procurement</th>
                    <th className="px-4 py-3 text-center font-bold bg-red-600" style={{ minWidth: '120px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                        <p className="text-gray-600 font-medium mb-2">Tidak ada data proyek</p>
                        <Button 
                          variant="link" 
                          onClick={() => navigate("/projects/add")}
                          className="text-red-600 hover:text-red-700"
                        >
                          Tambah proyek pertama
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-center" style={{ minWidth: '150px' }}>
                          <ProjectTimer
                            projectId={project.id}
                            projectName={project.nama_proyek}
                            estimasiDurasi={Number(project.estimasi_durasi_hari) || 7}
                            tanggalMulai={project.tanggal_mulai || new Date().toISOString().split('T')[0]}
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
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableNumberCell
                            projectId={project.id}
                            column="rekon_nilai"
                            value={project.rekon_nilai}
                            onUpdate={handleNumberUpdate}
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
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="hover:bg-blue-100 p-2"
                              title="Lihat detail"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            {!isReadOnly && (
                              <>
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
  );
}