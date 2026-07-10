# BAB IV
# IMPLEMENTASI DAN PEMBAHASAN

Bab ini menguraikan tahap implementasi sistem Point of Sale (POS) Homwok Coffee
yang telah dirancang pada BAB III, beserta pengujian dan pembahasan hasilnya.
Fokus utama sistem ini adalah **perhitungan Harga Pokok Penjualan (HPP/COGS)
secara otomatis berbasis metode FIFO (First In First Out)** pada setiap
transaksi penjualan. Implementasi mencakup basis data, antarmuka pengguna,
algoritma inti perhitungan HPP, layanan API, hingga pengujian sistem.

---

## 4.1 Lingkungan Implementasi

Implementasi sistem dilakukan pada lingkungan pengembangan dengan spesifikasi
perangkat keras dan perangkat lunak sebagai berikut.

### 4.1.1 Perangkat Keras

| Komponen  | Spesifikasi (contoh, sesuaikan dengan perangkat Anda) |
|-----------|--------------------------------------------------------|
| Prosesor  | Apple M-series / Intel Core i5 setara ke atas          |
| RAM       | 8 GB                                                   |
| Penyimpanan | SSD 256 GB                                           |
| Tampilan  | Resolusi 1920 × 1080                                    |

### 4.1.2 Perangkat Lunak

| Kategori            | Perangkat Lunak / Teknologi                          |
|---------------------|------------------------------------------------------|
| Sistem Operasi      | macOS / Windows 10+                                   |
| Bahasa Backend      | PHP 8.3                                               |
| Framework Backend   | Laravel 13 (REST API + Sanctum)                       |
| Bahasa Frontend     | TypeScript                                            |
| Framework Frontend  | Next.js 14 (App Router), React 18                     |
| Styling             | Tailwind CSS v4, shadcn/ui                            |
| Basis Data          | SQLite (pengembangan) / MySQL (produksi)             |
| Manajemen Paket     | Composer (PHP), pnpm (JavaScript)                     |
| Arsitektur Proyek   | Monorepo (Turborepo)                                  |
| Editor & Tools      | Visual Studio Code, Git, GitHub                       |

### 4.1.3 Arsitektur Sistem

Sistem dibangun dengan arsitektur **client–server** yang terpisah (*decoupled*)
dalam satu *monorepo*:

- **`apps/api`** — Backend Laravel yang menyediakan REST API dan menjadi
  tempat seluruh logika bisnis, termasuk mesin perhitungan HPP FIFO.
- **`apps/web`** — Frontend Next.js yang menyajikan antarmuka kasir dan
  manajemen, berkomunikasi dengan backend melalui HTTP (axios) dengan
  autentikasi token *Bearer* (Sanctum).
- **`packages/`** — Paket bersama: `@homwok/ui` (komponen antarmuka),
  `@homwok/types` (kontrak tipe data), dan `@homwok/lib` (fungsi bantu format).

Alur komunikasi: Frontend mengirim permintaan (mis. proses penjualan) ke API →
API memproses (menghitung HPP, mengurangi stok, menyimpan transaksi) → API
mengembalikan respons JSON → Frontend menampilkan hasil kepada pengguna.

---

## 4.2 Implementasi Basis Data

Basis data terdiri dari **9 tabel domain** yang dibuat melalui satu berkas
migrasi Laravel. Struktur tabel menggunakan penamaan berbahasa Indonesia dengan
*primary key* khusus (mis. `id_menu`, `id_bahan`).

### 4.2.1 Struktur Tabel

**1. Tabel `pegawai`** — data pengguna/staf sekaligus entitas autentikasi.

| Kolom          | Tipe                         | Keterangan                    |
|----------------|------------------------------|-------------------------------|
| id_pegawai     | bigint (PK)                  | Kunci utama                   |
| nama_lengkap   | string                       | Nama staf                     |
| username       | string (unik)                | Nama pengguna login           |
| kata_sandi     | string                       | Kata sandi (ter-*hash*)       |
| peran          | enum('barista','manager')    | Hak akses                     |
| aktif          | boolean                      | Status keaktifan              |

