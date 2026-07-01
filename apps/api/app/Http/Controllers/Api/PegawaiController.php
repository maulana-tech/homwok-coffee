<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PegawaiController extends Controller
{
    public function index()
    {
        return response()->json(Pegawai::orderBy('nama_lengkap')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:pegawai,username',
            'peran' => 'required|in:barista,manager',
            'aktif' => 'sometimes|boolean',
            'password' => 'required|string|min:6',
        ]);

        $pegawai = Pegawai::create([
            'nama_lengkap' => $data['nama_lengkap'],
            'username' => $data['username'],
            'peran' => $data['peran'],
            'aktif' => $data['aktif'] ?? true,
            'kata_sandi' => Hash::make($data['password']),
        ]);

        return response()->json($pegawai, 201);
    }

    public function show(string $id)
    {
        return response()->json(Pegawai::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $pegawai = Pegawai::findOrFail($id);

        $data = $request->validate([
            'nama_lengkap' => 'sometimes|required|string|max:255',
            'username' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('pegawai', 'username')->ignore($id, 'id_pegawai'),
            ],
            'peran' => 'sometimes|required|in:barista,manager',
            'aktif' => 'sometimes|boolean',
            'password' => 'nullable|string|min:6',
        ]);

        if (! empty($data['password'])) {
            $pegawai->kata_sandi = Hash::make($data['password']);
        }
        unset($data['password']);

        $pegawai->fill($data)->save();

        return response()->json($pegawai);
    }

    public function destroy(string $id)
    {
        Pegawai::findOrFail($id)->delete();

        return response()->json(['message' => 'Pegawai dihapus']);
    }
}
