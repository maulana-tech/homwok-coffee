<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;

/**
 * Katalog menu asli Homwok Coffee (master data).
 *
 * Sumber: papan menu Homwok. Harga di papan ditulis dalam ribuan rupiah
 * (mis. "18" = Rp 18.000), jadi tiap harga dikali 1.000 saat disimpan.
 *
 * Menu dua ukuran (R = Reguler, L = Large) dipecah menjadi dua baris menu
 * terpisah — mis. "Homwok Original (R)" dan "Homwok Original (L)" — karena
 * skema `menu` menyimpan satu harga per baris (`harga_jual`).
 *
 * Nama pada kategori snack/botol diberi prefiks kategori agar unik lintas
 * kategori (mis. "Cheese" ada di Roti Panggang & Frenchfries).
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // ── Minuman dua ukuran: [nama, harga R, harga L] (L = null jika satu ukuran) ──
        $coffee = [
            ['Cappuccino', 18, null],
            ['Espresso', 8, null],
            ['Homwok Original', 18, 23],
            ['Homwok Signature', 20, 25],
            ['Hawaiian Coffee', 20, 25],
            ['Sweet Black', 15, 20],
            ['Homwok Booster', 22, 27],
        ];

        $flavouredCoffee = [
            ['Hazelnut', 24, 29],
            ['Caramel', 24, 29],
            ['Coca Rum', 24, 29],
            ['Regal Coffee Rum', 24, 29],
            ['Salted Caramel', 24, 29],
            ['Irish', 24, 29],
            ['Peanut Butter Cookies', 24, 29],
            ['Avocado Coffee', 24, 29],
        ];

        $mocktail = [
            ['Sparkling Yellow', 22, 27],
            ['Tropical Fizzy', 22, 27],
            ['Strawberry Rock', 18, 23],
            ['Mango Fizz', 18, 23],
            ['Mango Peach', 18, 23],
            ['Sparkling Berry', 18, 23],
            ['Apple Mojito', 18, 23],
        ];

        $nonCoffee = [
            ['Thai Tea', 18, 23],
            ['Taro', 18, 23],
            ['Red Velvet', 20, 25],
            ['Regal Rum', 20, 25],
            ['Oreo Blend', 20, 25],
            ['Matcha Latte', 20, 25],
            ['Original Choco', 20, 25],
            ['Avocado Choco', 22, 27],
        ];

        $fruitSeries = [
            ['Lychee Tea', 16, 21],
            ["Passionate'a", 16, 21],
            ['Red Sunrise', 14, null],
        ];

        // ── Item satu harga: [nama, harga] ──
        $botol = [
            ['Botol 1L Original', 65],
            ['Botol 1L Signature Aren', 70],
            ['Botol 1L Avocado Choco', 70],
            ['Botol 1L Coca Rum', 75],
            ['Botol 1L Mango Peach', 65],
            ['Botol 1L Strawberry Rock', 65],
        ];

        $rotiPanggang = [
            ['Roti Panggang Chocolate Original', 14],
            ['Roti Panggang Cheese', 14],
            ['Roti Panggang Chocolate Cheese', 17],
            ['Roti Panggang Chocolate Melt', 17],
            ['Roti Panggang Cheese Melt', 17],
            ['Roti Panggang Oreo Cheese Melt', 18],
            ['Roti Panggang Double Cheese Melt', 22],
            ['Roti Panggang Smokebeef Egg Cheese', 22],
            ['Cheese Garlic Bread', 14],
        ];

        $frenchfries = [
            ['Frenchfries Original', 13],
            ['Frenchfries Barbeque', 15],
            ['Frenchfries Cheese', 15],
            ['Frenchfries Spicy Balado', 15],
            ['Frenchfries Hot and Spicy', 15],
        ];

        $riceBowl = [
            ['Rice Bowl Chicken Blackpepper', 21],
            ['Rice Bowl Chicken Katsu Teriyaki', 21],
            ['Rice Bowl Chicken Katsu Mayo', 21],
            ['Rice Bowl Chicken Cheeze', 21],
            ['Rice Bowl Bistik Galantin', 21],
            ['Rice Bowl Chicken Salted Egg', 24],
        ];

        $rows = [];

        // Pecah item R/L menjadi dua baris; item satu ukuran tetap satu baris.
        $addSized = function (string $kategori, array $items) use (&$rows) {
            foreach ($items as [$nama, $r, $l]) {
                if ($l === null) {
                    $rows[] = [$nama, $kategori, $r];
                } else {
                    $rows[] = [$nama . ' (R)', $kategori, $r];
                    $rows[] = [$nama . ' (L)', $kategori, $l];
                }
            }
        };

        $addSingle = function (string $kategori, array $items) use (&$rows) {
            foreach ($items as [$nama, $harga]) {
                $rows[] = [$nama, $kategori, $harga];
            }
        };

        $addSized('Coffee', $coffee);
        $addSized('Flavoured Coffee', $flavouredCoffee);
        $addSized('Mocktail', $mocktail);
        $addSingle('Botol 1 Liter', $botol);
        $addSized('Non Coffee', $nonCoffee);
        $addSized('Fruit Series', $fruitSeries);
        $addSingle('Roti Panggang', $rotiPanggang);
        $addSingle('Frenchfries', $frenchfries);
        $addSingle('Rice Bowl', $riceBowl);

        // Bulk insert (harga papan × 1.000).
        $now = now();
        $data = [];
        foreach ($rows as [$nama, $kategori, $ribuan]) {
            $data[] = [
                'nama_menu' => $nama,
                'kategori' => $kategori,
                'harga_jual' => $ribuan * 1000,
                'foto' => null,
                'aktif' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        Menu::insert($data);
    }
}
