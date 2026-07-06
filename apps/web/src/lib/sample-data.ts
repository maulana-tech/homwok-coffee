/**
 * Sample data — stands in for the (not-yet-built) Laravel API so the whole UI
 * is demoable offline. Every consumer wraps these in TanStack Query so the
 * swap to real `api.get(...)` calls later is a one-line change per hook.
 *
 * Values mirror the Laravel seeder (DatabaseSeeder.php).
 */
import type {
  BahanBaku,
  Menu,
  Pegawai,
  Pembelian,
  Penjualan,
} from "@homwok/types";

export type StockStatus = "available" | "low" | "out";

export interface SampleUser extends Pegawai {
  password: string;
}

export interface SampleMenu extends Menu {
  stockStatus: StockStatus;
}

/** Seeded logins — password is "password" for both (see DatabaseSeeder.php). */
export const SAMPLE_USERS: SampleUser[] = [
  {
    id_pegawai: 1,
    nama_lengkap: "Barista Satu",
    username: "barista",
    peran: "barista",
    aktif: true,
    password: "password",
  },
  {
    id_pegawai: 2,
    nama_lengkap: "Manager Satu",
    username: "manager",
    peran: "manager",
    aktif: true,
    password: "password",
  },
];

/**
 * Foto placeholder deterministik (picsum) hanya untuk mode demo.
 * Saat backend nyala, `foto_url` datang dari accessor Menu (Storage::url).
 * Sebagian menu sengaja dibiarkan tanpa foto untuk menunjukkan ikon fallback.
 */
const fotoDemo = (seed: string) =>
  `https://picsum.photos/seed/${seed}/400/300`;

export const sampleMenus: SampleMenu[] = [
  { id_menu: 1, nama_menu: "Espresso Solo", kategori: "Coffee", harga_jual: 15000, aktif: true, stockStatus: "available", foto_url: fotoDemo("espresso") },
  { id_menu: 2, nama_menu: "Caffe Latte", kategori: "Coffee", harga_jual: 25000, aktif: true, stockStatus: "available", foto_url: fotoDemo("latte") },
  { id_menu: 3, nama_menu: "Kopi Susu Aren", kategori: "Coffee", harga_jual: 22000, aktif: true, stockStatus: "low", foto_url: fotoDemo("kopisusu") },
  { id_menu: 4, nama_menu: "Cappuccino", kategori: "Coffee", harga_jual: 24000, aktif: true, stockStatus: "available", foto_url: fotoDemo("cappuccino") },
  { id_menu: 5, nama_menu: "Americano", kategori: "Coffee", harga_jual: 20000, aktif: true, stockStatus: "available" },
  { id_menu: 6, nama_menu: "Matcha Latte", kategori: "Non-Coffee", harga_jual: 28000, aktif: true, stockStatus: "available", foto_url: fotoDemo("matcha") },
  { id_menu: 7, nama_menu: "Chocolate", kategori: "Non-Coffee", harga_jual: 26000, aktif: true, stockStatus: "available", foto_url: fotoDemo("chocolate") },
  { id_menu: 8, nama_menu: "Lemon Tea", kategori: "Non-Coffee", harga_jual: 18000, aktif: true, stockStatus: "out", foto_url: fotoDemo("lemontea") },
  { id_menu: 9, nama_menu: "Croissant", kategori: "Snack", harga_jual: 20000, aktif: true, stockStatus: "available", foto_url: fotoDemo("croissant") },
  { id_menu: 10, nama_menu: "Butter Toast", kategori: "Snack", harga_jual: 17000, aktif: true, stockStatus: "low" },
  { id_menu: 11, nama_menu: "French Fries", kategori: "Snack", harga_jual: 22000, aktif: true, stockStatus: "available", foto_url: fotoDemo("fries") },
  { id_menu: 12, nama_menu: "Affogato", kategori: "Coffee", harga_jual: 30000, aktif: false, stockStatus: "available", foto_url: fotoDemo("affogato") },
];

export interface SampleBahan extends BahanBaku {
  sisa_stok: number;
  harga_rata: number;
  nilai_persediaan: number;
  status: "ok" | "warning";
}

