"use client";

import { useState } from "react";
import { useMenus } from "@/hooks/use-data";
import { MenuCard, Skeleton, cn } from "@homwok/ui";
import type { Menu } from "@homwok/types";

export function MenuGrid({ onSelect }: { onSelect: (menu: Menu) => void }) {
  const [cat, setCat] = useState("all");
  const { data: menus, isLoading } = useMenus();

  const activeMenus = (menus ?? []).filter((m) => m.aktif);
  const categories = ["all", ...Array.from(new Set(activeMenus.map((m) => m.kategori)))];
  const filtered =
    cat === "all" ? activeMenus : activeMenus.filter((m) => m.kategori === cat);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "px-4 py-2 whitespace-nowrap rounded-lg border border-border uppercase text-sm font-medium transition-colors",
              cat === c
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-secondary",
            )}
          >
            {c === "all" ? "Semua" : c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((menu) => (
            <MenuCard
              key={menu.id_menu}
              name={menu.nama_menu}
              price={menu.harga_jual}
              category={menu.kategori}
              imageUrl={menu.foto_url}
              stockStatus={menu.stockStatus}
              onClick={() => menu.stockStatus !== "out" && onSelect(menu)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
