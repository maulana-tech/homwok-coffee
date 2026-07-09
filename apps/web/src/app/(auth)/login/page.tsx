"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Input, Label, POSButton } from "@homwok/ui";
import { Coffee, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [cred, setCred] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/kasir");
  }, [isAuthenticated, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(cred);
    } catch {
      // error toast already surfaced by AuthProvider
    }
  };

  const handleQuickLogin = (role: "barista" | "manager") => {
    setCred({ username: role, password: "password" });
    setActiveRole(role);
    // Reset active state highlight after a short animation duration
    setTimeout(() => setActiveRole(null), 800);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background font-sans overflow-hidden">
      {/* LEFT COLUMN: Premium Branded Image Section (hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative flex-col justify-between p-12 text-white bg-zinc-950">
        {/* Ambient background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200&auto=format&fit=crop"
            alt="Cinematic Espresso Brewing"
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-10000 ease-out scale-105 hover:scale-100"
          />
          {/* Elegant warm overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/70 to-zinc-900/30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-xl shadow-lg">
            <Coffee className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              Homwok Coffee
            </h2>
            <p className="text-[10px] tracking-widest text-zinc-400 uppercase">
              Point of Sale System
            </p>
          </div>
        </div>

        {/* Bottom Slogan / Tagline */}
        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Premium Coffee Shop Companion
          </div>
          <blockquote className="space-y-2">
            <p className="text-xl font-light leading-relaxed text-zinc-100 italic">
              &ldquo;Presisi dalam setiap seduhan, kecepatan dalam setiap transaksi. Kelola operasional kedai kopi Anda dengan keanggunan kasir digital.&rdquo;
            </p>
            <footer className="text-xs tracking-wider text-zinc-400 uppercase font-mono">
              — Homwok Coffee Engine v1.0.0
            </footer>
          </blockquote>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Login Form Panel */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-8 sm:p-12 md:p-16 lg:p-10 xl:p-16 bg-background relative">
        
        {/* Small branding icon for mobile devices only */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="bg-primary w-12 h-12 flex items-center justify-center rounded-xl shadow-md mb-3">
            <Coffee className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Homwok Coffee</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
            Sistem Kasir POS
          </p>
        </div>

        {/* Main form container */}
        <div className="w-full max-w-md space-y-8 animate-fade-in-up duration-500">
          
          {/* Header */}
          <div className="hidden lg:block space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Selamat datang
            </h1>
            <p className="text-sm text-muted-foreground">
              Masukkan username dan password untuk masuk ke dashboard POS.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Username
                </Label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground group-focus-within:text-foreground transition-colors">
                    <User className="w-4 h-4" />
                  </span>
                  <Input
                    id="username"
                    value={cred.username}
                    onChange={(e) => setCred({ ...cred, username: e.target.value })}
                    placeholder="Masukkan username (barista / manager)"
                    autoComplete="username"
                    className="pl-10 h-11 border-border bg-card focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Password
                  </Label>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground group-focus-within:text-foreground transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={cred.password}
                    onChange={(e) => setCred({ ...cred, password: e.target.value })}
                    placeholder="Masukkan password Anda"
                    autoComplete="current-password"
                    className="pl-10 pr-10 h-11 border-border bg-card focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <POSButton
              type="submit"
              variant="accent"
              size="lg"
              className="w-full h-11 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all duration-200 active:scale-[0.98] shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menghubungkan…
                </span>
              ) : (
                "Masuk ke POS"
              )}
            </POSButton>
          </form>

          {/* Quick Demo Login Selector */}
          <div className="pt-6 border-t border-dashed border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Demo Login Cepat
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Klik untuk isi otomatis
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin("barista")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-card text-left transition-all duration-200 hover:border-foreground active:scale-[0.97] hover:shadow-sm ${
                  activeRole === "barista" ? "ring-2 ring-ring border-foreground scale-95" : "border-border"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-tight text-foreground">Barista</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5">User: barista</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("manager")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-card text-left transition-all duration-200 hover:border-foreground active:scale-[0.97] hover:shadow-sm ${
                  activeRole === "manager" ? "ring-2 ring-ring border-foreground scale-95" : "border-border"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-tight text-foreground">Manager</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5">User: manager</span>
              </button>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="pt-2 text-center text-[10px] text-muted-foreground/75 tracking-wider uppercase font-mono">
            Protected by Homwok Security Layer
          </div>
        </div>
      </div>
    </div>
  );
}
