import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DurationPicker from "@/components/DurationPicker";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { normalizeStatusText } from "@/lib/status";
import { formatThousandsId, normalizeToIntegerString } from "@/lib/currency";
import { getErrorMessage } from "@/utils/errors";

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
  estimasi_durasi_hari?: number | string;
  tanggal_mulai?: string;
}

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Project | null>(null);

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekapBoqOptions = ["Sudah Rekap", "Belum Rekap"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      // NOTE: parameter route sekarang memakai PID (string), bukan numeric ID
      const data = await penagihanService.getById(id!);
      
      // Map data dari API ke form
      const mappedData: Project = {
        id: (data.pid || data.id?.toString?.() || id || "").toString(),
        nama_proyek: data.nama_proyek || '',
        nama_mitra: data.nama_mitra || '',
        pid: data.pid || '',
        jenis_po: data.jenis_po || '',
        nomor_po: data.nomor_po || '',
        phase: data.phase || '',
        status_ct: normalizeStatusText(data.status_ct) || 'Belum CT',
        status_ut: normalizeStatusText(data.status_ut) || 'Belum UT',
        rekap_boq: normalizeStatusText(data.rekap_boq) || 'Belum Rekap',
        rekon_nilai: formatThousandsId(data.rekon_nilai?.toString() || '0'),
        rekon_material: normalizeStatusText(data.rekon_material) || 'Belum Rekon',
        pelurusan_material: normalizeStatusText(data.pelurusan_material) || 'Belum Lurus',
        status_procurement: normalizeStatusText(data.status_procurement) || 'Antri Periv',
        estimasi_durasi_hari: data.estimasi_durasi_hari || '',
        tanggal_mulai: data.tanggal_mulai || new Date().toISOString().split('T')[0],
      };
      
      setProject(mappedData);
      setFormData(mappedData);
    } catch (error) {
      toast.error("Gagal memuat proyek");
      navigate("/projects");
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRekonNilaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const formatted = digits ? formatThousandsId(digits) : '';
    if (formData) {
      setFormData({ ...formData, rekon_nilai: formatted });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData?.nama_proyek || !formData?.nama_mitra || !formData?.pid || !formData?.phase || !formData?.rekon_nilai) {
      toast.error("Semua field yang bertanda * harus diisi");
      return;
    }

    const buildPayload = (data: Project) => {
      const nomorPoTrimmed = data.nomor_po?.trim() ? data.nomor_po.trim() : null;
      return {
        nama_proyek: data.nama_proyek,
        nama_mitra: data.nama_mitra,
        pid: data.pid,
        jenis_po: data.jenis_po,
        nomor_po: nomorPoTrimmed,
        phase: data.phase,
        status_ct: data.status_ct,
        status_ut: data.status_ut,
        rekap_boq: data.rekap_boq,
        rekon_nilai: parseInt(normalizeToIntegerString(data.rekon_nilai), 10) || 0,
        rekon_material: data.rekon_material,
        pelurusan_material: data.pelurusan_material,
        status_procurement: data.status_procurement,
        estimasi_durasi_hari: parseInt(String(data.estimasi_durasi_hari)) || 7,
        tanggal_mulai: data.tanggal_mulai,
      };
    };

    // If user didn't change anything, treat it as success (friendly UX)
    if (project) {
      const before = buildPayload(project);
      const after = buildPayload(formData);
      if (JSON.stringify(before) === JSON.stringify(after)) {
        toast.success("Tidak ada perubahan. Data tetap tersimpan.");
        navigate("/projects");
        return;
      }
    }

    setLoading(true);
    try {
      const mappedData = buildPayload(formData);
      await penagihanService.update(id!, mappedData);
      toast.success("Proyek berhasil diperbarui");
      navigate("/projects");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal memperbarui proyek"));
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
      <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
        <PageHeader title="Edit Proyek" />
        <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto w-full min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="w-full max-w-none">
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

                  {/* Row 2: PID, Jenis PO & Nomor PO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <label className="block text-sm font-bold text-gray-900">Jenis PO</label>
                      <Input
                        type="text"
                        name="jenis_po"
                        placeholder="Isi Jenis PO (contoh: Batch 1)"
                        value={formData.jenis_po}
                        onChange={handleInputChange}
                        className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Nomor PO</label>
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
                    <Input
                      type="text"
                      name="phase"
                      placeholder="Isi Phase (contoh: Phase 1)"
                      value={formData.phase}
                      onChange={handleInputChange}
                      className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      required
                    />
                  </div>

                  {/* Row 4: Status CT, Status UT, Rekap BOQ, Rekon Nilai */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <label className="block text-sm font-bold text-gray-900">Rekap BOQ</label>
                      <Select value={formData.rekap_boq} onValueChange={(value) => handleSelectChange("rekap_boq", value)}>
                        <SelectTrigger className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rekapBoqOptions.map((option) => (
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
                        placeholder="1.000.000"
                        value={formData.rekon_nilai}
                        onChange={handleRekonNilaiChange}
                        className="border-2 border-blue-400 focus:border-blue-600 rounded-lg h-10 px-3 py-2 text-base bg-blue-50 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Row 5: Rekon Material, Pelurusan Material, Status Procurement */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-gray-200">
                    <Button type="button" variant="outline" onClick={() => navigate("/projects")} className="w-full sm:w-auto">
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading} className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-base rounded-lg">
                      {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}