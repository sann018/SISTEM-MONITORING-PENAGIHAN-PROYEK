import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/Badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
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
  project_type?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // =====================================
  // LETAKKAN getStatusVariant DI SINI
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

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      toast.error("Gagal memuat detail proyek");
      console.error(error);
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!project) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 font-bold mb-4">Data proyek tidak ditemukan</p>
              <Button onClick={() => navigate("/projects")}>Kembali ke Daftar Proyek</Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6 bg-gradient-to-r from-red-50 to-white border-b border-red-200">
              <SidebarTrigger />
              <h1 className="text-xl font-bold text-red-600">Detail Proyek</h1>
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/projects")}
                className="border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Button 
                onClick={() => navigate(`/projects/edit/${project.id}`)} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Proyek
              </Button>
            </div>

            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-2xl font-bold text-red-600">
                  {project.project_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Informasi Dasar */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Informasi Dasar</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Nama Proyek</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-3 bg-white">
                          {project.project_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Nama Mitra</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-3 bg-white">
                          {project.partner_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">PID</p>
                        <p className="font-mono border-2 border-gray-300 rounded-lg p-3 bg-white">
                          {project.pid}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Nomor PO</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-3 bg-white">
                          {project.po_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Phase</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-3 bg-white">
                          {project.phase}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Monitoring */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Status Monitoring</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Status CT</p>
                        <Badge variant={getStatusVariant(project.status_ct) as any} className="text-sm">
                          {project.status_ct}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Status UT</p>
                        <Badge variant={getStatusVariant(project.status_ut) as any} className="text-sm">
                          {project.status_ut}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Rekon Nilai</p>
                        <div className="border-2 border-blue-400 rounded px-3 py-2 bg-blue-50 text-blue-900 font-semibold inline-block">
                          {project.rekon_nilai}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Penagihan & Procurement */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Status Penagihan & Procurement</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Rekon Material</p>
                      <Badge 
                        variant={getStatusVariant(project.rekon_material || "Belum Rekon") as any} 
                        className="text-sm"
                      >
                        {project.rekon_material || "Belum Rekon"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Pelurusan Material</p>
                      <Badge 
                        variant={getStatusVariant(project.material_alignment || "Belum Lurus") as any} 
                        className="text-sm"
                      >
                        {project.material_alignment || "Belum Lurus"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Status Procurement</p>
                      <Badge 
                        variant={getStatusVariant(project.procurement_status || "Antri Periv") as any} 
                        className="text-sm"
                      >
                        {project.procurement_status || "Antri Periv"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Timeline</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Dibuat</p>
                      <p className="font-medium text-gray-800">
                        {new Date(project.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Diperbarui</p>
                      <p className="font-medium text-gray-800">
                        {new Date(project.updated_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}