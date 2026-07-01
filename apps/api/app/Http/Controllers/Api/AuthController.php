<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $pegawai = Pegawai::where('username', $credentials['username'])->first();

        if (! $pegawai || ! Hash::check($credentials['password'], $pegawai->kata_sandi)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah'],
            ]);
        }

        if (! $pegawai->aktif) {
            throw ValidationException::withMessages([
                'username' => ['Akun tidak aktif, hubungi manajer'],
            ]);
        }

        $token = $pegawai->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $pegawai,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
