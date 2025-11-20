import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, User, Lock, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  role_display: string;
  avatar_url?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: "",
    full_name: "",
    email: "",
    role_display: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || "",
          email: user.email || "",
          role_display: data.role_display || "User",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      toast.error("Gagal memuat profil");
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Gagal memperbarui profil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b-2 border-red-200 bg-white shadow-sm">
            <div className="flex h-20 items-center gap-4 px-6 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-red-600">Profil Pengguna</h1>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 space-y-6 max-w-2xl">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>

            {/* Profile Card */}
            <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
              <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-2xl font-bold text-red-600">Informasi Profil</CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-8">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b-2 border-gray-200">
                  <Avatar className="h-24 w-24 ring-4 ring-red-200 shadow-lg">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    <AvatarFallback className="bg-red-100 text-red-600 text-lg font-bold">
                      {profile.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || "User"}</h2>
                    <p className="text-gray-600 font-medium">{profile.role_display}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>

                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`transition-all duration-300 ${
                      isEditing
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Batal Edit
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profil
                      </>
                    )}
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nama Lengkap */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-900 gap-2">
                      <User className="h-4 w-4 text-red-600" />
                      Nama Lengkap
                    </label>
                    <Input
                      type="text"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`
                        border-2 rounded-lg h-11 px-4 py-2 text-base transition-all duration-300
                        ${isEditing
                          ? "border-red-400 focus:border-red-600 bg-white"
                          : "border-gray-300 bg-gray-50 cursor-not-allowed"
                        }
                      `}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-900 gap-2">
                      <Mail className="h-4 w-4 text-red-600" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      disabled
                      className="border-2 border-gray-300 rounded-lg h-11 px-4 py-2 text-base bg-gray-100 cursor-not-allowed text-gray-600"
                    />
                    <p className="text-xs text-blue-600 mt-1">Email tidak dapat diubah</p>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-900 gap-2">
                      <Lock className="h-4 w-4 text-red-600" />
                      Role
                    </label>
                    <Input
                      type="text"
                      value={profile.role_display}
                      disabled
                      className="border-2 border-gray-300 rounded-lg h-11 px-4 py-2 text-base bg-gray-100 cursor-not-allowed text-gray-600"
                    />
                    <p className="text-xs text-blue-600 mt-1">Role ditentukan oleh administrator</p>
                  </div>

                  {/* Save Button */}
                  {isEditing && (
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 border-gray-300 hover:bg-gray-100"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card className="border-2 border-gray-200 shadow-lg bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Informasi Penting</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Untuk mengubah email atau role, silakan hubungi administrator sistem.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
