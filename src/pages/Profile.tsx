import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: 0,
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat profil');
      }

      setProfile({
        id: data.data.id,
        name: data.data.name || "",
        email: data.data.email || "",
        role: data.data.role || "",
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat profil");
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
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui profil');
      }

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
      
      // Update profile data
      setProfile(prev => ({
        ...prev,
        name: data.data.name,
      }));
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'viewer':
        return 'Viewer';
      default:
        return 'User';
    }
  };

  return (
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <TopBar />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '112px' }}>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side - Photo */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-md bg-red-600 rounded-2xl shadow-xl p-6 border-4 border-red-700">
                  <h3 className="text-center text-white font-bold text-lg mb-4 bg-red-700 py-2 rounded-lg">
                    FOTO PROFIL
                  </h3>
                  <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center mb-6 mx-auto">
                    <Camera className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-center text-white font-bold text-xl mb-2">
                    {profile.name || "Nomin Lengkap"}
                  </h3>
                  <p className="text-center text-white text-sm mb-4">Jabatan</p>
                  <button className="w-full bg-white text-red-600 font-bold py-2 rounded-lg hover:bg-gray-100 transition">
                    Admin
                  </button>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                  Profile Information
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Username
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Username"
                      className="w-full h-11 px-4 border-2 border-gray-300 rounded-md disabled:bg-gray-50 focus:border-red-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      disabled
                      placeholder="Email"
                      className="w-full h-11 px-4 border-2 border-gray-300 rounded-md disabled:bg-gray-50"
                    />
                  </div>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nama Lengkap
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Nama lengkap"
                      className="w-full h-11 px-4 border-2 border-gray-300 rounded-md disabled:bg-gray-50 focus:border-red-500"
                    />
                  </div>

                  {/* NIK and Role - Two columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        NIK
                      </label>
                      <Input
                        type="text"
                        value={profile.id.toString()}
                        disabled
                        placeholder="NIK"
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={getRoleDisplay(profile.role)}
                        disabled
                        className="w-full h-11 px-4 border-2 border-gray-300 rounded-md disabled:bg-gray-50 bg-white"
                      >
                        <option>{getRoleDisplay(profile.role)}</option>
                      </select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6">
                    {!isEditing ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-md text-sm"
                        >
                          EDIT
                        </Button>
                        <Button
                          disabled
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-md text-sm opacity-50 cursor-not-allowed"
                        >
                          SIMPAN
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 rounded-md text-sm"
                        >
                          BATAL
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-md text-sm"
                        >
                          {loading ? "Menyimpan..." : "SIMPAN"}
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
