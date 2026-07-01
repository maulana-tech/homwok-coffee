# Homwok Coffee — POS System Documentation

> Sistem Point of Sale (POS) untuk Homwok Coffee dengan perhitungan **HPP berbasis FIFO** otomatis.
> Stack: **Laravel 11** (API) + **Next.js 14** (App Router) dalam **monorepo Turborepo + pnpm**, UI **shadcn/ui** tema hitam-putih.

---

## Daftar Isi

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Konsep FIFO & HPP](#2-konsep-fifo--hpp)
3. [Arsitektur & Tech Stack](#3-arsitektur--tech-stack)
4. [Struktur Monorepo](#4-struktur-monorepo)
5. [Backend — Laravel](#5-backend--laravel)
6. [Frontend — Next.js](#6-frontend--nextjs)
7. [Setup Step-by-Step](#7-setup-step-by-step)
8. [Fitur Tambahan](#8-fitur-tambahan)
9. [Known Issues & Perbaikan](#9-known-issues--perbaikan)
10. [Checklist Deploy](#10-checklist-deploy)

---

## 1. Ringkasan Sistem

POS Homwok Coffee menangani alur kasir dari pemilihan menu → keranjang → pembayaran → struk, dengan **perhitungan Harga Pokok Penjualan (HPP) otomatis** setiap transaksi. HPP dihitung dari komposisi resep tiap menu, dikalikan harga beli bahan baku berdasarkan **lot FIFO** (First In First Out).

**Role pengguna:**

| Role | Akses |
|------|-------|
| Barista | Kasir, master data (menu, bahan, resep), pembelian |
| Manager | Semua akses barista + laporan (penjualan, HPP, laba-rugi, persediaan) |

**Alur inti:**

```
Menu Grid → Keranjang → Checkout → [Hitung HPP FIFO + kurangi stok lot] → Struk
```

---

## 2. Konsep FIFO & HPP

### FIFO (First In First Out)

Bahan yang **pertama dibeli** adalah yang **pertama dipakai**. Setiap pembelian tercatat sebagai satu **lot** dengan harga belinya sendiri. Saat menjual, sistem mengambil dari lot tertua dulu sampai kebutuhan terpenuhi.

**Contoh:**

```
01 Jan : Beli Kopi 5.000 g @ Rp 120/g  → Lot 1
05 Jan : Beli Kopi 5.000 g @ Rp 135/g  → Lot 2
10 Jan : Beli Kopi 5.000 g @ Rp 150/g  → Lot 3

Jual menu butuh 6.000 g kopi:
  - 5.000 g dari Lot 1 (@120) = Rp 600.000
  - 1.000 g dari Lot 2 (@135) = Rp 135.000
  ──────────────────────────────────────────
  HPP = Rp 735.000

Sisa stok:
  - Lot 1 : 0 g (habis)
  - Lot 2 : 4.000 g
  - Lot 3 : 5.000 g
```

### HPP (Harga Pokok Penjualan / COGS)

Biaya langsung untuk menghasilkan barang yang dijual:

```
HPP = Biaya Bahan Baku + Tenaga Kerja Langsung + Overhead Pabrik
```

Dalam sistem ini, HPP dihitung dari **pemakaian bahan baku (via resep) × harga beli lot FIFO**. Komponen tenaga kerja & overhead bisa ditambahkan belakangan bila diperlukan.

---

## 3. Arsitektur & Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 11, Sanctum (auth), Maatwebsite Excel, DomPDF |
| Database | MySQL 8 / PostgreSQL |
| Frontend | Next.js 14 (App Router), TypeScript, TanStack Query |
| UI | shadcn/ui + Tailwind CSS (tema hitam-putih) |
| Monorepo | Turborepo + pnpm workspaces |
| Auth | Sanctum token (disimpan konsisten — lihat [§9](#9-known-issues--perbaikan)) |

---

## 4. Struktur Monorepo

```
homwok-coffee/
├── apps/
│   ├── web/                    # Next.js 14 (App Router)
│   └── api/                    # Laravel 11
├── packages/
│   ├── ui/                     # shadcn components (shared)
│   ├── types/                  # Shared TypeScript types
│   ├── lib/                    # Shared utilities (formatRupiah, dll)
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Keuntungan monorepo:** code sharing (UI, types, utils), atomic changes (ubah API + FE dalam satu commit), build caching via Turbo, tooling konsisten.

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json` (Turborepo 2.x — pakai `tasks`, bukan `pipeline`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

> ⚠️ Di Turborepo 2.0 key `"pipeline"` sudah **dihapus** dan diganti `"tasks"`. Kalau masih pakai `pipeline`, `turbo dev`/`turbo build` akan error.

---

## 5. Backend — Laravel

### 5.1 Database Migrations

Skema inti terdiri dari master data (pegawai, menu, bahan_baku, resep), transaksi (pembelian, penjualan), dan **audit trail FIFO** (detail_pembelian sebagai lot, pemakaian_bahan sebagai log).

```php
<?php
// database/migrations/xxxx_create_all_tables.php

// Master: Pegawai
Schema::create('pegawai', function (Blueprint $table) {
    $table->id('id_pegawai');
    $table->string('nama_lengkap');
    $table->string('username')->unique();
    $table->string('kata_sandi');            // bcrypt hash
    $table->enum('peran', ['barista', 'manager']);
    $table->boolean('aktif')->default(true);
    $table->timestamps();
});

// Master: Menu
Schema::create('menu', function (Blueprint $table) {
    $table->id('id_menu');
    $table->string('nama_menu');
    $table->string('kategori');
    $table->decimal('harga_jual', 15, 2);
    $table->boolean('aktif')->default(true);
    $table->timestamps();
});

// Master: Bahan Baku
Schema::create('bahan_baku', function (Blueprint $table) {
    $table->id('id_bahan');
    $table->string('nama_bahan');
    $table->string('satuan');                // satuan dasar: gram, ml, pcs
    $table->decimal('stok_minimum', 12, 2);
    $table->timestamps();
});

// Master: Resep (komposisi menu)
Schema::create('resep', function (Blueprint $table) {
    $table->id('id_resep');
    $table->foreignId('id_menu')->constrained('menu', 'id_menu');
    $table->foreignId('id_bahan')->constrained('bahan_baku', 'id_bahan');
    $table->decimal('takaran', 12, 2);       // dalam satuan dasar bahan
    $table->string('satuan');                // redundan untuk validasi
    $table->timestamps();
});

// Transaksi: Pembelian (header)
Schema::create('pembelian', function (Blueprint $table) {
    $table->id('id_pembelian');
    $table->foreignId('id_pegawai')->constrained('pegawai', 'id_pegawai');
    $table->string('nomor_pembelian')->unique();
    $table->dateTime('tanggal_beli');        // datetime, bukan date — presisi lot FIFO per jam
    $table->string('pemasok');
    $table->decimal('total_beli', 15, 2);
    $table->timestamps();
});

// LOT FIFO — inti sistem
Schema::create('detail_pembelian', function (Blueprint $table) {
    $table->id('id_detail_pembelian');
    $table->foreignId('id_pembelian')->constrained('pembelian', 'id_pembelian');
    $table->foreignId('id_bahan')->constrained('bahan_baku', 'id_bahan');
    $table->decimal('qty_awal', 12, 2);      // qty awal saat beli
    $table->decimal('sisa_qty', 12, 2);      // sisa yang bisa dipakai
    $table->decimal('harga_beli', 15, 2);    // harga per satuan dasar
    $table->date('tanggal_kadaluarsa')->nullable();
    $table->timestamps();
    $table->index(['id_bahan', 'sisa_qty']); // index untuk performa FIFO
});

// Transaksi: Penjualan (header)
Schema::create('penjualan', function (Blueprint $table) {
    $table->id('id_penjualan');
    $table->foreignId('id_pegawai')->constrained('pegawai', 'id_pegawai');
    $table->string('nomor_nota')->unique();
    $table->dateTime('tanggal_jual');
    $table->decimal('total_jual', 15, 2);
    $table->decimal('total_diskon', 15, 2)->default(0);
    $table->decimal('pajak', 15, 2)->default(0);
    $table->decimal('grand_total', 15, 2);
    $table->decimal('total_hpp', 15, 2);
    $table->decimal('laba_kotor', 15, 2);    // grand_total - total_hpp
    $table->timestamps();
});

// Detail Penjualan
Schema::create('detail_penjualan', function (Blueprint $table) {
    $table->id('id_detail_penjualan');
    $table->foreignId('id_penjualan')->constrained('penjualan', 'id_penjualan');
    $table->foreignId('id_menu')->constrained('menu', 'id_menu');
    $table->integer('qty');
    $table->decimal('harga_jual', 15, 2);
    $table->decimal('subtotal', 15, 2);
    $table->decimal('hpp_menu', 15, 2);      // HPP total untuk menu ini
    $table->timestamps();
});

// Log Pemakaian Bahan (audit trail HPP)
Schema::create('pemakaian_bahan', function (Blueprint $table) {
    $table->id('id_pemakaian');
    $table->foreignId('id_detail_penjualan')->constrained('detail_penjualan', 'id_detail_penjualan');
    $table->foreignId('id_bahan')->constrained('bahan_baku', 'id_bahan');
    $table->foreignId('id_detail_pembelian')->constrained('detail_pembelian', 'id_detail_pembelian');
    $table->decimal('qty_dipakai', 12, 2);
    $table->decimal('harga_beli', 15, 2);    // snapshot harga saat pakai
    $table->decimal('subtotal_hpp', 15, 2);
    $table->timestamps();
});
```

> **Catatan presisi:** `tanggal_beli` dibuat `dateTime` (bukan `date`) supaya lot yang dibeli di hari yang sama tetap terurut benar. Tie-breaker tambahan tetap pakai `id` ASC.

### 5.2 Models Penting

```php
<?php
// app/Models/DetailPembelian.php — model terpenting untuk FIFO

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailPembelian extends Model
{
    protected $table = 'detail_pembelian';
    protected $primaryKey = 'id_detail_pembelian';

    protected $fillable = [
        'id_pembelian', 'id_bahan', 'qty_awal', 'sisa_qty',
        'harga_beli', 'tanggal_kadaluarsa',
    ];

    public function pembelian(): BelongsTo
    {
        return $this->belongsTo(Pembelian::class, 'id_pembelian');
    }

    public function bahan(): BelongsTo
    {
        return $this->belongsTo(BahanBaku::class, 'id_bahan');
    }

    // Scope lot yang masih tersedia (FIFO)
    public function scopeTersedia($query)
    {
        return $query->where('sisa_qty', '>', 0);
    }
}
```

```php
<?php
// app/Models/BahanBaku.php — pastikan relasi detailPembelian ada
// (dipakai oleh PersediaanController untuk hitung sisa stok)

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BahanBaku extends Model
{
    protected $table = 'bahan_baku';
    protected $primaryKey = 'id_bahan';

    protected $fillable = ['nama_bahan', 'satuan', 'stok_minimum'];

    public function detailPembelian(): HasMany
    {
        return $this->hasMany(DetailPembelian::class, 'id_bahan');
    }
}
```

### 5.3 Service FIFO (Logika Inti)

Menggunakan **row-level locking** (`lockForUpdate`) di dalam transaksi DB untuk mencegah race condition saat dua kasir memproses transaksi bersamaan.

```php
<?php
// app/Services/FifoCostCalculator.php

namespace App\Services;

use App\Models\DetailPembelian;
use App\Models\DetailPenjualan;
use App\Models\Menu;
use App\Models\PemakaianBahan;
use App\Models\Penjualan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FifoCostCalculator
{
    /**
     * Proses penjualan + hitung HPP FIFO.
     * @param array $items [['id_menu' => 1, 'qty' => 2], ...]
     */
    public function prosesPenjualan(array $items, int $idPegawai): array
    {
        return DB::transaction(function () use ($items, $idPegawai) {
            try {
                $penjualan = new Penjualan([
                    'id_pegawai'  => $idPegawai,
                    'nomor_nota'  => $this->generateNomorNota(),
                    'tanggal_jual'=> now(),
                    'total_jual'  => 0,
                    'grand_total' => 0,
                    'total_hpp'   => 0,
                    'laba_kotor'  => 0,
                ]);
                $penjualan->save();

                $totalJual = 0;
                $totalHpp  = 0;

                foreach ($items as $item) {
                    $menu = Menu::with('resep.bahan')->findOrFail($item['id_menu']);

                    if ($menu->resep->isEmpty()) {
                        throw new \Exception("Menu '{$menu->nama_menu}' tidak memiliki resep");
                    }

                    $qtyPorsi     = $item['qty'];
                    $subtotalJual = $menu->harga_jual * $qtyPorsi;

                    $detail = DetailPenjualan::create([
                        'id_penjualan' => $penjualan->id_penjualan,
                        'id_menu'      => $menu->id_menu,
                        'qty'          => $qtyPorsi,
                        'harga_jual'   => $menu->harga_jual,
                        'subtotal'     => $subtotalJual,
                        'hpp_menu'     => 0,
                    ]);

                    $hppMenu = $this->hitungHppMenu($menu, $qtyPorsi, $detail);
                    $detail->update(['hpp_menu' => $hppMenu]);

                    $totalJual += $subtotalJual;
                    $totalHpp  += $hppMenu;
                }

                $penjualan->update([
                    'total_jual'  => $totalJual,
                    'grand_total' => $totalJual,           // sebelum diskon/pajak
                    'total_hpp'   => $totalHpp,
                    'laba_kotor'  => $totalJual - $totalHpp,
                ]);

                return [
                    'penjualan' => $penjualan->load('detailPenjualan.menu'),
                    'success'   => true,
                    'error'     => null,
                ];
            } catch (\Exception $e) {
                Log::error('FIFO Error: ' . $e->getMessage());
                return ['penjualan' => null, 'success' => false, 'error' => $e->getMessage()];
            }
        });
    }

    /** Hitung HPP satu menu dengan algoritma FIFO */
    private function hitungHppMenu(Menu $menu, int $qtyPorsi, DetailPenjualan $detail): float
    {
        $hppMenu = 0;

        foreach ($menu->resep as $resep) {
            $butuhSisa = $resep->takaran * $qtyPorsi;
            $bahan     = $resep->bahan;

            // Ambil lot FIFO dengan locking. Urut: tanggal_beli ASC, lalu id ASC
            $lots = DetailPembelian::tersedia()
                ->where('detail_pembelian.id_bahan', $bahan->id_bahan)
                ->join('pembelian', 'detail_pembelian.id_pembelian', '=', 'pembelian.id_pembelian')
                ->orderBy('pembelian.tanggal_beli', 'asc')
                ->orderBy('detail_pembelian.id_detail_pembelian', 'asc')
                ->lockForUpdate()
                ->select('detail_pembelian.*')
                ->get();

            foreach ($lots as $lot) {
                if ($butuhSisa <= 0) break;

                $ambil = min($lot->sisa_qty, $butuhSisa);
                $lot->update(['sisa_qty' => $lot->sisa_qty - $ambil]);

                $subtotalHpp = $ambil * $lot->harga_beli;
                PemakaianBahan::create([
                    'id_detail_penjualan' => $detail->id_detail_penjualan,
                    'id_bahan'            => $bahan->id_bahan,
                    'id_detail_pembelian' => $lot->id_detail_pembelian,
                    'qty_dipakai'         => $ambil,
                    'harga_beli'          => $lot->harga_beli,
                    'subtotal_hpp'        => $subtotalHpp,
                ]);

                $hppMenu   += $subtotalHpp;
                $butuhSisa -= $ambil;
            }

            if ($butuhSisa > 0) {
                throw new \Exception(
                    "Stok '{$bahan->nama_bahan}' tidak cukup. Kurang: {$butuhSisa}"
                );
            }
        }

        return round($hppMenu, 2);
    }

    /** Generate nomor nota anti race-condition (lock baris terakhir hari ini) */
    private function generateNomorNota(): string
    {
        $prefix = 'NJ-' . now()->format('Ymd') . '-';

        $last = Penjualan::whereDate('tanggal_jual', today())
            ->orderBy('id_penjualan', 'desc')
            ->lockForUpdate()          // penting: cegah nomor kembar
            ->first();

        $sequence = $last ? ((int) substr($last->nomor_nota, -3)) + 1 : 1;
        return $prefix . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }
}
```

### 5.4 Controller Penjualan

```php
<?php
// app/Http/Controllers/Api/PenjualanController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FifoCostCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PenjualanController extends Controller
{
    public function __construct(private FifoCostCalculator $fifoCalculator) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items'            => 'required|array|min:1',
            'items.*.id_menu'  => 'required|exists:menu,id_menu',
            'items.*.qty'      => 'required|integer|min:1',
        ]);

        $result = $this->fifoCalculator->prosesPenjualan($validated['items'], Auth::id());

        if (!$result['success']) {
            $status = str_contains($result['error'], 'tidak cukup') ? 422 : 500;
            return response()->json(['message' => $result['error']], $status);
        }

        $penjualan = $result['penjualan'];

        return response()->json([
            'nomor_nota'  => $penjualan->nomor_nota,
            'tanggal_jual'=> $penjualan->tanggal_jual,
            'total_jual'  => (float) $penjualan->total_jual,
            'total_hpp'   => (float) $penjualan->total_hpp,
            'laba_kotor'  => (float) $penjualan->laba_kotor,
            'items'       => $penjualan->detailPenjualan->map(fn ($d) => [
                'nama_menu' => $d->menu->nama_menu,
                'qty'       => $d->qty,
                'subtotal'  => (float) $d->subtotal,
                'hpp_menu'  => (float) $d->hpp_menu,
            ]),
        ], 201);
    }
}
```

### 5.5 Routes & Middleware

```php
<?php
// routes/api.php

use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', fn () => auth()->user());

    // Master data
    Route::apiResource('/pegawai', PegawaiController::class);
    Route::apiResource('/menu', MenuController::class);
    Route::apiResource('/bahan', BahanBakuController::class);

    // Pembelian & Penjualan
    Route::apiResource('/pembelian', PembelianController::class)->only(['index','store','show']);
    Route::apiResource('/penjualan', PenjualanController::class)->only(['index','store','show']);

    // Persediaan
    Route::get('/persediaan', [PersediaanController::class, 'index']);
    Route::post('/persediaan/cek', [PersediaanController::class, 'cekKetersediaan']); // ⬅ WAJIB didaftarkan

    // Laporan (Manager only)
    Route::middleware('role:manager')->group(function () {
        Route::get('/laporan/penjualan', [LaporanController::class, 'penjualan']);
        Route::get('/laporan/hpp', [LaporanController::class, 'hpp']);
        Route::get('/laporan/laba-rugi', [LaporanController::class, 'labaRugi']);
    });
});
```

**Registrasi middleware `role` di Laravel 11** (`bootstrap/app.php`):

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\RoleMiddleware::class,
    ]);
})
```

```php
<?php
// app/Http/Middleware/RoleMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        if ($request->user()?->peran !== $role) {
            abort(403, 'Anda tidak memiliki akses');
        }
        return $next($request);
    }
}
```

> ⚠️ Tanpa registrasi ini, semua route `role:manager` akan **error 500**.

---

## 6. Frontend — Next.js

### 6.1 Struktur Folder (`apps/web`)

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # sidebar + auth guard
│   │   ├── kasir/page.tsx
│   │   ├── master/{menu,bahan,pegawai}/
│   │   ├── pembelian/page.tsx
│   │   └── laporan/{penjualan,hpp,laba-rugi}/
│   ├── layout.tsx               # root layout
│   └── globals.css
├── components/{providers,layout,kasir,master}/
├── hooks/{use-auth,use-cart,use-stock}.ts
├── lib/{api,utils}.ts
└── types/index.ts
```

### 6.2 API Client (`lib/api.ts`)

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message || 'Terjadi kesalahan';
    switch (error.response?.status) {
      case 401:
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        break;
      case 403: toast.error('Anda tidak memiliki akses'); break;
      case 422: toast.error(message); break;
      case 500: toast.error('Server error, silakan coba lagi'); break;
      default:  toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6.3 Hook Keranjang (`hooks/use-cart.ts`)

```typescript
'use client';
import { useState, useCallback, useEffect } from 'react';
import { CartItem, Menu } from '@/types';
import { toast } from 'sonner';

const STORAGE_KEY = 'homwok_cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setItems(JSON.parse(saved)); } catch { localStorage.removeItem(STORAGE_KEY); } }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = useCallback((menu: Menu) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id_menu === menu.id_menu);
      if (existing) {
        const qty = existing.qty + 1;
        return prev.map((i) => i.id_menu === menu.id_menu
          ? { ...i, qty, subtotal: qty * i.harga_jual } : i);
      }
      return [...prev, { id_menu: menu.id_menu, nama_menu: menu.nama_menu,
        harga_jual: menu.harga_jual, qty: 1, subtotal: menu.harga_jual }];
    });
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) return setItems((p) => p.filter((i) => i.id_menu !== id));
    setItems((p) => p.map((i) => i.id_menu === id
      ? { ...i, qty, subtotal: qty * i.harga_jual } : i));
  }, []);

  const removeItem = useCallback((id: number) =>
    setItems((p) => p.filter((i) => i.id_menu !== id)), []);
  const clearCart = useCallback(() => {
    setItems([]); localStorage.removeItem(STORAGE_KEY);
  }, []);

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return { items, addItem, updateQty, removeItem, clearCart, total, itemCount, isHydrated };
}
```

### 6.4 Auth Provider (`components/providers/auth-provider.tsx`)

```typescript
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Pegawai, LoginCredentials, AuthResponse } from '@/types';

interface AuthContextType {
  user: Pegawai | null;
  login: (c: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Pegawai | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchProfile(); else setIsLoading(false);
  }, []);

  const fetchProfile = async () => {
    try { const { data } = await api.get('/me'); setUser(data); }
    catch { localStorage.removeItem('token'); }
    finally { setIsLoading(false); }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/login', credentials);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      router.push(data.user.peran === 'manager' ? '/laporan/penjualan' : '/kasir');
    } finally { setIsLoading(false); }
  };

  const logout = () => {
    api.post('/logout').catch(() => {});
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

> ⚠️ **Auth strategy — pilih SATU.** Contoh ini pakai token di `localStorage` + client-side guard (`AuthProvider` + `redirect` di dashboard layout). **Jangan** dikombinasikan dengan `middleware.ts` yang baca `cookies.get('token')` — middleware jalan di edge/server dan tidak bisa akses localStorage. Detail di [§9](#9-known-issues--perbaikan).

### 6.5 UI — shadcn/ui (Tema Hitam-Putih)

CSS variables (`packages/ui/src/styles.css`):

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --primary: 0 0% 0%;             /* Hitam pekat */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --destructive: 0 84% 60%;
    --border: 0 0% 90%;
    --ring: 0 0% 0%;
    --radius: 0.25rem;              /* sudut tajam, minimalis */
  }
  .dark {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
    --primary: 0 0% 100%;
    --primary-foreground: 0 0% 0%;
    --border: 0 0% 20%;
    --ring: 0 0% 100%;
  }
}
```

Font: **Inter** (sans) untuk UI, **JetBrains Mono** untuk struk. Aksen visual pakai *hard shadow* brutalist: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`.

Komponen shadcn yang dipakai: `button, input, label, select, table, dialog, dropdown-menu, card, badge, separator, skeleton, tabs, popover, calendar, scroll-area, sheet, alert, alert-dialog, checkbox, textarea, tooltip, command`. Plus komponen custom POS: `pos-button, menu-card, cart-item, receipt`.

---

## 7. Setup Step-by-Step

```bash
# 1. Inisialisasi monorepo
npx create-turbo@latest homwok-coffee   # pilih pnpm
cd homwok-coffee

# 2. Frontend (apps/web)
cd apps && rm -rf docs web
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --no-git
cd web
pnpm add axios sonner lucide-react @tanstack/react-query @tanstack/react-query-devtools

# 3. Backend (apps/api)
cd ../.. && mkdir -p apps/api && cd apps/api
composer create-project laravel/laravel .
composer require laravel/sanctum maatwebsite/excel barryvdh/laravel-dompdf

# 4. Shared UI (packages/ui) — shadcn
cd ../../packages/ui
pnpm dlx shadcn@latest init          # CLI baru: `shadcn`, bukan `shadcn-ui`
pnpm dlx shadcn@latest add button input table dialog card badge sheet

# 5. Install semua + jalankan
cd ../..
pnpm install
pnpm dev                              # jalankan web + api paralel via turbo
```

**Environment (`apps/web/.env.local`):**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=Homwok Coffee
```

**Migrate & seed (Laravel):**

```bash
cd apps/api
php artisan migrate --seed
php artisan serve --port=8000
```

> ⚠️ CLI `npx shadcn-ui@latest` sudah **di-rename** jadi `npx shadcn@latest`. Yang lama masih jalan tapi akan dihapus.

---

## 8. Fitur Tambahan

### 8.1 Laporan + Export (Excel / PDF)

`LaporanController` menyediakan laporan penjualan, HPP detail (rincian potongan FIFO per transaksi), dan laba-rugi kotor, semuanya dengan filter periode `from`/`to`. Parameter `?export=excel` memakai **Maatwebsite Excel**, `?export=pdf` memakai **DomPDF**.

Di frontend, download file pakai `responseType: 'blob'`:

```typescript
const handleExport = async (type: 'excel' | 'pdf') => {
  const res = await api.get('/laporan/penjualan', {
    params: { from, to, export: type },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-penjualan-${from}-to-${to}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

### 8.2 Real-time Stok Warning

- `GET /persediaan` → sisa stok + nilai persediaan semua bahan, status `ok`/`warning` (dibanding `stok_minimum`).
- `POST /persediaan/cek` → pre-transaction check sebelum item masuk keranjang.
- Frontend polling tiap 30 detik via TanStack Query (`refetchInterval: 30000`), badge stok muncul di menu card.

### 8.3 Diskon & Promo

Diskon didukung di **dua level**: per-item (`diskon_persen` / `diskon_nominal`) dan per-transaksi, plus pajak opsional. Perhitungan grand total:

```
subtotal
  − diskon item
  − diskon transaksi
  + pajak
= grand_total
laba_kotor = grand_total − total_hpp
```

### 8.4 Multi-currency (opsional)

Helper `formatCurrency(amountIdr, 'USD')` mengonversi dari IDR pakai rate statis. Untuk produksi, ambil rate dari API kurs, jangan hardcode.

---

## 9. Known Issues & Perbaikan

Isu-isu berikut ada di draft awal dan **sudah diperbaiki** dalam dokumen ini. Dicatat sebagai referensi.

| # | Isu | Dampak | Perbaikan |
|---|-----|--------|-----------|
| 1 | **Auth mismatch** — token di `localStorage`, tapi `middleware.ts` baca dari cookie | Route protection tidak jalan / redirect loop | Pilih satu strategi. Dokumen ini pakai localStorage + client guard, **tanpa** middleware cookie. Alternatif lebih aman: simpan token di cookie `httpOnly` agar middleware bisa baca |
| 2 | Route `POST /persediaan/cek` **tidak didaftarkan** | Pre-transaction check 404 | Ditambahkan di `routes/api.php` |
| 3 | `turbo.json` pakai key `"pipeline"` | `turbo` error di v2.x | Diganti `"tasks"` |
| 4 | Middleware `role:manager` **tidak diregistrasi** | Semua route laporan 500 | Registrasi alias + class `RoleMiddleware` |
| 5 | `generateNomorNota` race condition | Nomor nota kembar → unique violation | Tambah `lockForUpdate()` pada query baris terakhir |
| 6 | `next.config.js` pakai `images.domains` | Deprecated | Ganti `images.remotePatterns` |
| 7 | CLI `shadcn-ui` | Sudah di-rename | Pakai `shadcn` |
| 8 | `<style jsx>` di shared `packages/ui` | styled-jsx = fitur Next, riskan di lib framework-agnostic | Pindah ke CSS print biasa (`@media print`) |
| 9 | Relasi `BahanBaku::detailPembelian` | Dipakai controller tapi tak terdefinisi | Ditambahkan di model |
| 10 | `laba_kotor` beda definisi antar versi | Inkonsistensi angka | Konsisten: `grand_total − total_hpp` (setelah diskon + pajak) |

**Catatan FIFO/HPP:** konsep & test case (6.000 g → Rp 735.000) sudah **valid**. Satu-satunya penajaman: `tanggal_beli` diubah ke `datetime` untuk presisi lot per jam.

### `next.config.js` yang benar

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      // tambahkan domain gambar menu produksi di sini
    ],
  },
};
module.exports = nextConfig;
```

---

## 10. Checklist Deploy

- [ ] Environment variables di-set (`NEXT_PUBLIC_API_URL`)
- [ ] CORS di Laravel mengizinkan domain frontend (`config/cors.php`)
- [ ] Strategi auth sudah tunggal & konsisten (localStorage **atau** cookie, tidak campur)
- [ ] `turbo.json` pakai `"tasks"` (bukan `"pipeline"`)
- [ ] Middleware `role` teregistrasi di `bootstrap/app.php`
- [ ] Route `/persediaan/cek` terdaftar
- [ ] `generateNomorNota` sudah pakai lock
- [ ] `npm run build` (web) bersih tanpa error TypeScript
- [ ] Migrasi & seeder jalan bersih (`php artisan migrate:fresh --seed`)
- [ ] Unit test FIFO lulus (`php artisan test`)
- [ ] Test manual: login → kasir → checkout → struk → laporan export

---

## Lampiran — Unit Test FIFO

```php
<?php
// tests/Unit/FifoCalculatorTest.php

use App\Services\FifoCostCalculator;
use App\Models\{BahanBaku, Menu, Pegawai, Pembelian, DetailPembelian};
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('menghitung HPP FIFO dengan benar', function () {
    $bahan   = BahanBaku::create(['nama_bahan' => 'Kopi', 'satuan' => 'g', 'stok_minimum' => 1000]);
    $pegawai = Pegawai::factory()->create();

    // 3 lot: 5000g @120, @135, @150
    foreach ([['B001','2026-01-01',120], ['B002','2026-01-05',135], ['B003','2026-01-10',150]] as $l) {
        $beli = Pembelian::create([
            'id_pegawai' => $pegawai->id_pegawai, 'nomor_pembelian' => $l[0],
            'tanggal_beli' => $l[1], 'pemasok' => 'X', 'total_beli' => 5000 * $l[2],
        ]);
        DetailPembelian::create([
            'id_pembelian' => $beli->id_pembelian, 'id_bahan' => $bahan->id_bahan,
            'qty_awal' => 5000, 'sisa_qty' => 5000, 'harga_beli' => $l[2],
        ]);
    }

    $menu = Menu::create(['nama_menu' => 'Kopi Hitam', 'kategori' => 'Minuman', 'harga_jual' => 50000]);
    $menu->resep()->create(['id_bahan' => $bahan->id_bahan, 'takaran' => 6000, 'satuan' => 'g']);

    $result = (new FifoCostCalculator())->prosesPenjualan(
        [['id_menu' => $menu->id_menu, 'qty' => 1]], $pegawai->id_pegawai
    );

    // HPP = 5000×120 + 1000×135 = 735.000
    expect($result['success'])->toBeTrue();
    expect((float) $result['penjualan']->total_hpp)->toEqual(735000.00);

    expect((float) DetailPembelian::find(1)->sisa_qty)->toEqual(0.0);     // lot 1 habis
    expect((float) DetailPembelian::find(2)->sisa_qty)->toEqual(4000.0);  // lot 2 sisa 4000
});
```
