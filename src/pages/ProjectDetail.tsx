import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { Badge } from "@/components/Badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
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
  tanggal_invoice?: string;
  tanggal_jatuh_tempo?: string;
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
      const data = await penagihanService.getById(parseInt(id!));
      
      // Map data dari API ke format yang dibutuhkan
      // Sesuaikan dengan Model Penagihan di backend
      const mappedData = {
        id: data.id.toString(),
        nama_proyek: data.nama_proyek || '',
        nama_mitra: data.nama_mitra || '',
        pid: data.pid || '',
        nomor_po: data.nomor_po || '',
        phase: data.phase || '',
        status_ct: data.status_ct || 'BELUM CT',
        status_ut: data.status_ut || 'BELUM UT',
        rekon_nilai: data.rekon_nilai?.toString() || '0',
        rekon_material: data.rekon_material || 'BELUM REKON',
        pelurusan_material: data.pelurusan_material || 'BELUM LURUS',
        status_procurement: data.status_procurement || 'ANTRI PERIV',
        tanggal_invoice: data.tanggal_invoice || '',
        tanggal_jatuh_tempo: data.tanggal_jatuh_tempo || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };
      
      setProject(mappedData);
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-svh w-full bg-background relative overflow-hidden">
        <AppSidebar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 sm:h-16 items-center gap-2 md:gap-4 px-3 md:px-6 bg-gradient-to-r from-red-50 to-white border-b border-red-200">
              <SidebarTrigger className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10 hover:bg-red-100 active:bg-red-200 border-2 border-transparent hover:border-red-300 rounded-lg transition-colors" />
              <h1 className="text-sm sm:text-base md:text-xl font-bold text-red-600 truncate">Detail Proyek</h1>
            </div>
          </header>

          <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/projects")}
                className="border-gray-300 hover:bg-gray-100 text-xs md:text-sm w-full sm:w-auto"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Kembali
              </Button>
              <Button 
                onClick={() => navigate(`/projects/edit/${project.id}`)} 
                className="bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm w-full sm:w-auto"
              >
                <Pencil className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Edit Proyek
              </Button>
            </div>

            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-red-600 break-words">
                  {project.nama_proyek}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 space-y-4 md:space-y-6">
                {/* Informasi Dasar - Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3 md:mb-4">Informasi Dasar</h3>
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Nama Proyek</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-2 md:p-3 bg-white text-xs md:text-sm break-words">
                          {project.nama_proyek}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Nama Mitra</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-2 md:p-3 bg-white text-xs md:text-sm break-words">
                          {project.nama_mitra}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">PID</p>
                        <p className="font-mono border-2 border-gray-300 rounded-lg p-2 md:p-3 bg-white text-xs md:text-sm">
                          {project.pid}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Nomor PO</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-2 md:p-3 bg-white text-xs md:text-sm">
                          {project.nomor_po}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Phase</p>
                        <p className="font-medium border-2 border-gray-300 rounded-lg p-2 md:p-3 bg-white text-xs md:text-sm">
                          {project.phase}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Monitoring - Responsive */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3 md:mb-4\">Status Monitoring</h3>
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Status CT</p>
                        <Badge variant={getStatusVariant(project.status_ct) as any} className="text-[10px] md:text-xs">
                          {project.status_ct}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Status UT</p>
                        <Badge variant={getStatusVariant(project.status_ut) as any} className="text-[10px] md:text-xs">
                          {project.status_ut}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Rekon Nilai</p>
                        <div className="border-2 border-blue-400 rounded px-2 md:px-3 py-1.5 md:py-2 bg-blue-50 text-blue-900 font-semibold inline-block text-xs md:text-sm">
                          {project.rekon_nilai}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Penagihan & Procurement - Responsive Grid */}
                <div className="pt-4 md:pt-6 border-t-2 border-gray-200">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3 md:mb-4">Status Penagihan & Procurement</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Rekon Material</p>
                      <Badge 
                        variant={getStatusVariant(project.rekon_material) as any} 
                        className="text-[10px] md:text-xs"
                      >
                        {project.rekon_material}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Pelurusan Material</p>
                      <Badge 
                        variant={getStatusVariant(project.pelurusan_material) as any} 
                        className="text-[10px] md:text-xs"
                      >
                        {project.pelurusan_material}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">Status Procurement</p>
                      <Badge 
                        variant={getStatusVariant(project.status_procurement) as any} 
                        className="text-[10px] md:text-xs"
                      >
                        {project.status_procurement}
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