import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StatsCard } from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/Badge";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
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
  estimasi_durasi_hari?: number | string;
  tanggal_mulai?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await penagihanService.getAll();
      
      // Map data dari API ke format yang dibutuhkan
      const mappedData = response.data.map((item: any) => ({
        id: item.id.toString(),
        nama_proyek: item.nama_proyek || '',
        nama_mitra: item.nama_mitra || '',
        pid: item.pid || '',
        nomor_po: item.nomor_po || '',
        phase: item.phase || '',
        status_ct: item.status_ct || 'BELUM CT',
        status_ut: item.status_ut || 'BELUM UT',
        rekon_nilai: item.rekon_nilai?.toString() || '0',
        rekon_material: item.rekon_material || 'BELUM REKON',
        pelurusan_material: item.pelurusan_material || 'BELUM LURUS',
        status_procurement: item.status_procurement || 'ANTRI PERIV',
        estimasi_durasi_hari: item.estimasi_durasi_hari || 7,
        tanggal_mulai: item.tanggal_mulai || new Date().toISOString().split('T')[0],
      }));
      
      setProjects(mappedData);
    } catch (error) {
      toast.error("Gagal memuat data proyek");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // STATISTICS CALCULATION
  // =====================================
  const totalProjects = projects.length;

  const completedProjects = projects.filter((p) => 
    p.status_ct.toLowerCase() === "sudah ct" &&
    p.status_ut.toLowerCase() === "sudah ut" &&
    p.rekon_material.toLowerCase() === "sudah rekon" &&
    p.pelurusan_material.toLowerCase() === "sudah lurus" &&
    p.status_procurement.toLowerCase() === "otw reg"
  ).length;

  const ongoingProjects = projects.filter((p) => {
    const ct = p.status_ct.toLowerCase();
    const ut = p.status_ut.toLowerCase();
    const rekon = p.rekon_material.toLowerCase();
    const alignment = p.pelurusan_material.toLowerCase();
    const procurement = p.status_procurement.toLowerCase();
    
    return (
      ct === "belum ct" ||
      ut === "belum ut" ||
      rekon === "belum rekon" ||
      alignment === "belum lurus" ||
      procurement === "antri periv" ||
      procurement === "proses periv" ||
      procurement === "sekuler ttd" ||
      procurement === "scan dokumen mitra" ||
      procurement === "revisi mitra"
    );
  }).length;

  const delayedProjects = projects.filter((project) => {
    const procurement = project.status_procurement?.toLowerCase().trim() || "";
    return procurement === "revisi mitra";
  }).length;

  // =====================================
  // NAVIGATION HANDLERS
  // =====================================
  const handleNavigateToProjects = (filter: "all" | "completed" | "ongoing" | "delayed") => {
    navigate("/projects", { state: { filter } });
  };

  // =====================================
  // SEARCH FILTER
  // =====================================
  const filteredProjects = projects.filter(
    (project) =>
      project.nama_proyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.nama_mitra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.nomor_po.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string): string => {
    if (!status) return "default";
    const statusLower = status.toLowerCase().trim();

    if (statusLower === "sudah ct") return "sudah-ct";
    if (statusLower === "sudah ut") return "sudah-ut";
    if (statusLower === "sudah lurus") return "sudah-lurus";
    if (statusLower === "sudah rekon") return "sudah-rekon";
    if (statusLower === "otw reg") return "otw-reg";

    if (statusLower === "proses periv") return "proses-periv";
    if (statusLower === "sekuler ttd") return "sekuler-ttd";
    if (statusLower === "scan dokumen mitra") return "scan-dokumen";

    if (statusLower === "belum ct") return "belum-ct";
    if (statusLower === "belum ut") return "belum-ut";
    if (statusLower === "belum lurus") return "belum-lurus";
    if (statusLower === "belum rekon") return "belum-rekon";
    if (statusLower === "antri periv") return "antri-periv";
    if (statusLower === "revisi mitra") return "revisi-mitra";

    return "default";
  };

  if (loading) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full relative">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center min-w-0">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <AppSidebar />
        <main className="flex-1 w-full overflow-x-hidden min-w-0">
          {/* Header - Responsive */}
          <header className="sticky top-0 z-30 border-b-2 border-red-200 bg-white shadow-sm">
            <div className="flex h-14 sm:h-16 md:h-20 items-center gap-2 md:gap-4 px-3 md:px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10 hover:bg-red-100 active:bg-red-200 border-2 border-transparent hover:border-red-300 rounded-lg transition-colors" />
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600 truncate">Dashboard Monitoring Penagihan Proyek</h1>
            </div>
          </header>

          <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Description - Responsive */}
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Monitor status penagihan proyek konstruksi.</h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Kelola dan pantau semua proyek konstruksi Telkom Akses</p>
            </div>

            {/* Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              <StatsCard
                title="Total Proyek"
                value={totalProjects}
                icon={FolderKanban}
                variant="default"
                onClick={() => handleNavigateToProjects("all")}
              />
              <StatsCard
                title="Selesai Penuh"
                value={completedProjects}
                icon={CheckCircle2}
                variant="success"
                onClick={() => handleNavigateToProjects("completed")}
              />
              <StatsCard
                title="Sedang Berjalan"
                value={ongoingProjects}
                icon={Clock}
                variant="warning"
                onClick={() => handleNavigateToProjects("ongoing")}
              />
              <StatsCard
                title="Tertunda"
                value={delayedProjects}
                icon={AlertTriangle}
                variant="danger"
                onClick={() => handleNavigateToProjects("delayed")}
              />
            </div>

            {/* Search & View All - Responsive */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
              <Input
                placeholder="Cari proyek, mitra, PID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-xs md:max-w-sm border-2 border-gray-400 focus:border-red-500 rounded-lg h-9 md:h-10 text-sm md:text-base bg-white"
              />
              <Button 
                onClick={() => navigate("/projects")} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 md:py-3 lg:py-6 px-4 md:px-6 rounded-lg text-sm md:text-base transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                Lihat Semua Proyek
              </Button>
            </div>

            {/* Projects Table Preview - Responsive */}
            <div className="rounded-xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] md:min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Nama Proyek</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Nama Mitra</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">PID</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Nomor PO</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Phase</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Status CT</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Status UT</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Rekon Nilai</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Rekon Material</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Pelurusan Material</th>
                      <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-red-700">Status Procurement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-2 md:px-4 py-8 md:py-12 text-center text-muted-foreground">
                          <p className="text-gray-600 font-medium mb-2 text-xs md:text-sm">
                            {searchTerm ? "Tidak ada proyek yang cocok dengan pencarian" : "Tidak ada data proyek"}
                          </p>
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
                      filteredProjects.slice(0, 5).map((project) => (
                        <tr 
                          key={project.id} 
                          className="border-b hover:bg-red-50/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-900">{project.nama_proyek}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700">{project.nama_mitra}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-600">{project.pid}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700">{project.nomor_po}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700">{project.phase}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <Badge variant={getStatusVariant(project.status_ct) as any} className="text-[10px] md:text-xs">
                              {project.status_ct}
                            </Badge>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <Badge variant={getStatusVariant(project.status_ut) as any} className="text-[10px] md:text-xs">
                              {project.status_ut}
                            </Badge>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <div className="border border-gray-300 rounded px-2 md:px-3 py-1 bg-blue-50 text-blue-900 font-medium inline-block text-[10px] md:text-xs">
                              {project.rekon_nilai}
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <Badge variant={getStatusVariant(project.rekon_material) as any} className="text-[10px] md:text-xs">
                              {project.rekon_material}
                            </Badge>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <Badge variant={getStatusVariant(project.pelurusan_material) as any} className="text-[10px] md:text-xs">
                              {project.pelurusan_material}
                            </Badge>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                            <Badge variant={getStatusVariant(project.status_procurement) as any} className="text-[10px] md:text-xs">
                              {project.status_procurement}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {filteredProjects.length > 5 && (
                <div className="border-t-2 border-gray-200 p-4 bg-gray-50 text-center">
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/projects")}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    Lihat {filteredProjects.length - 5} proyek lainnya →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
