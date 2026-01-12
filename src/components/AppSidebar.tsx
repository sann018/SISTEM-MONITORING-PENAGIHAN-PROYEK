import { Activity, FolderKanban, LayoutDashboard, LogOut, User, Users, Bell, History, Database } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

const baseMenuItems = [
  { title: "Dasbor", url: "/dashboard", icon: LayoutDashboard },
  { title: "Proyek", url: "/projects", icon: FolderKanban },
  { title: "Profil", url: "/profile", icon: User },
];

const adminMenuItems = [
  { title: "Notifikasi", url: "/notifications", icon: Bell },
];

const superAdminMenuItems = [
  { title: "Man Pengguna", url: "/user-management", icon: Users },
  { title: "Aktivitas Sistem", url: "/activity", icon: Activity },
  { title: "Log Aktivitas Pengguna", url: "/log-activity", icon: History },
  { title: "Pembersihan Data", url: "/data-cleanup", icon: Database },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.role === "super_admin";
  const isAdminOrSuperAdmin = user?.role === "admin" || isSuperAdmin;
  const isActive = (url: string) => location.pathname === url;

  const menuItems = [
    ...baseMenuItems,
    ...(isAdminOrSuperAdmin ? adminMenuItems : []),
    ...(isSuperAdmin ? superAdminMenuItems : []),
  ];

  return (
    <Sidebar
      className="bg-transparent top-[88px] left-4 bottom-auto h-[calc(100svh-104px)] [&>[data-sidebar=sidebar]]:bg-transparent [&>[data-sidebar=sidebar]]:shadow-none"
      collapsible="offcanvas"
    >
      <SidebarContent className="bg-gradient-to-b from-red-700 to-red-600 h-full flex flex-col rounded-2xl shadow-lg overflow-hidden">
        <div className="px-2 pt-4 pb-4">
          <div className="text-white font-extrabold text-xl leading-snug">Sistem Informasi Penagihan</div>
          <div className="text-white/80 font-semibold text-sm mt-1">Telkom Akses</div>
        </div>

        <div className="h-px bg-white/20 mx-4" />

        <div className="px-4 py-3">
          <div className="text-white font-extrabold text-xl tracking-wide">Menu</div>
        </div>

        <div className="h-px bg-white/20 mx-4" />

        <SidebarGroup className="pt-4 px-3 flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-hidden">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`
                      ${isActive(item.url)
                        ? "bg-white text-red-700 shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
                        : "bg-transparent text-white hover:bg-white/10"
                      }
                      w-full font-semibold py-3 px-4 rounded-2x2
                      transition-all duration-200 ease-in-out
                      flex items-center justify-start gap-3 text-base
                    `}
                  >
                    <Link to={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 border-t border-white/20 sticky bottom-20 sm:bottom-4 md:bottom-0 z-10">
          <Button
            onClick={signOut}
            className="w-full bg-white hover:bg-gray-50 text-red-700 font-bold py-3 px-4 rounded-2x2 transition-all duration-200 ease-in-out shadow-sm flex items-center justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            <span className="truncate">Keluar</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}