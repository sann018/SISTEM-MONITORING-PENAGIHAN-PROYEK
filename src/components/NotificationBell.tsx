import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function NotificationBell() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const canSeeNotifications = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchUnreadCount = useCallback(async () => {
    if (!token || !canSeeNotifications) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifikasi?status=terkirim&per_page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token, canSeeNotifications]);

  useEffect(() => {
    if (!canSeeNotifications) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchUnreadCount, canSeeNotifications]);

  if (!canSeeNotifications) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Icon Button - Click to navigate to full notifications page */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 hover:bg-red-700 rounded-lg transition-colors group"
        title="Lihat semua notifikasi"
      >
        <Bell className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
