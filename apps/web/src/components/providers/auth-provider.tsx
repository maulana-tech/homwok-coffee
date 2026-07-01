"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { LoginCredentials, Pegawai } from "@homwok/types";
import { SAMPLE_USERS } from "@/lib/sample-data";
import { toast } from "sonner";

const TOKEN_KEY = "homwok_token";
const USER_KEY = "homwok_user";

interface AuthContextType {
  user: Pegawai | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Pegawai | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session from localStorage (sample-data mode).
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const saved = localStorage.getItem(USER_KEY);
      if (token && saved) setUser(JSON.parse(saved) as Pegawai);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      try {
        // TODO: swap for `await api.post<AuthResponse>('/login', credentials)`
        // once the Laravel backend exposes /login. For now we authenticate
        // against the seeded sample users so the UI is fully demoable offline.
        const match = SAMPLE_USERS.find(
          (u) =>
            u.username === credentials.username &&
            u.password === credentials.password,
        );
        if (!match) throw new Error("Username atau password salah");

        const { password: _password, ...pegawai } = match;
        localStorage.setItem(TOKEN_KEY, `sample-${match.username}`);
        localStorage.setItem(USER_KEY, JSON.stringify(pegawai));
        setUser(pegawai);
        toast.success(`Selamat datang, ${pegawai.nama_lengkap}`);
        router.push(pegawai.peran === "manager" ? "/laporan/penjualan" : "/kasir");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal login");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
