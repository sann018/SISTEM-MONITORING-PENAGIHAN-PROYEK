import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fullName.trim()) {
        toast.error("Masukkan nama lengkap Anda");
        setLoading(false);
        return;
      }
      if (!username.trim()) {
        toast.error("Masukkan username Anda");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, username);
      if (error) {
        toast.error(typeof error === "string" ? error : error.message || "Registrasi gagal");
      } else {
        toast.success("Akun berhasil dibuat!");
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
              Register
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
                {loading ? "Loading..." : "REGISTER"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full border-2 border-black bg-white text-black font-bold h-14 text-xl rounded-xl hover:bg-gray-100"
              >
                LOGIN
              </Button>
            </div>
          </div>
        </div>

        {/* Right Card - Register Form */}
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
                  REGISTER
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Fullname Input */}
                  <div className="space-y-2">
                    <label className="flex items-center text-base font-bold text-black">
                      <svg
                        className="w-5 h-5 mr-3 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      Fullname
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Masukkan nama lengkap Anda"
                      className="border-0 border-b-2 border-gray-300 focus:border-red-600 rounded-none h-12 text-base px-2"
                    />
                  </div>

                  {/* Username Input */}
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
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Masukkan username"
                      className="border-0 border-b-2 border-gray-300 focus:border-red-600 rounded-none h-12 text-base px-2"
                      minLength={3}
                    />
                  </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="flex items-center text-base font-bold text-black">
                    <Mail className="w-5 h-5 mr-3 text-red-600" />
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Masukkan email Anda"
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
                    minLength={6}
                  />
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg rounded-xl transition-colors duration-200 shadow-lg mt-6"
                >
                  {loading ? "Loading..." : "REGISTER"}
                </Button>
              </form>
            </div>
        </div>
      </div>
  );
}
