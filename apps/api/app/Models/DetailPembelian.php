<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailPembelian extends Model
{
    protected $table = 'detail_pembelian';
    protected $primaryKey = 'id_detail_pembelian';

    protected $fillable = [
        'id_pembelian',
        'id_bahan',
        'qty_awal',
        'sisa_qty',
        'harga_beli',
        'tanggal_kadaluarsa',
    ];

    protected $casts = [
        'qty_awal' => 'float',
        'sisa_qty' => 'float',
        'harga_beli' => 'float',
        'tanggal_kadaluarsa' => 'date',
    ];

    public function pembelian()
    {
        return $this->belongsTo(Pembelian::class, 'id_pembelian', 'id_pembelian');
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class, 'id_bahan', 'id_bahan');
    }

    public function scopeTersedia($query)
    {
        return $query->where('sisa_qty', '>', 0);
    }
}
