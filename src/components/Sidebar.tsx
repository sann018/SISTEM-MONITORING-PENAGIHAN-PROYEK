import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Folder, 
  User, 
  Users, 
  Activity, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  // Menu items dengan role-based visibility
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["super_admin", "admin", "viewer"] },
    { label: "Project", icon: Folder, path: "/projects", roles: ["super_admin", "admin", "viewer"] },
    { label: "Profile", icon: User, path: "/profile", roles: ["super_admin", "admin", "viewer"] },
    { label: "Man User", icon: Users, path: "/user-management", roles: ["super_admin"] }, // Hanya super_admin
    { label: "Activity", icon: Activity, path: "/activity", roles: ["super_admin", "admin"] }, // Super Admin dan Admin
  ];

  // Filter menu berdasarkan role user
  const visibleMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || "")
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="w-28 bg-red-600 text-white flex flex-col fixed left-0 shadow-xl" style={{ top: '64px', height: 'calc(100vh - 64px)' }}>
      {/* MENU Header */}
      <div className="p-3 bg-red-600">
        <h3 className="font-bold text-sm text-center tracking-wider">MENU</h3>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1 p-2 pt-4">
        {visibleMenuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex flex-col items-center justify-center py-3 rounded-md transition-all text-xs font-bold ${
              isActive(item.path)
                ? "bg-white text-red-600 shadow-md"
                : "text-white hover:bg-red-700 hover:shadow"
            }`}
          >
            <item.icon className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t-2 border-red-700 bg-red-700">
        <button
          onClick={handleLogout}
          className="w-full bg-white text-red-600 font-bold py-2 px-2 rounded-md hover:bg-gray-100 transition flex flex-col items-center justify-center gap-1 text-xs shadow-md"
        >
          <LogOut className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-[9px] font-extrabold">LOG OUT</span>
        </button>
      </div>
    </div>
  );
}
