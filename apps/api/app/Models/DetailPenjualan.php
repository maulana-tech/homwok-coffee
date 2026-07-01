<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailPenjualan extends Model
{
    protected $table = 'detail_penjualan';
    protected $primaryKey = 'id_detail_penjualan';

    protected $fillable = [
        'id_penjualan',
        'id_menu',
        'qty',
        'harga_jual',
        'subtotal',
        'diskon',
        'hpp_menu',
    ];

    protected $casts = [
        'qty' => 'integer',
        'harga_jual' => 'float',
        'subtotal' => 'float',
        'diskon' => 'float',
        'hpp_menu' => 'float',
    ];

    public function penjualan()
    {
        return $this->belongsTo(Penjualan::class, 'id_penjualan', 'id_penjualan');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'id_menu', 'id_menu');
    }

    public function pemakaianBahan()
    {
        return $this->hasMany(PemakaianBahan::class, 'id_detail_penjualan', 'id_detail_penjualan');
    }
}
