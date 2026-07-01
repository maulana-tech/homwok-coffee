<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanBaku;
use Illuminate\Http\Request;

class BahanBakuController extends Controller
{
    public function index()
    {
        return response()->json(BahanBaku::orderBy('nama_bahan')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_bahan' => 'required|string|max:255',
            'satuan' => 'required|string|max:50',
            'stok_minimum' => 'required|numeric|min:0',
        ]);

        return response()->json(BahanBaku::create($data), 201);
    }

    public function show(string $id)
    {
        return response()->json(BahanBaku::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $bahan = BahanBaku::findOrFail($id);

        $data = $request->validate([
            'nama_bahan' => 'sometimes|required|string|max:255',
            'satuan' => 'sometimes|required|string|max:50',
            'stok_minimum' => 'sometimes|required|numeric|min:0',
        ]);

        $bahan->update($data);

        return response()->json($bahan);
    }

    public function destroy(string $id)
    {
        BahanBaku::findOrFail($id)->delete();

        return response()->json(['message' => 'Bahan dihapus']);
    }
}
