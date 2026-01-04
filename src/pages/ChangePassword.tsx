import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function ChangePasswordContent() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    if (user && user.role !== "super_admin") {
      toast.error("Akses ditolak. Ganti password hanya untuk Super Admin.");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const isValidPassword = (password: string) => {
    // Minimal 8, harus ada huruf kecil, huruf besar, angka, simbol
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error("Password baru dan konfirmasi password tidak cocok");
      return;
    }

    if (!isValidPassword(formData.password)) {
      toast.error("Password minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, angka, dan simbol");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Gagal mengubah password');
      } else {
        toast.success(data.message || "Password berhasil diubah!");
        setFormData({
          current_password: "",
          password: "",
          password_confirmation: "",
        });
        
        // Redirect ke profile setelah 2 detik
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Ganti Password" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full max-w-none">
             {/* Back Button */}
           <Button variant="outline" onClick={() => navigate("/profile")} className="mb-2 md:mb-4 text-xs md:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            {/* Change Password Card */}
            <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
              <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-2xl font-bold text-red-600">Ubah Password</CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-900 gap-2">
                      <Lock className="h-4 w-4 text-red-600" />
                      Password Lama
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        required
                        placeholder="Masukkan password lama"
                        className="border-2 border-gray-300 focus:border-red-500 rounded-lg h-12 px-4 py-2 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-900 gap-2">
                      <Lock className="h-4 w-4 text-red-600" />
                      Password Baru
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                        placeholder="Minimal 8 karakter"
                        className="border-2 border-gray-300 focus:border-red-500 rounded-lg h-12 px-4 py-2 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">Password minimal 8 karakter</p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-900 gap-2">
                      <Lock className="h-4 w-4 text-red-600" />
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                        placeholder="Ulangi password baru"
                        className="border-2 border-gray-300 focus:border-red-500 rounded-lg h-12 px-4 py-2 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/profile")}
                      className="flex-1 border-gray-300 hover:bg-gray-100"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
                    >
                      {loading ? "Menyimpan..." : "Ubah Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-2 border-blue-200 shadow-lg bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Tips Keamanan Password</p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol</li>
                      <li>Jangan gunakan password yang sama dengan akun lain</li>
                      <li>Ganti password secara berkala untuk keamanan</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ChangePasswordContent />
    </SidebarProvider>
  );
}
