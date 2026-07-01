"use client";

import { useCallback, useEffect, useState } from "react";
import type { Menu } from "@homwok/types";

export interface CartLine {
  id_menu: number;
  nama_menu: string;
  harga_jual: number;
  qty: number;
  subtotal: number;
}

const STORAGE_KEY = "homwok_cart";

/**
 * Client-side cart state, persisted to localStorage so a refresh mid-order
 * doesn't lose the transaction. Transient UI state — not server state.
 */
export function useCart() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved) as CartLine[]);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = useCallback((menu: Menu) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id_menu === menu.id_menu);
      if (existing) {
        return prev.map((i) =>
          i.id_menu === menu.id_menu
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.harga_jual }
            : i,
        );
      }
      return [
        ...prev,
        {
          id_menu: menu.id_menu,
          nama_menu: menu.nama_menu,
          harga_jual: menu.harga_jual,
          qty: 1,
          subtotal: menu.harga_jual,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) {
      setItems((p) => p.filter((i) => i.id_menu !== id));
      return;
    }
    setItems((p) =>
      p.map((i) =>
        i.id_menu === id ? { ...i, qty, subtotal: qty * i.harga_jual } : i,
      ),
    );
  }, []);

  const removeItem = useCallback(
    (id: number) => setItems((p) => p.filter((i) => i.id_menu !== id)),
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return {
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    total,
    itemCount,
    isHydrated,
  };
}
