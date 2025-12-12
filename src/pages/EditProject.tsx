import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DurationPicker from "@/components/DurationPicker";
import { ArrowLeft } from "lucide-react";
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

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Project | null>(null);

  const statusCtOptions = ["SUDAH CT", "BELUM CT"];
  const statusUtOptions = ["SUDAH UT", "BELUM UT"];
  const rekonMaterialOptions = ["SUDAH REKON", "BELUM REKON"];
  const materialAlignmentOptions = ["SUDAH LURUS", "BELUM LURUS"];
  const procurementOptions = ["ANTRI PERIV", "PROSES PERIV", "REVISI MITRA", "SEKULER TTD", "SCAN DOKUMEN MITRA", "OTW REG"];
  const phaseOptions = ["Instalasi", "Konstruksi", "Optimasi", "Perencanaan", "Implementasi", "Aktivasi", "Maintenance", "Penyelesaian"];

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await penagihanService.getById(parseInt(id!));
      
      // Map data dari API ke form
      const mappedData: Project = {
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
        estimasi_durasi_hari: data.estimasi_durasi_hari || '7',
        tanggal_mulai: data.tanggal_mulai || new Date().toISOString().split('T')[0],
      };
      
      setProject(mappedData);
      setFormData(mappedData);
    } catch (error) {
      toast.error("Gagal memuat proyek");
      navigate("/projects");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData?.nama_proyek || !formData?.nama_mitra || !formData?.pid || !formData?.nomor_po || !formData?.phase || !formData?.rekon_nilai) {
      toast.error("Semua field yang bertanda * harus diisi");
      return;
    }

    setLoading(true);
    try {
      // Map data form ke format API backend
      const mappedData = {
        nama_proyek: formData.nama_proyek,
        nama_mitra: formData.nama_mitra,
        pid: formData.pid,
        nomor_po: formData.nomor_po,
        phase: formData.phase,
        status_ct: formData.status_ct,
        status_ut: formData.status_ut,
        rekon_nilai: parseFloat(formData.rekon_nilai) || 0,
        rekon_material: formData.rekon_material,
        pelurusan_material: formData.pelurusan_material,
        status_procurement: formData.status_procurement,
        estimasi_durasi_hari: parseInt(String(formData.estimasi_durasi_hari)) || 7,
        tanggal_mulai: formData.tanggal_mulai,
      };

      await penagihanService.update(parseInt(id!), mappedData);
      toast.success("Proyek berhasil diperbarui");
      navigate("/projects");
    } catch (error) {
      toast.error("Gagal memperbarui proyek");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background relative">
        <AppSidebar />
        <main className="flex-1 overflow-hidden w-full min-w-0">
          <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
            <div className="flex h-14 sm:h-16 md:h-20 items-center gap-2 md:gap-4 px-3 md:px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10 hover:bg-red-100 active:bg-red-200 border-2 border-transparent hover:border-red-300 rounded-lg transition-colors" />
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600 truncate">Edit Proyek</h1>
            </div>
          </header>

          <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 max-w-4xl mx-auto">
            <Button variant="outline" onClick={() => navigate("/projects")} className="mb-2 md:mb-4 text-xs md:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-red-600">Informasi Proyek</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  {/* Row 1: Nama Proyek & Nama Mitra - Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Nama Proyek <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="nama_proyek"
                        placeholder="Masukkan nama proyek"
                        value={formData.nama_proyek}
                        onChange={handleInputChange}
                        className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Nama Mitra <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="nama_mitra"
                        placeholder="Masukkan nama mitra"
                        value={formData.nama_mitra}
                        onChange={handleInputChange}
                        className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: PID & Nomor PO */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">PID <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="pid"
                        placeholder="PID-00123"
                        value={formData.pid}
                        onChange={handleInputChange}
                        className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Nomor PO <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="nomor_po"
                        placeholder="PO-2024-001"
                        value={formData.nomor_po}
                        onChange={handleInputChange}
                        className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Row 3: Phase */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">Phase <span className="text-red-600">*</span></label>
                    <Select value={formData.phase} onValueChange={(value) => handleSelectChange("phase", value)}>
                      <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                        <SelectValue placeholder="Pilih phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phaseOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 4: Status CT, Status UT, Rekon Nilai */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Status CT <span className="text-red-600">*</span></label>
                      <Select value={formData.status_ct} onValueChange={(value) => handleSelectChange("status_ct", value)}>
                        <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusCtOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Status UT <span className="text-red-600">*</span></label>
                      <Select value={formData.status_ut} onValueChange={(value) => handleSelectChange("status_ut", value)}>
                        <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusUtOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Rekon Nilai <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="rekon_nilai"
                        placeholder="Rp. 0"
                        value={formData.rekon_nilai}
                        onChange={handleInputChange}
                        className="border-2 border-blue-400 focus:border-blue-600 rounded-lg h-10 px-3 py-2 text-base bg-blue-50 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Row 5: Rekon Material, Pelurusan Material, Status Procurement */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Rekon Material</label>
                      <Select value={formData.rekon_material || "Belum Rekon"} onValueChange={(value) => handleSelectChange("rekon_material", value)}>
                        <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rekonMaterialOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Pelurusan Material</label>
                      <Select value={formData.pelurusan_material} onValueChange={(value) => handleSelectChange("pelurusan_material", value)}>
                        <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {materialAlignmentOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Status Procurement</label>
                      <Select value={formData.status_procurement} onValueChange={(value) => handleSelectChange("status_procurement", value)}>
                        <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {procurementOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 6: Estimasi Durasi & Tanggal Mulai */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <DurationPicker
                        value={formData.estimasi_durasi_hari || '7'}
                        onChange={(value) => setFormData(prev => prev ? { ...prev, estimasi_durasi_hari: value } : null)}
                        label="Estimasi Durasi (hari)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Tanggal Mulai</label>
                      <Input
                        type="date"
                        name="tanggal_mulai"
                        value={formData.tanggal_mulai || ''}
                        onChange={handleInputChange}
                        className="border-2 border-green-400 focus:border-green-600 rounded-lg h-10 px-3 py-2 text-base bg-green-50 placeholder-gray-500"
                      />
                      <p className="text-xs text-gray-600">Tanggal mulai countdown timer</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                    <Button type="button" variant="outline" onClick={() => navigate("/projects")}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-base rounded-lg">
                      {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}