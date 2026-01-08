import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { Navigate } from "react-router-dom";
import { Mail, Eye, EyeOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [superAdminPhone, setSuperAdminPhone] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user } = useAuth();

  // ✅ Validasi Username: 4-30 karakter
  const isValidUsername = (value: string) => {
    return /^(?=.{4,30}$)(?![._-])(?!.*[._-]{2})[a-zA-Z0-9._-]+(?<![._-])$/.test(value);
  };

  // ✅ Validasi Email Format
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // ✅ Validasi Email Domain: Hanya @telkom.co.id atau @gmail.com
  const isValidEmailDomain = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    return trimmedEmail.endsWith('@telkom.co.id') || trimmedEmail.endsWith('@gmail.com');
  };

  // ✅ Validasi Password: 8-50 karakter dengan kompleksitas
  const isValidPassword = (password: string) => {
    if (password.length < 8) return { valid: false, message: "Password minimal 8 karakter" };
    if (password.length > 50) return { valid: false, message: "Password maksimal 50 karakter" };
    if (!/[a-z]/.test(password)) return { valid: false, message: "Password harus mengandung huruf kecil" };
    if (!/[A-Z]/.test(password)) return { valid: false, message: "Password harus mengandung huruf besar" };
    if (!/\d/.test(password)) return { valid: false, message: "Password harus mengandung angka" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: "Password harus mengandung simbol" };
    return { valid: true, message: "" };
  };

  // ✅ Real-time validation untuk identifier
  const validateIdentifier = (value: string) => {
    if (!value) {
      setIdentifierError("");
      return;
    }

    const trimmedValue = value.trim();
    
    // Cek jika ada @@ (double @)
    if ((trimmedValue.match(/@/g) || []).length > 1) {
      setIdentifierError("⚠️ Email tidak boleh memiliki lebih dari satu simbol @");
      return;
    }

    // Cek jika mengandung spasi
    if (/\s/.test(trimmedValue)) {
      setIdentifierError("⚠️ Email/Username tidak boleh mengandung spasi");
      return;
    }

    // Jika ada @, validasi sebagai email
    if (trimmedValue.includes("@")) {
      if (!isValidEmail(trimmedValue)) {
        setIdentifierError("⚠️ Format email tidak valid (contoh: nama@telkom.co.id)");
        return;
      }
      if (!isValidEmailDomain(trimmedValue)) {
        setIdentifierError("⚠️ Email hanya boleh @telkom.co.id atau @gmail.com");
        return;
      }
    } else {
      // Validasi sebagai username
      if (trimmedValue.length < 4) {
        setIdentifierError("⚠️ Username minimal 4 karakter");
        return;
      }
      if (trimmedValue.length > 30) {
        setIdentifierError("⚠️ Username maksimal 30 karakter");
        return;
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(trimmedValue)) {
        setIdentifierError("⚠️ Username hanya boleh alphanumeric, . _ -");
        return;
      }
    }

    setIdentifierError("");
  };

  // ✅ Real-time validation untuk password
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("");
      return;
    }

    const validation = isValidPassword(value);
    if (!validation.valid) {
      setPasswordError(`⚠️ ${validation.message}`);
    } else {
      setPasswordError("");
    }
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
      
      // ✅ Validasi Email atau Username
      if (trimmedIdentifier.includes("@")) {
        // Cek format email
        if (!isValidEmail(trimmedIdentifier)) {
          toast.error("Format email tidak valid!");
          setLoading(false);
          return;
        }
        // ✅ Cek domain email (hanya @telkom.co.id atau @gmail.com)
        if (!isValidEmailDomain(trimmedIdentifier)) {
          toast.error("Email hanya boleh menggunakan domain @telkom.co.id atau @gmail.com!", {
            duration: 5000,
            description: "Silakan gunakan email dengan domain yang diizinkan"
          });
          setLoading(false);
          return;
        }
      } else {
        // Validasi username
        if (!isValidUsername(trimmedIdentifier)) {
          toast.error("Username tidak valid! Harus 4-30 karakter, alphanumeric + . _ -");
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
        toast.error(typeof error === "string" ? error : error.message || "Login gagal");
        setLoading(false);
      } else {
        console.log("[LOGIN] Sign in successful, navigating...");
        toast.success("Login berhasil! Mengarahkan ke dashboard...");
        // Don't set loading to false - let navigation happen
        // setLoading will be reset when component unmounts
      }
    } catch (error: unknown) {
      console.error("[LOGIN] Exception:", error);
      toast.error(getErrorMessage(error, "Terjadi kesalahan"));
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
      {/* Soft red gradient overlay (matches sample) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -left-28 h-[520px] w-[520px] rounded-full bg-red-700/70 blur-3xl" />
        <div className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-red-600/70 blur-3xl" />
        <div className="absolute bottom-[-160px] left-1/3 h-[620px] w-[620px] rounded-full bg-red-500/40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/35 via-red-600/10 to-red-500/35" />
      </div>

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
                className="hello-underline mx-auto mt-3 h-1 w-40 rounded-full origin-left bg-gradient-to-r from-red-800 via-red-600 to-red-500"
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
                      className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-red-500 text-white font-bold text-sm shadow transition-all hover:from-red-900 hover:via-red-700 hover:to-red-600"
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
                <div className="bg-gradient-to-br from-red-900 via-red-600 to-red-500 rounded-full p-5 w-24 h-24 flex items-center justify-center shadow-lg">
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
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        validateIdentifier(e.target.value);
                      }}
                      required
                      placeholder="Email (@telkom.co.id atau @gmail.com) atau username"
                      className={`border-0 border-b-2 ${identifierError ? 'border-red-500' : 'border-gray-300'} focus:border-red-600 rounded-none h-12 text-base px-2`}
                    />
                    {identifierError && (
                      <p className="text-sm text-red-600 font-medium mt-1 animate-pulse">{identifierError}</p>
                    )}
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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          validatePassword(e.target.value);
                        }}
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        placeholder="Masukkan password Anda"
                        className={`border-0 border-b-2 pr-12 ${passwordError ? 'border-red-500' : 'border-gray-300'} focus:border-red-600 rounded-none h-12 text-base px-2`}
                        style={{ backgroundImage: 'none' } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-600 font-medium mt-1 animate-pulse">{passwordError}</p>
                    )}
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
                    className="w-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 text-white font-bold h-14 text-lg rounded-xl transition-all duration-200 shadow-lg hover:from-red-950 hover:via-red-700 hover:to-red-600"
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