**2. Tabel `menu`** — katalog produk yang dijual.

| Kolom      | Tipe            | Keterangan                          |
|------------|-----------------|-------------------------------------|
| id_menu    | bigint (PK)     | Kunci utama                         |
| nama_menu  | string          | Nama menu                           |
| kategori   | string          | Kategori (Coffee, Non Coffee, dll.) |
| harga_jual | decimal(15,2)   | Harga jual                          |
| foto       | string (null)   | Path foto di disk `public`          |
| aktif      | boolean         | Status ketersediaan                 |

**3. Tabel `bahan_baku`** — data bahan mentah.

| Kolom        | Tipe          | Keterangan                       |
|--------------|---------------|----------------------------------|
| id_bahan     | bigint (PK)   | Kunci utama                      |
| nama_bahan   | string        | Nama bahan                       |
| satuan       | string        | Satuan (gram, ml, pcs, dll.)     |
| stok_minimum | decimal(12,2) | Ambang batas stok minimum        |

**4. Tabel `resep`** — komposisi bahan tiap menu (relasi menu ↔ bahan).

| Kolom    | Tipe          | Keterangan                        |
|----------|---------------|-----------------------------------|
| id_resep | bigint (PK)   | Kunci utama                       |
| id_menu  | bigint (FK)   | Menu terkait                      |
| id_bahan | bigint (FK)   | Bahan yang digunakan              |
| takaran  | decimal(12,2) | Jumlah bahan per porsi            |
| satuan   | string        | Satuan takaran                    |

**5. Tabel `pembelian`** — header transaksi pembelian bahan.

| Kolom           | Tipe          | Keterangan                 |
|-----------------|---------------|----------------------------|
| id_pembelian    | bigint (PK)   | Kunci utama                |
| id_pegawai      | bigint (FK)   | Petugas pembelian          |
| nomor_pembelian | string (unik) | Nomor PO                   |
| tanggal_beli    | date          | Tanggal pembelian          |
| pemasok         | string        | Nama pemasok               |
| total_beli      | decimal(15,2) | Total nilai pembelian      |

**6. Tabel `detail_pembelian`** — **setiap baris = satu lot FIFO**.

| Kolom               | Tipe          | Keterangan                          |
|---------------------|---------------|-------------------------------------|
| id_detail_pembelian | bigint (PK)   | Kunci utama                         |
| id_pembelian        | bigint (FK)   | Header pembelian                    |
| id_bahan            | bigint (FK)   | Bahan yang dibeli                   |
| qty_awal            | decimal(12,2) | Kuantitas awal lot                  |
| **sisa_qty**        | decimal(12,2) | **Sisa kuantitas lot (kunci FIFO)** |
| **harga_beli**      | decimal(15,2) | **Harga beli per satuan (kunci HPP)** |
| tanggal_kadaluarsa  | date (null)   | Tanggal kedaluwarsa                 |

Diberi indeks `['id_bahan', 'sisa_qty']` untuk mempercepat pencarian lot
tersedia.

**7. Tabel `penjualan`** — header transaksi penjualan.

| Kolom        | Tipe          | Keterangan                        |
|--------------|---------------|-----------------------------------|
| id_penjualan | bigint (PK)   | Kunci utama                       |
| id_pegawai   | bigint (FK)   | Kasir                             |
| nomor_nota   | string (unik) | Nomor nota (NJ-YYYYMMDD-XXX)      |
| tanggal_jual | dateTime      | Waktu transaksi                   |
| total_jual   | decimal(15,2) | Total penjualan                   |
| total_diskon | decimal(15,2) | Total diskon                      |
| pajak        | decimal(15,2) | Pajak                             |
| grand_total  | decimal(15,2) | Total akhir                       |
| **total_hpp**| decimal(15,2) | **Total HPP hasil FIFO**          |
| **laba_kotor**| decimal(15,2)| **Laba kotor (grand_total − HPP)**|

