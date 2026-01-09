import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const { user } = useAuth();
  const [photoError, setPhotoError] = useState(false);

  const backendBaseUrl = useMemo(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000/api";
    return apiBase.replace(/\/?api\/?$/, "");
  }, []);

  const photoSrc = useMemo(() => {
    const photo = user?.photo;
    if (!photo || photoError) return null;
    if (/^https?:\/\//i.test(photo)) return photo;
    if (photo.startsWith("/")) return `${backendBaseUrl}${photo}`;
    return `${backendBaseUrl}/${photo}`;
  }, [backendBaseUrl, photoError, user?.photo]);

  // Generate initials from name
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role display name
  const getRoleDisplay = (role: string | undefined) => {
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Admin";
    if (role === "viewer") return "Viewer";
    return "User";
  };

  return (
    <div className="relative bg-gradient-to-r from-red-700 to-red-600 shadow-md overflow-hidden mb-4 z-50 h-[72px]">
      <div className="relative z-10 flex h-full items-center justify-between px-6">
        {/* Page Title - Left Aligned with proper spacing */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <SidebarTrigger className="lg:hidden" />
          <span className="text-white/90 font-semibold text-sm md:text-base whitespace-nowrap">
           <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-md truncate">
            SIPENTA
          </h1>
          </span>
          <div className="h-8 w-1.5 bg-white/90 rounded-full" />
          <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-md truncate">
            {title}
          </h2>
        </div>

        {/* User Info - Right Aligned with proper spacing */}
        <div className="flex items-center gap-3 pl-3 pr-4 py-2.5">
          {/* Notifications - Left of user info */}
          <NotificationBell />

          {/* Profile Photo or Initials */}
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={user?.name || "User"}
                  className="h-full w-full object-cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {getInitials(user?.name)}
                </span>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
          </div>

          {/* User Details */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-white font-bold text-sm leading-tight truncate">
              {user?.name || "User"}
            </span>
            <span className="text-red-100 text-xs font-medium leading-tight">
              {getRoleDisplay(user?.role)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
