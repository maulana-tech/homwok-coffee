<?php

namespace App\Services;

use App\Models\DetailPembelian;
use App\Models\DetailPenjualan;
use App\Models\Menu;
use App\Models\PemakaianBahan;
use App\Models\Penjualan;
use Illuminate\Support\Facades\DB;

/**
 * Inti sistem: memproses penjualan dan menghitung HPP (COGS) berdasarkan
 * konsumsi lot bahan baku secara FIFO (First In First Out).
 *
 * Seluruh proses berjalan dalam satu transaksi DB dengan row-level locking
 * (`lockForUpdate`) pada lot agar aman dari race condition antar kasir.
 */
class FifoCostCalculator
{
    /**
     * @param  array<int, array{id_menu:int, qty:int}>  $items
     * @return array{success:bool, penjualan:?Penjualan, error:?string}
     */
    public function prosesPenjualan(array $items, int $idPegawai): array
    {
        try {
            $penjualan = DB::transaction(function () use ($items, $idPegawai) {
                $penjualan = Penjualan::create([
                    'id_pegawai'   => $idPegawai,
                    'nomor_nota'   => $this->generateNomorNota(),
                    'tanggal_jual' => now(),
                    'total_jual'   => 0,
                    'total_diskon' => 0,
                    'pajak'        => 0,
                    'grand_total'  => 0,
                    'total_hpp'    => 0,
                    'laba_kotor'   => 0,
                ]);

                $totalJual = 0.0;
                $totalHpp = 0.0;

                foreach ($items as $item) {
                    /** @var Menu $menu */
                    $menu = Menu::with('resep.bahanBaku')->findOrFail($item['id_menu']);
                    $qty = (int) $item['qty'];

                    if ($menu->resep->isEmpty()) {
                        throw new \RuntimeException("Menu '{$menu->nama_menu}' belum memiliki resep");
                    }

                    $subtotal = (float) $menu->harga_jual * $qty;

                    $detail = DetailPenjualan::create([
                        'id_penjualan' => $penjualan->id_penjualan,
                        'id_menu'      => $menu->id_menu,
                        'qty'          => $qty,
                        'harga_jual'   => $menu->harga_jual,
                        'subtotal'     => $subtotal,
                        'diskon'       => 0,
                        'hpp_menu'     => 0,
                    ]);

                    $hppMenu = $this->hitungHppMenu($menu, $qty, $detail);
                    $detail->update(['hpp_menu' => $hppMenu]);

                    $totalJual += $subtotal;
                    $totalHpp += $hppMenu;
                }

                $penjualan->update([
                    'total_jual'  => $totalJual,
                    'grand_total' => $totalJual, // sebelum diskon/pajak transaksi
                    'total_hpp'   => $totalHpp,
                    'laba_kotor'  => $totalJual - $totalHpp,
                ]);

                return $penjualan->load('detailPenjualan.menu', 'pegawai');
            });

            return ['success' => true, 'penjualan' => $penjualan, 'error' => null];
        } catch (\Throwable $e) {
            return ['success' => false, 'penjualan' => null, 'error' => $e->getMessage()];
        }
    }

    /**
     * Hitung HPP satu baris menu dengan konsumsi lot FIFO (dengan row lock).
     */
    private function hitungHppMenu(Menu $menu, int $qtyPorsi, DetailPenjualan $detail): float
    {
        $hppMenu = 0.0;

        foreach ($menu->resep as $resep) {
            $butuh = (float) $resep->takaran * $qtyPorsi;

            // Ambil lot yang masih tersedia, urut tertua dulu (tanggal_beli, lalu id).
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
                if ($butuh <= 0) {
                    break;
                }

                $ambil = min((float) $lot->sisa_qty, $butuh);
                $lot->update(['sisa_qty' => (float) $lot->sisa_qty - $ambil]);

                $subtotalHpp = $ambil * (float) $lot->harga_beli;

                PemakaianBahan::create([
                    'id_detail_penjualan' => $detail->id_detail_penjualan,
                    'id_bahan'            => $resep->id_bahan,
                    'id_detail_pembelian' => $lot->id_detail_pembelian,
                    'qty_dipakai'         => $ambil,
                    'harga_beli'          => $lot->harga_beli,
                    'subtotal_hpp'        => $subtotalHpp,
                ]);

                $hppMenu += $subtotalHpp;
                $butuh -= $ambil;
            }

            if ($butuh > 0.00001) {
                $nama = $resep->bahanBaku?->nama_bahan ?? "bahan #{$resep->id_bahan}";
                throw new \RuntimeException(
                    "Stok '{$nama}' tidak cukup untuk menu '{$menu->nama_menu}'. Kurang: ".round($butuh, 2)
                );
            }
        }

        return round($hppMenu, 2);
    }

    /**
     * Nomor nota unik per hari: NJ-YYYYMMDD-XXX.
     * Lock baris terakhir hari ini agar dua kasir tidak dapat nomor kembar.
     */
    private function generateNomorNota(): string
    {
        $prefix = 'NJ-'.now()->format('Ymd').'-';

        $last = Penjualan::whereDate('tanggal_jual', today())
            ->orderByDesc('id_penjualan')
            ->lockForUpdate()
            ->first();

        $sequence = $last ? ((int) substr($last->nomor_nota, -3)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }
}
