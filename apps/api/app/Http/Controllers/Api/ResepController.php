<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resep;
use Illuminate\Http\Request;

class ResepController extends Controller
{
    public function index(Request $request)
    {
        $query = Resep::with(['bahanBaku', 'menu']);

        if ($request->filled('id_menu')) {
            $query->where('id_menu', $request->query('id_menu'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_menu' => 'required|integer|exists:menu,id_menu',
            'id_bahan' => 'required|integer|exists:bahan_baku,id_bahan',
            'takaran' => 'required|numeric|min:0.01',
            'satuan' => 'required|string|max:50',
        ]);

        $resep = Resep::create($data);

        return response()->json($resep->load('bahanBaku'), 201);
    }

    public function destroy(string $id)
    {
        Resep::findOrFail($id)->delete();

        return response()->json(['message' => 'Resep dihapus']);
    }
}
