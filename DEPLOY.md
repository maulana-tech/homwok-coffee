# Panduan Deploy — Homwok Coffee POS

Panduan men-deploy monorepo ini ke produksi:

- **Frontend (Next.js 14, `apps/web`) → Vercel**
- **Backend (Laravel 13 / PHP 8.3, `apps/api`) → Railway** (+ database MySQL/PostgreSQL)

```
                 HTTPS                         HTTPS
  Pengguna  ─────────────►  Vercel  ─────────────────►  Railway
  (browser)                (Next.js)   fetch /api/*      (Laravel API)
                                                            │
                                                            ▼
                                                   Railway MySQL/Postgres
                                                   + Volume (foto menu)
```

> ⚠️ **Baca dulu:** frontend saat ini masih memakai **sample data** (`lib/sample-data.ts`), belum
> memanggil API sungguhan (lihat *Fase B* di `PLANNING.md`). Artinya:
> - Deploy Vercel **sudah bisa dilakukan sekarang** dan UI akan tampil normal dengan data contoh.
> - Deploy Railway menyiapkan API-nya, tapi baru benar-benar terpakai setelah wiring Fase B selesai
>   (ganti `queryFn` di `hooks/use-data.ts` & `AuthProvider.login` ke `api.get/post`).

---

## 0. Prasyarat

- Repo sudah di GitHub (`maulana-tech/homwok-coffee`).
- Akun **Vercel** dan **Railway** (bisa login pakai GitHub).
- PHP 8.3 + Composer terpasang di lokal **hanya** untuk menghasilkan `APP_KEY`
  (`php artisan key:generate --show`). Kalau belum ada PHP, `APP_KEY` bisa dibuat lewat
  Railway shell setelah service jalan.

Urutan yang disarankan: **API dulu** (Railway) → catat domainnya → **Web** (Vercel) pakai domain itu →
balik set `FRONTEND_URL` di Railway → redeploy API.

---

## A. Deploy API Laravel ke Railway

### A.1 Buat project + database
1. **New Project** di Railway → **Deploy from GitHub repo** → pilih repo ini.
2. Tambah database: **+ New → Database → MySQL** (atau PostgreSQL). Railway otomatis membuat
   variabel koneksi (`MYSQLHOST`, `MYSQLPORT`, dst.).

### A.2 Atur service API (monorepo)
Buka service aplikasi → **Settings**:
- **Root Directory**: `apps/api`  ← wajib, karena Laravel ada di subfolder.
- **Builder**: Nixpacks (default; otomatis mendeteksi PHP/Laravel dari `composer.json`).
- **Start Command** (Settings → Deploy → Custom Start Command):

  ```bash
  php artisan migrate --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port $PORT
  ```

  > `migrate --force` idempotent (aman dijalankan tiap deploy). `artisan serve` cukup untuk skala
  > TA/demo. Untuk trafik nyata, ganti ke Nginx + PHP-FPM atau Laravel Octane.

### A.3 Environment Variables
Service API → **Variables** → tambahkan:

| Variable | Nilai | Catatan |
|---|---|---|
| `APP_NAME` | `Homwok Coffee` | |
| `APP_ENV` | `production` | |
| `APP_KEY` | `base64:...` | dari `php artisan key:generate --show` |
| `APP_DEBUG` | `false` | **jangan** `true` di produksi |
| `APP_URL` | `https://<domain-railway>` | isi setelah generate domain (A.4) |
| `APP_LOCALE` | `id` | |
| `LOG_CHANNEL` | `stack` | |
| `LOG_LEVEL` | `error` | |
| `DB_CONNECTION` | `mysql` | atau `pgsql` |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` | pakai *reference variable* Railway |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` | |
| `DB_DATABASE` | `${{MySQL.MYSQLDATABASE}}` | |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` | |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` | |
| `SESSION_DRIVER` | `database` | tabel `sessions` sudah ada di migration |
| `CACHE_STORE` | `database` | tabel `cache` sudah ada |
| `QUEUE_CONNECTION` | `sync` | paling sederhana; tak perlu worker terpisah |
| `FILESYSTEM_DISK` | `public` | foto menu disimpan di disk `public` |
| `FRONTEND_URL` | `https://<domain-vercel>` | **untuk CORS** — isi setelah Web dideploy (Bagian C) |

> **PostgreSQL?** Ganti `DB_CONNECTION=pgsql`, `DB_PORT=5432`, dan pakai referensi
> `${{Postgres.PGHOST}}`, `${{Postgres.PGDATABASE}}`, `${{Postgres.PGUSER}}`, `${{Postgres.PGPASSWORD}}`.

### A.4 Domain publik
Settings → **Networking → Generate Domain**. Akan muncul mis.
`https://homwok-api-production.up.railway.app`.
- Set `APP_URL` ke domain itu.
- **Base URL API** yang dipakai frontend = domain itu **+ `/api`**, contoh:
  `https://homwok-api-production.up.railway.app/api`.

### A.5 Perintah sekali-jalan (Railway shell / `railway run`)
Setelah deploy pertama sukses, jalankan sekali:

```bash
php artisan storage:link      # symlink foto menu (public/storage → storage/app/public)
php artisan db:seed           # akun awal: barista/password & manager/password
```

> `storage:link` **tidak** dimasukkan ke Start Command karena error bila symlink sudah ada.

### A.6 Penyimpanan foto menu (PENTING)
Filesystem Railway **ephemeral** — file yang di-upload (foto menu) **hilang** saat redeploy/restart.
Pilih salah satu:

