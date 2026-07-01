<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Penjualan;
use App\Services\FifoCostCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PenjualanController extends Controller
{
    public function __construct(private FifoCostCalculator $fifo) {}

    public function index(Request $request)
    {
        $query = Penjualan::with('pegawai')->orderByDesc('tanggal_jual');

        if ($request->filled('from')) {
            $query->whereDate('tanggal_jual', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('tanggal_jual', '<=', $request->query('to'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id_menu' => 'required|integer|exists:menu,id_menu',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        $result = $this->fifo->prosesPenjualan($validated['items'], (int) Auth::id());

        if (! $result['success']) {
            $status = Str::contains($result['error'], 'tidak cukup') ? 422 : 500;

            return response()->json(['message' => $result['error']], $status);
        }

        $penjualan = $result['penjualan'];

        return response()->json([
            'id_penjualan' => $penjualan->id_penjualan,
            'nomor_nota'   => $penjualan->nomor_nota,
            'tanggal_jual' => $penjualan->tanggal_jual,
            'total_jual'   => (float) $penjualan->total_jual,
            'grand_total'  => (float) $penjualan->grand_total,
            'total_hpp'    => (float) $penjualan->total_hpp,
            'laba_kotor'   => (float) $penjualan->laba_kotor,
            'kasir'        => $penjualan->pegawai?->nama_lengkap,
            'items'        => $penjualan->detailPenjualan->map(fn ($d) => [
                'id_menu'    => $d->id_menu,
                'nama_menu'  => $d->menu?->nama_menu,
                'qty'        => (int) $d->qty,
                'harga_jual' => (float) $d->harga_jual,
                'subtotal'   => (float) $d->subtotal,
                'hpp_menu'   => (float) $d->hpp_menu,
            ]),
        ], 201);
    }

    public function show(string $id)
    {
        $penjualan = Penjualan::with([
            'pegawai',
            'detailPenjualan.menu',
            'detailPenjualan.pemakaianBahan.bahanBaku',
        ])->findOrFail($id);

        return response()->json($penjualan);
    }
}
