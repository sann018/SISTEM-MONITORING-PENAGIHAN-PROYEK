import { UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = "Dashboard" }: TopBarProps) {
  const { user } = useAuth();
  
  return (
    <div className="bg-red-600 text-white px-8 py-5 flex items-center justify-between shadow-lg fixed top-0 left-0 right-0 z-10" style={{ height: '80px' }}>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-3">
          <UserCircle className="w-9 h-9" />
          <span className="font-semibold text-lg">{user?.name || 'USER'}</span>
        </div>
      </div>
    </div>
  );
}
