import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  Trash2
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState("");

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

  const handleResetPassword = async () => {
    if (!selectedUser || !token) return;

    if (newPassword !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
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
        body: JSON.stringify({
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal reset password');
      }

      toast.success(data.message || `Password untuk ${selectedUser.name} berhasil direset`);
      setResetPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !token || !newRole) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah role');
      }

      toast.success(data.message || `Role untuk ${selectedUser.name} berhasil diubah`);
      setChangeRoleDialog(false);
      setNewRole("");
      setSelectedUser(null);
      
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah role");
    } finally {
      setLoading(false);
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

  return (
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <TopBar />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '112px' }}>
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-red-600 mb-1">
                Manajemen user
              </h1>
              <p className="text-lg font-semibold text-red-600">User dan Admin</p>
            </div>

            {/* Search and Dropdown and Add Button */}
            <div className="mb-6 flex gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 border-2 border-gray-300 rounded-md px-4 focus:border-red-500"
                />
              </div>

              {/* Dropdown Filter */}
              <select className="h-10 px-4 border-2 border-gray-300 rounded-md bg-white text-gray-700 font-medium focus:border-red-500 min-w-[200px]">
                <option>Semua Pengguna</option>
                <option>Admin</option>
                <option>User</option>
              </select>

              {/* Add Button */}
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-5 h-5" />
                Tambah Akun
              </Button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-pink-100 border-b-2 border-pink-200">
                    <th className="px-4 py-3 text-center font-bold text-red-600">
                      All
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
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          <span className="text-gray-600">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-pink-50'}`}>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="w-8 h-8 bg-gray-200 rounded border-2 border-gray-400 flex items-center justify-center mx-auto">
                            <Users className="w-5 h-5 text-gray-500" />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                        <td className="px-4 py-3 text-gray-700">{user.id}</td>
                        <td className="px-4 py-3 text-gray-700">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-semibold">
                            {user.role === 'super_admin' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-3">
                            <button className="text-blue-600 hover:text-blue-800 transition">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button className="text-orange-500 hover:text-orange-700 transition">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button className="text-red-600 hover:text-red-800 transition">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                        Tidak ada data pengguna
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
