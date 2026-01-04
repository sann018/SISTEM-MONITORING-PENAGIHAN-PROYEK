import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Mail } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [superAdminPhone, setSuperAdminPhone] = useState<string | null>(null);
  const { signIn, user } = useAuth();

  const isValidUsername = (value: string) => {
    // 4-30 chars, alnum + . _ -, no leading/trailing symbol, no double symbols
    return /^(?=.{4,30}$)(?![._-])(?!.*[._-]{2})[a-zA-Z0-9._-]+(?<![._-])$/.test(value);
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      if (!trimmedIdentifier) {
        toast.error("Email / Username wajib diisi");
        setLoading(false);
        return;
      }
      if (trimmedIdentifier.includes("@")) {
        if (!isValidEmail(trimmedIdentifier)) {
          toast.error("Format email tidak valid");
          setLoading(false);
          return;
        }
      } else {
        if (!isValidUsername(trimmedIdentifier)) {
          toast.error("Username tidak valid (4-30 karakter, huruf/angka/._-, tidak diawali/diakhiri simbol, tidak ada simbol berurutan)");
          setLoading(false);
          return;
        }
      }
      if (!password) {
        toast.error("Password wajib diisi");
        setLoading(false);
        return;
      }

      console.log("[LOGIN] Starting sign in...");
      const { error } = await signIn(identifier, password);
      
      if (error) {
        console.error("[LOGIN] Sign in error:", error);
        toast.error(typeof error === "string" ? error : error.message || "Login failed");
        setLoading(false);
      } else {
        console.log("[LOGIN] Sign in successful, navigating...");
        toast.success("Login berhasil! Mengarahkan ke dashboard...");
        // Don't set loading to false - let navigation happen
        // setLoading will be reset when component unmounts
      }
    } catch (error: any) {
      console.error("[LOGIN] Exception:", error);
      toast.error(error.message || "Terjadi kesalahan");
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSuperAdminContact = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/super-admin-contact`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const phone = typeof payload?.data?.nomor_hp === 'string' ? payload.data.nomor_hp : null;
        setSuperAdminPhone(phone ? phone.trim() : null);
      } catch {
        // silent fallback
      }
    };

    fetchSuperAdminContact();
  }, []);

  const telegramHref = useMemo(() => {
    if (!superAdminPhone) return null;
    const digits = superAdminPhone.replace(/\D/g, '');
    if (!digits) return null;

    // Normalisasi ke format Indonesia (62...) bila input diawali 0.
    const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    return `https://t.me/+${normalized}`;
  }, [superAdminPhone]);

  // IMPORTANT: Keep this redirect AFTER hooks to avoid
  // "Rendered fewer hooks than expected" errors.
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-8 overflow-hidden">
      <style>{`
        @keyframes helloLetterLoop {
          0%, 12% {
            opacity: 0;
            transform: translateY(18px) rotateX(65deg);
            filter: blur(10px);
          }
          22% {
            opacity: 1;
            transform: translateY(-2px) rotateX(0deg);
            filter: blur(0);
          }
          70% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-6px) rotateX(0deg);
            filter: blur(6px);
          }
        }

        @keyframes helloUnderlineLoop {
          0%, 18% { transform: scaleX(0); opacity: 0; }
          30% { transform: scaleX(1); opacity: 1; }
          70% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0); opacity: 0; }
        }

        @keyframes helloShine {
          0% { transform: translateX(-120%); opacity: 0; }
          30% { opacity: 0.25; }
          60% { opacity: 0.15; }
          100% { transform: translateX(120%); opacity: 0; }
        }

        @keyframes tickerMove {
          from { transform: translateX(100%); }
          to { transform: translateX(-100%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hello-letter, .hello-underline, .hello-shine, .hello-ticker {
            animation: none !important;
          }
        }
      `}</style>

      {/* Image background (place file in /public/login-bg.jpg) */}
      <div
        className="absolute inset-0 pointer-events-none bg-center bg-cover"
        style={{ backgroundImage: "url('/BG-merah-TA.jpg')" }}
      />
      {/* No tint overlay: show background image as-is */}

      {/* Container for Overlapping Cards */}
      <div className="relative w-full max-w-6xl h-[600px] flex items-center justify-center">
        
        {/* Left Card - Welcome Section */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[45%] bg-white rounded-3xl shadow-2xl p-12 z-10">
          <div className="text-center">
            <div className="relative inline-block mb-6" aria-label="Halo!">
              <h1 className="text-6xl font-bold text-black leading-none">
                {Array.from("Halo!").map((ch, i) => (
                  <span
                    key={`${ch}-${i}`}
                    className="hello-letter inline-block"
                    style={{
                      animation: `helloLetterLoop 3200ms cubic-bezier(0.2, 0.9, 0.2, 1) ${80 * i}ms infinite`,
                      transformOrigin: '50% 100%',
                    }}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </h1>

              {/* underline */}
              <div
                className="hello-underline mx-auto mt-3 h-1 w-40 bg-red-600 rounded-full origin-left"
                style={{ animation: 'helloUnderlineLoop 3200ms ease-in-out 420ms infinite' }}
              />

              {/* subtle shine */}
              <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-6 overflow-hidden">
                <div
                  className="hello-shine h-full w-1/2 bg-white/40 blur-md"
                  style={{ animation: 'helloShine 2.4s ease-in-out 1.2s infinite' }}
                />
              </div>
            </div>
            <p className="text-3xl font-bold text-black mb-2">
              Selamat Datang
            </p>
            <p className="text-3xl font-bold text-black mb-8">
              Silakan Masuk
            </p>
            
            {/* Watermark Logo */}
            <div className="relative my-12 opacity-10">
              <p className="text-6xl font-bold text-red-600">TelkomAkses</p>
              <p className="text-sm text-gray-400">by Telkom Indonesia</p>
            </div>

            {/* Note about account creation */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-4">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-bold text-gray-900">Catatan</span>
                  <span className="text-gray-400">:</span> Untuk membuat akun baru, hubungi Super Admin
                </p>

                {/* <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Telegram</span>
                  <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                    {superAdminPhone || '-'}
                  </span>
                </div> */}

                {telegramHref ? (
                  <div className="mt-4 flex justify-center">
                    <a
                      href={telegramHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-red-600 text-white font-bold text-sm shadow hover:bg-red-700 transition-colors"
                    >
                      Buka Telegram
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Kontak Telegram belum tersedia.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card - Login Form */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] h-[650px] bg-white rounded-3xl shadow-2xl p-12 z-20 flex flex-col">
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
                MASUK
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div className="flex flex-col gap-5">
                  {/* Identifier Input */}
                  <div className="space-y-2">
                    <label className="flex items-center text-base font-bold text-black">
                      <Mail className="w-5 h-5 mr-3 text-red-600" />
                      Email / Nama Pengguna
                    </label>
                    <Input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
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

                  <div className="text-right -mt-1">
                    <p className="text-sm font-semibold text-gray-600">
                      {/* Lupa kata sandi? Hubungi Super Admin{superAdminPhone ? ` (${superAdminPhone})` : ''}. */}
                      Lupa kata sandi? Hubungi Super Admin.
                    </p>
                    {telegramHref ? (
                      <div className="mt-1">
                        <a
                          href={telegramHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-red-700 hover:text-red-800 underline"
                        >
                          Hubungi lewat Telegram
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Login Button */}
                <div className="mt-auto pt-8">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg rounded-xl transition-colors duration-200 shadow-lg"
                  >
                    {loading ? "Memuat..." : "MASUK"}
                  </Button>
                </div>
              </form>
            </div>
        </div>
      </div>
  )
}
