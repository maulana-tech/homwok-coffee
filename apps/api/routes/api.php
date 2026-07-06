<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BahanBakuController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\PegawaiController;
use App\Http\Controllers\Api\PembelianController;
use App\Http\Controllers\Api\PenjualanController;
use App\Http\Controllers\Api\PersediaanController;
use App\Http\Controllers\Api\ResepController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/login', [AuthController::class, 'login']);

// Authenticated (Sanctum bearer token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Master data
    Route::apiResource('menu', MenuController::class);
    Route::apiResource('bahan', BahanBakuController::class);
    Route::apiResource('pegawai', PegawaiController::class);
    Route::apiResource('resep', ResepController::class)->only(['index', 'store', 'destroy']);

    // Purchasing (creates FIFO lots) & Sales (consumes FIFO lots + HPP)
    Route::apiResource('pembelian', PembelianController::class)->only(['index', 'store', 'show']);
    Route::apiResource('penjualan', PenjualanController::class)->only(['index', 'store', 'show']);

    // Inventory
    Route::get('persediaan', [PersediaanController::class, 'index']);
    Route::post('persediaan/cek', [PersediaanController::class, 'cek']);

    // Reports (manager only)
    Route::middleware('role:manager')->group(function () {
        Route::get('laporan/penjualan', [LaporanController::class, 'penjualan']);
        Route::get('laporan/pembelian', [LaporanController::class, 'pembelian']);
        Route::get('laporan/hpp', [LaporanController::class, 'hpp']);
        Route::get('laporan/laba-rugi', [LaporanController::class, 'labaRugi']);
        Route::get('laporan/kartu-persediaan', [LaporanController::class, 'kartuPersediaan']);
    });
});
