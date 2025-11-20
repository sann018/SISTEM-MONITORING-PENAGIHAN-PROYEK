import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Project | null>(null);

  const statusCtOptions = ["Sudah CT", "Belum CT"];
  const statusUtOptions = ["Sudah UT", "Belum UT"];
  const rekonMaterialOptions = ["Sudah Rekon", "Belum Rekon"];
  const materialAlignmentOptions = ["Sudah Lurus", "Belum Lurus"];
  const procurementOptions = ["Antri Periv", "Proses Periv", "Revisi Mitra", "Sekuler TTD", "Scan Dokumen Mitra", "OTW Reg"];
  const phaseOptions = ["Instalasi", "Konstruksi", "Optimasi", "Perencanaan", "Implementasi", "Aktivasi", "Maintenance", "Penyelesaian"];

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error) {
      toast.error("Gagal memuat proyek");
      navigate("/projects");
    } else {
      setProject(data);
      setFormData(data);
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
    
    if (!formData?.project_name || !formData?.partner_name || !formData?.pid || !formData?.po_number || !formData?.phase || !formData?.rekon_nilai) {
      toast.error("Semua field yang bertanda * harus diisi");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("projects").update(formData).eq("id", id);
      if (error) throw error;
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
            <div className="flex h-20 items-center gap-4 px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-red-600">Edit Proyek</h1>
            </div>
          </header>

          <div className="p-8 space-y-8 max-w-4xl">
            <Button variant="outline" onClick={() => navigate("/projects")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-xl font-bold text-red-600">Informasi Proyek</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: Nama Proyek & Nama Mitra */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Nama Proyek <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="project_name"
                        placeholder="Masukkan nama proyek"
                        value={formData.project_name}
                        onChange={handleInputChange}
                        className="border-2 border-gray-400 focus:border-red-500 rounded-lg h-10 px-3 py-2 text-base bg-white placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900">Nama Mitra <span className="text-red-600">*</span></label>
                      <Input
                        type="text"
                        name="partner_name"
                        placeholder="Masukkan nama mitra"
                        value={formData.partner_name}
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
                        name="po_number"
                        placeholder="PO-2024-001"
                        value={formData.po_number}
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
                      <Select value={formData.material_alignment || "Belum Lurus"} onValueChange={(value) => handleSelectChange("material_alignment", value)}>
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
                      <Select value={formData.procurement_status || "Antri Periv"} onValueChange={(value) => handleSelectChange("procurement_status", value)}>
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