**8. Tabel `detail_penjualan`** — baris per menu pada satu nota.

| Kolom              | Tipe          | Keterangan                    |
|--------------------|---------------|-------------------------------|
| id_detail_penjualan| bigint (PK)   | Kunci utama                   |
| id_penjualan       | bigint (FK)   | Header penjualan              |
| id_menu            | bigint (FK)   | Menu yang dijual              |
| qty                | integer       | Jumlah porsi                  |
| harga_jual         | decimal(15,2) | Harga jual saat transaksi     |
| subtotal           | decimal(15,2) | Subtotal baris                |
| diskon             | decimal(15,2) | Diskon baris                  |
| **hpp_menu**       | decimal(15,2) | **HPP baris menu ini**        |

**9. Tabel `pemakaian_bahan`** — jejak audit HPP (lot mana yang dikonsumsi).

| Kolom               | Tipe          | Keterangan                       |
|---------------------|---------------|----------------------------------|
| id_pemakaian        | bigint (PK)   | Kunci utama                      |
| id_detail_penjualan | bigint (FK)   | Baris penjualan terkait          |
| id_bahan            | bigint (FK)   | Bahan yang dipakai               |
| id_detail_pembelian | bigint (FK)   | **Lot sumber yang dikonsumsi**   |
| qty_dipakai         | decimal(12,2) | Kuantitas diambil dari lot       |
| harga_beli          | decimal(15,2) | Harga lot tersebut               |
| subtotal_hpp        | decimal(15,2) | qty_dipakai × harga_beli         |

> **[Gambar 4.1]** Diagram relasi antar tabel (ERD) basis data sistem.

### 4.2.2 Data Awal (Seeder)

Untuk keperluan pengujian dan demonstrasi, sistem dilengkapi *seeder* berisi
data nyata katalog Homwok Coffee:

- **`MenuSeeder`** — 89 baris menu dari papan menu Homwok (menu berukuran
  Reguler/Large dipecah menjadi dua baris; harga papan dikalikan 1.000).
- **`BahanBakuSeeder`** — 59 bahan baku (kopi, susu, sirup, bubuk, buah, roti,
  saus, kemasan) beserta **stok awal**, yaitu satu transaksi pembelian "Stok
  Awal" per bahan agar setiap bahan memiliki lot untuk perhitungan FIFO.
- **`ResepSeeder`** — ±349 baris resep untuk seluruh menu (takaran ukuran Large
  otomatis ×1,3; kemasan cup/botol/box ditambahkan otomatis per kategori).

> **[Gambar 4.2]** Tampilan tabel basis data setelah proses seeding.

---

## 4.3 Implementasi Antarmuka

Antarmuka dibangun dengan tema *neo-brutalism* hitam-putih yang bersih dan
konsisten. Berikut halaman-halaman utama sistem.

### 4.3.1 Halaman Login

Halaman autentikasi dengan kolom *username* dan *password*, dilengkapi tombol
**demo login** (barista/manager) untuk mempercepat pengujian.

> **[Gambar 4.3]** Halaman Login.

### 4.3.2 Halaman Kasir (POS)

Halaman transaksi utama untuk barista: menampilkan grid menu beserta filter
kategori, keranjang belanja, hingga proses *checkout* dan cetak struk.

> **[Gambar 4.4]** Halaman Kasir dengan keranjang belanja.
> **[Gambar 4.5]** Struk hasil transaksi.

### 4.3.3 Halaman Master Data

Pengelolaan data master dengan tabel dan formulir tambah/ubah berbentuk panel
geser (*drawer*):

- **Master Menu** — daftar menu, termasuk unggah foto produk.
- **Master Bahan Baku** — daftar bahan beserta indikator stok menipis.
- **Master Pegawai** — pengelolaan akun staf dan perannya.

