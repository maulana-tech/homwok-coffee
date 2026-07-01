<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Pegawai;
use App\Models\Menu;
use App\Models\BahanBaku;
use App\Models\Resep;
use App\Models\Pembelian;
use App\Models\DetailPembelian;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Pegawai
        $barista = Pegawai::create([
            'nama_lengkap' => 'Barista Satu',
            'username' => 'barista',
            'kata_sandi' => Hash::make('password'),
            'peran' => 'barista',
            'aktif' => true,
        ]);

        $manager = Pegawai::create([
            'nama_lengkap' => 'Manager Satu',
            'username' => 'manager',
            'kata_sandi' => Hash::make('password'),
            'peran' => 'manager',
            'aktif' => true,
        ]);

        // 2. Create Bahan Baku
        $kopi = BahanBaku::create([
            'nama_bahan' => 'Biji Kopi Arabika',
            'satuan' => 'gram',
            'stok_minimum' => 1000.00,
        ]);

        $susu = BahanBaku::create([
            'nama_bahan' => 'Susu Segar (Fresh Milk)',
            'satuan' => 'ml',
            'stok_minimum' => 2000.00,
        ]);

        $aren = BahanBaku::create([
            'nama_bahan' => 'Sirup Gula Aren',
            'satuan' => 'ml',
            'stok_minimum' => 500.00,
        ]);

        $cup = BahanBaku::create([
            'nama_bahan' => 'Paper Cup 12oz',
            'satuan' => 'pcs',
            'stok_minimum' => 100.00,
        ]);

        // 3. Create Menu
        $espresso = Menu::create([
            'nama_menu' => 'Espresso Solo',
            'kategori' => 'Coffee',
            'harga_jual' => 15000.00,
            'aktif' => true,
        ]);

        $latte = Menu::create([
            'nama_menu' => 'Caffe Latte',
            'kategori' => 'Coffee',
            'harga_jual' => 25000.00,
            'aktif' => true,
        ]);

        $arenLatte = Menu::create([
            'nama_menu' => 'Kopi Susu Aren',
            'kategori' => 'Coffee',
            'harga_jual' => 22000.00,
            'aktif' => true,
        ]);

        // 4. Create Resep (Recipes)
        // Espresso recipe
        Resep::create([
            'id_menu' => $espresso->id_menu,
            'id_bahan' => $kopi->id_bahan,
            'takaran' => 18.00,
            'satuan' => 'gram',
        ]);
        Resep::create([
            'id_menu' => $espresso->id_menu,
            'id_bahan' => $cup->id_bahan,
            'takaran' => 1.00,
            'satuan' => 'pcs',
        ]);

        // Caffe Latte recipe
        Resep::create([
            'id_menu' => $latte->id_menu,
            'id_bahan' => $kopi->id_bahan,
            'takaran' => 18.00,
            'satuan' => 'gram',
        ]);
        Resep::create([
            'id_menu' => $latte->id_menu,
            'id_bahan' => $susu->id_bahan,
            'takaran' => 150.00,
            'satuan' => 'ml',
        ]);
        Resep::create([
            'id_menu' => $latte->id_menu,
            'id_bahan' => $cup->id_bahan,
            'takaran' => 1.00,
            'satuan' => 'pcs',
        ]);

        // Kopi Susu Aren recipe
        Resep::create([
            'id_menu' => $arenLatte->id_menu,
            'id_bahan' => $kopi->id_bahan,
            'takaran' => 18.00,
            'satuan' => 'gram',
        ]);
        Resep::create([
            'id_menu' => $arenLatte->id_menu,
            'id_bahan' => $susu->id_bahan,
            'takaran' => 120.00,
            'satuan' => 'ml',
        ]);
        Resep::create([
            'id_menu' => $arenLatte->id_menu,
            'id_bahan' => $aren->id_bahan,
            'takaran' => 20.00,
            'satuan' => 'ml',
        ]);
        Resep::create([
            'id_menu' => $arenLatte->id_menu,
            'id_bahan' => $cup->id_bahan,
            'takaran' => 1.00,
            'satuan' => 'pcs',
        ]);

        // 5. Seed Pembelian & DetailPembelian (Initial Stock)
        $pembelian = Pembelian::create([
            'id_pegawai' => $manager->id_pegawai,
            'nomor_pembelian' => 'PO-' . date('Ymd') . '-0001',
            'tanggal_beli' => date('Y-m-d'),
            'pemasok' => 'CV. Kopi Nusantara',
            'total_beli' => 1500000.00,
        ]);

        // Detail 1: Biji Kopi (5000g @ Rp 200/g)
        DetailPembelian::create([
            'id_pembelian' => $pembelian->id_pembelian,
            'id_bahan' => $kopi->id_bahan,
            'qty_awal' => 5000.00,
            'sisa_qty' => 5000.00,
            'harga_beli' => 200.00,
            'tanggal_kadaluarsa' => date('Y-m-d', strtotime('+6 months')),
        ]);

        // Detail 2: Susu Segar (10000ml @ Rp 25/ml)
        DetailPembelian::create([
            'id_pembelian' => $pembelian->id_pembelian,
            'id_bahan' => $susu->id_bahan,
            'qty_awal' => 10000.00,
            'sisa_qty' => 10000.00,
            'harga_beli' => 25.00,
            'tanggal_kadaluarsa' => date('Y-m-d', strtotime('+7 days')),
        ]);

        // Detail 3: Sirup Gula Aren (2000ml @ Rp 15/ml)
        DetailPembelian::create([
            'id_pembelian' => $pembelian->id_pembelian,
            'id_bahan' => $aren->id_bahan,
            'qty_awal' => 2000.00,
            'sisa_qty' => 2000.00,
            'harga_beli' => 15.00,
            'tanggal_kadaluarsa' => date('Y-m-d', strtotime('+3 months')),
        ]);

        // Detail 4: Paper Cup (500 pcs @ Rp 1000/pcs)
        DetailPembelian::create([
            'id_pembelian' => $pembelian->id_pembelian,
            'id_bahan' => $cup->id_bahan,
            'qty_awal' => 500.00,
            'sisa_qty' => 500.00,
            'harga_beli' => 1000.00,
            'tanggal_kadaluarsa' => null,
        ]);
    }
}
