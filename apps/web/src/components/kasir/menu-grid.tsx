"use client";

import { useState } from "react";
import { useMenus } from "@/hooks/use-data";
import {
  MenuCard,
  Skeleton,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  POSButton
} from "@homwok/ui";
import type { Menu } from "@homwok/types";
import { Search, X, ArrowUpDown, Coffee } from "lucide-react";
import { formatRupiah } from "@homwok/lib";

interface GroupedMenu {
  baseName: string;
  kategori: string;
  foto_url: string | null;
  aktif: boolean;
  stockStatus: string;
  sizes: {
    sizeLabel: string;
    id_menu: number;
    harga_jual: number;
    menuOriginal: Menu;
  }[];
}

interface MenuGridProps {
  onSelect: (menu: Menu, sugar?: string, ice?: string, qty?: number) => void;
}

export function MenuGrid({ onSelect }: MenuGridProps) {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const { data: menus, isLoading } = useMenus();

  // Dialog customization states
  const [customizingMenu, setCustomizingMenu] = useState<GroupedMenu | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [sugar, setSugar] = useState("Normal");
  const [ice, setIce] = useState("Normal");
  const [qty, setQty] = useState(1);

  const activeMenus = (menus ?? []).filter((m) => m.aktif);

  // Grouping menus by base name (removing (R) and (L) suffixes)
  const groupedMenus: GroupedMenu[] = [];
  const map = new Map<string, GroupedMenu>();

  activeMenus.forEach((m) => {
    let baseName = m.nama_menu;
    let sizeLabel = "Normal";

    if (m.nama_menu.endsWith(" (R)")) {
      baseName = m.nama_menu.substring(0, m.nama_menu.length - 4);
      sizeLabel = "Reguler (R)";
    } else if (m.nama_menu.endsWith(" (L)")) {
      baseName = m.nama_menu.substring(0, m.nama_menu.length - 4);
      sizeLabel = "Large (L)";
    }

    if (!map.has(baseName)) {
      const g: GroupedMenu = {
        baseName,
        kategori: m.kategori,
        foto_url: m.foto_url ?? null,
        aktif: m.aktif,
        stockStatus: (m as any).stockStatus ?? "available",
        sizes: [],
      };
      map.set(baseName, g);
      groupedMenus.push(g);
    }

    const g = map.get(baseName)!;
    g.sizes.push({
      sizeLabel,
      id_menu: m.id_menu,
      harga_jual: m.harga_jual,
      menuOriginal: m,
    });
  });

  const categories = ["all", ...Array.from(new Set(groupedMenus.map((m) => m.kategori)))];

  // Filtering
  const filtered = groupedMenus.filter((m) => {
    const matchesCategory = cat === "all" || m.kategori === cat;
    const matchesSearch = m.baseName.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sorting based on starting price or name
  const sorted = [...filtered].sort((a, b) => {
    const priceA = a.sizes[0]?.harga_jual ?? 0;
    const priceB = b.sizes[0]?.harga_jual ?? 0;

    if (sortBy === "name-asc") return a.baseName.localeCompare(b.baseName);
    if (sortBy === "name-desc") return b.baseName.localeCompare(a.baseName);
    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    return 0;
  });

  const handleOpenCustomize = (menu: GroupedMenu) => {
    setCustomizingMenu(menu);
    // Default to the first available size
    setSelectedSizeId(menu.sizes[0].id_menu);
    setSugar("Normal");
    setIce("Normal");
    setQty(1);
  };

  const handleAddToCart = () => {
    if (!customizingMenu || !selectedSizeId) return;

    const selectedSizeOption = customizingMenu.sizes.find(
      (s) => s.id_menu === selectedSizeId
    );

    if (!selectedSizeOption) return;

    // Check if category is a drink (only drinks get customized sugar and ice)
    const drinkCategories = ["Coffee", "Flavoured Coffee", "Non Coffee", "Mocktail", "Fruit Series", "Botol 1 Liter"];
    const isDrink = drinkCategories.includes(customizingMenu.kategori);

    onSelect(
      selectedSizeOption.menuOriginal,
      isDrink ? sugar : undefined,
      isDrink ? ice : undefined,
      qty
    );

    setCustomizingMenu(null);
  };

  const selectedSizeOption = customizingMenu?.sizes.find(
    (s) => s.id_menu === selectedSizeId
  );
  const currentPrice = selectedSizeOption?.harga_jual ?? 0;

  const drinkCategories = ["Coffee", "Flavoured Coffee", "Non Coffee", "Mocktail", "Fruit Series", "Botol 1 Liter"];
  const isCustomizingDrink = customizingMenu ? drinkCategories.includes(customizingMenu.kategori) : false;

  return (
    <div className="space-y-4">
      {/* Sticky Header with Search, Sort and Category Tabs */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md z-10 pt-1 pb-3 space-y-3 border-b border-border/80">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Cari menu kopi, snack, roti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selection */}
          <div className="relative w-full sm:w-48">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-4 py-1.5 whitespace-nowrap rounded-lg border border-border uppercase text-xs tracking-wider font-semibold transition-all duration-200 active:scale-95",
                cat === c
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "all" ? "Semua" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Menus */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Menu tidak ditemukan</p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-primary underline underline-offset-4 hover:opacity-80"
            >
              Hapus pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((menu) => {
            const minPrice = menu.sizes[0]?.harga_jual ?? 0;
            const hasMultipleSizes = menu.sizes.length > 1;
            const priceLabel = hasMultipleSizes ? `Mulai ${formatRupiah(minPrice)}` : formatRupiah(minPrice);

            return (
              <MenuCard
                key={menu.baseName}
                name={menu.baseName}
                price={priceLabel as any}
                category={menu.kategori}
                imageUrl={menu.foto_url}
                stockStatus={menu.stockStatus as any}
                onClick={() => menu.stockStatus !== "out" && handleOpenCustomize(menu)}
              />
            );
          })}
        </div>
      )}

      {/* Customize Choices Sheet */}
      {customizingMenu && (
        <Sheet open={!!customizingMenu} onOpenChange={(open) => !open && setCustomizingMenu(null)}>
          <SheetContent className="w-[90vw] sm:max-w-md p-6 flex flex-col h-full bg-background border-l border-border">
            <SheetHeader className="pb-4 border-b border-border shrink-0">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Coffee className="w-5 h-5 text-primary animate-pulse" />
                {customizingMenu.baseName}
              </SheetTitle>
              <SheetDescription className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Kategori: {customizingMenu.kategori}
              </SheetDescription>
            </SheetHeader>

            {/* Scrollable Customize Options */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              <div className="space-y-6">
                {/* Size Configuration */}
                {customizingMenu.sizes.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block font-semibold">
                      Pilih Ukuran (Size)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {customizingMenu.sizes.map((s) => (
                        <button
                          key={s.id_menu}
                          type="button"
                          onClick={() => setSelectedSizeId(s.id_menu)}
                          className={cn(
                            "p-3 rounded-lg border text-center transition-all duration-150 active:scale-[0.98]",
                            selectedSizeId === s.id_menu
                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "border-border bg-card hover:bg-secondary text-foreground"
                          )}
                        >
                          <div className="text-xs font-semibold uppercase">{s.sizeLabel}</div>
                          <div className={cn("text-xs mt-0.5 font-mono", selectedSizeId === s.id_menu ? "text-primary-foreground/90" : "text-muted-foreground")}>
                            {formatRupiah(s.harga_jual)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isCustomizingDrink && <hr className="border-border/60" />}

                {/* Drink Customization options (Sugar, Ice) */}
                {isCustomizingDrink && (
                  <>
                    {/* Sugar customization */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block font-semibold">
                        Kemanisan (Sugar Level)
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {["Less Sugar", "Normal", "More Sugar"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSugar(opt)}
                            className={cn(
                              "py-2.5 rounded-lg border text-center text-xs font-semibold transition-all duration-150 active:scale-95",
                              sugar === opt
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {opt === "Normal" ? "Normal" : opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Ice customization */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block font-semibold">
                        Tingkat Es (Ice Level)
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {["No Ice", "Less Ice", "Normal"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setIce(opt)}
                            className={cn(
                              "py-2.5 rounded-lg border text-center text-xs font-semibold transition-all duration-150 active:scale-95",
                              ice === opt
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-border/60" />
                  </>
                )}

                {/* Quantity Selection */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 font-semibold">
                    Jumlah (Quantity)
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center font-bold transition-all duration-150 active:scale-90"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-base">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center font-bold transition-all duration-150 active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-border shrink-0 bg-background mt-auto">
              <POSButton
                variant="accent"
                size="lg"
                className="w-full h-12 text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] shadow-md"
                onClick={handleAddToCart}
              >
                Masukkan Keranjang · {formatRupiah(currentPrice * qty)}
              </POSButton>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