export const sampleBahan: SampleBahan[] = [
  { id_bahan: 1, nama_bahan: "Biji Kopi Arabika", satuan: "gram", stok_minimum: 1000, sisa_stok: 4200, harga_rata: 200, nilai_persediaan: 840000, status: "ok" },
  { id_bahan: 2, nama_bahan: "Susu Segar (Fresh Milk)", satuan: "ml", stok_minimum: 2000, sisa_stok: 1500, harga_rata: 25, nilai_persediaan: 37500, status: "warning" },
  { id_bahan: 3, nama_bahan: "Sirup Gula Aren", satuan: "ml", stok_minimum: 500, sisa_stok: 1800, harga_rata: 15, nilai_persediaan: 27000, status: "ok" },
  { id_bahan: 4, nama_bahan: "Paper Cup 12oz", satuan: "pcs", stok_minimum: 100, sisa_stok: 480, harga_rata: 1000, nilai_persediaan: 480000, status: "ok" },
  { id_bahan: 5, nama_bahan: "Bubuk Matcha", satuan: "gram", stok_minimum: 300, sisa_stok: 250, harga_rata: 350, nilai_persediaan: 87500, status: "warning" },
  { id_bahan: 6, nama_bahan: "Cokelat Bubuk", satuan: "gram", stok_minimum: 400, sisa_stok: 900, harga_rata: 180, nilai_persediaan: 162000, status: "ok" },
];

export const samplePegawai: Pegawai[] = SAMPLE_USERS.map(({ password: _p, ...rest }) => rest);

export interface SamplePembelian extends Pembelian {
  jumlah_item: number;
}

export const samplePembelian: SamplePembelian[] = [
  { id_pembelian: 1, id_pegawai: 2, nomor_pembelian: "PO-20260628-0001", tanggal_beli: "2026-06-28", pemasok: "CV. Kopi Nusantara", total_beli: 1500000, jumlah_item: 4 },
  { id_pembelian: 2, id_pegawai: 2, nomor_pembelian: "PO-20260630-0002", tanggal_beli: "2026-06-30", pemasok: "PT. Dairy Fresh", total_beli: 500000, jumlah_item: 2 },
  { id_pembelian: 3, id_pegawai: 2, nomor_pembelian: "PO-20260701-0003", tanggal_beli: "2026-07-01", pemasok: "Toko Kemasan Jaya", total_beli: 750000, jumlah_item: 3 },
];

export const samplePenjualan: Penjualan[] = [
  { id_penjualan: 1, id_pegawai: 1, nomor_nota: "NJ-20260701-001", tanggal_jual: "2026-07-01T08:15:00", total_jual: 72000, total_diskon: 0, pajak: 0, grand_total: 72000, total_hpp: 21600, laba_kotor: 50400 },
  { id_penjualan: 2, id_pegawai: 1, nomor_nota: "NJ-20260701-002", tanggal_jual: "2026-07-01T09:02:00", total_jual: 47000, total_diskon: 2000, pajak: 0, grand_total: 45000, total_hpp: 13100, laba_kotor: 31900 },
  { id_penjualan: 3, id_pegawai: 1, nomor_nota: "NJ-20260701-003", tanggal_jual: "2026-07-01T10:41:00", total_jual: 96000, total_diskon: 0, pajak: 0, grand_total: 96000, total_hpp: 30500, laba_kotor: 65500 },
  { id_penjualan: 4, id_pegawai: 1, nomor_nota: "NJ-20260701-004", tanggal_jual: "2026-07-01T12:20:00", total_jual: 25000, total_diskon: 0, pajak: 0, grand_total: 25000, total_hpp: 8200, laba_kotor: 16800 },
  { id_penjualan: 5, id_pegawai: 1, nomor_nota: "NJ-20260701-005", tanggal_jual: "2026-07-01T13:55:00", total_jual: 54000, total_diskon: 0, pajak: 0, grand_total: 54000, total_hpp: 18300, laba_kotor: 35700 },
];

/** Categories present in the sample menu, for the kasir filter bar. */
export const sampleKategori = Array.from(
  new Set(sampleMenus.map((m) => m.kategori)),
);

/** Simulate a network fetch so consumers can keep the async query shape. */
export function fakeFetch<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
