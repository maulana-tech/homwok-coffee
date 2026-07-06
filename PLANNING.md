# Homwok Coffee POS — Planning & Roadmap

> Point of Sale coffee shop dengan **perhitungan HPP (COGS) otomatis berbasis FIFO**.
> Monorepo Turborepo + pnpm: **Next.js 14** (`apps/web`) + **Laravel** (`apps/api`), paket bersama `@homwok/{ui,types,lib}`.
> Dokumen blueprint: `homwok-coffee-pos.md` (sistem/FIFO) & `homwok-coffee-frontend.md` (UI).

_Terakhir diperbarui: 2026-07-06._

---

## 1. Arsitektur

```
homwok-coffee/
├── apps/
│   ├── web/     # Next.js 14 App Router — UI POS (Tailwind v4, TanStack Query)
│   └── api/     # Laravel — REST API + FIFO/HPP engine (Sanctum, sqlite default)
└── packages/
    ├── ui/      # @homwok/ui — design system (shadcn v4 + komponen POS)
    ├── types/   # @homwok/types — kontrak tipe (mirror field snake_case API)
    └── lib/     # @homwok/lib — formatRupiah, formatDate, formatDateTime
```

- **Auth**: token Sanctum di `localStorage` + client-side guard (bukan middleware cookie).
- **Tema**: soft neo-brutalism hitam-putih (border tipis, sudut membulat, shadow lembut).
- **Inti bisnis**: `FifoCostCalculator` — tiap penjualan mengkonsumsi lot bahan tertua dulu, mencatat audit `pemakaian_bahan`, menghitung HPP & laba kotor dalam satu transaksi ber-lock.

---

## 2. Status saat ini

### ✅ Selesai
**Design system (`@homwok/ui`)**
- 16 primitives shadcn (Tailwind v4) + 4 komponen POS: `POSButton`, `MenuCard`, `CartItem`, `Receipt`.
- Tema soft: `border border-border`, `rounded-lg`, `shadow-md/lg`, `font-bold`, netral hitam-putih.

**Frontend (`apps/web`) — semua halaman (mode sample data)**
- Login + dashboard layout (auth guard) + sidebar/navbar role-based.
- **Kasir**: grid menu + filter kategori, keranjang (panel/sheet responsif), checkout + struk cetak.
- **Master**: menu, bahan baku, pegawai (tabel + CRUD dialog). Menu punya **foto** (upload + preview, thumbnail di tabel, fallback ikon per kategori di kartu kasir).
- **Pembelian**: list + form multi-baris (tiap baris = lot FIFO).
- **Laporan**: penjualan, HPP, laba-rugi + tombol export (stub).
- Infra: `lib/api.ts` (axios + Bearer), providers (auth+query), `hooks/use-cart`, `hooks/use-data`.

**Backend (`apps/api`) — kode lengkap**
- `FifoCostCalculator` (transaksi + `lockForUpdate`, konsumsi FIFO, audit trail).
- `AuthController` (login/logout/me), CRUD `Menu/BahanBaku/Pegawai/Resep` (Menu: upload foto ke disk `public`, accessor `foto_url`).
- `PembelianController` (buat lot), `PenjualanController` (FIFO), `PersediaanController` (stok + `/cek`), `LaporanController` (JSON + export CSV/PDF, manager-only).
- Wiring: `bootstrap/app.php` (api routing + alias `role`), `routes/api.php`, `RoleMiddleware`, `config/cors.php`, `.env` (sqlite).
- Model: `$casts` + relasi `BahanBaku`, scope `tersedia()`.
- Test: `tests/Feature/FifoCalculatorTest.php` (6.000 g → HPP Rp 735.000).

### 🚧 Belum / catatan
- **Backend belum dijalankan** — PHP/Composer belum terpasang di mesin dev; kode belum diverifikasi runtime.
- **Frontend masih pakai sample data** — belum disambungkan ke API sungguhan.
- Export laporan: `excel` = CSV sederhana (belum pakai maatwebsite/excel), `pdf` = DomPDF.

---

## 3. Roadmap bertahap

### Fase A — Jalankan backend _(butuh PHP 8.3 + Composer)_
```bash
cd apps/api
composer install
php artisan key:generate          # .env sudah tersedia (sqlite)
touch database/database.sqlite
php artisan migrate --seed
php artisan storage:link          # symlink public/storage → storage/app/public (foto menu)
php artisan test                  # verifikasi FifoCalculatorTest hijau
php artisan serve --port=8000     # http://localhost:8000/api
```

### Fase B — Sambungkan frontend → API
- `apps/web/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
- Ganti `queryFn` di `hooks/use-data.ts` dari sample → `api.get(...)`.
- Ganti `AuthProvider.login` dari sample → `api.post('/login', ...)`.
- Sambungkan checkout kasir → `POST /penjualan`, form master/pembelian → endpoint terkait.
- Hapus/kecilkan `lib/sample-data.ts` setelah semua nyambung.

### Fase C — Kelengkapan fitur
- Diskon per-item & per-transaksi + pajak (kolom sudah ada di skema).
- Persediaan real-time di kartu menu (polling `GET /persediaan`, badge stok).
- Pre-check stok sebelum checkout (`POST /persediaan/cek`).
- Export Excel asli (maatwebsite/excel) menggantikan CSV.
- Manajemen resep di UI (halaman/tab resep per menu).

### Fase D — Produksi
- Pindah DB ke MySQL/PostgreSQL (FIFO lock sesungguhnya jalan).
- CORS domain produksi, HTTPS, env terpisah.
- CI: `pnpm build` + `php artisan test` hijau.
- Deploy web (Vercel) + api (VPS/Forge).

---

## 4. Endpoint API

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/login` | publik | Login → token + user |
| GET/POST | `/api/logout`, `/api/me` | auth | Sesi |
| apiResource | `/api/menu`, `/api/bahan`, `/api/pegawai` | auth | Master CRUD |
| GET/POST/DELETE | `/api/resep` | auth | Komposisi menu |
| GET/POST/GET | `/api/pembelian` | auth | Pembelian → lot FIFO |
| GET/POST/GET | `/api/penjualan` | auth | Penjualan → FIFO/HPP |
| GET/POST | `/api/persediaan`, `/api/persediaan/cek` | auth | Stok & pre-check |
| GET | `/api/laporan/{penjualan,hpp,laba-rugi}` | **manager** | Laporan + export |

Login seed: `barista/password`, `manager/password`.

---

## 5. Keputusan desain (kenapa begini)

- **Tailwind v4** (bukan v3 dari dokumen) → mengikuti scaffold yang sudah terpasang.
- **Sample-data mode** dulu → UI bisa didemokan tanpa backend jalan; wiring 1 baris per hook saat siap.
- **Auth localStorage + client guard** (bukan cookie middleware) → hindari redirect loop (lihat known-issues di `homwok-coffee-pos.md` §9).
- **`turbo.json`** sudah diperbaiki `pipeline` → `tasks` (Turbo 2.x).
- **`composer.json`** dep fiktif `laravel/pao` dibuang agar `composer install` tidak gagal.
