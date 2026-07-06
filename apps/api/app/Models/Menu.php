<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Menu extends Model
{
    protected $table = 'menu';
    protected $primaryKey = 'id_menu';

    protected $fillable = [
        'nama_menu',
        'kategori',
        'harga_jual',
        'foto',
        'aktif',
    ];

    protected $casts = [
        'harga_jual' => 'float',
        'aktif' => 'boolean',
    ];

    /** Sertakan URL foto pada setiap respons JSON. */
    protected $appends = ['foto_url'];

    /** URL publik penuh dari path foto (null jika belum ada foto). */
    public function getFotoUrlAttribute(): ?string
    {
        return $this->foto ? Storage::url($this->foto) : null;
    }

    public function resep()
    {
        return $this->hasMany(Resep::class, 'id_menu', 'id_menu');
    }
}
