import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, SlidersHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

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
      <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
        <TopBar />
        <Sidebar />
        <div className="flex items-center justify-center" style={{ marginLeft: '112px', height: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <TopBar title="Dashboard" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '112px' }}>

        <div className="flex-1 overflow-auto p-8">
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
              <p className="text-gray-700 text-sm font-semibold mb-2">Terfunda</p>
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
              onClick={() => navigate("/projects")}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl h-12 text-base"
            >
              Lihat Semua Proyek
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200 border-b-2 border-red-600">
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Nama Proyek</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Nama Mitra</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">PID</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Nomor PO</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Fase</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Status UT</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Rekap BOQ</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Rekon Nilai</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Status Procurement</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{project.nama_proyek}</td>
                      <td className="px-4 py-3">{project.nama_mitra}</td>
                      <td className="px-4 py-3">{project.pid}</td>
                      <td className="px-4 py-3">{project.nomor_po}</td>
                      <td className="px-4 py-3">{project.phase}</td>
                      <td className="px-4 py-3">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                          {project.status_ut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                          BOQ
                        </span>
                      </td>
                      <td className="px-4 py-3">{project.rekon_nilai}</td>
                      <td className="px-4 py-3">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                          {project.status_procurement}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-3 text-center text-gray-500">
                      Tidak ada data proyek
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
