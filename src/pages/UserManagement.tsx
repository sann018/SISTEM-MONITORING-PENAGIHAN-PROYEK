import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Edit, 
  Trash2,
  Camera,
  Key,
  Menu,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  jobdesk?: string;
  mitra?: string;
  phone?: string;
  photo?: string;
  created_at: string;
}

function UserManagementContent() {
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Dialog states
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [photoViewerDialog, setPhotoViewerDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk'>('single');

  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showNewUserPasswordConfirmation, setShowNewUserPasswordConfirmation] = useState(false);

  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    email?: string;
    password: string;
    createdAtLabel: string;
  } | null>(null);
  
  // Form states for Add User
  const [newUserData, setNewUserData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "viewer"
  });
  
  // Form states for Edit User
  const [editUserData, setEditUserData] = useState({
    name: "",
    username: "",
    email: "",
  });
  
  // Form states for Reset Password
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    password_confirmation: ""
  });

  const currentUserId = Number(currentUser?.id);
  const isCurrentUserRow = (user: User) => {
    // Prioritas 1: cek ID dulu (paling akurat)
    if (Number.isFinite(currentUserId) && currentUserId > 0) {
      return user.id === currentUserId;
    }
    
    // Fallback 2: cek username (hanya jika kedua nilai tidak kosong/null/whitespace)
    const currentUsernameTrimmed = currentUser?.username?.trim();
    const usernameTrimmed = user.username?.trim();
    if (currentUsernameTrimmed && usernameTrimmed) {
      return currentUsernameTrimmed.toLowerCase() === usernameTrimmed.toLowerCase();
    }
    
    // Fallback 3: cek email (hanya jika kedua nilai valid email dengan '@')
    const currentEmailValid = currentUser?.email && currentUser.email.includes('@');
    const userEmailValid = user.email && user.email.includes('@');
    if (currentEmailValid && userEmailValid) {
      return currentUser!.email.toLowerCase() === user.email.toLowerCase();
    }
    
    return false;
  };

  useEffect(() => {
    // Check if user is super admin
    if (currentUser?.role !== 'super_admin') {
      toast.error("Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini.");
      navigate("/dashboard");
      return;
    }
    
    fetchUsers();
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    if (!token) {
      console.error('[UserManagement] Token tidak tersedia');
      return;
    }
    
    setLoading(true);
    try {
      console.log('[UserManagement] Fetching users from:', `${API_BASE_URL}/users`);
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[UserManagement] Response status:', response.status);
      
      const data = await response.json();
      console.log('[UserManagement] Response data:', data);

      if (!response.ok) {
        console.error('[UserManagement] API Error:', data);
        throw new Error(data.message || 'Gagal memuat data users');
      }

      // Validasi struktur response
      if (!data || typeof data !== 'object') {
        console.error('[UserManagement] Invalid response structure:', data);
        throw new Error('Format response tidak valid');
      }

      const rawUsers = Array.isArray(data.data) ? data.data : [];
      console.log('[UserManagement] Raw users count:', rawUsers.length);
      console.log('[UserManagement] Sample raw user:', rawUsers[0]);

      const normalizedUsers: User[] = rawUsers
        .map((raw: any, index: number) => {
          // Coba semua kemungkinan field ID
          const rawId = raw?.id ?? raw?.id_pengguna ?? raw?.idPengguna ?? raw?.user_id;
          const parsedId = typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId);
          
          // Debug logging untuk ID yang tidak valid
          if (!Number.isFinite(parsedId)) {
            console.warn(`[UserManagement] Invalid ID at index ${index}:`, {
              rawId,
              parsedId,
              raw
            });
            return null;
          }

          const normalized = {
            id: parsedId,
            name: String(raw?.name ?? raw?.nama ?? ''),
            username: String(raw?.username ?? ''),
            email: String(raw?.email ?? ''),
            role: String(raw?.role ?? raw?.peran ?? ''),
            jobdesk: String(
              raw?.jobdesk ??
                raw?.job_desc ??
                raw?.jobDescription ??
                raw?.jabatan ??
                raw?.posisi ??
                raw?.role_description ??
                ''
            ),
            mitra: String(
              raw?.mitra ??
                raw?.nama_mitra ??
                raw?.mitra_name ??
                raw?.partner ??
                raw?.partner_name ??
                raw?.namaMitra ??
                ''
            ),
            phone: String(
              raw?.phone ??
                raw?.no_hp ??
                raw?.nomor_hp ??
                raw?.hp ??
                raw?.telp ??
                raw?.no_telp ??
                raw?.nomor_telepon ??
                ''
            ),
            photo: typeof raw?.photo === 'string' ? raw.photo : undefined,
            created_at: String(raw?.created_at ?? raw?.dibuat_pada ?? ''),
          } as User;

          return normalized;
        })
        .filter(Boolean) as User[];

      console.log('[UserManagement] Normalized users count:', normalizedUsers.length);
      console.log('[UserManagement] Sample normalized user:', normalizedUsers[0]);

      setUsers(normalizedUsers);
      
      if (normalizedUsers.length > 0) {
        toast.success(`Berhasil memuat ${normalizedUsers.length} user`);
      } else {
        toast.info('Tidak ada data user di database');
      }
    } catch (error: any) {
      console.error('[UserManagement] Error fetching users:', error);
      toast.error(error.message || "Gagal memuat data users");
    } finally {
      setLoading(false);
    }
  };

  const isValidUsername = (username: string) => {
    return /^(?=.{4,30}$)(?![._-])(?!.*[._-]{2})[a-zA-Z0-9._-]+(?<![._-])$/.test(username);
  };

  const isValidPassword = (password: string) => {
    // Minimal 8, harus ada huruf kecil, huruf besar, angka, simbol
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Berhasil disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  // Handle Add User
  const handleAddUser = async () => {
    if (!token) return;

    if (!newUserData.username.trim()) {
      toast.error("Username wajib diisi");
      return;
    }

    if (!isValidUsername(newUserData.username.trim())) {
      toast.error("Username tidak valid (4-30 karakter, huruf/angka/._-, tidak diawali/diakhiri simbol, tidak ada simbol berurutan)");
      return;
    }

    if (!newUserData.email.trim()) {
      toast.error("Email wajib diisi");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email.trim())) {
      toast.error("Format email tidak valid");
      return;
    }

    if (!newUserData.password) {
      toast.error("Password wajib diisi");
      return;
    }

    if (!newUserData.password_confirmation) {
      toast.error("Konfirmasi password wajib diisi");
      return;
    }

    if (newUserData.password !== newUserData.password_confirmation) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (!isValidPassword(newUserData.password)) {
      toast.error("Password minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, angka, dan simbol");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserData.name,
          username: newUserData.username.trim(),
          email: newUserData.email,
          password: newUserData.password,
          password_confirmation: newUserData.password_confirmation,
          role: newUserData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambah user');
      }

      const createdUsername = data?.data?.user?.username || newUserData.username.trim();
      const createdEmail = data?.data?.user?.email || newUserData.email || "";
      const createdPassword = newUserData.password;

      const createdAtLabel = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      setCreatedCredentials({
        username: createdUsername,
        email: createdEmail || undefined,
        password: createdPassword,
        createdAtLabel,
      });
      setCredentialsDialogOpen(true);

      setAddUserDialog(false);
      setNewUserData({
        name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "viewer"
      });
      setShowNewUserPassword(false);
      setShowNewUserPasswordConfirmation(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambah user");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async () => {
    if (!selectedUser || !token) return;

    if (!editUserData.username.trim()) {
      toast.error("Username wajib diisi");
      return;
    }

    if (!isValidUsername(editUserData.username.trim())) {
      toast.error("Username tidak valid (4-30 karakter, huruf/angka/._-, tidak diawali/diakhiri simbol, tidak ada simbol berurutan)");
      return;
    }

    setLoading(true);
    try {
      if (!Number.isFinite(selectedUser.id)) {
        toast.error("User tidak ditemukan");
        return;
      }

      // Kirim hanya field yang valid agar tidak memicu 'sometimes|required' di backend
      const payload: Record<string, unknown> = {};
      if (editUserData.name.trim()) payload.name = editUserData.name.trim();
      if (editUserData.username.trim()) payload.username = editUserData.username.trim().toLowerCase();
      if (editUserData.email.trim()) payload.email = editUserData.email.trim();

      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal update user');
      }

      toast.success("User berhasil diupdate");
      setEditUserDialog(false);
      setSelectedUser(null);
      
      // Refresh tabel untuk menampilkan perubahan
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal update user");
    } finally {
      setLoading(false);
    }
  };

  // Handle Inline Role Change
  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah role');
      }

      toast.success(`Role berhasil diubah menjadi ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah role");
    }
  };

  // Handle Reset Password
  const handleResetPassword = async () => {
    if (!selectedUser || !token) return;

    if (resetPasswordData.password !== resetPasswordData.password_confirmation) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (!isValidPassword(resetPasswordData.password)) {
      toast.error("Password minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, angka, dan simbol");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetPasswordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal reset password');
      }

      toast.success(`Password untuk ${selectedUser.name} berhasil direset`);
      setResetPasswordDialog(false);
      setSelectedUser(null);
      setResetPasswordData({
        password: "",
        password_confirmation: ""
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Single User
  const handleDeleteUser = async () => {
    if (!selectedUser || !token) return;

    if (isCurrentUserRow(selectedUser)) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri");
      return;
    }

    if (selectedUser.role === 'super_admin') {
      toast.error("Akun Super Admin tidak dapat dihapus");
      return;
    }

    setLoading(true);
    try {
      const deletingUserId = selectedUser.id;
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus user');
      }

      toast.success("User berhasil dihapus");

      // Optimistic update: langsung hilangkan dari tabel
      setUsers((prev) => prev.filter((u) => u.id !== deletingUserId));
      setSelectedUsers((prev) => prev.filter((id) => id !== deletingUserId));

      setDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus user");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Multiple Users
  const handleDeleteMultiple = async () => {
    if (selectedUsers.length === 0 || !token) return;

    setLoading(true);
    try {
      const idsToDelete = selectedUsers.filter((id) => {
        const target = users.find((u) => u.id === id);
        if (!target) return false;
        if (target.role === 'super_admin') return false;
        if (isCurrentUserRow(target)) return false;
        return true;
      });

      if (idsToDelete.length === 0) {
        toast.error("Tidak ada akun yang dapat dihapus dari pilihan saat ini");
        return;
      }

      // Delete each selected user and validate response
      const results = await Promise.all(
        idsToDelete.map(async (userId) => {
          const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          let payload: any = null;
          try {
            payload = await res.json();
          } catch {
            payload = null;
          }

          return { userId, ok: res.ok, message: payload?.message };
        })
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error(failed[0].message || `Gagal menghapus ${failed.length} user`);
      }

      toast.success(`${idsToDelete.length} user berhasil dihapus`);

      // Optimistic update: langsung hilangkan dari tabel
      setUsers((prev) => prev.filter((u) => !idsToDelete.includes(u.id)));
      setSelectedUsers([]);
      setDeleteDialog(false);

      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus user");
    } finally {
      setLoading(false);
    }
  };

  // Handle Select All
  const handleSelectAll = () => {
    const allIds = filteredUsers
      .filter((u) => u.role !== 'super_admin' && !isCurrentUserRow(u))
      .map((u) => u.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedUsers.includes(id));
    setSelectedUsers(allSelected ? [] : allIds);
  };

  // Handle Select Single
  const handleSelectUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((user) => {
    // Filter berdasarkan search term
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.mitra || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.jobdesk || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter berdasarkan role
    const matchesRole = 
      roleFilter === "all" ||
      (roleFilter === "super_admin" && user.role === "super_admin") ||
      (roleFilter === "admin" && user.role === "admin") ||
      (roleFilter === "viewer" && user.role === "viewer");
    
    return matchesSearch && matchesRole;
  });

  const deletableFilteredUsers = filteredUsers.filter(
    (u) => u.role !== 'super_admin' && !isCurrentUserRow(u),
  );

  const isAllSelected =
    deletableFilteredUsers.length > 0 && deletableFilteredUsers.every((u) => selectedUsers.includes(u.id));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'viewer': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-svh w-full bg-gray-50 overflow-hidden">
      <PageHeader title="Manajemen Pengguna" />
      <div className="flex flex-1 gap-4 px-4 pb-4 min-h-0">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full max-w-none">
              <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8">
                <div className="sticky top-0 z-10 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-gray-100">
                  {/* Header */}
                  <div>
                    <h1 className="text-3xl font-bold text-red-600 mb-1">
                      Manajemen User
                    </h1>
                    <p className="text-lg font-semibold text-red-600">Admin dan User</p>
                  </div>

                  {/* Search, Filter, and Action Buttons */}
                  <div className="mt-4 flex flex-col md:flex-row gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 w-full relative">
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 border-2 border-gray-300 rounded-md px-4 focus:border-red-500"
                      />
                    </div>

                    {/* Filter Dropdown */}
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="h-10 px-4 border-2 border-gray-300 rounded-md bg-white text-gray-700 font-medium focus:border-red-500 min-w-[200px]"
                    >
                      <option value="all">Semua Pengguna</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    {/* Delete Multiple Button */}
                    {selectedUsers.length > 0 && (
                      <Button
                        onClick={() => {
                          setDeleteMode('bulk');
                          setDeleteDialog(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md flex items-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        Hapus ({selectedUsers.length})
                      </Button>
                    )}

                    {/* Add User Button */}
                    <Button
                      onClick={() => setAddUserDialog(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5" />
                      Tambah Akun
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-pink-100 border-b-2 border-pink-200">
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-red-600">
                      <Users className="w-5 h-5 mx-auto" />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Nama Lengkap
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Jobdesk
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Nama Mitra
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Nomor HP
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Tanggal Dibuat
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-red-600">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">
                          {user.role === 'super_admin' || isCurrentUserRow(user) ? (
                            <span className="inline-block w-4 h-4" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div 
                            className="w-10 h-10 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
                            onClick={() => {
                              if (user.photo) {
                                setSelectedUser(user);
                                setPhotoViewerDialog(true);
                              }
                            }}
                          >
                            {user.photo ? (
                              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          {/* Inline Role Editor */}
                          {user.role === 'super_admin' ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                              {getRoleDisplay(user.role)}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border-0 focus:ring-2 focus:ring-red-500 ${getRoleBadgeColor(user.role)}`}
                              disabled={isCurrentUserRow(user)}
                            >
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {user.jobdesk || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {user.mitra || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {user.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setEditUserData({
                                  name: user.name,
                                  username: user.username,
                                  email: user.email || "",
                                });
                                setEditUserDialog(true);
                              }}
                              className="text-orange-600 hover:text-orange-800 transition"
                              title="Edit User"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            {user.role !== 'super_admin' && (
                              <>
                                <button 
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setResetPasswordDialog(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 transition"
                                  title="Reset Password"
                                >
                                  <Key className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeleteMode('single');
                                    setSelectedUsers([]);
                                    setSelectedUser(user);
                                    setDeleteDialog(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 transition"
                                  disabled={isCurrentUserRow(user)}
                                  title="Hapus User"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data pengguna
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

              </div>

        {/* Add User Dialog */}
        <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
          <DialogContent className="max-w-2xl border-4 border-red-600">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi user yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 border-2 border-red-600 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                <Input
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                  placeholder="john.doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                  className="w-full h-10 px-3 border-2 border-gray-300 rounded-md focus:border-red-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Input
                    type={showNewUserPassword ? "text" : "password"}
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    placeholder="Minimal 8 karakter"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showNewUserPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showNewUserPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Konfirmasi Password</label>
                <div className="relative">
                  <Input
                    type={showNewUserPasswordConfirmation ? "text" : "password"}
                    value={newUserData.password_confirmation}
                    onChange={(e) => setNewUserData({...newUserData, password_confirmation: e.target.value})}
                    placeholder="Ulangi password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPasswordConfirmation((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showNewUserPasswordConfirmation ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
                  >
                    {showNewUserPasswordConfirmation ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleAddUser} disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? "Menyimpan..." : "Tambah User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Created Credentials Popup (Centered, Close-button only) */}
        <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
          <DialogContent
            hideClose
            className="max-w-lg border-4 border-red-600"
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600">Akun berhasil dibuat</DialogTitle>
              <DialogDescription>
                {createdCredentials?.createdAtLabel}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <span className="font-semibold">Username:</span>{" "}
                  <span className="font-mono break-all">{createdCredentials?.username || "-"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => createdCredentials?.username && copyToClipboard(createdCredentials.username)}
                  className="text-xs text-red-700 hover:text-red-900 underline whitespace-nowrap"
                >
                  Salin
                </button>
              </div>

              {createdCredentials?.email ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold">Email:</span>{" "}
                    <span className="font-mono break-all">{createdCredentials.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => createdCredentials?.email && copyToClipboard(createdCredentials.email)}
                    className="text-xs text-red-700 hover:text-red-900 underline whitespace-nowrap"
                  >
                    Salin
                  </button>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <span className="font-semibold">Password:</span>{" "}
                  <span className="font-mono break-all">{createdCredentials?.password || "-"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => createdCredentials?.password && copyToClipboard(createdCredentials.password)}
                  className="text-xs text-red-700 hover:text-red-900 underline whitespace-nowrap"
                >
                  Salin
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Simpan informasi ini sekarang. Password tidak akan ditampilkan lagi setelah Anda menutup popup.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setCredentialsDialogOpen(false);
                  setCreatedCredentials(null);
                }}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600">Edit User</DialogTitle>
              <DialogDescription className="text-gray-600">
                Ubah informasi user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                <Input
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <Input
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500"
                  placeholder="Masukkan username"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500"
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditUserDialog(false)}
                className="h-11 px-6 border-2 border-gray-300 hover:bg-gray-100 font-semibold"
              >
                Batal
              </Button>
              <Button 
                onClick={handleEditUser} 
                disabled={loading} 
                className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <Key className="w-6 h-6" />
                Reset Password
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Reset password untuk user <span className="font-semibold text-gray-900">{selectedUser?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password Baru</label>
                <Input
                  type="password"
                  value={resetPasswordData.password}
                  onChange={(e) => setResetPasswordData({...resetPasswordData, password: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Konfirmasi Password Baru</label>
                <Input
                  type="password"
                  value={resetPasswordData.password_confirmation}
                  onChange={(e) => setResetPasswordData({...resetPasswordData, password_confirmation: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ulangi password baru"
                />
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Password baru akan langsung berlaku dan user harus menggunakan password ini untuk login.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setResetPasswordDialog(false);
                  setResetPasswordData({ password: "", password_confirmation: "" });
                }}
                className="h-11 px-6 border-2 border-gray-300 hover:bg-gray-100 font-semibold"
              >
                Batal
              </Button>
              <Button 
                onClick={handleResetPassword} 
                disabled={loading} 
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading ? "Mereset..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                {deleteMode === 'bulk'
                  ? `Apakah Anda yakin ingin menghapus ${selectedUsers.length} user?` 
                  : `Apakah Anda yakin ingin menghapus user "${selectedUser?.name}"?`}
                <br />
                <span className="text-red-600 font-semibold">Tindakan ini tidak dapat dibatalkan!</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteDialog(false);
                setSelectedUser(null);
              }}>
                Batal
              </Button>
              <Button 
                onClick={deleteMode === 'bulk' ? handleDeleteMultiple : handleDeleteUser} 
                disabled={loading} 
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo Viewer Dialog - WhatsApp Style */}
        <Dialog open={photoViewerDialog} onOpenChange={setPhotoViewerDialog}>
          <DialogContent className="max-w-3xl p-0 bg-black/95 border-0">
            <div className="relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setPhotoViewerDialog(false);
                  setSelectedUser(null);
                }}
                className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
              >
                ✕
              </Button>
              
              {/* User Info Header */}
              <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/70 to-transparent p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                    {selectedUser?.photo ? (
                      <img src={selectedUser.photo} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="text-white">
                    <h3 className="font-semibold text-lg">{selectedUser?.name}</h3>
                    <p className="text-sm text-gray-300">{selectedUser?.email}</p>
                  </div>
                </div>
              </div>

              {/* Photo Container */}
              <div className="flex items-center justify-center min-h-[60vh] max-h-[80vh] p-4">
                {selectedUser?.photo ? (
                  <img 
                    src={selectedUser.photo} 
                    alt={selectedUser.name} 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                    <Camera className="w-24 h-24" />
                    <p className="text-xl">Tidak ada foto profil</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  return (
    <SidebarProvider defaultOpen={true}>
      <UserManagementContent />
    </SidebarProvider>
  );
}
