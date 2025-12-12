import { LogOut, LayoutDashboard, FolderKanban, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar className={`${isCollapsed ? "w-80 md:w-96" : "w-60 md:w-64"} z-50 bg-gradient-to-b from-red-600 to-red-700`} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-red-600 to-white/10 h-full flex flex-col">
        {/* Logo Section - Responsive: Rata Kiri */}
        <div className={`flex items-start ${isCollapsed ? "gap-0 px-2" : "gap-2 md:gap-3 px-3 md:px-4"} py-3 md:py-4 justify-center ${isCollapsed ? "" : ""}`}>
          <a
            href="/dashboard"
            className={`${isCollapsed ? "p-1 md:p-1.5" : "p-1.5 md:p-2"} rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center flex-shrink-0`}
          >
            <img
              src="/LOGO TELKOM AKSES.png"
              alt="Logo Telkom Akses"
              className={`${
                isCollapsed 
                  ? "h-6 w-6 sm:h-7 sm:w-7" 
                  : "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
              } object-contain transition-all duration-300`}
            />
          </a>

          {!isCollapsed && (
            <div className="flex flex-col justify-center min-w-0 pt-1">
              <h2 className="font-bold text-white text-xs sm:text-sm md:text-base lg:text-lg leading-tight truncate">
                Telkom Akses
              </h2>
              <p className="font-semibold text-red-100 text-[10px] sm:text-xs md:text-sm leading-tight truncate">
                Divisi Konstruksi
              </p>
            </div>
          )}
        </div>

        {/* Menu Items - Responsive */}
        <SidebarGroup className="pt-4 md:pt-6 lg:pt-8 px-2 md:px-3">
          <SidebarGroupLabel className="font-bold text-sm md:text-base lg:text-lg text-red mb-3 md:mb-4 px-0">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            <SidebarMenu className="space-y-1.5 md:space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`
                      ${isActive(item.url) 
                        ? 'bg-red-600 text-white shadow-lg' 
                        : 'bg-white text-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg'
                      }
                      w-full font-bold py-2.5 md:py-3 px-3 md:px-4
                      rounded-lg
                      transition-all duration-300 ease-in-out
                      hover:-translate-y-1
                      active:translate-y-0 active:shadow-md active:scale-95
                      flex items-center justify-start gap-2 md:gap-3
                      group
                      text-xs md:text-sm lg:text-base
                    `}
                  >
                    <a href={item.url} className="flex items-center gap-2 md:gap-3 w-full">
                      <item.icon 
                        className="h-4 w-4 md:h-5 md:w-5 transition-all duration-300 group-hover:rotate-12 flex-shrink-0" 
                      />
                      <span className="group-hover:font-extrabold truncate">
                        {item.title}
                      </span>
                      
                      {/* Active indicator dot */}
                      {isActive(item.url) && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button - Responsive */}
        <div className="mt-auto p-3 md:p-4 border-t-2 border-white border-opacity-30 px-2 md:px-3">
          <Button
            onClick={signOut}
            className="sidebar-logout-btn w-full bg-white hover:bg-gray-50 text-red-600 font-bold py-2.5 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md active:scale-95 flex items-center justify-start gap-2 group text-xs md:text-sm lg:text-base"
          >
            <LogOut className="h-4 w-4 md:h-5 md:w-5 transition-all duration-300 group-hover:rotate-12" />
            <span className={`${isCollapsed ? "hidden" : ""} group-hover:font-extrabold truncate`}>
              Logout
            </span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}