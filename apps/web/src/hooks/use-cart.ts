"use client";

import { useCallback, useEffect, useState } from "react";
import type { Menu } from "@homwok/types";

export interface CartLine {
  key: string;
  id_menu: number;
  nama_menu: string;
  harga_jual: number;
  qty: number;
  subtotal: number;
  sugar?: string;
  ice?: string;
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

  const addItem = useCallback((menu: Menu, sugar?: string, ice?: string, qty: number = 1) => {
    setItems((prev) => {
      // Create a unique key for the item based on id_menu and options
      const sugarSuffix = sugar ? `-${sugar.toLowerCase().replace(/\s+/g, '')}` : "";
      const iceSuffix = ice ? `-${ice.toLowerCase().replace(/\s+/g, '')}` : "";
      const key = `${menu.id_menu}${sugarSuffix}${iceSuffix}`;

      // Build custom name for display in receipt/cart
      let nama_menu = menu.nama_menu;
      const options: string[] = [];
      if (sugar && sugar !== "Normal") options.push(sugar);
      if (ice && ice !== "Normal") options.push(ice);
      if (options.length > 0) {
        nama_menu = `${menu.nama_menu} [${options.join(", ")}]`;
      }

      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, qty: i.qty + qty, subtotal: (i.qty + qty) * i.harga_jual }
            : i,
        );
      }

      return [
        ...prev,
        {
          key,
          id_menu: menu.id_menu,
          nama_menu,
          harga_jual: menu.harga_jual,
          qty,
          subtotal: menu.harga_jual * qty,
          sugar,
          ice,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    if (qty <= 0) {
      setItems((p) => p.filter((i) => i.key !== key));
      return;
    }
    setItems((p) =>
      p.map((i) =>
        i.key === key ? { ...i, qty, subtotal: qty * i.harga_jual } : i,
      ),
    );
  }, []);

  const removeItem = useCallback(
    (key: string) => setItems((p) => p.filter((i) => i.key !== key)),
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
