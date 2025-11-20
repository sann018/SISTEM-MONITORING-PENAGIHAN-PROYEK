import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/Badge";
import { EditableStatusCell } from "@/components/EditableStatusCell";
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
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  project_name: string;
  partner_name: string;
  pid: string;
  po_number: string;
  phase: string;
  status_ct: string;
  status_ut: string;
  rekon_nilai: string;
  rekon_material?: string;
  material_alignment?: string;
  procurement_status?: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // =====================================
  // LETAKKAN STATE INI DI SINI
  // =====================================
  const [isDeleting, setIsDeleting] = useState(false);  // ← Loading state

  const navigate = useNavigate();

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];

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
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      toast.error("Gagal memuat data proyek");
      console.error(error);
    }
  };

  // =====================================
  // FUNCTION: filtered projects
  // =====================================
  const filteredProjects = projects.filter(
    (project) =>
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.po_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =====================================
  // FUNCTION: handleStatusUpdate
  // =====================================
  const handleStatusUpdate = async (
    projectId: string,
    column: string,
    newValue: string
  ) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ [column]: newValue })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId ? { ...p, [column]: newValue } : p
        )
      );

      toast.success("Status berhasil diperbarui");
    } catch (error) {
      console.error(error);
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
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
            <div className="flex h-20 items-center gap-4 px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-red-600">Daftar Proyek</h1>
            </div>
          </header>

          <div className="p-8 space-y-8 overflow-hidden">
            {/* Search & Add Button */}
            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Cari proyek, mitra, PID, atau PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 text-base bg-white"
              />
              <Button 
                onClick={() => navigate("/projects/add")} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-6 rounded-lg text-base transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <Plus className="h-5 w-5 mr-2" />
                Tambah Proyek
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-48">Nama Proyek</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-44">Nama Mitra</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-32">PID</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-40">Nomor PO</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-32">Phase</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-32">Status CT</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-32">Status UT</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-32">Rekon Nilai</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-40">Rekon Material</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-40">Pelurusan Material</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-40">Status Procurement</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700 min-w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
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
                        <tr key={project.id} className="border-b hover:bg-red-50/50 transition-colors text-gray-700 font-medium">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.project_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.partner_name}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{project.pid}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.po_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.phase}</td>
                          <td className="px-4 py-3 text-sm">
                            <EditableStatusCell
                              value={project.status_ct}
                              columnName="status_ct"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={statusCtOptions}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <EditableStatusCell
                              value={project.status_ut}
                              columnName="status_ut"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={statusUtOptions}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="border border-gray-300 rounded px-3 py-1 bg-blue-50 text-blue-900 font-medium inline-block">
                              {project.rekon_nilai}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <EditableStatusCell
                              value={project.rekon_material || "Belum Rekon"}
                              columnName="rekon_material"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={rekonMaterialOptions}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <EditableStatusCell
                              value={project.material_alignment || "Belum Lurus"}
                              columnName="material_alignment"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={materialAlignmentOptions}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <EditableStatusCell
                              value={project.procurement_status || "Antri Periv"}
                              columnName="procurement_status"
                              projectId={project.id}
                              onUpdate={handleStatusUpdate}
                              options={procurementOptions}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="hover:bg-blue-100 transition-all duration-200 hover:scale-110 active:scale-95"
                                title="Lihat detail"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/projects/edit/${project.id}`)}
                                className="hover:bg-yellow-100 transition-all duration-200 hover:scale-110 active:scale-95"
                                title="Edit proyek"
                              >
                                <Pencil className="h-4 w-4 text-yellow-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(project.id)}
                                className="hover:bg-red-100 transition-all duration-200 hover:scale-110 active:scale-95"
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
    </SidebarProvider>
  );
}