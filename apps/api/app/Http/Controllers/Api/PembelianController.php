<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetailPembelian;
use App\Models\Pembelian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PembelianController extends Controller
{
    public function index()
    {
        $rows = Pembelian::withCount('detailPembelian as jumlah_item')
            ->with('pegawai')
            ->orderByDesc('tanggal_beli')
            ->get();

        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pemasok' => 'required|string|max:255',
            'tanggal_beli' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.id_bahan' => 'required|integer|exists:bahan_baku,id_bahan',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.harga_beli' => 'required|numeric|min:0',
            'items.*.tanggal_kadaluarsa' => 'nullable|date',
        ]);

        $pembelian = DB::transaction(function () use ($validated) {
            $total = collect($validated['items'])
                ->sum(fn ($i) => $i['qty'] * $i['harga_beli']);

            $pembelian = Pembelian::create([
                'id_pegawai' => (int) Auth::id(),
                'nomor_pembelian' => $this->generateNomor(),
                'tanggal_beli' => $validated['tanggal_beli'],
                'pemasok' => $validated['pemasok'],
                'total_beli' => $total,
            ]);

            foreach ($validated['items'] as $item) {
                // Setiap baris pembelian = satu LOT FIFO baru (sisa_qty = qty_awal).
                DetailPembelian::create([
                    'id_pembelian' => $pembelian->id_pembelian,
                    'id_bahan' => $item['id_bahan'],
                    'qty_awal' => $item['qty'],
                    'sisa_qty' => $item['qty'],
                    'harga_beli' => $item['harga_beli'],
                    'tanggal_kadaluarsa' => $item['tanggal_kadaluarsa'] ?? null,
                ]);
            }

            return $pembelian->load('detailPembelian.bahanBaku', 'pegawai');
        });

        return response()->json($pembelian, 201);
    }

    public function show(string $id)
    {
        return response()->json(
            Pembelian::with(['detailPembelian.bahanBaku', 'pegawai'])->findOrFail($id)
        );
    }

    private function generateNomor(): string
    {
        $prefix = 'PO-'.now()->format('Ymd').'-';

        $count = Pembelian::where('nomor_pembelian', 'like', $prefix.'%')
            ->lockForUpdate()
            ->count();

        return $prefix.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }
}
