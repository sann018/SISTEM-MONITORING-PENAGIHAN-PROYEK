import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Activity as ActivityIcon, Clock, User, FileText } from "lucide-react";

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'login' | 'edit' | 'create' | 'delete';
}

export default function Activity() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([
    {
      id: 1,
      user: "Ihsan Al Husna",
      action: "Login",
      description: "User berhasil login ke sistem",
      timestamp: "2024-01-15 09:30:00",
      type: "login"
    },
    {
      id: 2,
      user: "Admin",
      action: "Edit Proyek",
      description: "Mengubah status proyek 'Website Company' menjadi Selesai Penuh",
      timestamp: "2024-01-15 10:15:00",
      type: "edit"
    },
    {
      id: 3,
      user: "Ihsan Al Husna",
      action: "Tambah Proyek",
      description: "Menambahkan proyek baru 'Mobile App Development'",
      timestamp: "2024-01-15 11:00:00",
      type: "create"
    },
    {
      id: 4,
      user: "Admin",
      action: "Hapus User",
      description: "Menghapus user dengan email test@example.com",
      timestamp: "2024-01-15 13:45:00",
      type: "delete"
    },
    {
      id: 5,
      user: "Ihsan Al Husna",
      action: "Update Profile",
      description: "Mengubah informasi profil",
      timestamp: "2024-01-15 14:20:00",
      type: "edit"
    },
    {
      id: 6,
      user: "Admin",
      action: "Export Excel",
      description: "Mengunduh data proyek dalam format Excel",
      timestamp: "2024-01-15 15:00:00",
      type: "create"
    },
  ]);

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'create':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'edit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <User className="w-5 h-5" />;
      case 'create':
        return <FileText className="w-5 h-5" />;
      case 'edit':
        return <ActivityIcon className="w-5 h-5" />;
      case 'delete':
        return <FileText className="w-5 h-5" />;
      default:
        return <ActivityIcon className="w-5 h-5" />;
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="bg-gray-100" style={{ minHeight: '100vh', paddingTop: '64px' }}>
      <TopBar title="Aktivitas" />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '112px' }}>
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <ActivityIcon className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-red-600">
                  Aktivitas Sistem
                </h1>
                <p className="text-gray-600 text-sm mt-1">Riwayat aktivitas pengguna dan sistem</p>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4 mt-8">
              {activities.map((activity, index) => {
                const { date, time } = formatDateTime(activity.timestamp);
                return (
                  <div
                    key={activity.id}
                    className={`flex gap-4 p-4 rounded-lg border-2 hover:shadow-md transition-all ${getActivityColor(activity.type)}`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(activity.type)} border-2`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{activity.action}</h3>
                          <p className="text-sm font-semibold opacity-80">oleh {activity.user}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <Clock className="w-4 h-4" />
                            {time}
                          </div>
                          <p className="text-xs opacity-70 mt-1">{date}</p>
                        </div>
                      </div>
                      <p className="text-sm opacity-90">{activity.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-md transition-all">
                Muat Lebih Banyak
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
