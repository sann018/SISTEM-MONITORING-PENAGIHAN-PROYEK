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
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <TopBar />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '112px' }}>
        <TopBar />

        <div className="flex-1 overflow-auto p-8 space-y-6">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-red-600">Daftar Penagihan Proyek</h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
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
            <Button
              onClick={handleDownloadExcel}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 shadow-md"
            >
              <Upload className="w-5 h-5" />
              Download Excel
            </Button>
          </div>

          {/* Search Box with Date */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Cari proyek..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border border-gray-300 rounded-lg px-4 flex-1 max-w-xs"
            />
            <span className="text-sm font-semibold text-gray-600">📅 01-2025</span>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="px-4 py-3 text-left font-bold">Nama Proyek</th>
                    <th className="px-4 py-3 text-left font-bold">Nama Mitra</th>
                    <th className="px-4 py-3 text-left font-bold">PID</th>
                    <th className="px-4 py-3 text-left font-bold">Nomor PO</th>
                    <th className="px-4 py-3 text-left font-bold">Fase</th>
                    <th className="px-4 py-3 text-left font-bold">Status CT</th>
                    <th className="px-4 py-3 text-left font-bold">Status UT</th>
                    <th className="px-4 py-3 text-left font-bold">Rekap BOQ</th>
                    <th className="px-4 py-3 text-left font-bold">Rekon Nilai</th>
                    <th className="px-4 py-3 text-left font-bold">Rekon Material</th>
                    <th className="px-4 py-3 text-left font-bold">Status Procurement</th>
                    <th className="px-4 py-3 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
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
                        <td className="px-4 py-3">{project.nama_proyek}</td>
                        <td className="px-4 py-3">{project.nama_mitra}</td>
                        <td className="px-4 py-3 font-mono">{project.pid}</td>
                        <td className="px-4 py-3">{project.nomor_po}</td>
                        <td className="px-4 py-3">{project.phase}</td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="status_ct"
                            value={project.status_ct}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.status_ct)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="status_ut"
                            value={project.status_ut}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.status_ut)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            BOQ
                          </span>
                        </td>
                        <td className="px-4 py-3">{project.rekon_nilai}</td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="rekon_material"
                            value={project.rekon_material}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.rekon_material)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EditableStatusCell
                            projectId={project.id}
                            column="status_procurement"
                            value={project.status_procurement}
                            onUpdate={handleStatusUpdate}
                            variant={getStatusVariant(project.status_procurement)}
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