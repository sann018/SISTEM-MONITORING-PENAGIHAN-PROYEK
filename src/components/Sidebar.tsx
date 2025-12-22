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
    <div className="w-28 bg-red-600 text-white flex flex-col fixed left-0 shadow-xl" style={{ top: '80px', height: 'calc(100vh - 80px)' }}>
      {/* MENU Header */}
      <div className="px-3 py-4 bg-red-700">
        <h3 className="font-bold text-base text-center tracking-wider">MENU</h3>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2 px-3 py-4">
        {visibleMenuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex flex-col items-center justify-center py-4 rounded-lg transition-all duration-300 ease-in-out text-xs font-bold transform ${
              isActive(item.path)
                ? "bg-white text-red-600 shadow-lg scale-105"
                : "text-white hover:bg-red-700 hover:shadow-md hover:scale-102"
            }`}
          >
            <item.icon className="w-7 h-7 mb-1.5 transition-transform duration-300" strokeWidth={2.5} />
            <span className="text-xs font-semibold transition-all duration-300">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-3 border-t-2 border-red-700 bg-red-700">
        <button
          onClick={handleLogout}
          className="w-full bg-white text-red-600 font-bold py-3 px-2 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-lg flex flex-col items-center justify-center gap-1 text-xs shadow-md"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-xs font-bold">Keluar</span>
        </button>
      </div>
    </div>
  );
}
