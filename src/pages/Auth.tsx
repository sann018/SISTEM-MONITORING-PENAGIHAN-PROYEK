import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(typeof error === "string" ? error : error.message || "Login failed");
      } else {
        toast.success("Login berhasil!");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 border-[12px] border-red-600 rounded-3xl">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 text-center lg:text-left">
            <div className="mb-12">
              <h1 className="text-6xl lg:text-7xl font-bold mb-6 text-[#1a2332]">Hallo!</h1>
              <p className="text-3xl lg:text-4xl font-semibold text-[#1a2332]">Welcome To</p>
              <p className="text-3xl lg:text-4xl font-semibold text-[#1a2332] mt-2">Login Form</p>
            </div>
            <div className="flex justify-center lg:justify-start">
              <div className="text-left font-medium">
                <p className="text-xl text-[#1a2332]">Telkom Indonesia</p>
                <p className="text-base text-gray-600">Sistem Penagihan Proyek</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 w-full border-[6px] border-red-600">
              <div className="mb-8 flex justify-center">
                <div className="bg-red-600 rounded-full p-6 w-24 h-24 flex items-center justify-center shadow-lg">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center text-black mb-10">LOGIN</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center text-base font-bold text-black mb-2">
                    <Mail className="w-5 h-5 mr-3 text-red-600" />
                    Email
                  </label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Masukkan email Anda" className="border-0 border-b-2 border-gray-300 focus:border-red-600 rounded-none h-12 text-base px-2" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-base font-bold text-black mb-2">
                    <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Masukkan password Anda" className="border-0 border-b-2 border-gray-300 focus:border-red-600 rounded-none h-12 text-base px-2" minLength={8} />
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => navigate("/auth/forgot-password")} className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline">
                    Lupa Password?
                  </button>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg rounded-xl transition-colors duration-200 shadow-lg mt-6">
                  {loading ? "Loading..." : "LOGIN"}
                </Button>
              </form>
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Catatan:</span> Untuk membuat akun baru, hubungi Super Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
