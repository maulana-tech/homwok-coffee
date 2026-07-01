<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menu';
    protected $primaryKey = 'id_menu';

    protected $fillable = [
        'nama_menu',
        'kategori',
        'harga_jual',
        'aktif',
    ];

    protected $casts = [
        'harga_jual' => 'float',
        'aktif' => 'boolean',
    ];

    public function resep()
    {
        return $this->hasMany(Resep::class, 'id_menu', 'id_menu');
    }
}
