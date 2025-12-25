import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Trash2, Edit, Eye } from "lucide-react";

interface ProjectData {
  id: number;
  nama: string;
  mitra: string;
  pid: string;
  jenisPO: string;
  nomorPO: string;
  fase: string;
  statusCT: string;
  statusUT: string;
  rekapBOQ: string;
  rekonNilai: string;
  rekonMaterial: string;
  statusProcurement: string;
}

export default function ProjectManagement() {
  const [projects] = useState<ProjectData[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate] = useState("01-2025");

  const filteredProjects = projects.filter((project) =>
    project.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background relative">
        <AppSidebar />
        <main className="flex-1 overflow-hidden w-full min-w-0">
          <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
            <div className="flex h-14 sm:h-16 md:h-20 items-center gap-2 md:gap-4 px-3 md:px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10 hover:bg-red-100 active:bg-red-200 border-2 border-transparent hover:border-red-300 rounded-lg transition-colors" />
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600 truncate">Daftar Penagihan</h1>
            </div>
          </header>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto flex-1">
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-red-600 mb-8">
              Daftar Penagihan Proyek
            </h1>

            {/* Action Buttons and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex flex-wrap gap-3">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Cecer
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Proyek
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Unduh Excel
                </Button>
              </div>

              {/* Search Box with Date */}
              <div className="flex items-center gap-4 ml-auto">
                <Input
                  type="text"
                  placeholder="Cari proyek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 border border-gray-300 rounded-lg px-4"
                />
                <span className="text-sm font-semibold text-gray-600">
                  📅 {filterDate}
                </span>
              </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="px-4 py-3 text-left font-bold">Nama Proyek</th>
                    <th className="px-4 py-3 text-left font-bold">Nama Mitra</th>
                    <th className="px-4 py-3 text-left font-bold">PID</th>
                    <th className="px-4 py-3 text-left font-bold">Jenis PO</th>
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
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{project.nama}</td>
                        <td className="px-4 py-3">{project.mitra}</td>
                        <td className="px-4 py-3">{project.pid}</td>
                        <td className="px-4 py-3">{project.jenisPO}</td>
                        <td className="px-4 py-3">{project.nomorPO}</td>
                        <td className="px-4 py-3">{project.fase}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            {project.statusCT}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            {project.statusUT}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            {project.rekapBOQ}
                          </span>
                        </td>
                        <td className="px-4 py-3">{project.rekonNilai}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            {project.rekonMaterial}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                            {project.statusProcurement}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-yellow-600 hover:text-yellow-800">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-4 py-3 text-center text-gray-500">
                        Tidak ada data proyek
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
