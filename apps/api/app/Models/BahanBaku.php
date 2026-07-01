<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BahanBaku extends Model
{
    protected $table = 'bahan_baku';
    protected $primaryKey = 'id_bahan';

    protected $fillable = [
        'nama_bahan',
        'satuan',
        'stok_minimum',
    ];

    protected $casts = [
        'stok_minimum' => 'float',
    ];

    public function detailPembelian()
    {
        return $this->hasMany(DetailPembelian::class, 'id_bahan', 'id_bahan');
    }

    public function resep()
    {
        return $this->hasMany(Resep::class, 'id_bahan', 'id_bahan');
    }
}
