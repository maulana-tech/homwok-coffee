# Homwok Coffee — Frontend / UI Documentation

> Dokumentasi khusus **layer frontend** POS Homwok Coffee: design system, arsitektur komponen, layout, styling, dan pola state management.
> Stack: **Next.js 14 (App Router)** · TypeScript · **shadcn/ui** · Tailwind CSS · TanStack Query. Tema: **brutalist hitam-putih**.

---

## Daftar Isi

1. [Filosofi Desain](#1-filosofi-desain)
2. [Design Tokens](#2-design-tokens)
3. [Tipografi](#3-tipografi)
4. [Arsitektur Komponen](#4-arsitektur-komponen)
5. [Setup shadcn/ui](#5-setup-shadcnui)
6. [Komponen POS Custom](#6-komponen-pos-custom)
7. [Layout & Navigasi](#7-layout--navigasi)
8. [Komposisi Halaman](#8-komposisi-halaman)
9. [State Management & Data Fetching](#9-state-management--data-fetching)
10. [Print Styling (Struk)](#10-print-styling-struk)
11. [Responsive & Touch (POS)](#11-responsive--touch-pos)
12. [Aksesibilitas](#12-aksesibilitas)

---

## 1. Filosofi Desain

Homwok Coffee identik dengan **hitam-putih**. Desain UI mengikuti prinsip *neo-brutalism* minimalis: kontras tinggi, border tebal, sudut tajam, hard shadow, dan tipografi tegas. Tidak ada gradient warna, tidak ada soft shadow blur — semuanya crisp.

**Prinsip inti:**

| Prinsip | Implementasi |
|---------|--------------|
| Kontras maksimal | Hanya `#000` dan `#fff` sebagai warna utama, abu-abu untuk state sekunder |
| Border tegas | `border-2 border-black`, bukan `border` tipis |
| Sudut tajam | `--radius: 0.25rem` (nyaris siku) |
| Hard shadow | `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` — tanpa blur |
| Feedback taktil | `active:scale-95`, hover shadow bergeser (`translate`) |
| Hierarki via bobot | `font-black` / `uppercase` / `tracking-tight`, bukan warna |

Warna semantik (merah destructive, hijau success) dipakai **seperlunya** — mostly di ikon/badge kecil, bukan area besar, supaya identitas monokrom tetap dominan.

---

## 2. Design Tokens

Token disimpan sebagai CSS variables di `packages/ui/src/styles.css`, dikonsumsi Tailwind via `hsl(var(--token))`. Format HSL memudahkan dark mode.

```css
/* packages/ui/src/styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 0%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 0%;
    --primary: 0 0% 0%;              /* Hitam pekat */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96%;           /* Abu terang */
    --secondary-foreground: 0 0% 0%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 0%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 0 0% 0%;
    --radius: 0.25rem;               /* sudut tajam */
  }

  .dark {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
    --card: 0 0% 5%;
    --card-foreground: 0 0% 100%;
    --popover: 0 0% 5%;
    --popover-foreground: 0 0% 100%;
    --primary: 0 0% 100%;
    --primary-foreground: 0 0% 0%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 65%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 0 0% 100%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### Palet abu-abu (skala fungsional)

| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| `foreground` | `0%` (hitam) | Teks utama, border, primary button |
| `muted-foreground` | `45%` | Teks sekunder, label, hint |
| `border` / `input` | `90%` | Garis pemisah, field kosong |
| `secondary` / `muted` | `96%` | Background badge, hover ghost |
| `background` | `100%` (putih) | Kanvas |

### Tailwind config (`packages/ui/tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../apps/web/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary:     { DEFAULT: "hsl(var(--primary))",     foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))",   foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))",       foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))",      foreground: "hsl(var(--accent-foreground))" },
        popover:     { DEFAULT: "hsl(var(--popover))",     foreground: "hsl(var(--popover-foreground))" },
        card:        { DEFAULT: "hsl(var(--card))",        foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 3. Tipografi

Dua typeface, dua fungsi:

| Font | Peran | Karakteristik |
|------|-------|---------------|
| **Inter** | Seluruh UI | Netral, legible, cocok untuk data-dense |
| **JetBrains Mono** | Struk / nota | Monospace, terasa "thermal printer", angka rata |

**Skala & bobot yang dipakai:**

| Elemen | Class |
|--------|-------|
| Judul halaman | `text-2xl font-bold` |
| Nama menu (card) | `text-lg font-bold uppercase tracking-tight` |
| Harga (card) | `text-2xl font-black` |
| Total besar | `text-lg font-black uppercase` |
| Label sekunder | `text-sm text-muted-foreground` |
| Struk (body) | `font-mono text-xs uppercase` |

Aturan: judul & angka penting pakai `font-black` + `uppercase` untuk ketegasan; badan teks tetap normal. `tracking-tight` di heading, `tracking-widest` untuk label kecil bergaya (kategori, footer struk).

**Load font di root layout:**

```tsx
// apps/web/src/app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono  = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## 4. Arsitektur Komponen

Dua lapis komponen, dipisah berdasarkan *reusability*:

```
packages/ui/                    # SHARED — dipakai lintas app, generic
├── components/
│   ├── button, input, table…   # shadcn primitives
│   └── pos-button, menu-card…  # custom, domain-agnostic
└── lib/utils.ts                # cn()

apps/web/src/components/        # APP-SPECIFIC — tahu soal bisnis Homwok
├── providers/                  # auth-provider, query-provider
├── layout/                     # sidebar, navbar, auth-guard
├── kasir/                      # menu-grid, cart-panel, checkout-modal
└── master/                     # data-table, form-modal, delete-confirm
```

**Aturan pemisahan:**

- Komponen di `packages/ui` **tidak boleh** tahu tentang API, route, atau state bisnis. Murni presentational, prop-driven.
- Komponen di `apps/web` boleh pakai hooks (`useCart`, `useAuth`), fetch data, tahu route.
- `MenuCard` (di `ui`) hanya terima `name/price/stockStatus` sebagai prop; `MenuGrid` (di `web`) yang fetch menu & susun grid-nya.

**Import pattern:**

```tsx
import { Button, MenuCard, CartItem, Sheet, ScrollArea } from "@homwok/ui";
import { formatRupiah, cn } from "@homwok/lib";
import { CartItem as CartItemType } from "@homwok/types";
```

---

## 5. Setup shadcn/ui

```bash
cd packages/ui
pnpm dlx shadcn@latest init          # base color: neutral
```

`components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Komponen yang di-install untuk POS:**

```bash
pnpm dlx shadcn@latest add button input label select table dialog \
  dropdown-menu card badge separator skeleton tabs popover calendar \
  scroll-area sheet alert alert-dialog checkbox textarea tooltip command
```

> CLI resmi sekarang `shadcn` (bukan `shadcn-ui` yang lama).

**Barrel export** (`packages/ui/src/index.ts`):

```typescript
// shadcn primitives
export * from "./components/button";
export * from "./components/input";
export * from "./components/table";
export * from "./components/dialog";
export * from "./components/sheet";
export * from "./components/scroll-area";
// … dst

// custom POS
export * from "./components/pos-button";
export * from "./components/menu-card";
export * from "./components/cart-item";
export * from "./components/receipt";

export { cn } from "./lib/utils";
```

---

## 6. Komponen POS Custom

Empat komponen inti yang membentuk pengalaman kasir. Semuanya presentational (prop-driven), tema hitam-putih.

### 6.1 `POSButton`

Tombol ukuran besar & taktil, dioptimasi untuk tap di layar kasir. Varian `accent` memakai efek hard-shadow yang "menekan" saat hover.

```tsx
// packages/ui/src/components/pos-button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const posButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:     "bg-black text-white hover:bg-gray-900 border border-black",
        destructive: "bg-white text-black border-2 border-black hover:bg-black hover:text-white",
        outline:     "bg-white text-black border-2 border-black hover:bg-black hover:text-white",
        secondary:   "bg-gray-100 text-black hover:bg-gray-200",
        ghost:       "hover:bg-gray-100 text-black",
        accent:      "bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]",
      },
      size: {
        default:   "h-10 px-4 py-2",
        sm:        "h-8 px-3 text-xs",
        lg:        "h-12 px-6 text-base",
        xl:        "h-14 px-8 text-lg",       // tombol Bayar
        icon:      "h-10 w-10",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface POSButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof posButtonVariants> {}

const POSButton = React.forwardRef<HTMLButtonElement, POSButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(posButtonVariants({ variant, size, className }))} {...props} />
  )
);
POSButton.displayName = "POSButton";

export { POSButton, posButtonVariants };
```

### 6.2 `MenuCard`

Kartu menu yang di-tap untuk masuk keranjang. State `selected` membalik warna (hitam ↔ putih). State `out` men-disable + grayscale. State `low` munculkan titik berkedip.

```tsx
// packages/ui/src/components/menu-card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface MenuCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  name: string;
  price: number;
  category: string;
  stockStatus?: "available" | "low" | "out";
  selected?: boolean;
}

const MenuCard = React.forwardRef<HTMLButtonElement, MenuCardProps>(
  ({ className, name, price, category, stockStatus = "available", selected, ...props }, ref) => (
    <button
      ref={ref}
      disabled={stockStatus === "out"}
      className={cn(
        "relative group flex flex-col items-start p-4 border-2 transition-all duration-200",
        "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]",
        selected
          ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
          : "bg-white text-black border-black",
        stockStatus === "out" && "opacity-40 cursor-not-allowed grayscale",
        className
      )}
      {...props}
    >
      <Badge
        variant={selected ? "secondary" : "outline"}
        className={cn("mb-3 text-xs uppercase tracking-wider",
          selected ? "bg-white text-black border-white" : "border-black")}
      >
        {category}
      </Badge>

      <div className="flex-1 w-full">
        <h3 className={cn("font-bold text-lg uppercase tracking-tight line-clamp-2 mb-2",
          selected ? "text-white" : "text-black")}>
          {name}
        </h3>
        <p className={cn("text-2xl font-black", selected ? "text-white" : "text-black")}>
          Rp {price.toLocaleString("id-ID")}
        </p>
      </div>

      {stockStatus === "low" && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full animate-pulse" />
      )}
    </button>
  )
);
MenuCard.displayName = "MenuCard";

export { MenuCard };
```

### 6.3 `CartItem`

Baris item keranjang dengan kontrol qty inline (−/+), subtotal, dan tombol hapus.

```tsx
// packages/ui/src/components/cart-item.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  className?: string;
}

const CartItem = React.forwardRef<HTMLDivElement, CartItemProps>(
  ({ className, name, price, quantity, subtotal, onIncrease, onDecrease, onRemove }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3 p-3 bg-white border-2 border-black", className)}>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 border-2 border-black" onClick={onDecrease}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-bold">{quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8 border-2 border-black" onClick={onIncrease}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold uppercase truncate">{name}</h4>
        <p className="text-sm text-muted-foreground">@ Rp {price.toLocaleString("id-ID")}</p>
      </div>

      <div className="text-right">
        <p className="font-black">Rp {subtotal.toLocaleString("id-ID")}</p>
        <button onClick={onRemove}
          className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 mt-1">
          <Trash2 className="w-3 h-3" /> Hapus
        </button>
      </div>
    </div>
  )
);
CartItem.displayName = "CartItem";

export { CartItem };
```

### 6.4 `Receipt`

Struk gaya thermal printer: monospace, uppercase, border dashed. **Print styling di CSS biasa**, bukan `styled-jsx` (lihat [§10](#10-print-styling-struk)) — karena ini shared library yang harus framework-agnostic.

```tsx
// packages/ui/src/components/receipt.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface ReceiptProps {
  storeName: string;
  receiptNumber: string;
  date: string;
  cashier: string;
  items: Array<{ name: string; qty: number; price: number; subtotal: number }>;
  total: number;
  className?: string;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ storeName, receiptNumber, date, cashier, items, total, className }, ref) => (
    <div ref={ref} className={cn(
      "receipt w-full max-w-[300px] mx-auto bg-white p-6 font-mono text-xs border-2 border-black",
      className)}>
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-1">{storeName}</h2>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Coffee &amp; Co</p>
      </div>

      <div className="space-y-1 mb-4 text-[10px] uppercase">
        <div className="flex justify-between"><span>No</span><span className="font-bold">{receiptNumber}</span></div>
        <div className="flex justify-between"><span>Tgl</span><span>{date}</span></div>
        <div className="flex justify-between"><span>Ksr</span><span>{cashier}</span></div>
      </div>

      <div className="border-t-2 border-dashed border-black my-4" />

      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between font-bold uppercase">
              <span>{item.name}</span>
              <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {item.qty} x Rp {item.price.toLocaleString("id-ID")}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-black my-4" />

      <div className="flex justify-between text-lg font-black uppercase mb-4">
        <span>Total</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>

      <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mt-6 pt-4 border-t border-gray-200">
        <p>Terima Kasih</p>
        <p className="mt-1">***</p>
      </div>
    </div>
  )
);
Receipt.displayName = "Receipt";

export { Receipt };
```

---

## 7. Layout & Navigasi

### 7.1 Struktur Route Group

```
app/
├── (auth)/login/          # tanpa sidebar
└── (dashboard)/
    ├── layout.tsx         # sidebar + auth guard (shared)
    ├── kasir/
    ├── master/{menu,bahan,pegawai}/
    ├── pembelian/
    └── laporan/{penjualan,hpp,laba-rugi}/
```

Route group `(auth)` dan `(dashboard)` memisahkan layout tanpa memengaruhi URL. Semua halaman dashboard otomatis dapat sidebar + proteksi auth.

### 7.2 Dashboard Layout (auth guard client-side)

```tsx
// app/(dashboard)/layout.tsx
'use client';
import { useAuth } from '@/components/providers/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { redirect } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-black rounded-full" />
      </div>
    );
  }
  if (!isAuthenticated) redirect('/login');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user!} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

> Proteksi route pakai **client-side guard** ini (bukan `middleware.ts` cookie) supaya konsisten dengan token di `localStorage`. Jangan campur dua mekanisme.

### 7.3 Sidebar (menu berdasar role, collapsible)

```tsx
// components/layout/sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Coffee, ShoppingCart, Package, Users, FileText, TrendingUp, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@homwok/lib';
import { Pegawai } from '@homwok/types';
import { useState } from 'react';

const menuItems = [
  { icon: ShoppingCart, label: 'Kasir',            href: '/kasir',             roles: ['barista', 'manager'] },
  { icon: Coffee,       label: 'Menu',             href: '/master/menu',       roles: ['barista'] },
  { icon: Package,      label: 'Bahan Baku',       href: '/master/bahan',      roles: ['barista'] },
  { icon: Users,        label: 'Pegawai',          href: '/master/pegawai',    roles: ['barista'] },
  { icon: Package,      label: 'Pembelian',        href: '/pembelian',         roles: ['barista'] },
  { icon: TrendingUp,   label: 'Laporan Penjualan',href: '/laporan/penjualan', roles: ['manager'] },
  { icon: FileText,     label: 'Laporan HPP',      href: '/laporan/hpp',       roles: ['manager'] },
  { icon: TrendingUp,   label: 'Laba Rugi',        href: '/laporan/laba-rugi', roles: ['manager'] },
];

export function Sidebar({ user }: { user: Pegawai }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const items = menuItems.filter((i) => i.roles.includes(user.peran));

  return (
    <aside className={cn("bg-white border-r-2 border-black flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64")}>
      <div className="p-4 border-b-2 border-black flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6" /><span className="font-black text-lg uppercase">Homwok</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 transition-colors",
                active ? "bg-black text-white font-bold" : "text-black hover:bg-gray-100",
                collapsed && "justify-center")}>
              <item.icon size={20} />
              {!collapsed && <span className="uppercase text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t-2 border-black">
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="font-bold text-sm uppercase">{user.nama_lengkap}</p>
            <p className="text-xs text-muted-foreground uppercase">{user.peran}</p>
          </div>
        )}
        <button onClick={logout} title={collapsed ? "Keluar" : undefined}
          className={cn("flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 w-full",
            collapsed && "justify-center")}>
          <LogOut size={20} />{!collapsed && <span className="uppercase text-sm">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
```

---

## 8. Komposisi Halaman

### 8.1 Halaman Kasir (dua panel)

Layout kasir = **grid menu (kiri)** + **keranjang (kanan)**. Di layar sempit, keranjang jadi `Sheet` yang bisa di-slide.

```tsx
// app/(dashboard)/kasir/page.tsx
'use client';
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { MenuGrid } from '@/components/kasir/menu-grid';
import { Cart } from '@/components/kasir/cart';
import { CheckoutModal } from '@/components/kasir/checkout-modal';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function KasirPage() {
  const cart = useCart();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isProcessing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!cart.items.length) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/penjualan', {
        items: cart.items.map((i) => ({ id_menu: i.id_menu, qty: i.qty })),
      });
      cart.clearCart();
      setCheckoutOpen(false);
      toast.success(`Transaksi ${data.nomor_nota} berhasil!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 overflow-auto">
        <MenuGrid onSelect={cart.addItem} />
      </div>
      <div className="w-96">
        <Cart items={cart.items} total={cart.total}
          onUpdateQty={cart.updateQty} onRemove={cart.removeItem}
          onCheckout={() => setCheckoutOpen(true)} />
      </div>
      <CheckoutModal isOpen={isCheckoutOpen} items={cart.items} total={cart.total}
        isProcessing={isProcessing} onClose={() => setCheckoutOpen(false)} onConfirm={handleCheckout} />
    </div>
  );
}
```

### 8.2 Menu Grid (filter kategori + status stok)

```tsx
// components/kasir/menu-grid.tsx
'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Menu } from '@homwok/types';
import { MenuCard } from '@homwok/ui';

export function MenuGrid({ onSelect }: { onSelect: (m: Menu) => void }) {
  const [cat, setCat] = useState('all');
  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => (await api.get('/menu')).data,
  });

  const categories = ['all', ...new Set(menus?.map((m: Menu) => m.kategori) || [])];
  const filtered = cat === 'all' ? menus : menus?.filter((m: Menu) => m.kategori === cat);

  if (isLoading) return <div className="p-8 text-center uppercase">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-2 whitespace-nowrap border-2 border-black uppercase text-sm font-bold ${
              cat === c ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>
            {c === 'all' ? 'Semua' : c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered?.map((menu: Menu) => (
          <MenuCard key={menu.id_menu} name={menu.nama_menu} price={menu.harga_jual}
            category={menu.kategori} onClick={() => onSelect(menu)} />
        ))}
      </div>
    </div>
  );
}
```

### 8.3 Halaman Login

```tsx
// app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button, Input } from '@homwok/ui';
import { Coffee } from 'lucide-react';

export default function LoginPage() {
  const [cred, setCred] = useState({ username: '', password: '' });
  const { login, isLoading } = useAuth();

  const submit = async () => { await login(cred); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-8 border-2 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-8">
          <div className="bg-black w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Homwok Coffee</h1>
          <p className="text-muted-foreground mt-1 uppercase text-xs tracking-widest">Sistem Kasir POS</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-1">Username</label>
            <Input value={cred.username} onChange={(e) => setCred({ ...cred, username: e.target.value })}
              className="border-2 border-black" placeholder="Masukkan username" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase mb-1">Password</label>
            <Input type="password" value={cred.password}
              onChange={(e) => setCred({ ...cred, password: e.target.value })}
              className="border-2 border-black" placeholder="Masukkan password" />
          </div>
          <Button onClick={submit} disabled={isLoading}
            className="w-full bg-black text-white hover:bg-gray-900 uppercase font-bold">
            {isLoading ? 'Memuat…' : 'Masuk'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

> **Catatan:** jangan bungkus field login dengan `<form>` + `onSubmit` bila artifact/environment melarangnya; pakai `onClick` handler seperti di atas. Untuk app Next.js normal, `<form>` biasa aman.

---

## 9. State Management & Data Fetching

Tiga jenis state, tiga pendekatan berbeda:

| Jenis | Contoh | Tool |
|-------|--------|------|
| **Server state** | daftar menu, laporan, stok | TanStack Query (cache, refetch, invalidation) |
| **Client transient** | keranjang, filter kategori | `useState` / custom hook (`useCart`) |
| **Global session** | user login, token | React Context (`AuthProvider`) |

### Query Provider

```tsx
// components/providers/query-provider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
  }));
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Pola query + mutation (dengan invalidation)

```typescript
// hooks/use-menu.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Menu } from '@homwok/types';

export function useMenus() {
  return useQuery({ queryKey: ['menus'], queryFn: async () => (await api.get('/menu')).data });
}

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Omit<Menu, 'id_menu'>) => api.post('/menu', m),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menus'] }),
  });
}
```

### Real-time stok (polling)

```typescript
// hooks/use-stock.ts
export function usePersediaan() {
  return useQuery({
    queryKey: ['persediaan'],
    queryFn: async () => (await api.get('/persediaan')).data,
    refetchInterval: 30000,   // refetch tiap 30 detik
    staleTime: 10000,
  });
}
```

Untuk kebutuhan benar-benar real-time (multi-kasir bersamaan), upgrade dari polling ke WebSocket (Laravel Echo / Pusher) belakangan.

---

## 10. Print Styling (Struk)

Struk 80mm butuh page setup khusus. **Jangan** pakai `styled-jsx` di `packages/ui` (itu fitur Next, bikin shared lib nggak portable). Taruh aturan print di stylesheet global aja:

```css
/* apps/web/src/app/globals.css */
@media print {
  @page { margin: 0; size: 80mm auto; }

  /* sembunyikan semua kecuali struk */
  body * { visibility: hidden; }
  .receipt, .receipt * { visibility: visible; }
  .receipt { position: absolute; left: 0; top: 0; width: 80mm; border: 0; padding: 8px; }

  .print\:hidden { display: none !important; }
}
```

Komponen `Receipt` sudah punya class `.receipt` di root-nya sebagai anchor. Tombol aksi (Cetak/Selesai) diberi `print:hidden` supaya nggak ikut tercetak.

Trigger cetak: `onClick={() => window.print()}`.

---

## 11. Responsive & Touch (POS)

POS umumnya dipakai di **tablet landscape** atau layar sentuh kecil. Penyesuaian:

- **Target tap minimal 44×44px.** `POSButton size="xl"` = `h-14` (56px), `MenuCard` full-area clickable.
- **Grid adaptif:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — 2 kolom di layar sempit, sampai 4 di desktop.
- **Keranjang:** panel tetap (`w-96`) di layar lebar; jadi `Sheet` slide-in di layar sempit.
- **Filter kategori:** `overflow-x-auto` supaya bisa scroll horizontal tanpa memecah layout.
- **Feedback taktil:** `active:scale-95` di semua tombol memberi respons visual saat ditekan.
- **Hindari hover-only:** semua aksi punya state non-hover (penting untuk touch yang nggak punya hover).

---

## 12. Aksesibilitas

Tema hitam-putih justru unggul di kontras, tapi tetap ada hal yang dijaga:

| Aspek | Praktik |
|-------|---------|
| **Kontras** | Hitam-putih = rasio ~21:1, jauh di atas WCAG AAA (7:1). Aman |
| **Focus ring** | `focus-visible:ring-2 focus-visible:ring-black ring-offset-2` di semua interaktif |
| **Keyboard nav** | shadcn/Radix sudah handle ARIA + keyboard di Dialog, Sheet, Dropdown |
| **State non-warna** | Status stok pakai ikon + teks (bukan warna semata) — mis. `low` = titik berkedip, `out` = grayscale + disabled |
| **Label form** | Setiap `Input` punya `<label>` eksplisit, bukan placeholder saja |
| **Tombol ikon** | `title`/`aria-label` saat sidebar collapsed atau tombol ikon tanpa teks |
| **Loading state** | Spinner + teks, disabled button saat proses (`isProcessing`) |

> Satu-satunya risiko a11y tema monokrom: status yang biasanya dibedakan warna (merah=bahaya, hijau=aman). Karena itu semua status **selalu** ditandai ikon/teks/pola, bukan cuma warna.

---

## Ringkasan Komponen

| Komponen | Lokasi | Peran |
|----------|--------|-------|
| `POSButton` | `packages/ui` | Tombol taktil besar, 6 varian |
| `MenuCard` | `packages/ui` | Kartu menu clickable + status stok |
| `CartItem` | `packages/ui` | Baris keranjang + kontrol qty |
| `Receipt` | `packages/ui` | Struk thermal 80mm |
| `Sidebar` | `apps/web` | Navigasi role-based, collapsible |
| `MenuGrid` | `apps/web` | Grid menu + filter kategori |
| `Cart` | `apps/web` | Panel keranjang + checkout |
| `AuthProvider` | `apps/web` | Session global, login/logout |
| `QueryProvider` | `apps/web` | Cache server state |
