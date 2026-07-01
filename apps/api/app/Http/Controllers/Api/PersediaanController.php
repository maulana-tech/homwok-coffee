<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanBaku;
use App\Models\DetailPembelian;
use App\Models\Menu;
use Illuminate\Http\Request;

class PersediaanController extends Controller
{
    /**
     * Sisa stok + nilai persediaan tiap bahan (dari sisa lot FIFO).
     */
    public function index()
    {
        $data = BahanBaku::all()->map(function (BahanBaku $b) {
            $lots = DetailPembelian::tersedia()->where('id_bahan', $b->id_bahan)->get();
            $sisa = (float) $lots->sum('sisa_qty');
            $nilai = (float) $lots->sum(fn ($l) => $l->sisa_qty * $l->harga_beli);

            return [
                'id_bahan' => $b->id_bahan,
                'nama_bahan' => $b->nama_bahan,
                'satuan' => $b->satuan,
                'stok_minimum' => (float) $b->stok_minimum,
                'sisa_stok' => $sisa,
                'harga_rata' => $sisa > 0 ? round($nilai / $sisa, 2) : 0,
                'nilai_persediaan' => round($nilai, 2),
                'status' => $sisa <= (float) $b->stok_minimum ? 'warning' : 'ok',
            ];
        });

        return response()->json($data->values());
    }

    /**
     * Pre-transaction check: apakah stok cukup untuk semua item di keranjang.
     */
    public function cek(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id_menu' => 'required|integer|exists:menu,id_menu',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        // Akumulasi kebutuhan bahan dari resep seluruh item.
        $kebutuhan = [];
        foreach ($validated['items'] as $item) {
            $menu = Menu::with('resep')->find($item['id_menu']);
            if (! $menu) {
                continue;
            }
            foreach ($menu->resep as $resep) {
                $kebutuhan[$resep->id_bahan] =
                    ($kebutuhan[$resep->id_bahan] ?? 0) + $resep->takaran * $item['qty'];
            }
        }

        $kurang = [];
        foreach ($kebutuhan as $idBahan => $butuh) {
            $tersedia = (float) DetailPembelian::tersedia()
                ->where('id_bahan', $idBahan)
                ->sum('sisa_qty');

            if ($tersedia < $butuh) {
                $bahan = BahanBaku::find($idBahan);
                $kurang[] = [
                    'id_bahan' => $idBahan,
                    'nama_bahan' => $bahan?->nama_bahan,
                    'butuh' => $butuh,
                    'tersedia' => $tersedia,
                ];
            }
        }

        return response()->json([
            'cukup' => count($kurang) === 0,
            'kekurangan' => $kurang,
        ]);
    }
}
