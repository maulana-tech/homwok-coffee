<?php

namespace Tests\Feature;

use App\Models\BahanBaku;
use App\Models\DetailPembelian;
use App\Models\Menu;
use App\Models\Pegawai;
use App\Models\Pembelian;
use App\Services\FifoCostCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FifoCalculatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_menghitung_hpp_fifo_dengan_benar(): void
    {
        $pegawai = Pegawai::create([
            'nama_lengkap' => 'Kasir Uji',
            'username' => 'kasiruji',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'barista',
            'aktif' => true,
        ]);

        $kopi = BahanBaku::create([
            'nama_bahan' => 'Kopi',
            'satuan' => 'g',
            'stok_minimum' => 1000,
        ]);

        // 3 lot @ 5000 g: Rp120 (01 Jan), Rp135 (05 Jan), Rp150 (10 Jan)
        foreach ([['B001', '2026-01-01', 120], ['B002', '2026-01-05', 135], ['B003', '2026-01-10', 150]] as $lot) {
            $beli = Pembelian::create([
                'id_pegawai' => $pegawai->id_pegawai,
                'nomor_pembelian' => $lot[0],
                'tanggal_beli' => $lot[1],
                'pemasok' => 'CV Uji',
                'total_beli' => 5000 * $lot[2],
            ]);
            DetailPembelian::create([
                'id_pembelian' => $beli->id_pembelian,
                'id_bahan' => $kopi->id_bahan,
                'qty_awal' => 5000,
                'sisa_qty' => 5000,
                'harga_beli' => $lot[2],
            ]);
        }

        $menu = Menu::create([
            'nama_menu' => 'Kopi Hitam',
            'kategori' => 'Coffee',
            'harga_jual' => 50000,
            'aktif' => true,
        ]);
        $menu->resep()->create([
            'id_bahan' => $kopi->id_bahan,
            'takaran' => 6000, // butuh 6000 g → habiskan lot 1 (5000) + 1000 dari lot 2
            'satuan' => 'g',
        ]);

        $result = (new FifoCostCalculator())->prosesPenjualan(
            [['id_menu' => $menu->id_menu, 'qty' => 1]],
            $pegawai->id_pegawai
        );

        $this->assertTrue($result['success'], $result['error'] ?? 'gagal');

        // HPP = 5000×120 + 1000×135 = 735.000
        $this->assertEquals(735000.0, (float) $result['penjualan']->total_hpp);
        // laba_kotor = grand_total − total_hpp (di sini takaran sengaja besar utk uji FIFO)
        $this->assertEquals(50000.0 - 735000.0, (float) $result['penjualan']->laba_kotor);

        // Sisa lot setelah FIFO
        $this->assertEquals(0.0, (float) DetailPembelian::find(1)->sisa_qty);    // lot 1 habis
        $this->assertEquals(4000.0, (float) DetailPembelian::find(2)->sisa_qty); // lot 2 sisa 4000
        $this->assertEquals(5000.0, (float) DetailPembelian::find(3)->sisa_qty); // lot 3 utuh
    }
}
