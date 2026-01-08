import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authStorage } from "@/lib/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  jobdesk?: string | null;
  mitra?: string | null;
  nomor_hp?: string | null;
  photo?: string | null;
}

const normalizeUserId = (rawUser: unknown): number => {
  if (typeof rawUser !== 'object' || rawUser === null) return 0;
  const obj = rawUser as Record<string, unknown>;

  // Try all possible ID field names (backend inconsistency)
  const rawId = obj['id'] ??
               obj['id_pengguna'] ??
               obj['idPengguna'] ??
               obj['user_id'] ??
               obj['userId'] ??
               obj['id_user'] ??
               obj['idUser'];
  
  // Parse to number
  const parsed = typeof rawId === "string" ? parseInt(rawId, 10) : Number(rawId);
  
  // Validate: must be finite and > 0
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  
  // Fallback: return 0 (invalid ID indicator)
  return 0;
};

const normalizeAuthUser = (rawUser: unknown): User => {
  const obj: Record<string, unknown> = typeof rawUser === 'object' && rawUser !== null ? (rawUser as Record<string, unknown>) : {};
  const id = normalizeUserId(obj);

  const jobdeskRaw = obj['jobdesk'] ?? obj['jabatan'];
  const mitraRaw = obj['mitra'] ?? obj['nama_mitra'];
  const nomorHpRaw = obj['nomor_hp'] ?? obj['no_hp'] ?? obj['phone'];
  const photoRaw = obj['photo'];

  return {
    id,
    name: String(obj['name'] ?? obj['nama'] ?? ""),
    username: String(obj['username'] ?? ""),
    email: String(obj['email'] ?? ""),
    role: String(obj['role'] ?? obj['peran'] ?? ""),
    created_at: String(obj['created_at'] ?? obj['dibuat_pada'] ?? ""),
    jobdesk: typeof jobdeskRaw === 'string' ? jobdeskRaw : null,
    mitra: typeof mitraRaw === 'string' ? mitraRaw : null,
    nomor_hp: typeof nomorHpRaw === 'string' ? nomorHpRaw : null,
    photo: typeof photoRaw === 'string' ? photoRaw : null,
  };
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuthState = useCallback((redirectToLogin: boolean) => {
    authStorage.clear();
    setToken(null);
    setUser(null);
    if (redirectToLogin) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Load user from storage on mount (migrate localStorage -> sessionStorage)
  useEffect(() => {
    authStorage.migrateLegacyToSession();

    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUserRaw();

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(normalizeAuthUser(JSON.parse(storedUser)));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Auto logout when connection lost
  useEffect(() => {
    const onOffline = () => {
      const existingToken = authStorage.getToken();
      if (!existingToken) return;

      clearAuthState(true);
      toast.error("Koneksi terputus. Anda otomatis logout.");
    };

    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
  }, [clearAuthState]);

  // Refresh user data from API
  const refreshUser = async () => {
    const storedToken = authStorage.getToken();
    if (!storedToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const refreshedUser: User = normalizeAuthUser(data?.data);

        setUser(refreshedUser);
        authStorage.setUserRaw(JSON.stringify(refreshedUser));
      } else {
        // Token invalid, clear auth
        clearAuthState(true);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      // Jika offline, auto logout
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        clearAuthState(true);
        toast.error("Koneksi terputus. Anda otomatis logout.");
      }
    }
  };

  const signIn = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      console.log("[AUTH] Login attempt:", { identifier, API_BASE_URL });
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      console.log("[AUTH] Login response status:", response.status);
      
      const data = await response.json();
      
      console.log("[AUTH] Login response data:", data);

      if (!response.ok) {
        console.error("[AUTH] Login error:", data.message || "Login gagal");
        return { error: data.message || "Login gagal" };
      }

      // Step 1: Save token to localStorage FIRST
      const receivedToken = data.data.token;
      authStorage.setToken(receivedToken);
      console.log("[AUTH] Token saved to sessionStorage");

      // Step 2: Normalize and save user data
      const normalizedUser = normalizeAuthUser(data.data.user);
      authStorage.setUserRaw(JSON.stringify(normalizedUser));
      console.log("[AUTH] User saved to sessionStorage:", normalizedUser);

      // Step 3: Update state (this triggers React re-render)
      setToken(receivedToken);
      setUser(normalizedUser);
      console.log("[AUTH] State updated with token and user");

      // Step 4: Wait a tick for state to propagate
      await new Promise(resolve => setTimeout(resolve, 0));

      // Step 5: Fetch fresh profile data (photo, updated info)
      try {
        console.log("[AUTH] Fetching fresh profile...");
        const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${receivedToken}`,
            Accept: 'application/json',
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const refreshedUser = normalizeAuthUser(profileData?.data);
          
          // Update with fresh data
          setUser(refreshedUser);
          authStorage.setUserRaw(JSON.stringify(refreshedUser));
          console.log("[AUTH] Profile refreshed successfully");
        } else {
          console.warn("[AUTH] Profile refresh failed, using initial user data");
        }
      } catch (profileError) {
        console.warn("[AUTH] Profile fetch error (non-critical):", profileError);
        // Continue with initial user data
      }

      // Step 6: Wait another tick before navigation to ensure all states are updated
      await new Promise(resolve => setTimeout(resolve, 50));

      // Step 7: NOW navigate to dashboard
      console.log("[AUTH] Navigating to dashboard...");
      navigate("/dashboard", { replace: true });

      return { error: null };
    } catch (error) {
      console.error("[AUTH] Network error:", error);
      return { error: "Terjadi gangguan jaringan. Silakan coba lagi." };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, username: string) => {
    setLoading(true);
    try {
      console.log("[AUTH] Registration attempt:", { email, username });
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          password_confirmation: password,
        }),
      });

      const data = await response.json();
      console.log("[AUTH] Registration response:", data);

      if (!response.ok) {
        console.error("[AUTH] Registration error:", data.message);
        return { error: data.message || "Registrasi gagal" };
      }

      // Step 1: Save token to localStorage FIRST
      const receivedToken = data.data.token;
      authStorage.setToken(receivedToken);
      console.log("[AUTH] Token saved to sessionStorage");

      // Step 2: Normalize and save user data
      const normalizedUser = normalizeAuthUser(data.data.user);
      authStorage.setUserRaw(JSON.stringify(normalizedUser));
      console.log("[AUTH] User saved to sessionStorage:", normalizedUser);

      // Step 3: Update state IMMEDIATELY
      setToken(receivedToken);
      setUser(normalizedUser);
      console.log("[AUTH] State updated with token and user");

      // Step 4: Wait for state to propagate
      await new Promise(resolve => setTimeout(resolve, 0));

      // Step 5: Fetch fresh profile data
      try {
        console.log("[AUTH] Fetching fresh profile...");
        const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${receivedToken}`,
            Accept: 'application/json',
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const refreshedUser = normalizeAuthUser(profileData?.data);
          setUser(refreshedUser);
          authStorage.setUserRaw(JSON.stringify(refreshedUser));
          console.log("[AUTH] Profile refreshed successfully");
        }
      } catch (profileError) {
        console.warn("[AUTH] Profile fetch error (non-critical):", profileError);
      }

      // Step 6: Wait before navigation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Step 7: Navigate to dashboard
      console.log("[AUTH] Navigating to dashboard...");
      navigate("/dashboard", { replace: true });
      
      return { error: null };
    } catch (error) {
      console.error("[AUTH] Network error:", error);
      return { error: "Terjadi gangguan jaringan. Silakan coba lagi." };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear storage and state
      clearAuthState(true);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signUp, signOut, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
