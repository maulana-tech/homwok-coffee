"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fakeFetch,
  sampleBahan,
  sampleMenus,
  samplePegawai,
  samplePembelian,
  samplePenjualan,
} from "@/lib/sample-data";

/**
 * Read queries. Each currently resolves sample data through `fakeFetch` so the
 * async/loading shape matches the eventual real API. To go live, replace each
 * queryFn body with `(await api.get('/<resource>')).data`.
 */

export function useMenus() {
  return useQuery({ queryKey: ["menus"], queryFn: () => fakeFetch(sampleMenus) });
}

export function useBahan() {
  return useQuery({ queryKey: ["bahan"], queryFn: () => fakeFetch(sampleBahan) });
}

export function usePegawai() {
  return useQuery({
    queryKey: ["pegawai"],
    queryFn: () => fakeFetch(samplePegawai),
  });
}

export function usePembelian() {
  return useQuery({
    queryKey: ["pembelian"],
    queryFn: () => fakeFetch(samplePembelian),
  });
}

export function usePenjualan() {
  return useQuery({
    queryKey: ["penjualan"],
    queryFn: () => fakeFetch(samplePenjualan),
  });
}
