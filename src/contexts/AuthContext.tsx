import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

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

const normalizeUserId = (rawUser: any): number => {
  // Try all possible ID field names (backend inconsistency)
  const rawId = rawUser?.id ?? 
               rawUser?.id_pengguna ?? 
               rawUser?.idPengguna ?? 
               rawUser?.user_id ?? 
               rawUser?.userId ?? 
               rawUser?.id_user ?? 
               rawUser?.idUser;
  
  // Parse to number
  const parsed = typeof rawId === "string" ? parseInt(rawId, 10) : Number(rawId);
  
  // Validate: must be finite and > 0
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  
  // Fallback: return 0 (invalid ID indicator)
  return 0;
};

const normalizeAuthUser = (rawUser: any): User => {
  const id = normalizeUserId(rawUser);
  return {
    id,
    name: String(rawUser?.name ?? rawUser?.nama ?? ""),
    username: String(rawUser?.username ?? ""),
    email: String(rawUser?.email ?? ""),
    role: String(rawUser?.role ?? rawUser?.peran ?? ""),
    created_at: String(rawUser?.created_at ?? rawUser?.dibuat_pada ?? ""),
    jobdesk: rawUser?.jobdesk ?? rawUser?.jabatan ?? null,
    mitra: rawUser?.mitra ?? rawUser?.nama_mitra ?? null,
    nomor_hp: rawUser?.nomor_hp ?? rawUser?.no_hp ?? rawUser?.phone ?? null,
    photo: rawUser?.photo ?? null,
  };
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<{ error: any }>;
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

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

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

  // Refresh user data from API
  const refreshUser = async () => {
    const storedToken = localStorage.getItem("token");
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
        localStorage.setItem("user", JSON.stringify(refreshedUser));
      } else {
        // Token invalid, clear auth
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
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
        console.error("[AUTH] Login error:", data.message || "Login failed");
        return { error: data.message || "Login failed" };
      }

      // Step 1: Save token to localStorage FIRST
      const receivedToken = data.data.token;
      localStorage.setItem("token", receivedToken);
      console.log("[AUTH] Token saved to localStorage");

      // Step 2: Normalize and save user data
      const normalizedUser = normalizeAuthUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      console.log("[AUTH] User saved to localStorage:", normalizedUser);

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
          localStorage.setItem("user", JSON.stringify(refreshedUser));
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
      return { error: "Network error. Please try again." };
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
        return { error: data.message || "Registration failed" };
      }

      // Step 1: Save token to localStorage FIRST
      const receivedToken = data.data.token;
      localStorage.setItem("token", receivedToken);
      console.log("[AUTH] Token saved to localStorage");

      // Step 2: Normalize and save user data
      const normalizedUser = normalizeAuthUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      console.log("[AUTH] User saved to localStorage:", normalizedUser);

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
          localStorage.setItem("user", JSON.stringify(refreshedUser));
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
      return { error: "Network error. Please try again." };
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
      // Clear localStorage and state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      navigate("/auth");
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
