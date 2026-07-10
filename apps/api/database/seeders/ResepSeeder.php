<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\BahanBaku;
use App\Models\Resep;

/**
 * Resep (komposisi bahan) untuk seluruh menu asli Homwok.
 *
 * - Resep didefinisikan per NAMA DASAR menu (tanpa akhiran " (R)"/" (L)").
 *   Takaran yang ditulis = ukuran Reguler; ukuran Large otomatis ×1,3.
 * - Kemasan (paper cup 12oz/16oz, botol, box) ditambahkan otomatis menurut
 *   kategori + ukuran, jadi tidak perlu ditulis di tiap resep.
 * - Menu demo FIFO (Espresso Solo, Caffe Latte, Kopi Susu Aren) TIDAK ada di
 *   sini karena sudah punya resep sendiri dari DatabaseSeeder.
 *
 * Takaran = estimasi standar (papan menu hanya menyebut komposisi deskriptif,
 * bukan takaran gram/ml).
 */
class ResepSeeder extends Seeder
{
    /** Faktor takaran untuk ukuran Large. */
    private const FAKTOR_L = 1.3;

    /** Nama bahan basis kopi & susu yang dipakai berulang (samakan dg demo). */
    private const KOPI = 'Biji Kopi Arabika';
    private const SUSU = 'Susu Segar (Fresh Milk)';
    private const AREN = 'Sirup Gula Aren';

