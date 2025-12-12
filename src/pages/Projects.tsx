import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/Badge";
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
import { Eye, Pencil, Trash2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  nama_proyek: string;
  nama_mitra: string;
  pid: string;
  nomor_po: string;
  phase: string;
  status_ct: string;
  status_ut: string;
  rekon_nilai: string;
  rekon_material: string;
  pelurusan_material: string;
  status_procurement: string;
  estimasi_durasi_hari?: number | string; // Durasi estimasi dalam hari
  tanggal_mulai?: string; // Tanggal mulai proyek (YYYY-MM-DD)
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "completed" | "ongoing" | "delayed">("all");
  
  // =====================================
  // LETAKKAN STATE INI DI SINI
  // =====================================
  const [isDeleting, setIsDeleting] = useState(false);  // ← Loading state

  const navigate = useNavigate();
  const location = useLocation();

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];

  // =====================================
  // useEffect untuk handle filter dari navigation state
  // =====================================
  useEffect(() => {
    const state = location.state as { filter?: string } | null;
    if (state?.filter) {
      setFilterType(state.filter as "all" | "completed" | "ongoing" | "delayed");
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
        nomor_po: item.nomor_po || '-',
        phase: item.phase || '-',
        status_ct: item.status_ct || 'Belum CT',
        status_ut: item.status_ut || 'Belum UT',
        rekon_nilai: item.rekon_nilai || '0',
        rekon_material: item.rekon_material || 'Belum Rekon',
        pelurusan_material: item.pelurusan_material || 'Belum Lurus',
        status_procurement: item.status_procurement || 'Antri Periv',
        estimasi_durasi_hari: item.estimasi_durasi_hari || 7,
        tanggal_mulai: item.tanggal_mulai || new Date().toISOString().split('T')[0],
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

      case "all":
      default:
        return projectsToFilter;
    }
  };

  const filteredProjects = getFilteredByCategory(
    projects.filter(
      (project) =>
        project.nama_proyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.nama_mitra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.nomor_po.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // =====================================
  // FUNCTION: handleDurationUpdate
  // =====================================
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background relative">
        <AppSidebar />
        <main className="flex-1 overflow-hidden w-full min-w-0">
          <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
            <div className="flex h-14 sm:h-16 md:h-20 items-center gap-2 md:gap-4 px-3 md:px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10 hover:bg-red-100 active:bg-red-200 border-2 border-transparent hover:border-red-300 rounded-lg transition-colors" />
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600 truncate">Daftar Proyek</h1>
            </div>
          </header>

          <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 overflow-hidden">
            {/* Filter Status - Responsive */}
            {filterType !== "all" && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-semibold text-gray-700">Filter Aktif:</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                    {filterType === "completed"
                      ? "Selesai Penuh"
                      : filterType === "ongoing"
                      ? "Sedang Berjalan"
                      : "Tertunda"}
                  </Badge>
                </div>
                <Button
                  onClick={() => setFilterType("all")}
                  variant="outline"
                  className="text-xs md:text-sm px-3 py-1 h-auto"
                >
                  Tampilkan Semua
                </Button>
              </div>
            )}

            {/* Search & Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
              <Input
                placeholder="Cari proyek, mitra, PID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-xs md:max-w-sm border-2 border-gray-400 focus:border-red-500 rounded-lg h-9 md:h-10 text-sm md:text-base bg-white"
              />
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 md:py-4 lg:py-6 px-4 md:px-6 rounded-lg text-sm md:text-base transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4 md:w-5 md:h-5" />
                  Import Excel
                </Button>
                <Button
                  onClick={() => navigate("/projects/add")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 md:py-4 lg:py-6 px-4 md:px-6 rounded-lg text-sm md:text-base transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  Tambah Proyek
                </Button>
              </div>
            </div>

            {/* Table - Responsive with horizontal scroll */}
            <div className="rounded-xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[150px] md:min-w-48">Nama Proyek</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[140px] md:min-w-44">Nama Mitra</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[100px] md:min-w-32">PID</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[120px] md:min-w-40">Nomor PO</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[100px] md:min-w-32">Phase</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[100px] md:min-w-32">Status CT</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[100px] md:min-w-32">Status UT</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[100px] md:min-w-32">Rekon Nilai</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[130px] md:min-w-40">Rekon Material</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[140px] md:min-w-40">Pelurusan Material</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[150px] md:min-w-40">Status Procurement</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700 min-w-[80px] md:min-w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-2 md:px-4 py-8 md:py-12 text-center text-muted-foreground">
                          <p className="text-gray-600 font-medium mb-2 text-xs md:text-sm">Tidak ada data proyek</p>
                          <Button 
                            variant="link" 
                            onClick={() => navigate("/projects/add")}
                            className="text-red-600 hover:text-red-700 text-xs md:text-sm"
                          >
                            Tambah proyek pertama
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-red-50/50 transition-colors text-gray-700 font-medium">
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <div className="space-y-2">
                              <div className="font-medium text-gray-900">{project.nama_proyek}</div>
                              <ProjectTimer
                                projectId={project.id}
                                projectName={project.nama_proyek}
                                estimasiDurasi={project.estimasi_durasi_hari}
                                tanggalMulai={project.tanggal_mulai}
                                statusProcurement={project.status_procurement}
                                onUpdateDuration={handleDurationUpdate}
                              />
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700">{project.nama_mitra}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-600">{project.pid}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700">{project.nomor_po}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700">{project.phase}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <EditableStatusCell
                              value={project.status_ct}
                              columnName="status_ct"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={statusCtOptions}
                            />
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <EditableStatusCell
                              value={project.status_ut}
                              columnName="status_ut"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={statusUtOptions}
                            />
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <EditableNumberCell
                              value={project.rekon_nilai}
                              columnName="rekon_nilai"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                            />
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <EditableStatusCell
                              value={project.rekon_material}
                              columnName="rekon_material"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={rekonMaterialOptions}
                            />
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <EditableStatusCell
                              value={project.pelurusan_material}
                              columnName="pelurusan_material"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={materialAlignmentOptions}
                            />
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <EditableStatusCell
                              value={project.status_procurement}
                              columnName="status_procurement"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={procurementOptions}
                            />
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <div className="flex items-center gap-1 md:gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="hover:bg-blue-100 transition-all duration-200 hover:scale-110 active:scale-95 p-1 md:p-2"
                                title="Lihat detail"
                              >
                                <Eye className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/projects/edit/${project.id}`)}
                                className="hover:bg-yellow-100 transition-all duration-200 hover:scale-110 active:scale-95 p-1 md:p-2"
                                title="Edit proyek"
                              >
                                <Pencil className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(project.id)}
                                className="hover:bg-red-100 transition-all duration-200 hover:scale-110 active:scale-95 p-1 md:p-2"
                                title="Hapus proyek"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                              </Button>
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
        </main>
      </div>

      {/* =====================================
          LETAKKAN AlertDialog DI SINI
          (SETELAH CLOSING TAG main & div)
          ===================================== */}
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
    </SidebarProvider>
  );
}