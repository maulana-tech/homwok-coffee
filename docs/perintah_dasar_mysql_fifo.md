# Perintah Dasar MySQL: Simulasi Logika FIFO (Terminal/Console)

Dokumen ini berisi sekumpulan perintah MySQL murni (Raw SQL) yang merepresentasikan bagaimana data masuk dan keluar diproses di dalam _database_ untuk mendukung algoritma persediaan FIFO.

## 0. Masuk ke Database via Terminal
Buka terminal Anda, lalu login ke MySQL dan pilih database yang Anda gunakan (ganti `homwok_coffee` dengan nama database Anda yang sebenarnya).

```bash
# Karena Anda menggunakan XAMPP di Mac, jalankan perintah ini (masukkan password jika diminta):
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p

# Pilih database yang akan digunakan
USE homwok_coffee;
```

## 1. Memeriksa Stok Awal (Data Bahan Baku)
Sebelum melakukan transaksi, kita memverifikasi data bahan baku "Biji Kopi Arabika" (ID = 1).

```sql
SELECT id_bahan, nama_bahan, satuan, stok_minimum 
FROM bahan_bakus 
WHERE id_bahan = 1;
```

## 2. Simulasi Transaksi Pembelian Masuk (INSERT Data ke Lot)
Ketika kedai membeli pasokan baru, sistem akan mencatat _header_ pembelian lalu memasukkan _detail_ yang akan bertindak sebagai "Lot" antrean FIFO.

```sql
-- a. Membuat Record Header Pembelian
INSERT INTO pembelians (id_pembelian, id_pegawai, tanggal_pembelian, total_harga, created_at, updated_at) 
VALUES (1, 1, '2026-07-10 11:41:00', 1160000, NOW(), NOW());

-- b. Memasukkan Lot 1 (Masuk 300g @ Rp 200)
INSERT INTO detail_pembelians (id_pembelian, id_bahan, qty_awal, sisa_qty, harga_beli, created_at, updated_at) 
VALUES (1, 1, 300, 300, 200, '2026-07-10 11:41:52', '2026-07-10 11:41:52');

-- c. Memasukkan Lot 2 (Masuk 5.000g @ Rp 220)
INSERT INTO detail_pembelians (id_pembelian, id_bahan, qty_awal, sisa_qty, harga_beli, created_at, updated_at) 
VALUES (1, 1, 5000, 5000, 220, '2026-07-10 11:41:52', '2026-07-10 11:41:52');
```

**Mengecek Antrean Lot yang Tersedia:**
```sql
SELECT id_detail_pembelian AS id_lot, id_bahan, qty_awal, sisa_qty, harga_beli 
FROM detail_pembelians 
WHERE id_bahan = 1 AND sisa_qty > 0 
ORDER BY created_at ASC;
```

## 3. Simulasi Transaksi Penjualan (Pengeluaran Stok)
Saat terjadi penjualan (misal Penjualan #1 butuh 36 gram), algoritma di _backend_ akan mencari `id_detail_pembelian` terlama (Lot 1) dan menguranginya (UPDATE), lalu mencatat jejak pemakaiannya (INSERT).

```sql
-- a. Mencatat Header Penjualan
INSERT INTO penjualans (id_penjualan, nama_pelanggan, tipe_pesanan, total_harga, status, created_at, updated_at)
VALUES (1, 'Guest', 'Dine In', 25000, 'selesai', NOW(), NOW());

-- b. Mengurangi Sisa Qty di Antrean Lot 1 (Pengurangan 36g)
UPDATE detail_pembelians 
SET sisa_qty = sisa_qty - 36, updated_at = NOW() 
WHERE id_detail_pembelian = 1;

-- c. Mencatat Histori Pemakaian Bahan (Kartu Persediaan) untuk HPP
INSERT INTO pemakaian_bahans (id_detail_penjualan, id_bahan, id_detail_pembelian, qty_dipakai, harga_beli, subtotal_hpp, created_at, updated_at)
VALUES (1, 1, 1, 36, 200, (36 * 200), '2026-07-10 11:41:53', '2026-07-10 11:41:53');
```

## 4. Query Laporan Saldo Akhir
Setelah berbagai transaksi terjadi, untuk mengetahui posisi saldo sisa stok dari sebuah bahan (gabungan dari seluruh Lot yang belum habis), Anda bisa menggunakan perintah agregasi `SUM`.

```sql
SELECT 
    b.nama_bahan,
    SUM(dp.sisa_qty) AS total_stok_tersedia
FROM bahan_bakus b
JOIN detail_pembelians dp ON b.id_bahan = dp.id_bahan
WHERE b.id_bahan = 1
GROUP BY b.id_bahan;
```

## 5. Query Laporan Kartu Persediaan FIFO (History Pemakaian)
Untuk menampilkan daftar HPP dari setiap gram kopi yang terjual secara terurut (mirip seperti tabel di laporan Anda).

```sql
SELECT 
    pb.created_at AS waktu_keluar,
    p.id_penjualan AS referensi_jual,
    pb.id_detail_pembelian AS diambil_dari_lot,
    pb.qty_dipakai AS qty_keluar,
    pb.harga_beli AS harga_modal_satuan,
    pb.subtotal_hpp AS nilai_hpp_tercatat
FROM pemakaian_bahans pb
JOIN detail_penjualans dpj ON pb.id_detail_penjualan = dpj.id_detail_penjualan
JOIN penjualans p ON dpj.id_penjualan = p.id_penjualan
WHERE pb.id_bahan = 1
ORDER BY pb.created_at ASC;
```
