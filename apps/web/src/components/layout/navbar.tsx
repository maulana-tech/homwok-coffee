"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { POSButton } from "@homwok/ui";
import { LogOut } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 border-b border-border bg-background flex items-center justify-between px-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Homwok Coffee
        </p>
        <h1 className="font-bold uppercase tracking-tight leading-none">
          Sistem Kasir POS
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right hidden sm:block">
            <p className="font-bold text-sm uppercase leading-none">
              {user.nama_lengkap}
            </p>
            <p className="text-xs text-muted-foreground uppercase">{user.peran}</p>
          </div>
        )}
        <POSButton variant="outline" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-1" /> Keluar
        </POSButton>
      </div>
    </header>
  );
}