> **[Gambar 4.6]** Halaman Master Menu.
> **[Gambar 4.7]** Halaman Master Bahan Baku.
> **[Gambar 4.8]** Halaman Master Pegawai.

### 4.3.4 Halaman Pembelian

Formulir pencatatan pembelian bahan dengan banyak baris — **setiap baris
menghasilkan satu lot FIFO** baru (`qty_awal`, `harga_beli`).

> **[Gambar 4.9]** Halaman Pembelian (form multi-baris).

### 4.3.5 Halaman Laporan

Menu khusus *manager*, terdiri dari: Laporan Penjualan, Laporan Pembelian,
Laporan HPP, Laporan Laba-Rugi, dan **Kartu Persediaan (kartu stok FIFO)**
yang memperlihatkan arus masuk/keluar dan saldo tiap bahan.

> **[Gambar 4.10]** Laporan HPP.
> **[Gambar 4.11]** Laporan Laba-Rugi.
> **[Gambar 4.12]** Kartu Persediaan (Kartu Stok FIFO).

### 4.3.6 Halaman Pengaturan

Halaman preferensi tampilan; saat ini menyediakan pengaturan **ukuran font**
(Kecil / Normal / Besar) yang tersimpan otomatis pada perangkat.

> **[Gambar 4.13]** Halaman Pengaturan.

---

## 4.4 Implementasi Fitur Inti: Perhitungan HPP Berbasis FIFO

Bagian ini merupakan inti dari sistem. Seluruh logika perhitungan HPP terpusat
pada kelas layanan **`FifoCostCalculator`**. Proses ini dijalankan dalam satu
**transaksi basis data** dengan **penguncian baris** (`lockForUpdate`) pada lot
bahan, agar aman dari *race condition* ketika dua kasir bertransaksi bersamaan.

### 4.4.1 Alur Proses Penjualan

Ketika sebuah penjualan diproses, sistem melakukan langkah berikut untuk setiap
menu yang dijual:

1. Mengambil resep menu (daftar bahan + takaran).
2. Untuk setiap bahan, menghitung kebutuhan = `takaran × jumlah porsi`.
3. Mengambil lot bahan yang masih tersedia (`sisa_qty > 0`), **diurutkan dari
   yang tertua** (berdasarkan `tanggal_beli`, lalu `id`).
4. Mengonsumsi lot tertua lebih dulu hingga kebutuhan terpenuhi; tiap
   pengambilan = `qty × harga_beli` diakumulasikan ke HPP menu.
5. Mengurangi `sisa_qty` lot dan mencatat jejak pada `pemakaian_bahan`.
6. Menyimpan `hpp_menu`, lalu menghitung `total_hpp` dan
   `laba_kotor = grand_total − total_hpp`.

### 4.4.2 Potongan Kode Konsumsi Lot FIFO

