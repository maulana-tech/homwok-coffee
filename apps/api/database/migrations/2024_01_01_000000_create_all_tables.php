<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pegawai
        Schema::create('pegawai', function (Blueprint $table) {
            $table->id('id_pegawai');
            $table->string('nama_lengkap');
            $table->string('username')->unique();
            $table->string('kata_sandi');
            $table->enum('peran', ['barista', 'manager']);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // Menu
        Schema::create('menu', function (Blueprint $table) {
            $table->id('id_menu');
            $table->string('nama_menu');
            $table->string('kategori');
            $table->decimal('harga_jual', 15, 2);
            $table->string('foto')->nullable(); // path di disk 'public', mis. "menu/abc.jpg"
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // Bahan Baku
        Schema::create('bahan_baku', function (Blueprint $table) {
            $table->id('id_bahan');
            $table->string('nama_bahan');
            $table->string('satuan');
            $table->decimal('stok_minimum', 12, 2);
            $table->timestamps();
        });

        // Resep
        Schema::create('resep', function (Blueprint $table) {
            $table->id('id_resep');
            $table->foreignId('id_menu')->constrained('menu', 'id_menu');
            $table->foreignId('id_bahan')->constrained('bahan_baku', 'id_bahan');
            $table->decimal('takaran', 12, 2);
            $table->string('satuan');
            $table->timestamps();
        });

        // Pembelian
        Schema::create('pembelian', function (Blueprint $table) {
            $table->id('id_pembelian');
            $table->foreignId('id_pegawai')->constrained('pegawai', 'id_pegawai');
            $table->string('nomor_pembelian')->unique();
            $table->date('tanggal_beli');
            $table->string('pemasok');
            $table->decimal('total_beli', 15, 2);
            $table->timestamps();
        });

        // Detail Pembelian (FIFO Lot)
        Schema::create('detail_pembelian', function (Blueprint $table) {
            $table->id('id_detail_pembelian');
            $table->foreignId('id_pembelian')->constrained('pembelian', 'id_pembelian');
            $table->foreignId('id_bahan')->constrained('bahan_baku', 'id_bahan');
            $table->decimal('qty_awal', 12, 2);
            $table->decimal('sisa_qty', 12, 2);
            $table->decimal('harga_beli', 15, 2);
            $table->date('tanggal_kadaluarsa')->nullable();
            $table->timestamps();
            $table->index(['id_bahan', 'sisa_qty']);
        });

        // Penjualan
        Schema::create('penjualan', function (Blueprint $table) {
            $table->id('id_penjualan');
            $table->foreignId('id_pegawai')->constrained('pegawai', 'id_pegawai');
            $table->string('nomor_nota')->unique();
            $table->dateTime('tanggal_jual');
            $table->decimal('total_jual', 15, 2);
            $table->decimal('total_diskon', 15, 2)->default(0);
            $table->decimal('pajak', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            $table->decimal('total_hpp', 15, 2);
            $table->decimal('laba_kotor', 15, 2);
            $table->timestamps();
        });

        // Detail Penjualan
        Schema::create('detail_penjualan', function (Blueprint $table) {
            $table->id('id_detail_penjualan');
            $table->foreignId('id_penjualan')->constrained('penjualan', 'id_penjualan');
            $table->foreignId('id_menu')->constrained('menu', 'id_menu');
            $table->integer('qty');
            $table->decimal('harga_jual', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('diskon', 15, 2)->default(0);
            $table->decimal('hpp_menu', 15, 2);
            $table->timestamps();
        });

        // Pemakaian Bahan (HPP Log)
        Schema::create('pemakaian_bahan', function (Blueprint $table) {
            $table->id('id_pemakaian');
            $table->foreignId('id_detail_penjualan')->constrained('detail_penjualan', 'id_detail_penjualan');
            $table->foreignId('id_bahan')->constrained('bahan_baku', 'id_bahan');
            $table->foreignId('id_detail_pembelian')->constrained('detail_pembelian', 'id_detail_pembelian');
            $table->decimal('qty_dipakai', 12, 2);
            $table->decimal('harga_beli', 15, 2);
            $table->decimal('subtotal_hpp', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemakaian_bahan');
        Schema::dropIfExists('detail_penjualan');
        Schema::dropIfExists('penjualan');
        Schema::dropIfExists('detail_pembelian');
        Schema::dropIfExists('pembelian');
        Schema::dropIfExists('resep');
        Schema::dropIfExists('bahan_baku');
        Schema::dropIfExists('menu');
        Schema::dropIfExists('pegawai');
    }
};
