import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, User, Upload, Lock, Menu } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/utils/errors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ProfileData {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: string;
  jobdesk?: string;
  mitra?: string;
  nomor_hp?: string;
  photo?: string;
}

function ProfileContent() {
  const { user, token, refreshUser } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = !!user;
  const canEditUsername = user?.role === 'admin' || user?.role === 'super_admin';
  const canEditMitra = user?.role === 'admin' || user?.role === 'super_admin';
  const canChangePassword = user?.role === 'super_admin';
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
    jobdesk: "",
    mitra: "",
    nomor_hp: "",
    photo: "",
  });

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat profil');
      }

      setProfile({
        id: Number(data.data.id_pengguna ?? data.data.id ?? 0),
        name: data.data.name || "",
        username: data.data.username || "",
        email: data.data.email || "",
        role: data.data.role || "",
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal memuat profil"));
      console.error(error);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!canEdit) {
      setIsEditing(false);
      setShowPasswordForm(false);
    }
  }, [canEdit]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 2MB");
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
    if (!canEdit) return;
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'nomor_hp' ? value.slice(0, 20) : value;
    setProfile((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!canEdit) {
      toast.error('Akses ditolak');
      return;
    }

    setLoading(true);
    try {
      const getFirstValidationError = (data: unknown): string | null => {
        if (!data || typeof data !== 'object') return null;

        const record = data as Record<string, unknown>;
        const errors = record['errors'];

        // Case: { errors: ['msg'] }
        if (Array.isArray(errors) && typeof errors[0] === 'string') {
          return errors[0];
        }

        // Case: { errors: { field: ['msg'] } }
        if (errors && typeof errors === 'object') {
          const obj = errors as Record<string, unknown>;
          const firstValue = Object.values(obj)[0];
          if (typeof firstValue === 'string') return firstValue;
          if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0];
        }

        return null;
      };

      // Jika ada foto yang diupload, upload dulu fotonya
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append('photo', fileInputRef.current.files[0]);

        const photoResponse = await fetch(`${API_BASE_URL}/profile/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });

        const photoData = await photoResponse.json();

        if (!photoResponse.ok) {
          const errorMessage =
            getFirstValidationError(photoData)
            || (typeof (photoData as { message?: unknown } | null)?.message === 'string'
              ? (photoData as { message: string }).message
              : null)
            || 'Gagal mengupload foto';

          throw new Error(errorMessage);
        }
        
        // Update profile photo state
        if (photoData.data?.photo) {
          setProfilePhoto(photoData.data.photo);
        }
      }

      // Update profile data
      const payload: Record<string, unknown> = {
        name: profile.name,
        jobdesk: profile.jobdesk,
        nomor_hp: profile.nomor_hp,
        ...(canEditUsername ? { username: profile.username } : {}),
        ...(canEditMitra ? { mitra: profile.mitra } : {}),
      };

      console.log('Saving profile with payload:', payload);

      const requestJson = async (method: 'PUT' | 'POST') => {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const raw = await res.text();
        let parsed: unknown = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }

        return { res, raw, data: parsed };
      };

      // Coba PUT dulu (standar REST). Jika server membalas HTML/405, fallback ke POST alias.
      let result = await requestJson('PUT');
      console.log('Save response status:', result.res.status);

      const looksLikeHtml = result.raw.trim().startsWith('<');
      const shouldFallback = result.res.status === 405 || result.res.status === 404 || looksLikeHtml;
      if (shouldFallback) {
        result = await requestJson('POST');
        console.log('Save response fallback(POST) status:', result.res.status);
      }

      console.log('Save response data:', result.data);

      if (!result.res.ok) {
        const messageFromJson =
          typeof (result.data as { message?: unknown } | null)?.message === 'string'
            ? (result.data as { message: string }).message
            : null;

        const validationMessage = getFirstValidationError(result.data);

        const message = validationMessage
          || messageFromJson
          || (looksLikeHtml ? 'Server mengembalikan HTML (bukan JSON). Cek konfigurasi API/route.' : null)
          || `Gagal memperbarui profil (HTTP ${result.res.status})`;
        throw new Error(message);
      }

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);

      // Clear preview and sync latest profile to global/header
      await refreshUser();

      // Clear preview and fetch profile again
      setPreviewPhoto("");
      await fetchProfile();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal memperbarui profil"));
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal mengubah password"));
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
         <div className="flex-1 overflow-y-auto min-h-0 h-full">
          {/* Main Content */}
          <div className="w-full max-w-none min-h-full">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 lg:p-6 min-h-full">
              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Left Side - Photo Profile Card */}
              <div className="lg:col-span-2 w-none">
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
                      className={`bg-white rounded-full w-full h-full shadow-2xl border-[6px] border-white ring-4 ring-red-400/50 overflow-hidden ${isEditing && canEdit ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-300' : ''}`}
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
                    {isEditing && canEdit && (
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
                      disabled={!canEdit}
                      className="hidden"
                    />
                  </div>

                  <div className="text-center text-xs text-gray-600 font-medium -mt-2">
                    Ukuran foto maksimal 2MB
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
                            disabled={!isEditing || !canEditUsername}
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

                        {/* Jobdesk */}
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

                      {/* Mitra */}
                      <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Nama Mitra
                          </label>
                          <Input
                            type="text"
                            name="mitra"
                            value={profile.mitra}
                            onChange={handleInputChange}
                            disabled={!isEditing || !canEditMitra}
                            placeholder="Nama Mitra"
                            className="w-full h-11 px-4 border-2 border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-sm font-medium"
                          />
                        </div>

                      {/* Nomor HP and Role - Two columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            maxLength={12}
                            inputMode="tel"
                            pattern="[0-9+\\-() ]*"
                            disabled={!isEditing}
                            placeholder="Nomor HP"
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

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1"></div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        {canEdit ? (
                          !isEditing ? (
                            <>
                              <Button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
                              >
                                EDIT
                              </Button>
                              {canChangePassword && (
                                <Button
                                  type="button"
                                  onClick={() => navigate('/change-password')}
                                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
                                >
                                  GANTI PASSWORD
                                </Button>
                              )}
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
                          )
                        ) : (
                          <div className="w-full text-center text-gray-500 font-medium py-3">
                            Mode viewer
                          </div>
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