```php
// app/Services/FifoCostCalculator.php
private function hitungHppMenu(Menu $menu, int $qtyPorsi, DetailPenjualan $detail): float
{
    $hppMenu = 0.0;

    foreach ($menu->resep as $resep) {
        $butuh = (float) $resep->takaran * $qtyPorsi;

        // Ambil lot tersedia, urut tertua dulu (tanggal_beli, lalu id) + kunci baris.
        $lots = DetailPembelian::query()
            ->tersedia()
            ->where('detail_pembelian.id_bahan', $resep->id_bahan)
            ->join('pembelian', 'detail_pembelian.id_pembelian', '=', 'pembelian.id_pembelian')
            ->orderBy('pembelian.tanggal_beli', 'asc')
            ->orderBy('detail_pembelian.id_detail_pembelian', 'asc')
            ->lockForUpdate()
            ->select('detail_pembelian.*')
            ->get();

        foreach ($lots as $lot) {
            if ($butuh <= 0) break;

            $ambil = min((float) $lot->sisa_qty, $butuh);      // ambil sebanyak yang bisa
            $lot->update(['sisa_qty' => (float) $lot->sisa_qty - $ambil]);

            $subtotalHpp = $ambil * (float) $lot->harga_beli;  // biaya sesuai harga lot

            PemakaianBahan::create([                            // catat jejak audit
                'id_detail_penjualan' => $detail->id_detail_penjualan,
                'id_bahan'            => $resep->id_bahan,
                'id_detail_pembelian' => $lot->id_detail_pembelian,
                'qty_dipakai'         => $ambil,
                'harga_beli'          => $lot->harga_beli,
                'subtotal_hpp'        => $subtotalHpp,
            ]);

            $hppMenu += $subtotalHpp;
            $butuh   -= $ambil;
        }

        if ($butuh > 0.00001) {                                 // stok kurang → batalkan transaksi
            throw new \RuntimeException("Stok tidak cukup untuk menu '{$menu->nama_menu}'.");
        }
    }

    return round($hppMenu, 2);
}
```

### 4.4.3 Contoh Perhitungan (Kasus Sederhana)

Misal terjual **1 gelas Caffe Latte** (harga jual Rp 25.000) dengan resep:
18 g biji kopi, 150 ml susu, 1 pcs paper cup. Stok berasal dari satu lot dengan
harga: kopi Rp 200/g, susu Rp 25/ml, cup Rp 1.000/pcs.

| Bahan       | Kebutuhan | Harga Lot | Subtotal HPP |
|-------------|-----------|-----------|--------------|
| Biji Kopi   | 18 g      | Rp 200/g  | Rp 3.600     |
| Susu Segar  | 150 ml    | Rp 25/ml  | Rp 3.750     |
| Paper Cup   | 1 pcs     | Rp 1.000  | Rp 1.000     |
| **Total HPP** |         |           | **Rp 8.350** |

Maka: **Laba Kotor = Rp 25.000 − Rp 8.350 = Rp 16.650**.

### 4.4.4 Contoh Perhitungan Lintas Lot (Pembuktian FIFO)

Kasus ini membuktikan sistem mengambil lot **tertua lebih dulu** dan berpindah
ke lot berikutnya saat lot pertama habis. Terdapat 3 lot biji kopi @ 5.000 g:

| Lot | Tanggal Beli | Sisa Qty | Harga Beli |
|-----|--------------|----------|------------|
| 1   | 01 Jan       | 5.000 g  | Rp 120/g   |
| 2   | 05 Jan       | 5.000 g  | Rp 135/g   |
| 3   | 10 Jan       | 5.000 g  | Rp 150/g   |

Jika sebuah transaksi membutuhkan **6.000 g** biji kopi, sistem mengonsumsi:

| Sumber | Diambil | Harga | Subtotal HPP |
|--------|---------|-------|--------------|
| Lot 1  | 5.000 g | Rp 120| Rp 600.000   |
| Lot 2  | 1.000 g | Rp 135| Rp 135.000   |
| **Total** | 6.000 g |    | **Rp 735.000** |

**Sisa stok setelah transaksi:** Lot 1 = 0 g (habis), Lot 2 = 4.000 g,
Lot 3 = 5.000 g (utuh). Hasil ini konsisten dengan prinsip FIFO dan telah
diverifikasi melalui pengujian unit (lihat Subbab 4.6.2).

---

## 4.5 Implementasi Layanan API

Seluruh fungsi backend diekspos sebagai REST API dengan autentikasi token
Sanctum. Akses laporan dibatasi khusus peran *manager* melalui *middleware*
`role`.

