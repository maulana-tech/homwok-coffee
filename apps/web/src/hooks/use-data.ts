"use client";

import { useQuery } from "@tanstack/react-query";
import {
  sampleBahan,
  sampleKartuPergerakan,
  sampleMenus,
  samplePegawai,
  samplePembelian,
  samplePenjualan,
  type SampleBahan,
  type SamplePembelian,
} from "@/lib/sample-data";
import api from "@/lib/api";
import type { Menu, BahanBaku, Pegawai, Pembelian, Penjualan, KartuPersediaanRow } from "@homwok/types";

/**
 * Read queries. Connected to the real backend Laravel API.
 * Automatically falls back to mock data if the API connection fails.
 */

export function useMenus() {
  return useQuery<Menu[]>({
    queryKey: ["menus"],
    queryFn: async () => {
      try {
        const res = await api.get("/menu");
        return res.data;
      } catch (err) {
        console.warn("Gagal fetch /menu, menggunakan mock data:", err);
        return sampleMenus;
      }
    },
  });
}

export function useBahan() {
  return useQuery<SampleBahan[]>({
    queryKey: ["bahan"],
    queryFn: async () => {
      try {
        const res = await api.get("/persediaan");
        return res.data;
      } catch (err) {
        console.warn("Gagal fetch /persediaan, menggunakan mock data:", err);
        return sampleBahan;
      }
    },
  });
}

export function usePegawai() {
  return useQuery<Pegawai[]>({
    queryKey: ["pegawai"],
    queryFn: async () => {
      try {
        const res = await api.get("/pegawai");
        return res.data;
      } catch (err) {
        console.warn("Gagal fetch /pegawai, menggunakan mock data:", err);
        return samplePegawai;
      }
    },
  });
}

export function usePembelian() {
  return useQuery<SamplePembelian[]>({
    queryKey: ["pembelian"],
    queryFn: async () => {
      try {
        const res = await api.get("/pembelian");
        return res.data;
      } catch (err) {
        console.warn("Gagal fetch /pembelian, menggunakan mock data:", err);
        return samplePembelian;
      }
    },
  });
}

export function usePenjualan() {
  return useQuery<Penjualan[]>({
    queryKey: ["penjualan"],
    queryFn: async () => {
      try {
        const res = await api.get("/penjualan");
        return res.data;
      } catch (err) {
        console.warn("Gagal fetch /penjualan, menggunakan mock data:", err);
        return samplePenjualan;
      }
    },
  });
}

/**
 * Pergerakan kartu persediaan FIFO untuk satu bahan.
 */
export function useKartuPersediaan(idBahan: number | null) {
  return useQuery<KartuPersediaanRow[]>({
    queryKey: ["kartu-persediaan", idBahan],
    queryFn: async () => {
      if (!idBahan) return [];
      try {
        const res = await api.get("/laporan/kartu-persediaan", {
          params: { id_bahan: idBahan },
        });
        return res.data.data;
      } catch (err) {
        console.warn(
          "Gagal fetch /laporan/kartu-persediaan, menggunakan mock data:",
          err,
        );
        return sampleKartuPergerakan[idBahan] ?? [];
      }
    },
    enabled: idBahan !== null,
  });
}
