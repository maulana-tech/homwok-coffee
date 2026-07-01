<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penjualan extends Model
{
    protected $table = 'penjualan';
    protected $primaryKey = 'id_penjualan';

    protected $fillable = [
        'id_pegawai',
        'nomor_nota',
        'tanggal_jual',
        'total_jual',
        'total_diskon',
        'pajak',
        'grand_total',
        'total_hpp',
        'laba_kotor',
    ];

    protected $casts = [
        'tanggal_jual' => 'datetime',
        'total_jual' => 'float',
        'total_diskon' => 'float',
        'pajak' => 'float',
        'grand_total' => 'float',
        'total_hpp' => 'float',
        'laba_kotor' => 'float',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai', 'id_pegawai');
    }

    public function detailPenjualan()
    {
        return $this->hasMany(DetailPenjualan::class, 'id_penjualan', 'id_penjualan');
    }
}
