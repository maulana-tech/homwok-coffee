// Auth Types
export interface Pegawai {
  id_pegawai: number;
  nama_lengkap: string;
  username: string;
  peran: 'barista' | 'manager';
  aktif: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Pegawai;
}

// Master Data Types
export interface Menu {
  id_menu: number;
  nama_menu: string;
  kategori: string;
  harga_jual: number;
  aktif: boolean;
  /** Stored path relative to the public disk, e.g. "menu/abc.jpg" (null if no photo). */
  foto?: string | null;
  /** Full public URL to the photo, computed by the API accessor (null if no photo). */
  foto_url?: string | null;
  resep?: Resep[];
}

export interface BahanBaku {
  id_bahan: number;
  nama_bahan: string;
  satuan: string;
  stok_minimum: number;
}

export interface Resep {
  id_resep: number;
  id_menu: number;
  id_bahan: number;
  takaran: number;
  satuan: string;
  menu?: Menu;
  bahan_baku?: BahanBaku;
}

export interface Pembelian {
  id_pembelian: number;
  id_pegawai: number;
  nomor_pembelian: string;
  tanggal_beli: string;
  pemasok: string;
  total_beli: number;
  pegawai?: Pegawai;
  detail_pembelian?: DetailPembelian[];
}

export interface DetailPembelian {
  id_detail_pembelian: number;
  id_pembelian: number;
  id_bahan: number;
  qty_awal: number;
  sisa_qty: number;
  harga_beli: number;
  tanggal_kadaluarsa?: string | null;
  bahan_baku?: BahanBaku;
}

export interface Penjualan {
  id_penjualan: number;
  id_pegawai: number;
  nomor_nota: string;
  tanggal_jual: string;
  total_jual: number;
  total_diskon: number;
  pajak: number;
  grand_total: number;
  total_hpp: number;
  laba_kotor: number;
  pegawai?: Pegawai;
  detail_penjualan?: DetailPenjualan[];
}

export interface DetailPenjualan {
  id_detail_penjualan: number;
  id_penjualan: number;
  id_menu: number;
  qty: number;
  harga_jual: number;
  subtotal: number;
  diskon: number;
  hpp_menu: number;
  menu?: Menu;
}

export interface PemakaianBahan {
  id_pemakaian: number;
  id_detail_penjualan: number;
  id_bahan: number;
  id_detail_pembelian: number;
  qty_dipakai: number;
  harga_beli: number;
  subtotal_hpp: number;
  bahan_baku?: BahanBaku;
  detail_pembelian?: DetailPembelian;
}

// Report Types
/** Satu baris pergerakan pada kartu persediaan (kartu stok FIFO). */
export interface KartuPersediaanRow {
  tanggal: string;
  referensi: string;
  keterangan: string; // "Pembelian" | "Penjualan"
  masuk_qty: number;
  masuk_harga: number;
  masuk_total: number;
  keluar_qty: number;
  keluar_harga: number;
  keluar_total: number;
  /** Saldo berjalan — dihitung server (atau klien untuk data sample). */
  saldo_qty?: number;
  saldo_nilai?: number;
}

export interface KartuPersediaan {
  bahan: Pick<BahanBaku, 'id_bahan' | 'nama_bahan' | 'satuan'>;
  summary: {
    total_masuk_qty: number;
    total_masuk_nilai: number;
    total_keluar_qty: number;
    total_keluar_nilai: number;
    saldo_qty: number;
    saldo_nilai: number;
  };
  data: KartuPersediaanRow[];
}
