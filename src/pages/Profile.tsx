import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, User, Upload, Lock, Menu } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ProfileData {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: string;
  nik?: string;
  jobdesk?: string;
  mitra?: string;
  nomor_hp?: string;
  photo?: string;
}

function ProfileContent() {
  const { user, token, refreshUser } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [previewPhoto, setPreviewPhoto] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [profile, setProfile] = useState<ProfileData>({
    id: 0,
    name: "",
    username: "",
    email: "",
    role: "",
    nik: "",
    jobdesk: "",
    mitra: "",
    nomor_hp: "",
    photo: "",
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
        username: data.data.username || "",
        email: data.data.email || "",
        role: data.data.role || "",
        nik: data.data.nik || "",
        jobdesk: data.data.jobdesk || "",
        mitra: data.data.mitra || "",
        nomor_hp: data.data.nomor_hp || "",
        photo: data.data.photo || "",
      });
      
      // Set foto dari server
      const photoUrl = data.data.photo || "";
      console.log('Photo URL from server:', photoUrl);
      setProfilePhoto(photoUrl);
      setPreviewPhoto(""); // Clear preview
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat profil");
      console.error(error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 1MB");
        return;
      }

      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar");
        return;
      }

      // Preview foto (base64 untuk preview saja)
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
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
      // Jika ada foto yang diupload, upload dulu fotonya
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append('photo', fileInputRef.current.files[0]);

        const photoResponse = await fetch(`${API_BASE_URL}/profile/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const photoData = await photoResponse.json();

        if (!photoResponse.ok) {
          throw new Error(photoData.message || 'Gagal mengupload foto');
        }
        
        // Update profile photo state
        if (photoData.data?.photo) {
          setProfilePhoto(photoData.data.photo);
        }
      }

      // Update profile data (name, username, nik, jobdesk, mitra, nomor_hp)
      const payload: Record<string, unknown> = {
        name: profile.name,
        username: profile.username,
        nik: profile.nik,
        jobdesk: profile.jobdesk,
        mitra: profile.mitra,
        nomor_hp: profile.nomor_hp,
      };

      console.log('Saving profile with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Save response status:', response.status);

      const data = await response.json();
      
      console.log('Save response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui profil');
      }

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);

      // Clear preview and sync latest profile to global/header
      await refreshUser();

      // Clear preview and fetch profile again
      setPreviewPhoto("");
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }

    if (passwordData.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah password');
      }

      toast.success("Password berhasil diubah!");
      setShowPasswordForm(false);
      setPasswordData({
        current_password: "",
        password: "",
        password_confirmation: ""
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Super Admin';
    }
  };

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Profil Pengguna" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 lg:p-6">
              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Left Side - Photo Profile Card */}
              <div className="lg:col-span-2 w-full">
                <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-red-600 h-full flex flex-col justify-center">
                  {/* Header with Icon */}
                  <div className="text-center mb-6">
                    <div className="inline-block bg-red-100 rounded-full p-2 mb-2">
                      <User className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-2xl tracking-wide mb-2">
                      Foto Profil
                    </h3>
                  </div>
                  
                  {/* Profile Photo with Upload - Optimized Size */}
                  <div className="relative mb-6 mx-auto w-48 h-48">
                    <div 
                      className={`bg-white rounded-full w-full h-full shadow-2xl border-[6px] border-white ring-4 ring-red-400/50 overflow-hidden ${isEditing ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-300' : ''}`}
                      onClick={handlePhotoClick}
                    >
                      {(previewPhoto || profilePhoto) ? (
                        <div className="w-full h-full relative bg-gray-100">
                          <img 
                            src={previewPhoto || profilePhoto} 
                            alt="Profile" 
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                              objectPosition: 'center',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              console.error('Error loading image:', previewPhoto || profilePhoto);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', previewPhoto || profilePhoto);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-24 h-24 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Icon Overlay when Editing */}
                    {isEditing && (
                      <div 
                        className="absolute bottom-2 right-2 bg-white rounded-full p-3 shadow-xl cursor-pointer hover:bg-red-50 transition-all duration-300 hover:scale-110 border-3 border-red-600"
                        onClick={handlePhotoClick}
                      >
                        <Upload className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Info Cards without White Box - Single Line Layout */}
                  <div className="space-y-3">
                    {/* Nama Lengkap Section */}
                    <div className="bg-red-50 backdrop-blur-sm rounded-xl p-3 border-2 border-red-200 hover:bg-red-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 rounded-lg p-1.5 flex-shrink-0">
                          <User className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-gray-700 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                          Nama:
                        </p>
                        <p className="text-gray-900 font-bold text-base flex-1 truncate">
                          {profile.name || "Super Admin"}
                        </p>
                      </div>
                    </div>
                    
                    {/* NIK Section */}
                    <div className="bg-red-50 backdrop-blur-sm rounded-xl p-3 border-2 border-red-200 hover:bg-red-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 rounded-lg p-1.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        </div>
                        <p className="text-gray-700 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                          NIK:
                        </p>
                        <p className="text-gray-900 font-bold text-base flex-1">
                          {profile.nik || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Jobdesk Section */}
                    <div className="bg-red-50 backdrop-blur-sm rounded-xl p-3 border-2 border-red-200 hover:bg-red-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 rounded-lg p-1.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-700 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                          Jobdesk:
                        </p>
                        <p className="text-gray-900 font-bold text-base flex-1 truncate">
                          {profile.jobdesk || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Mitra Section */}
                    <div className="bg-red-50 backdrop-blur-sm rounded-xl p-3 border-2 border-red-200 hover:bg-red-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 rounded-lg p-1.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <p className="text-gray-700 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                          Mitra:
                        </p>
                        <p className="text-gray-900 font-bold text-base flex-1 truncate">
                          {profile.mitra || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Nomor HP Section */}
                    <div className="bg-red-50 backdrop-blur-sm rounded-xl p-3 border-2 border-red-200 hover:bg-red-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 rounded-lg p-1.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <p className="text-gray-700 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                          No HP:
                        </p>
                        <p className="text-gray-900 font-bold text-base flex-1">
                          {profile.nomor_hp || "-"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Role Section */}
                    <div className="bg-red-50 backdrop-blur-sm rounded-xl p-3 border-2 border-red-200 hover:bg-red-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 rounded-lg p-1.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <p className="text-gray-700 text-xs font-bold uppercase tracking-wider flex-shrink-0">
                          Role:
                        </p>
                        <p className="text-red-600 font-bold text-base flex-1">
                          {getRoleDisplay(profile.role)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Profile Information Form */}
              <div className="lg:col-span-3 w-full">
                <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden h-full flex flex-col">
                  {/* Form Header */}
                  <div className="bg-gray-50 border-b-2 border-gray-200 px-6 py-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Informasi Profil
                    </h2>
                  </div>

                  {/* Form Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={profile.email}
                          disabled
                          placeholder="Email"
                          className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-600 text-sm font-medium"
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Username
                        </label>
                        <Input
                          type="text"
                          name="username"
                          value={profile.username}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Username"
                          className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                        />
                      </div>

                      {/* Nama Lengkap */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Nama Lengkap
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Nama lengkap"
                          className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                        />
                      </div>

                      {/* NIK and Role - Two columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            NIK
                          </label>
                          <Input
                            type="text"
                            name="nik"
                            value={profile.nik}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="NIK"
                            className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Role
                          </label>
                          <Input
                            type="text"
                            value={getRoleDisplay(profile.role)}
                            disabled
                            placeholder="Role"
                            className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-600 text-sm font-medium"
                          />
                        </div>
                      </div>

                      {/* Jobdesk and Mitra */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Jobdesk
                          </label>
                          <Input
                            type="text"
                            name="jobdesk"
                            value={profile.jobdesk}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Jobdesk"
                            className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Nama Mitra
                          </label>
                          <Input
                            type="text"
                            name="mitra"
                            value={profile.mitra}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Nama Mitra"
                            className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                          />
                        </div>
                      </div>

                      {/* Nomor HP */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Nomor HP
                        </label>
                        <Input
                          type="text"
                          name="nomor_hp"
                          value={profile.nomor_hp}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Nomor HP"
                          className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                        />
                      </div>

                      {/* Ubah Password - Super Admin Only */}
                      {profile.role === 'super_admin' && (
                        <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-red-600" />
                              <label className="text-sm font-bold text-gray-900">
                                Ubah Password
                              </label>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setShowPasswordForm(!showPasswordForm)}
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 font-semibold text-sm h-8"
                            >
                              {showPasswordForm ? "Tutup" : "Tampilkan"}
                            </Button>
                          </div>
                          
                          {showPasswordForm && (
                            <div className="space-y-3 mt-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Password Lama
                                </label>
                                <Input
                                  type="password"
                                  value={passwordData.current_password}
                                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                  placeholder="Masukkan password lama"
                                  className="h-10 border-2 border-gray-300 rounded-lg focus:border-red-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Password Baru
                                </label>
                                <Input
                                  type="password"
                                  value={passwordData.password}
                                  onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                                  placeholder="Minimal 8 karakter"
                                  className="h-10 border-2 border-gray-300 rounded-lg focus:border-red-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Konfirmasi Password Baru
                                </label>
                                <Input
                                  type="password"
                                  value={passwordData.password_confirmation}
                                  onChange={(e) => setPasswordData({...passwordData, password_confirmation: e.target.value})}
                                  placeholder="Ulangi password baru"
                                  className="h-10 border-2 border-gray-300 rounded-lg focus:border-red-500 text-sm"
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={handlePasswordChange}
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 rounded-lg text-sm"
                              >
                                {loading ? "Mengubah..." : "Ubah Password"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1"></div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        {!isEditing ? (
                          <>
                            <Button
                              type="button"
                              onClick={() => setIsEditing(true)}
                              className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
                            >
                              EDIT
                            </Button>
                            <Button
                              disabled
                              className="w-full sm:flex-1 bg-pink-200 text-pink-400 font-bold py-3 rounded-xl text-base cursor-not-allowed uppercase tracking-wide"
                            >
                              SIMPAN
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              onClick={() => {
                                setIsEditing(false);
                                fetchProfile(); // Reset to original data
                              }}
                              className="w-full sm:flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
                            >
                              BATAL
                            </Button>
                            <Button
                              type="submit"
                              disabled={loading}
                              className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-60 uppercase tracking-wide"
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
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ProfileContent />
    </SidebarProvider>
  );
}