    public function run(): void
    {
        // base name => [[nama_bahan, takaran Reguler], ...] (tanpa kemasan)
        $resep = [
            // ── Coffee ──
            'Cappuccino' => [[self::KOPI, 18], [self::SUSU, 150]],
            'Espresso' => [[self::KOPI, 18]],
            'Homwok Original' => [[self::KOPI, 18], ['Susu Kental Manis', 20], [self::SUSU, 120]],
            'Homwok Signature' => [[self::KOPI, 18], ['Brown Sugar', 15], [self::SUSU, 120]],
            'Hawaiian Coffee' => [[self::KOPI, 18], ['Santan (Coconut Milk)', 120]],
            'Sweet Black' => [[self::KOPI, 18], ['Simple Syrup', 15]],
            'Homwok Booster' => [[self::KOPI, 36], ['Susu Kental Manis', 20], [self::SUSU, 120]],

            // ── Flavoured Coffee (espresso + sirup + milk) ──
            'Hazelnut' => [[self::KOPI, 18], ['Sirup Hazelnut', 20], [self::SUSU, 120]],
            'Caramel' => [[self::KOPI, 18], ['Sirup Caramel', 20], [self::SUSU, 120]],
            'Coca Rum' => [[self::KOPI, 18], ['Sirup Coca Rum', 20], [self::SUSU, 120]],
            'Regal Coffee Rum' => [[self::KOPI, 18], ['Sirup Coca Rum', 20], ['Biskuit Regal', 15], [self::SUSU, 120]],
            'Salted Caramel' => [[self::KOPI, 18], ['Sirup Salted Caramel', 20], [self::SUSU, 120]],
            'Irish' => [[self::KOPI, 18], ['Sirup Irish', 20], [self::SUSU, 120]],
            'Peanut Butter Cookies' => [[self::KOPI, 18], ['Sirup Peanut Butter', 20], ['Cookies', 15], [self::SUSU, 120]],
            'Avocado Coffee' => [[self::KOPI, 18], ['Bubuk Avocado', 20], [self::SUSU, 120]],

            // ── Mocktail ──
            'Sparkling Yellow' => [[self::KOPI, 18], ['Sirup Pineapple', 20], ['Soda', 120]],
            'Tropical Fizzy' => [[self::KOPI, 18], ['Sirup Tropical', 20], ['Soda', 120]],
            'Strawberry Rock' => [[self::KOPI, 18], ['Sirup Special', 20], ['Buah Strawberry Segar', 30]],
            'Mango Fizz' => [[self::KOPI, 18], ['Sirup Mango', 20], [self::SUSU, 120]],
            'Mango Peach' => [['Soda', 120], ['Sirup Mango', 20], ['Buah Peach Segar', 30]],
            'Sparkling Berry' => [['Soda', 120], ['Buah Strawberry Segar', 30], ['Sirup Strawberry', 20]],
            'Apple Mojito' => [['Soda', 120], ['Sirup Apple', 20], ['Sirup Special', 10]],

            // ── Non Coffee ──
            'Thai Tea' => [['Bubuk Thai Tea', 20], ['Creamer', 10], [self::SUSU, 120]],
            'Taro' => [['Bubuk Taro', 25], [self::SUSU, 150]],
            'Red Velvet' => [['Bubuk Red Velvet', 25], [self::SUSU, 150]],
            'Regal Rum' => [['Rum (Essence)', 10], ['Biskuit Regal', 20], [self::SUSU, 150]],
            'Oreo Blend' => [['Oreo', 30], [self::SUSU, 150]],
            'Matcha Latte' => [['Bubuk Matcha', 8], [self::SUSU, 150]],
            'Original Choco' => [['Bubuk Coklat', 25], [self::SUSU, 150]],
            'Avocado Choco' => [['Bubuk Avocado', 15], ['Bubuk Coklat', 15], [self::SUSU, 150]],

            // ── Fruit Series ──
            'Lychee Tea' => [['Sirup Lychee', 20], ['Teh', 5], ['Buah Lychee', 30]],
            "Passionate'a" => [['Sirup Passion Fruit', 20], ['Teh', 5], ['Buah Peach Segar', 30]],
            'Red Sunrise' => [['Sirup Mango', 20], ['Sirup Special', 10], ['Buah Peach Segar', 30]],

            // ── Botol 1 Liter (porsi ±1 liter, satu ukuran) ──
            'Botol 1L Original' => [[self::KOPI, 40], ['Susu Kental Manis', 60], [self::SUSU, 500], [self::AREN, 40]],
            'Botol 1L Signature Aren' => [[self::KOPI, 40], [self::AREN, 80], [self::SUSU, 600]],
            'Botol 1L Avocado Choco' => [['Bubuk Avocado', 40], ['Bubuk Coklat', 40], [self::SUSU, 700]],
            'Botol 1L Coca Rum' => [[self::KOPI, 40], ['Sirup Coca Rum', 80], [self::SUSU, 600]],
            'Botol 1L Mango Peach' => [['Sirup Mango', 80], ['Buah Peach Segar', 80], ['Soda', 700]],
            'Botol 1L Strawberry Rock' => [['Sirup Special', 60], ['Buah Strawberry Segar', 80], ['Soda', 700]],

            // ── Roti Panggang ──
            'Roti Panggang Chocolate Original' => [['Roti Tawar', 2], ['Selai Coklat', 30]],
            'Roti Panggang Cheese' => [['Roti Tawar', 2], ['Keju Cheddar', 30]],
            'Roti Panggang Chocolate Cheese' => [['Roti Tawar', 2], ['Selai Coklat', 20], ['Keju Cheddar', 20]],
            'Roti Panggang Chocolate Melt' => [['Roti Tawar', 2], ['Selai Coklat', 20], ['Mozzarella', 30]],
            'Roti Panggang Cheese Melt' => [['Roti Tawar', 2], ['Keju Cheddar', 20], ['Mozzarella', 30]],
            'Roti Panggang Oreo Cheese Melt' => [['Roti Tawar', 2], ['Oreo', 20], ['Mozzarella', 30]],
            'Roti Panggang Double Cheese Melt' => [['Roti Tawar', 2], ['Keju Cheddar', 30], ['Mozzarella', 40]],
            'Roti Panggang Smokebeef Egg Cheese' => [['Roti Tawar', 2], ['Smoked Beef', 30], ['Telur', 1], ['Keju Cheddar', 20]],
            'Cheese Garlic Bread' => [['Roti Tawar', 2], ['Garlic Butter', 20], ['Keju Cheddar', 20]],

            // ── Frenchfries ──
            'Frenchfries Original' => [['Kentang', 150]],
            'Frenchfries Barbeque' => [['Kentang', 150], ['Bumbu Barbeque', 8]],
            'Frenchfries Cheese' => [['Kentang', 150], ['Bumbu Keju', 8]],
            'Frenchfries Spicy Balado' => [['Kentang', 150], ['Bumbu Balado', 8]],
            'Frenchfries Hot and Spicy' => [['Kentang', 150], ['Bumbu Hot & Spicy', 8]],

            // ── Rice Bowl (nasi + sayur + telur + ayam/galantin + saus) ──
            'Rice Bowl Chicken Blackpepper' => [['Nasi Putih', 200], ['Sayur Segar', 40], ['Telur', 1], ['Fillet Ayam', 100], ['Saus Blackpepper', 30]],
            'Rice Bowl Chicken Katsu Teriyaki' => [['Nasi Putih', 200], ['Sayur Segar', 40], ['Telur', 1], ['Fillet Ayam', 100], ['Saus Teriyaki', 30]],
            'Rice Bowl Chicken Katsu Mayo' => [['Nasi Putih', 200], ['Sayur Segar', 40], ['Telur', 1], ['Fillet Ayam', 100], ['Saus Mayo', 30]],
            'Rice Bowl Chicken Cheeze' => [['Nasi Putih', 200], ['Sayur Segar', 40], ['Telur', 1], ['Fillet Ayam', 100], ['Saus Keju', 30]],
            'Rice Bowl Bistik Galantin' => [['Nasi Putih', 200], ['Sayur Segar', 40], ['Telur', 1], ['Galantin', 120], ['Saus Blackpepper', 30]],
            'Rice Bowl Chicken Salted Egg' => [['Nasi Putih', 200], ['Sayur Segar', 40], ['Telur', 1], ['Fillet Ayam', 100], ['Saus Salted Egg', 30]],
        ];

        // Kategori yang memakai paper cup (minuman gelas).
        $kategoriGelas = ['Coffee', 'Flavoured Coffee', 'Mocktail', 'Non Coffee', 'Fruit Series'];

        // Peta bahan (nama → model) untuk ambil id + satuan.
        $bahanMap = BahanBaku::all()->keyBy('nama_bahan');

        $baris = [];
        foreach (Menu::all() as $menu) {
            // Tentukan ukuran + nama dasar.
            $nama = $menu->nama_menu;
            if (str_ends_with($nama, ' (L)')) {
                $ukuran = 'L';
                $base = substr($nama, 0, -4);
            } elseif (str_ends_with($nama, ' (R)')) {
                $ukuran = 'R';
                $base = substr($nama, 0, -4);
            } else {
                $ukuran = 'S'; // satu ukuran
                $base = $nama;
            }

            if (! isset($resep[$base])) {
                continue; // menu demo / tak dikenal → lewati
            }

            // Bahan konsumsi (takaran L = ×1,3).
            foreach ($resep[$base] as [$namaBahan, $takaran]) {
                $b = $bahanMap->get($namaBahan);
                if (! $b) {
                    continue; // bahan tak ditemukan → aman-lewati
                }
                $qty = $ukuran === 'L' ? (int) round($takaran * self::FAKTOR_L) : $takaran;
                $baris[] = [
                    'id_menu' => $menu->id_menu,
                    'id_bahan' => $b->id_bahan,
                    'takaran' => $qty,
                    'satuan' => $b->satuan,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Kemasan otomatis.
            $kemasan = match (true) {
                in_array($menu->kategori, $kategoriGelas, true) => $ukuran === 'L' ? 'Paper Cup 16oz' : 'Paper Cup 12oz',
                $menu->kategori === 'Botol 1 Liter' => 'Botol 1 Liter',
                $menu->kategori === 'Rice Bowl' => 'Box Rice Bowl',
                default => 'Box Snack', // Roti Panggang & Frenchfries
            };
            if ($bk = $bahanMap->get($kemasan)) {
                $baris[] = [
                    'id_menu' => $menu->id_menu,
                    'id_bahan' => $bk->id_bahan,
                    'takaran' => 1,
                    'satuan' => $bk->satuan,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Bulk insert resep.
        foreach (array_chunk($baris, 200) as $chunk) {
            Resep::insert($chunk);
        }
    }
}
