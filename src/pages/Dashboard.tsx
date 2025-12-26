import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, SlidersHorizontal, Search, Menu } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
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
  prioritas?: number | null;
  prioritas_label?: string;
}

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch dashboard prioritized projects
      const response = await penagihanService.getDashboardPrioritized();
      
      // Map data dari API ke format yang dibutuhkan
      const mappedData = response.data.map((item: any) => ({
        id: item.id.toString(),
        nama_proyek: item.nama_proyek || '',
        nama_mitra: item.nama_mitra || '',
        pid: item.pid || '',
        jenis_po: item.jenis_po || '',
        nomor_po: item.nomor_po || '',
        phase: item.phase || '',
        status_ct: item.status_ct || 'BELUM CT',
        status_ut: item.status_ut || 'BELUM UT',
        rekap_boq: item.rekap_boq || '',
        rekon_nilai: item.rekon_nilai?.toString() || '0',
        rekon_material: item.rekon_material || 'BELUM REKON',
        pelurusan_material: item.pelurusan_material || 'BELUM LURUS',
        status_procurement: item.status_procurement || 'ANTRI PERIV',
        prioritas: item.prioritas,
        prioritas_label: item.prioritas_label,
      }));
      
      setProjects(mappedData);
    } catch (error) {
      toast.error("Gagal memuat data proyek");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPriority = async (projectId: string, prioritas: number | null) => {
    try {
      await penagihanService.setPrioritize(Number(projectId), prioritas);
      toast.success(prioritas ? `Proyek berhasil di-set sebagai prioritas ${prioritas}` : "Prioritas berhasil dihapus");
      fetchProjects();
    } catch (error) {
      toast.error("Gagal mengatur prioritas");
      console.error(error);
    }
  };

  const handleAutoPrioritize = async () => {
    try {
      const result = await penagihanService.autoPrioritize();
      toast.success(`Auto-prioritize berhasil! ${result.updated} proyek di-update, ${result.cleared} proyek di-clear`);
      fetchProjects();
    } catch (error) {
      toast.error("Gagal menjalankan auto-prioritize");
      console.error(error);
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

  const notReconProjects = projects.filter((p) => 
    p.rekon_material.toLowerCase() !== "sudah rekon"
  ).length;

  // =====================================
  // NAVIGATION HANDLERS
  // =====================================
  const handleNavigateToProjects = (filter: "all" | "completed" | "ongoing" | "delayed") => {
    navigate("/projects", { state: { filter } });
  };

  // =====================================
  // SEARCH FILTER (Support Multiple Keywords)
  // =====================================
  const filteredProjects = projects.filter((project) => {
    if (!searchTerm.trim()) return true;
    
    // Split by comma, trim whitespace
    const searchTerms = searchTerm
      .split(/,/) // Split by comma
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
      <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
        <PageHeader title="Dashboard Monitoring Penagihan Proyek" />
        <div className="flex flex-1 gap-4 px-4 pb-4">
          <AppSidebar />
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
      <PageHeader title="Dashboard Monitoring Penagihan Proyek" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-8">
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
              <p className="text-gray-700 text-sm font-semibold mb-2">Belum Rekon</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600">{notReconProjects}</p>
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Buttons */}
          <div className="flex items-center justify-between mb-6 gap-4">
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
            <Button
              onClick={handleAutoPrioritize}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl h-12 text-base"
            >
              🎯 Auto Prioritize
            </Button>
            <Button
              onClick={() => navigate("/projects")}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl h-12 text-base"
            >
              Lihat Semua Proyek
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto min-h-0 rounded-lg shadow bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '2100px' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-200 border-b-2 border-red-600">
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
                  <th className="px-4 py-3 text-center font-bold text-gray-700 bg-gray-200" style={{ minWidth: '200px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.slice(0, 10).map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ minWidth: '120px' }}>
                        {project.prioritas === 1 && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                            🔥 PRIORITAS 1
                          </span>
                        )}
                        {project.prioritas === 2 && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">
                            ⚠️ PRIORITAS 2
                          </span>
                        )}
                        {!project.prioritas && (
                          <span className="px-3 py-1 rounded text-xs font-semibold text-gray-400">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '180px' }}>{project.nama_proyek}</td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '150px' }}>{project.nama_mitra}</td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ minWidth: '100px' }}>{project.pid}</td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '120px' }}>{project.jenis_po}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '120px' }}>{project.nomor_po}</td>
                      <td className="px-4 py-3 whitespace-normal" style={{ minWidth: '100px' }}>{project.phase}</td>
                      <td className="px-4 py-3" style={{ minWidth: '120px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.status_ct === 'Sudah CT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status_ct}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '120px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.status_ut === 'Sudah UT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status_ut}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '130px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.rekap_boq === 'Sudah Rekap' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {project.rekap_boq}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '150px' }}>
                        {project.rekon_nilai ? `Rp ${Number(project.rekon_nilai).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '140px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.rekon_material === 'Sudah Rekap' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {project.rekon_material}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '160px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.pelurusan_material === 'Sudah Diluruskan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {project.pelurusan_material}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: '180px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          project.status_procurement?.includes('OTW') || project.status_procurement?.includes('Sekuler') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status_procurement}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" style={{ minWidth: '200px' }}>
                        <div className="flex gap-1 justify-center">
                          {project.prioritas !== 1 && (
                            <Button
                              onClick={() => handleSetPriority(project.id, 1)}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-7"
                            >
                              Set P1
                            </Button>
                          )}
                          {project.prioritas && (
                            <Button
                              onClick={() => handleSetPriority(project.id, null)}
                              size="sm"
                              variant="outline"
                              className="text-gray-600 text-xs px-2 py-1 h-7"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={15} className="px-4 py-3 text-center text-gray-500">
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
