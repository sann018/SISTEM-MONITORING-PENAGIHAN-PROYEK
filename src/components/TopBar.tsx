import { UserCircle } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-red-600 text-white px-8 py-4 flex items-center justify-between shadow-lg fixed top-0 left-0 right-0 z-10" style={{ height: '64px' }}>
      <h1 className="text-xl font-bold">Dashboard Monitoring Penagihan Proyek</h1>
      <div className="flex items-center gap-3">
        <UserCircle className="w-8 h-8" />
        <span className="font-semibold">USER</span>
      </div>
    </div>
  );
}
