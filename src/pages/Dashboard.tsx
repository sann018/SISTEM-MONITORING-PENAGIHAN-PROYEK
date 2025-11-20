import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
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
    (p.rekon_material?.toLowerCase() === "sudah rekon" || false) &&
    (p.material_alignment?.toLowerCase() === "sudah lurus" || false) &&
    (p.procurement_status?.toLowerCase() === "otw reg" || false)
  ).length;

  const ongoingProjects = projects.filter((p) => {
    const ct = p.status_ct.toLowerCase();
    const ut = p.status_ut.toLowerCase();
    const rekon = p.rekon_material?.toLowerCase() || "";
    const alignment = p.material_alignment?.toLowerCase() || "";
    const procurement = p.procurement_status?.toLowerCase() || "";
    
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

  const delayedProjects = 0; // Bisa disesuaikan dengan logic tertunda

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
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.po_number.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b-2 border-red-200 bg-white shadow-sm">
            <div className="flex h-20 items-center gap-4 px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-red-600">Dashboard Monitoring Penagihan Proyek</h1>
            </div>
          </header>

          <div className="p-8 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Monitor status penagihan proyek konstruksi.</h2>
              <p className="text-gray-600">Kelola dan pantau semua proyek konstruksi Telkom Akses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Search & View All */}
            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Cari proyek, mitra, PID, atau status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 text-base bg-white"
              />
              <Button 
                onClick={() => navigate("/projects")} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-6 rounded-lg text-base transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Lihat Semua Proyek
              </Button>
            </div>

            {/* Projects Table Preview */}
            <div className="rounded-xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Nama Proyek</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Nama Mitra</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">PID</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Nomor PO</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Phase</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Status CT</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Status UT</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Rekon Nilai</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Rekon Material</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Pelurusan Material</th>
                      <th className="px-4 py-4 text-left text-sm font-bold text-red-700">Status Procurement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                          <p className="text-gray-600 font-medium mb-2">
                            {searchTerm ? "Tidak ada proyek yang cocok dengan pencarian" : "Tidak ada data proyek"}
                          </p>
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
                      filteredProjects.slice(0, 5).map((project) => (
                        <tr 
                          key={project.id} 
                          className="border-b hover:bg-red-50/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.project_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.partner_name}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{project.pid}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.po_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.phase}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusVariant(project.status_ct) as any}>
                              {project.status_ct}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusVariant(project.status_ut) as any}>
                              {project.status_ut}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="border border-gray-300 rounded px-3 py-1 bg-blue-50 text-blue-900 font-medium inline-block">
                              {project.rekon_nilai}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusVariant(project.rekon_material || "Belum Rekon") as any}>
                              {project.rekon_material || "Belum Rekon"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusVariant(project.material_alignment || "Belum Lurus") as any}>
                              {project.material_alignment || "Belum Lurus"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusVariant(project.procurement_status || "Antri Periv") as any}>
                              {project.procurement_status || "Antri Periv"}
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
