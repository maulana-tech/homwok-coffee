<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048', // maks 2 MB
        ]);

        // Simpan file ke disk 'public' → path "menu/xxxx.jpg"
        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('menu', 'public');
        }

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
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'hapus_foto' => 'sometimes|boolean', // true = hapus foto tanpa mengganti
        ]);

        // Ganti foto: simpan yang baru, hapus yang lama.
        if ($request->hasFile('foto')) {
            if ($menu->foto) {
                Storage::disk('public')->delete($menu->foto);
            }
            $data['foto'] = $request->file('foto')->store('menu', 'public');
        } elseif ($request->boolean('hapus_foto') && $menu->foto) {
            Storage::disk('public')->delete($menu->foto);
            $data['foto'] = null;
        }

        unset($data['hapus_foto']);
        $menu->update($data);

        return response()->json($menu);
    }

    public function destroy(string $id)
    {
        $menu = Menu::findOrFail($id);

        if ($menu->foto) {
            Storage::disk('public')->delete($menu->foto);
        }

        $menu->delete();

        return response()->json(['message' => 'Menu dihapus']);
    }
}
