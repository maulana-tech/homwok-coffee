<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $query = Menu::query()->orderBy('nama_menu');

        if ($request->query('with') === 'resep') {
            $query->with('resep.bahanBaku');
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_menu' => 'required|string|max:255',
            'kategori' => 'required|string|max:255',
            'harga_jual' => 'required|numeric|min:0',
            'aktif' => 'sometimes|boolean',
        ]);

        return response()->json(Menu::create($data), 201);
    }

    public function show(string $id)
    {
        return response()->json(Menu::with('resep.bahanBaku')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $menu = Menu::findOrFail($id);

        $data = $request->validate([
            'nama_menu' => 'sometimes|required|string|max:255',
            'kategori' => 'sometimes|required|string|max:255',
            'harga_jual' => 'sometimes|required|numeric|min:0',
            'aktif' => 'sometimes|boolean',
        ]);

        $menu->update($data);

        return response()->json($menu);
    }

    public function destroy(string $id)
    {
        Menu::findOrFail($id)->delete();

        return response()->json(['message' => 'Menu dihapus']);
    }
}