- **Railway Volume (paling simpel untuk TA):** service → **+ Volume**, mount ke
  `/app/apps/api/storage/app/public`. Foto jadi persisten.
- **S3 / object storage (produksi nyata):** set `FILESYSTEM_DISK=s3` + kredensial `AWS_*`.
  `Storage::url()` di model `Menu` otomatis mengembalikan URL yang benar.

### A.7 Kalau build gagal karena ekstensi PHP
`barryvdh/laravel-dompdf` & `maatwebsite/excel` butuh ekstensi (`gd`, `zip`, `mbstring`, `dom`).
Bila Nixpacks tak menyertakannya, tambahkan file **`apps/api/nixpacks.toml`**:

```toml
[phases.setup]
nixPkgs = ["php83", "php83Extensions.gd", "php83Extensions.zip", "php83Packages.composer"]
```

---

## B. Deploy Web Next.js ke Vercel

### B.1 Import project
1. Vercel → **Add New → Project** → import repo yang sama.
2. **Root Directory**: `apps/web`. Vercel mendeteksi **Next.js** & workspace **pnpm** otomatis
   (paket `@homwok/*` ikut ter-*transpile* via `transpilePackages` di `next.config.js`).
3. Build/Install command: biarkan default (`next build` / `pnpm install`). Tak perlu diubah.

### B.2 Environment Variable
Project → **Settings → Environment Variables**:

| Variable | Nilai | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<domain-railway>/api` | Production (+ Preview bila perlu) |

> ⚠️ Variabel `NEXT_PUBLIC_*` **di-*inline* saat build**. Kalau diubah, **redeploy** agar
> nilai barunya ikut. Pastikan **ada `/api`** di akhir (baseURL axios menyertakannya).

### B.3 Deploy
Klik **Deploy**. Setelah selesai, catat domain Vercel (mis. `https://homwok-coffee.vercel.app`).

---

## C. Hubungkan keduanya (CORS)

1. Di **Railway** → Variables → set `FRONTEND_URL` = domain Vercel (mis. `https://homwok-coffee.vercel.app`,
   **tanpa** trailing slash). `config/cors.php` sudah membaca env ini.
2. Redeploy service API (Railway → Deploy) agar CORS memuat origin baru.
3. Kalau nanti pakai domain kustom, tambahkan juga ke daftar origin di `config/cors.php`.

---

## D. Checklist verifikasi

- [ ] `https://<railway>/api/login` merespons (405/422 untuk GET itu wajar — artinya route hidup).
- [ ] `php artisan migrate` sukses (tabel domain + framework terbuat).
- [ ] `db:seed` sukses → bisa `POST /api/login` dengan `manager` / `password` → dapat `token`.
- [ ] `storage:link` sudah dijalankan **dan** Volume/S3 aktif → foto menu persisten.
- [ ] Vercel build hijau, situs terbuka, tak ada error konsol.
- [ ] Setelah **Fase B**: dari situs Vercel, request ke `/api/*` **tidak** kena CORS
      (cek tab Network — status 200, bukan error CORS).

---

## E. Catatan penting

- **SQLite → MySQL/Postgres.** Default lokal `sqlite`; di Railway wajib DB sungguhan (SQLite tak
  persisten di filesystem ephemeral). Migrasi kita pakai Blueprint standar → jalan di keduanya.
- **Secrets.** Jangan commit `.env`/`APP_KEY`/kredensial DB. Semua diisi lewat dashboard
  Railway/Vercel. `.env` sudah di-`.gitignore`.
- **HTTPS** otomatis di Vercel & Railway. `APP_URL` harus `https://` agar URL foto (`Storage::url`) benar.
- **Auth stateless (Bearer token)** → tak butuh `SANCTUM_STATEFUL_DOMAINS`/cookie domain →
  konfigurasi CORS jadi sederhana (cukup `FRONTEND_URL`).
- **Biaya.** Vercel Hobby gratis; Railway pakai kuota trial/berlangganan (service + DB + volume).
- **Frontend belum ter-wiring ke API** (Fase B). Deploy tetap berhasil dengan sample data;
  selesaikan Fase B agar situs benar-benar memakai API di Railway.

---

## F. Troubleshooting

| Gejala | Kemungkinan sebab & solusi |
|---|---|
| Web kena **CORS error** saat call API | `FRONTEND_URL` di Railway belum = domain Vercel, atau API belum redeploy. |
| `No application encryption key` | `APP_KEY` belum diset. Isi via `key:generate --show`. |
| Foto menu hilang setelah redeploy | Filesystem ephemeral — pasang **Volume** atau pindah ke **S3** (A.6). |
| Foto 404 walau baru upload | `php artisan storage:link` belum dijalankan (A.5). |
| Build Railway gagal (ext PHP) | Tambah `apps/api/nixpacks.toml` (A.7). |
| `NEXT_PUBLIC_API_URL` tak berubah | Ingat: di-inline saat build → **redeploy** Vercel. |
| 500 tapi log kosong | Sementara set `APP_DEBUG=true` untuk lihat error, lalu **kembalikan `false`**. |
| Migrasi gagal `database is locked`/timeout | Pastikan `DB_*` menunjuk ke DB Railway (bukan sqlite). |

---

_Rujukan terkait: `PLANNING.md` (Fase A–D & wiring), `CLAUDE.md` (arsitektur), `homwok-coffee-pos.md` (sistem)._
