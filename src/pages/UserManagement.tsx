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
  Menu
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
  email: string;
  nik?: string;
  role: string;
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Dialog states
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states for Add User
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    nik: "",
    password: "",
    password_confirmation: "",
    role: "viewer"
  });
  
  // Form states for Edit User
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    nik: "",
  });
  
  // Form states for Reset Password
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    password_confirmation: ""
  });

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
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat data users');
      }

      setUsers(data.data || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add User
  const handleAddUser = async () => {
    if (!token) return;

    if (newUserData.password !== newUserData.password_confirmation) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (newUserData.password.length < 8) {
      toast.error("Password minimal 8 karakter");
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
          email: newUserData.email,
          nik: newUserData.nik,
          password: newUserData.password,
          password_confirmation: newUserData.password_confirmation,
          role: newUserData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambah user');
      }

      toast.success("User berhasil ditambahkan");
      setAddUserDialog(false);
      setNewUserData({
        name: "",
        email: "",
        nik: "",
        password: "",
        password_confirmation: "",
        role: "viewer"
      });
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

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUserData),
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

    if (resetPasswordData.password.length < 8) {
      toast.error("Password minimal 8 karakter");
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

    setLoading(true);
    try {
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
      // Delete each selected user
      const deletePromises = selectedUsers.map(userId =>
        fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      );

      await Promise.all(deletePromises);

      toast.success(`${selectedUsers.length} user berhasil dihapus`);
      setSelectedUsers([]);
      setSelectAll(false);
      setDeleteDialog(false);
      fetchUsers();
    } catch (error: any) {
      toast.error("Gagal menghapus user");
    } finally {
      setLoading(false);
    }
  };

  // Handle Select All
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle Select Single
  const handleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl border-4 border-red-600 p-4 sm:p-6 lg:p-8">
                {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-red-600 mb-1">
                Manajemen User
              </h1>
              <p className="text-lg font-semibold text-red-600">Admin dan User</p>
            </div>

            {/* Search, Filter, and Action Buttons */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
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
              <select className="h-10 px-4 border-2 border-gray-300 rounded-md bg-white text-gray-700 font-medium focus:border-red-500 min-w-[200px]">
                <option>Semua Pengguna</option>
                <option>Super Admin</option>
                <option>Admin</option>
                <option>Viewer</option>
              </select>

              {/* Delete Multiple Button */}
              {selectedUsers.length > 0 && (
                <Button 
                  onClick={() => setDeleteDialog(true)}
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

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-pink-100 border-b-2 border-pink-200">
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
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
                      NIK
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-red-600">
                      Terakhir Akses
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
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="w-10 h-10 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {user.photo ? (
                              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.nik || '-'}
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
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}
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
                                  email: user.email,
                                  nik: user.nik || "",
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
                                    setSelectedUser(user);
                                    setDeleteDialog(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 transition"
                                  disabled={user.id === currentUser?.id}
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
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data pengguna
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

        {/* Add User Dialog */}
        <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi user yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                <Input
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  placeholder="John Doe"
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
                <label className="block text-sm font-medium mb-2">NIK (Opsional)</label>
                <Input
                  value={newUserData.nik}
                  onChange={(e) => setNewUserData({...newUserData, nik: e.target.value})}
                  placeholder="1234567890"
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
                <Input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Konfirmasi Password</label>
                <Input
                  type="password"
                  value={newUserData.password_confirmation}
                  onChange={(e) => setNewUserData({...newUserData, password_confirmation: e.target.value})}
                  placeholder="Ulangi password"
                />
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">NIK</label>
                <Input
                  value={editUserData.nik}
                  onChange={(e) => setEditUserData({...editUserData, nik: e.target.value})}
                  className="h-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500"
                  placeholder="Nomor Induk Karyawan (opsional)"
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
                {selectedUsers.length > 0 
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
                onClick={selectedUsers.length > 0 ? handleDeleteMultiple : handleDeleteUser} 
                disabled={loading} 
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </DialogFooter>
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