| Method | Endpoint                        | Akses    | Fungsi                              |
|--------|---------------------------------|----------|-------------------------------------|
| POST   | `/api/login`                    | Publik   | Login → token + data pengguna       |
| GET    | `/api/me`                       | Auth     | Data sesi pengguna                  |
| POST   | `/api/logout`                   | Auth     | Keluar / hapus token                |
| —      | `/api/menu`, `/bahan`, `/pegawai` | Auth   | CRUD data master (apiResource)      |
| —      | `/api/resep`                    | Auth     | Kelola komposisi menu               |
| —      | `/api/pembelian`                | Auth     | Pembelian → membuat lot FIFO        |
| —      | `/api/penjualan`                | Auth     | Penjualan → konsumsi FIFO + HPP     |
| GET    | `/api/persediaan`               | Auth     | Data stok                           |
| POST   | `/api/persediaan/cek`           | Auth     | Pra-cek ketersediaan stok           |
| GET    | `/api/laporan/penjualan`        | Manager  | Laporan penjualan                   |
| GET    | `/api/laporan/pembelian`        | Manager  | Laporan pembelian                   |
| GET    | `/api/laporan/hpp`              | Manager  | Laporan HPP                         |
| GET    | `/api/laporan/laba-rugi`        | Manager  | Laporan laba-rugi                   |
| GET    | `/api/laporan/kartu-persediaan` | Manager  | Kartu stok FIFO                     |

---

## 4.6 Pengujian Sistem

Pengujian dilakukan dengan dua metode: **Black Box Testing** untuk memverifikasi
fungsionalitas dari sisi pengguna, dan **Unit Testing** untuk memverifikasi
ketepatan algoritma inti HPP.

### 4.6.1 Pengujian Black Box

| No | Skenario Pengujian            | Masukan                          | Hasil Diharapkan                              | Hasil | 
|----|-------------------------------|----------------------------------|-----------------------------------------------|-------|
| 1  | Login valid                   | username & password benar        | Berhasil masuk ke dashboard                   | ✓     |
| 2  | Login tidak valid             | password salah                   | Muncul pesan error, tetap di halaman login    | ✓     |
| 3  | Tambah data menu              | data menu lengkap + foto         | Menu baru tersimpan & tampil di tabel         | ✓     |
| 4  | Ubah data menu                | ubah harga jual                  | Data menu ter-*update*                        | ✓     |
| 5  | Tambah bahan baku             | nama, satuan, stok minimum       | Bahan baru tersimpan                          | ✓     |
| 6  | Tambah data pegawai           | data staf + peran                | Akun staf baru tersimpan                      | ✓     |
| 7  | Catat pembelian (lot baru)    | bahan, qty, harga beli           | Lot FIFO baru terbentuk, stok bertambah       | ✓     |
| 8  | Proses penjualan di kasir     | pilih menu → checkout            | Nota tersimpan, struk tampil                  | ✓     |
| 9  | Perhitungan HPP otomatis      | penjualan menu ber-resep         | `total_hpp` & `laba_kotor` terisi otomatis    | ✓     |
| 10 | Pengurangan stok FIFO         | penjualan menu                   | `sisa_qty` lot tertua berkurang lebih dulu    | ✓     |
| 11 | Penjualan saat stok kurang    | qty melebihi stok                | Transaksi ditolak, muncul pesan stok kurang   | ✓     |
| 12 | Lihat Laporan HPP             | akun manager                     | Laporan HPP tampil                            | ✓     |
| 13 | Lihat Kartu Persediaan        | akun manager                     | Kartu stok FIFO tampil (masuk/keluar/saldo)   | ✓     |
| 14 | Batasan akses laporan         | akun barista buka laporan        | Akses ditolak (bukan manager)                 | ✓     |
| 15 | Ubah ukuran font              | pilih "Besar" di Pengaturan      | Tampilan membesar & tersimpan                 | ✓     |
| 16 | Logout                        | klik keluar                      | Sesi berakhir, kembali ke login               | ✓     |

Berdasarkan tabel di atas, seluruh skenario menghasilkan keluaran sesuai yang
diharapkan (**valid**).

