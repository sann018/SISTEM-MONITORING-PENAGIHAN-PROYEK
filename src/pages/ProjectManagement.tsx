import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Trash2, Edit, Eye } from "lucide-react";

interface ProjectData {
  id: number;
  nama: string;
  mitra: string;
  pid: string;
  nomorPO: string;
  fase: string;
  statusCT: string;
  statusUT: string;
  rekonBOQ: string;
  rekonNilai: string;
  rekonMaterial: string;
  statusProcurement: string;
}

export default function ProjectManagement() {
  const [projects] = useState<ProjectData[]>([
    {
      id: 1,
      nama: "Project 1",
      mitra: "Semarabad",
      pid: "PR2891",
      nomorPO: "PO-2023-01",
      fase: "Peresmaan",
      statusCT: "Sudah CT",
      statusUT: "Sudah UT",
      rekonBOQ: "Sudah Rekon",
      rekonNilai: "",
      rekonMaterial: "Sudah Rekon",
      statusProcurement: "Sudah Rekon",
    },
    {
      id: 2,
      nama: "Project 2",
      mitra: "Semarabad",
      pid: "PR2891",
      nomorPO: "PO-2023-01",
      fase: "Peresmaan",
      statusCT: "In-On-Bin Tan",
      statusUT: "Sudah UT",
      rekonBOQ: "Sudah Rekon",
      rekonNilai: "",
      rekonMaterial: "Belum Rekon",
      statusProcurement: "Belum Rekon",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate] = useState("01-2025");

  const filteredProjects = projects.filter((project) =>
    project.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <TopBar />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '112px' }}>
        <TopBar />

        <div className="flex-1 overflow-auto p-8">
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
                          {project.rekonBOQ}
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
                    <td colSpan={12} className="px-4 py-3 text-center text-gray-500">
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
