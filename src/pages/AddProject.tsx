import { useState } from "react";
import { useNavigate } from "react-router-dom";
import penagihanService from "@/services/penagihanService";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_proyek: "",
    nama_mitra: "",
    pid: "",
    jenis_po: "",
    nomor_po: "",
    phase: "",
    status_ct: "Belum CT",
    status_ut: "Belum UT",
    rekap_boq: "Belum Rekap",
    rekon_nilai: "",
    rekon_material: "Belum Rekon",
    pelurusan_material: "Belum Lurus",
    status_procurement: "Antri Periv",
    estimasi_durasi_hari: "7",
    tanggal_mulai: new Date().toISOString().split("T")[0],
  });

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekapBoqOptions = ["Sudah Rekap", "Belum Rekap"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];
  const phaseOptions = ["Instalasi", "Konstruksi", "Optimasi", "Perencanaan", "Implementasi", "Aktivasi", "Maintenance", "Penyelesaian"];
  const jenisPoOptions = ["Baru", "Perpanjangan", "Perubahan", "Addendum"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_proyek || !formData.nama_mitra || !formData.pid || !formData.nomor_po || !formData.phase || !formData.rekon_nilai) {
      toast.error("Semua field yang bertanda * harus diisi");
      return;
    }

    setLoading(true);
    try {
      // Generate nomor invoice unik
      const timestamp = Date.now();
      const invoiceNumber = `INV-${formData.pid}-${timestamp}`;
      
      const mappedData = {
        nama_proyek: formData.nama_proyek,
        nama_mitra: formData.nama_mitra,
        pid: formData.pid,
        jenis_po: formData.jenis_po,
        nomor_po: formData.nomor_po,
        phase: formData.phase,
        status_ct: formData.status_ct,
        status_ut: formData.status_ut,
        rekap_boq: formData.rekap_boq,
        rekon_nilai: parseFloat(formData.rekon_nilai) || 0,
        rekon_material: formData.rekon_material,
        pelurusan_material: formData.pelurusan_material,
        status_procurement: formData.status_procurement,
        estimasi_durasi_hari: parseInt(formData.estimasi_durasi_hari) || 7,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_invoice: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: new Date().toISOString().split('T')[0],
      };
      
      console.log("📤 Data yang dikirim ke API:", mappedData);
      
      await penagihanService.create(mappedData);
      toast.success("Proyek berhasil ditambahkan");
      navigate("/projects");
    } catch (error: any) {
      console.error("❌ Error detail:", error);
      console.error("❌ Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || "Gagal menambahkan proyek";
      const errorDetails = error.response?.data?.errors;
      
      if (errorDetails) {
        console.error("❌ Validation errors:", errorDetails);
        const firstError = Object.values(errorDetails)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
        <PageHeader title="Tambah Proyek Baru" />
        <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
          <AppSidebar />
          <main className="flex-1 overflow-auto w-full min-w-0">
            <div className="w-full max-w-none">
            {/* Back Button */}
            <Button variant="outline" onClick={() => navigate("/projects")} className="mb-2 md:mb-4 text-xs md:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200">
              {/* Card Header */}
              <div className="bg-pink-100 border-b-2 border-pink-200 px-8 py-4 rounded-t-xl">
                <h2 className="text-xl font-bold text-red-600">Informasi Proyek</h2>
              </div>

              {/* Card Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: Nama Proyek & Nama Mitra */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nama Proyek <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="text"
                        name="nama_proyek"
                        placeholder="Masukkan nama proyek"
                        value={formData.nama_proyek}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nama Mitra <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="text"
                        name="nama_mitra"
                        placeholder="Masukkan nama mitra"
                        value={formData.nama_mitra}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: PID, Jenis PO, Nomor PO */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        PID <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="text"
                        name="pid"
                        placeholder="PID-003"
                        value={formData.pid}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Jenis PO
                      </label>
                      <select
                        name="jenis_po"
                        value={formData.jenis_po}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        <option value="">Pilih Jenis PO</option>
                        {jenisPoOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nomor PO <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="text"
                        name="nomor_po"
                        placeholder="PO-2025-01"
                        value={formData.nomor_po}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Phase */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phase <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="phase"
                      value={formData.phase}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      required
                    >
                      <option value="">Pilih phase</option>
                      {phaseOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4: Status CT, Status UT, Rekap BOQ, Rekon Nilai */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Status CT <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="status_ct"
                        value={formData.status_ct}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        {statusCtOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Status UT <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="status_ut"
                        value={formData.status_ut}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        {statusUtOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Rekap BOQ & Rekon Nilai */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Rekap BOQ
                      </label>
                      <select
                        name="rekap_boq"
                        value={formData.rekap_boq}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        {rekapBoqOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Rekon Nilai <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="number"
                        name="rekon_nilai"
                        placeholder="2700000"
                        value={formData.rekon_nilai}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-blue-400 rounded-md focus:border-blue-600 bg-blue-50"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 6: Rekon Material, Pelurusan Material, Status Procurement */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Rekon Material
                      </label>
                      <select
                        name="rekon_material"
                        value={formData.rekon_material}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        {rekonMaterialOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Pelurusan Material
                      </label>
                      <select
                        name="pelurusan_material"
                        value={formData.pelurusan_material}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        {materialAlignmentOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Status Procurement
                      </label>
                      <select
                        name="status_procurement"
                        value={formData.status_procurement}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white text-gray-900"
                      >
                        {procurementOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 7: Estimasi Durasi & Tanggal Mulai */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Estimasi Durasi (hari)
                      </label>
                      <Input
                        type="number"
                        name="estimasi_durasi_hari"
                        placeholder="7"
                        value={formData.estimasi_durasi_hari}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md focus:border-red-500 bg-white"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Tanggal Mulai
                      </label>
                      <Input
                        type="date"
                        name="tanggal_mulai"
                        value={formData.tanggal_mulai}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 border-2 border-green-400 rounded-md focus:border-green-600 bg-green-50"
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                    <Button
                      type="button"
                      onClick={() => navigate("/projects")}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-8 rounded-md"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-md"
                    >
                      {loading ? "Menyimpan..." : "Simpan Proyek"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Info Box */}
            {Object.values(formData).some(val => val === "") && (
              <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold">
                  !
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Gagal memuat data proyek</span>
                </p>
              </div>
            )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}