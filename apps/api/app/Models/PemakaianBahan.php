<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PemakaianBahan extends Model
{
    protected $table = 'pemakaian_bahan';
    protected $primaryKey = 'id_pemakaian';

    protected $fillable = [
        'id_detail_penjualan',
        'id_bahan',
        'id_detail_pembelian',
        'qty_dipakai',
        'harga_beli',
        'subtotal_hpp',
    ];

    public function detailPenjualan()
    {
        return $this->belongsTo(DetailPenjualan::class, 'id_detail_penjualan', 'id_detail_penjualan');
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class, 'id_bahan', 'id_bahan');
    }

    public function detailPembelian()
    {
        return $this->belongsTo(DetailPembelian::class, 'id_detail_pembelian', 'id_detail_pembelian');
    }
}