### 4.6.2 Pengujian Unit (Algoritma FIFO)

Ketepatan algoritma perhitungan HPP diuji secara otomatis menggunakan PHPUnit
pada berkas `tests/Feature/FifoCalculatorTest.php`. Pengujian menggunakan skenario
lintas lot pada Subbab 4.4.4 (kebutuhan 6.000 g atas 3 lot):

```php
// HPP = 5000×120 + 1000×135 = 735.000
$this->assertEquals(735000.0, (float) $result['penjualan']->total_hpp);

// Sisa lot setelah FIFO
$this->assertEquals(0.0,    DetailPembelian::find(1)->sisa_qty); // lot 1 habis
$this->assertEquals(4000.0, DetailPembelian::find(2)->sisa_qty); // lot 2 sisa 4000
$this->assertEquals(5000.0, DetailPembelian::find(3)->sisa_qty); // lot 3 utuh
```

Perintah `php artisan test` menjalankan pengujian ini dan memberikan hasil
**PASS (hijau)**, membuktikan bahwa sistem menghitung HPP sebesar Rp 735.000 dan
mengurangi stok tiap lot secara tepat sesuai prinsip FIFO.

> **[Gambar 4.14]** Hasil eksekusi `php artisan test` yang menunjukkan pengujian lulus.

---

## 4.7 Pembahasan

### 4.7.1 Kesesuaian dengan Tujuan Penelitian

Berdasarkan hasil implementasi dan pengujian, sistem telah menjawab tujuan yang
ditetapkan pada BAB I:

1. **Membangun sistem POS untuk Homwok Coffee** — Terpenuhi. Sistem
   menyediakan proses transaksi kasir lengkap, dari pemilihan menu hingga cetak
   struk, serta pengelolaan data master.
2. **Menghitung HPP secara otomatis dengan metode FIFO** — Terpenuhi. Setiap
   penjualan langsung menghasilkan nilai HPP dan laba kotor tanpa perhitungan
   manual, dengan mengonsumsi lot bahan tertua lebih dulu.
3. **Menyediakan laporan bagi manajer** — Terpenuhi. Tersedia laporan
   penjualan, pembelian, HPP, laba-rugi, dan kartu persediaan.

### 4.7.2 Kelebihan Sistem

- **Akurasi dan otomatisasi HPP** — Perhitungan biaya pokok tidak lagi manual,
  sehingga mengurangi kesalahan dan menghemat waktu.
- **Ketertelusuran (audit trail)** — Tabel `pemakaian_bahan` mencatat lot mana
  yang dikonsumsi tiap transaksi, sehingga nilai HPP dapat diaudit.
- **Aman terhadap transaksi bersamaan** — Penggunaan transaksi basis data dan
  `lockForUpdate` mencegah nilai stok/HPP yang tidak konsisten.
- **Antarmuka konsisten dan responsif** — Memudahkan barista bekerja cepat.

### 4.7.3 Keterbatasan Sistem

Sebagai bahan pengembangan lanjutan, sistem masih memiliki keterbatasan:

- Belum mendukung **multi-cabang/multi-outlet**.
- Fitur **diskon dan pajak** per transaksi belum diaktifkan (kolom telah
  disediakan pada basis data).
- Basis data pengembangan menggunakan SQLite; untuk lingkungan produksi dengan
  banyak kasir bersamaan disarankan MySQL/PostgreSQL agar penguncian baris
  bekerja optimal.
- Data takaran resep dan harga bahan pada *seeder* masih berupa estimasi wajar,
  sehingga perlu disesuaikan dengan data riil operasional.

---

> _Catatan penyusunan: berkas ini adalah draf. Ganti seluruh penanda
> **[Gambar 4.x]** dengan tangkapan layar sesungguhnya, dan sesuaikan spesifikasi
> perangkat pada Subbab 4.1 serta penomoran bab/gambar dengan pedoman Tugas
> Akhir program studi Anda._
