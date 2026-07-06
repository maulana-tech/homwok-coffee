"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@homwok/ui";
import type { Pegawai } from "@homwok/types";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  FileText,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

type Role = Pegawai["peran"];

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles: Role[];
}

const menuItems: NavItem[] = [
  { icon: ShoppingCart, label: "Kasir", href: "/kasir", roles: ["barista", "manager"] },
  { icon: Coffee, label: "Menu", href: "/master/menu", roles: ["barista", "manager"] },
  { icon: Package, label: "Bahan Baku", href: "/master/bahan", roles: ["barista", "manager"] },
  { icon: Users, label: "Pegawai", href: "/master/pegawai", roles: ["barista", "manager"] },
  { icon: ShoppingBag, label: "Pembelian", href: "/pembelian", roles: ["barista", "manager"] },
  { icon: TrendingUp, label: "Laporan Penjualan", href: "/laporan/penjualan", roles: ["manager"] },
  { icon: FileText, label: "Laporan HPP", href: "/laporan/hpp", roles: ["manager"] },
  { icon: TrendingUp, label: "Laba Rugi", href: "/laporan/laba-rugi", roles: ["manager"] },
];

export function Sidebar({ user }: { user: Pegawai }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const items = menuItems.filter((i) => i.roles.includes(user.peran));

  return (
    <aside
      className={cn(
        "bg-background border-r border-border flex flex-col transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="h-16 p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg uppercase tracking-tight">Homwok</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          className="p-1 border border-transparent hover:bg-secondary hover:border-border"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-border font-medium"
                  : "border-transparent hover:bg-secondary hover:border-border",
                collapsed && "justify-center",
              )}
            >
              <Icon size={20} />
              {!collapsed && <span className="uppercase text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="mb-2 px-2">
            <p className="font-medium text-sm uppercase truncate">{user.nama_lengkap}</p>
            <p className="text-xs text-muted-foreground uppercase">{user.peran}</p>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? "Keluar" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full border border-transparent text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
            collapsed && "justify-center",
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span className="uppercase text-sm font-medium">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
