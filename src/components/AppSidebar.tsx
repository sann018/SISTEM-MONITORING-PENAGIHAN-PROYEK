import { Activity, FolderKanban, LayoutDashboard, LogOut, User, Users } from "lucide-react";
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

import "./AppSidebar.css";

const baseMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Project", url: "/projects", icon: FolderKanban },
  { title: "Profile", url: "/profile", icon: User },
];

const superAdminMenuItems = [
  { title: "Man User", url: "/user-management", icon: Users },
  { title: "Activity", url: "/activity", icon: Activity },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.role === "super_admin";
  const isActive = (url: string) => location.pathname === url;

  const menuItems = [...baseMenuItems, ...(isSuperAdmin ? superAdminMenuItems : [])];

  return (
    <Sidebar className="w-56 rounded-3xl overflow-hidden bg-transparent" collapsible="none">
      <SidebarContent className="bg-gradient-to-b from-red-700 to-red-600 h-full flex flex-col rounded-3xl shadow-lg overflow-hidden">
        <div className="px-4 pt-5 pb-4">
          <div className="text-white font-extrabold text-sm leading-snug">Monitoring Penagihan Proyek</div>
          <div className="text-white/80 font-semibold text-xs mt-1">Telkom Akses</div>
        </div>

        <div className="h-px bg-white/20 mx-4" />

        <div className="px-4 py-3">
          <div className="text-white font-extrabold text-sm tracking-wide">Menu</div>
        </div>

        <div className="h-px bg-white/20 mx-4" />

        <SidebarGroup className="pt-4 px-3 flex-1">
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
                      w-full font-semibold py-3 px-4 rounded-2xl
                      transition-all duration-200 ease-in-out
                      flex items-center justify-start gap-3 text-sm
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

        <div className="mt-auto p-3 border-t border-white/20">
          <Button
            onClick={signOut}
            className="w-full bg-white hover:bg-gray-50 text-red-700 font-bold py-3 px-4 rounded-2xl transition-all duration-200 ease-in-out shadow-sm flex items-center justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            <span className="truncate">Keluar</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}