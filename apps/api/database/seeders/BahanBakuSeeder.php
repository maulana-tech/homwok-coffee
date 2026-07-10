<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use App\Models\BahanBaku;
use App\Models\Pembelian;
use App\Models\DetailPembelian;

/**
 * Bahan baku lengkap untuk seluruh menu Homwok + stok awal.
 *
 * Untuk tiap bahan yang BARU dibuat, dibuatkan satu lot pembelian "Stok Awal"
 * (harga_beli per satuan) agar FifoCostCalculator punya lot untuk dikonsumsi
 * sehingga HPP setiap penjualan menu asli benar-benar terhitung.
 *
 * Empat bahan demo (Biji Kopi Arabika, Susu Segar, Sirup Gula Aren, Paper Cup
 * 12oz) sudah dibuat + punya lot di DatabaseSeeder, jadi firstOrCreate akan
 * memakainya kembali dan tidak membuat lot ganda.
 *
 * Harga & takaran = estimasi standar (papan menu hanya menyebut komposisi,
 * bukan harga bahan / takaran).
 */
class BahanBakuSeeder extends Seeder
{
    /** Jumlah stok awal & stok minimum default per satuan. */
    private const STOK_AWAL = ['gram' => 8000, 'ml' => 8000, 'pcs' => 500, 'butir' => 300, 'lembar' => 400];
    private const STOK_MIN = ['gram' => 500, 'ml' => 1000, 'pcs' => 50, 'butir' => 24, 'lembar' => 20];

    public function run(): void
    {
        // [nama_bahan, satuan, harga_beli per satuan (Rp)]
        $bahan = [
            // Basis kopi & susu
            ['Susu Kental Manis', 'ml', 30],
            ['Brown Sugar', 'gram', 25],
            ['Santan (Coconut Milk)', 'ml', 20],
            ['Simple Syrup', 'ml', 15],

            // Sirup rasa (flavoured coffee & mocktail)
            ['Sirup Hazelnut', 'ml', 40],
            ['Sirup Caramel', 'ml', 40],
            ['Sirup Salted Caramel', 'ml', 40],
            ['Sirup Irish', 'ml', 40],
            ['Sirup Coca Rum', 'ml', 40],
            ['Sirup Peanut Butter', 'ml', 40],
            ['Sirup Pineapple', 'ml', 40],
            ['Sirup Tropical', 'ml', 40],
            ['Sirup Special', 'ml', 40],
            ['Sirup Mango', 'ml', 40],
            ['Sirup Strawberry', 'ml', 40],
            ['Sirup Apple', 'ml', 40],
            ['Sirup Lychee', 'ml', 40],
            ['Sirup Passion Fruit', 'ml', 40],

            // Bubuk & tambahan
            ['Biskuit Regal', 'gram', 30],
            ['Cookies', 'gram', 40],
            ['Bubuk Avocado', 'gram', 60],
            ['Bubuk Thai Tea', 'gram', 35],
            ['Creamer', 'gram', 25],
            ['Bubuk Taro', 'gram', 40],
            ['Bubuk Red Velvet', 'gram', 40],
            ['Bubuk Matcha', 'gram', 80],
            ['Bubuk Coklat', 'gram', 35],
            ['Rum (Essence)', 'ml', 30],
            ['Oreo', 'gram', 40],
            ['Teh', 'gram', 30],
            ['Soda', 'ml', 12],

            // Buah segar
            ['Buah Strawberry Segar', 'gram', 50],
            ['Buah Peach Segar', 'gram', 50],
            ['Buah Lychee', 'gram', 50],

            // Roti panggang
            ['Roti Tawar', 'lembar', 1200],
            ['Selai Coklat', 'gram', 30],
            ['Keju Cheddar', 'gram', 60],
            ['Mozzarella', 'gram', 70],
            ['Smoked Beef', 'gram', 90],
            ['Telur', 'butir', 2500],
            ['Garlic Butter', 'gram', 40],

            // Frenchfries
            ['Kentang', 'gram', 30],
            ['Bumbu Barbeque', 'gram', 50],
            ['Bumbu Balado', 'gram', 50],
            ['Bumbu Keju', 'gram', 50],
            ['Bumbu Hot & Spicy', 'gram', 50],

            // Rice bowl
            ['Nasi Putih', 'gram', 8],
            ['Fillet Ayam', 'gram', 60],
            ['Sayur Segar', 'gram', 20],
            ['Galantin', 'gram', 55],
            ['Saus Blackpepper', 'ml', 25],
            ['Saus Teriyaki', 'ml', 25],
            ['Saus Mayo', 'ml', 25],
            ['Saus Keju', 'ml', 25],
            ['Saus Salted Egg', 'ml', 25],

            // Kemasan
            ['Paper Cup 16oz', 'pcs', 1300],
            ['Botol 1 Liter', 'pcs', 3500],
            ['Box Snack', 'pcs', 1500],
            ['Box Rice Bowl', 'pcs', 2500],
        ];

        // Header pembelian "Stok Awal".
        $idManager = Pegawai::where('peran', 'manager')->value('id_pegawai')
            ?? Pegawai::value('id_pegawai');

        $tglStok = date('Y-m-d', strtotime('-7 days'));
        $pembelian = Pembelian::create([
            'id_pegawai' => $idManager,
            'nomor_pembelian' => 'PO-' . date('Ymd', strtotime('-7 days')) . '-0000',
            'tanggal_beli' => $tglStok,
            'pemasok' => 'Stok Awal Sistem',
            'total_beli' => 0, // diperbarui di akhir
        ]);

        $total = 0;
        foreach ($bahan as [$nama, $satuan, $harga]) {
            $b = BahanBaku::firstOrCreate(
                ['nama_bahan' => $nama],
                ['satuan' => $satuan, 'stok_minimum' => self::STOK_MIN[$satuan]],
            );

            // Hanya beri lot stok awal untuk bahan yang benar-benar baru dibuat.
            if (! $b->wasRecentlyCreated) {
                continue;
            }

            $qty = self::STOK_AWAL[$satuan];
            DetailPembelian::create([
                'id_pembelian' => $pembelian->id_pembelian,
                'id_bahan' => $b->id_bahan,
                'qty_awal' => $qty,
                'sisa_qty' => $qty,
                'harga_beli' => $harga,
                'tanggal_kadaluarsa' => null,
            ]);
            $total += $qty * $harga;
        }

        $pembelian->update(['total_beli' => $total]);
    }
}
