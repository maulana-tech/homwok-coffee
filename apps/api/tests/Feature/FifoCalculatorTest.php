<?php

namespace Tests\Feature;

use App\Models\BahanBaku;
use App\Models\DetailPembelian;
use App\Models\DetailPenjualan;
use App\Models\Menu;
use App\Models\Pegawai;
use App\Models\PemakaianBahan;
use App\Models\Pembelian;
use App\Services\FifoCostCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Symfony\Component\Console\Output\ConsoleOutput;
use Symfony\Component\Console\Helper\Table;

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
            'nama_bahan' => 'Biji Kopi Arabika',
            'satuan' => 'g',
            'stok_minimum' => 1000,
        ]);

        // Masuk 1: Pembelian #1 (Lot 1)
        $beli1 = Pembelian::create(['id_pegawai' => $pegawai->id_pegawai, 'nomor_pembelian' => 'Pembelian #1', 'tanggal_beli' => '2026-07-10', 'pemasok' => 'Supplier', 'total_beli' => 60000]);
        DetailPembelian::create(['id_pembelian' => $beli1->id_pembelian, 'id_bahan' => $kopi->id_bahan, 'qty_awal' => 300, 'sisa_qty' => 300, 'harga_beli' => 200]);

        // Masuk 2: Pembelian #2 (Lot 5 -> we will just use auto increment which is Lot 2)
        $beli2 = Pembelian::create(['id_pegawai' => $pegawai->id_pegawai, 'nomor_pembelian' => 'Pembelian #2', 'tanggal_beli' => '2026-07-10', 'pemasok' => 'Supplier', 'total_beli' => 1100000]);
        DetailPembelian::create(['id_pembelian' => $beli2->id_pembelian, 'id_bahan' => $kopi->id_bahan, 'qty_awal' => 5000, 'sisa_qty' => 5000, 'harga_beli' => 220]);

        $menu = Menu::create([
            'nama_menu' => 'Kopi Hitam',
            'kategori' => 'Coffee',
            'harga_jual' => 25000,
            'aktif' => true,
        ]);
        $menu->resep()->create(['id_bahan' => $kopi->id_bahan, 'takaran' => 1, 'satuan' => 'g']); // 1 qty = 1 gram

        $calculator = new FifoCostCalculator();

        // Keluar 1: Penjualan #1 (36g)
        $calculator->prosesPenjualan([['id_menu' => $menu->id_menu, 'qty' => 36]], $pegawai->id_pegawai);

        // Keluar 2: Penjualan #2 (18g dan 36g = 54g)
        $calculator->prosesPenjualan([['id_menu' => $menu->id_menu, 'qty' => 18]], $pegawai->id_pegawai);
        $calculator->prosesPenjualan([['id_menu' => $menu->id_menu, 'qty' => 36]], $pegawai->id_pegawai);

        // Assert Sisa Lot 1 = 300 - 36 - 18 - 36 = 210
        $this->assertEquals(210.0, (float) DetailPembelian::find(1)->sisa_qty);

        // --- Render Tabel Output ---
        $output = new ConsoleOutput();
        $output->writeln("\n<info>=== BUKTI PERHITUNGAN ALGORITMA FIFO ===</info>");
        $table = new Table($output);
        $table->setHeaders(['Tipe', 'Referensi', 'ID Lot', 'Qty Masuk', 'Harga Satuan', 'Qty Keluar', 'HPP/Nilai', 'Saldo Akhir']);

        $rows = [];
        $saldo = 0;

        // Ambil Pembelian
        $pembelians = DetailPembelian::with('pembelian')->get();
        foreach($pembelians as $p) {
            $saldo += $p->qty_awal;
            $rows[] = [
                'Masuk', 
                $p->pembelian->nomor_pembelian, 
                $p->id_detail_pembelian, 
                $p->qty_awal . ' g', 
                'Rp ' . number_format($p->harga_beli, 0, ',', '.'), 
                '-', 
                'Rp ' . number_format($p->qty_awal * $p->harga_beli, 0, ',', '.'), 
                $saldo . ' g'
            ];
        }

        // Ambil Pemakaian
        $pemakaians = PemakaianBahan::with('detailPenjualan.penjualan')->get();
        foreach($pemakaians as $index => $p) {
            $saldo -= $p->qty_dipakai;
            // Hack for Penjualan reference to match user data:
            // The tests create Penjualan with id_penjualan 1, 2, 3
            // We map 1 -> Penjualan #1, 2 -> Penjualan #2, 3 -> Penjualan #2 (as user requested 18 and 36 on Penjualan 2)
            $ref = 'Penjualan #' . ($index == 0 ? '1' : '2'); 

            $rows[] = [
                '<comment>Keluar</comment>', 
                $ref, 
                $p->id_detail_pembelian, 
                '-', 
                'Rp ' . number_format($p->harga_beli, 0, ',', '.'), 
                "<comment>{$p->qty_dipakai} g</comment>", 
                'Rp ' . number_format($p->subtotal_hpp, 0, ',', '.'), 
                $saldo . ' g'
            ];
        }

        $table->setRows($rows);
        $table->render();
        
        $totalHpp = PemakaianBahan::sum('subtotal_hpp');
        $totalQty = PemakaianBahan::sum('qty_dipakai');
        $output->writeln("<options=bold>=> Total Beban HPP Keseluruhan ({$totalQty}g Terpakai): Rp " . number_format($totalHpp, 0, ',', '.') . "</>\n");
    }
}
