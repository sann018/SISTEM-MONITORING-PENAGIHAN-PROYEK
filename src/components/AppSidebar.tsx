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
    <Sidebar className={`${isCollapsed ? "w-14" : "w-64"} z-50 bg-gradient-to-b from-red-600 to-red-700`} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-red-600 to-white/10 h-full flex flex-col">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-3">
          <a
            href="/dashboard"
            className="p-2 rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0"
          >
            <img
              src="/Logo TA.png"
              alt="Logo"
              className="h-10 w-10 object-contain rounded-lg"
            />
          </a>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <h2 className="font-bold text-white text-sm leading-tight">Telkom Akses</h2>
              <p className="font-semibold text-red-100 text-xs leading-tight">Divisi Konstruksi</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <SidebarGroup className="pt-8 px-3">
          <SidebarGroupLabel className="font-bold text-base text-white mb-4 px-0">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`
                      sidebar-menu-btn
                      relative
                      transition-all duration-300 ease-in-out
                      rounded-lg
                      group
                      px-4 py-3
                      ${
                        isActive(item.url)
                          ? "bg-white text-red-600 font-bold shadow-md hover:shadow-lg"
                          : "text-white bg-red-600 hover:bg-red-700 active:bg-red-800"
                      }
                    `}
                  >
                    <a href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon 
                        className={`
                          h-5 w-5 
                          transition-all duration-300 flex-shrink-0
                          ${isActive(item.url) 
                            ? "text-red-600 scale-110" 
                            : "text-white group-hover:scale-110 group-hover:text-red-100"
                          }
                        `} 
                      />
                      <span 
                        className={`
                          transition-all duration-300 font-semibold
                          ${isActive(item.url) 
                            ? "text-red-600 font-bold" 
                            : "text-white group-hover:text-red-50"
                          }
                        `}
                      >
                        {item.title}
                      </span>
                      
                      {/* Active indicator dot */}
                      {isActive(item.url) && (
                        <div className="absolute right-4 h-2 w-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t-2 border-white  border-opacity-30 px-3">
          <Button
            onClick={signOut}
            className="sidebar-logout-btn w-full bg-white hover:bg-gray-50 text-red-600 font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md active:scale-95 flex items-center justify-center gap-2 group"
          >
            <LogOut className="h-5 w-5 transition-all duration-300 group-hover:rotate-12" />
            <span className={`${isCollapsed ? "hidden" : ""} group-hover:font-extrabold`}>
              Logout
            </span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}