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
      const { error } = await signUp(email, password, fullName);
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
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      {/* Full Frame Red Border */}
      <div className="w-full h-full min-h-[calc(100vh-4rem)] border-[12px] border-red-600 rounded-3xl p-12 flex items-center justify-center">
        {/* Main Container */}
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left Side - Welcome Section */}
            <div className="lg:col-span-2 text-center lg:text-left order-2 lg:order-1">
              <div className="mb-12">
                <h1 className="text-6xl lg:text-7xl font-bold mb-6 text-[#1a2332]">Hallo!</h1>
                <p className="text-3xl lg:text-4xl font-bold text-[#1a2332] mb-2">
                  Welcome To Form
                </p>
                <p className="text-3xl lg:text-4xl font-bold text-[#1a2332]">
                  Register
                </p>
              </div>
              <div className="flex justify-center lg:justify-start mt-16">
                <div className="text-left">
                  <p className="text-lg font-semibold text-[#1a2332]">Telkom Indonesia</p>
                  <p className="text-sm text-gray-600">Sistem Penagihan Proyek</p>
                </div>
              </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="lg:col-span-3 flex items-center justify-center order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-10 w-full border-[6px] border-red-600">
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
                  Create Account
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Fullname Input */}
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg rounded-xl transition-colors duration-200 shadow-lg mt-6"
                >
                  {loading ? "Loading..." : "REGISTER"}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-600 font-medium">
                      atau
                    </span>
                  </div>
                </div>

                {/* Google Register Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-red-600 bg-white text-red-600 font-bold h-14 text-lg rounded-xl hover:bg-red-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                    <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                    <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                    <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                  </svg>
                Google
              </Button>

                {/* Login Link */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-700 mb-3 text-sm">Sudah punya akun?</p>
                  <Button
                    type="button"
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="w-full border-2 border-red-600 bg-white text-red-600 font-bold h-14 text-lg rounded-xl hover:bg-red-50 transition-colors duration-200"
                  >
                    LOGIN
                  </Button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
