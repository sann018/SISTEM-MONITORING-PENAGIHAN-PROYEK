import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
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
      const { error } = await signIn(identifier, password);
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
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-8">
      {/* Container for Overlapping Cards */}
      <div className="relative w-full max-w-6xl h-[600px] flex items-center justify-center">
        
        {/* Left Card - Welcome Section */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[45%] bg-white rounded-3xl shadow-2xl p-12 z-10">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6 text-black">Hallo!</h1>
            <p className="text-3xl font-bold text-black mb-2">
              Welcome To Form
            </p>
            <p className="text-3xl font-bold text-black mb-8">
              Login
            </p>
            
            {/* Watermark Logo */}
            <div className="relative my-12 opacity-10">
              <p className="text-6xl font-bold text-red-600">TelkomAkses</p>
              <p className="text-sm text-gray-400">by Telkom Indonesia</p>
            </div>

            {/* Buttons */}
            <div className="space-y-4 mt-8">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-xl rounded-xl shadow-lg"
              >
                {loading ? "Loading..." : "LOGIN"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/register")}
                variant="outline"
                className="w-full border-2 border-black bg-white text-black font-bold h-14 text-xl rounded-xl hover:bg-gray-100"
              >
                REGIS
              </Button>
            </div>
          </div>
        </div>

        {/* Right Card - Login Form */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] bg-white rounded-3xl shadow-2xl p-12 z-20">
              {/* Header Icon */}
              <div className="mb-6 flex justify-center">
                <div className="bg-red-600 rounded-full p-5 w-24 h-24 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-14 h-14 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-center text-black mb-10">
                LOGIN
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier Input */}
                <div className="space-y-2">
                  <label className="flex items-center text-base font-bold text-black">
                    <Mail className="w-5 h-5 mr-3 text-red-600" />
                    Email atau Username
                  </label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="Masukkan email atau username"
                    className="border-0 border-b-2 border-gray-300 focus:border-red-600 rounded-none h-12 text-base px-2"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="flex items-center text-base font-bold text-black">
                    <svg
                      className="w-5 h-5 mr-3 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password Anda"
                    className="border-0 border-b-2 border-gray-300 focus:border-red-600 rounded-none h-12 text-base px-2"
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right -mt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/auth/forgot-password")}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg rounded-xl transition-colors duration-200 shadow-lg mt-6"
                >
                  {loading ? "Loading..." : "LOGIN"}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-black font-medium">
                      Or login with
                    </span>
                  </div>
                </div>

                {/* Google Login Button */}
                <Button
                  type="button"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg rounded-xl transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </form>
            </div>
        </div>
      </div>
  )
}
