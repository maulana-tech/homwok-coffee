"use client";

import { CartItem, POSButton, ScrollArea } from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { ShoppingCart, Trash2 } from "lucide-react";
import type { CartLine } from "@/hooks/use-cart";

interface CartProps {
  items: CartLine[];
  total: number;
  itemCount: number;
  onUpdateQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onClear?: () => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  total,
  itemCount,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
}: CartProps) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-border bg-background">
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-medium uppercase tracking-tight">Keranjang</h2>
        </div>
        <span className="text-sm font-medium">{itemCount} item</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground uppercase text-sm tracking-widest">
              Keranjang kosong
            </div>
          ) : (
            items.map((i) => (
              <CartItem
                key={i.key}
                name={i.nama_menu}
                price={i.harga_jual}
                quantity={i.qty}
                subtotal={i.subtotal}
                onIncrease={() => onUpdateQty(i.key, i.qty + 1)}
                onDecrease={() => onUpdateQty(i.key, i.qty - 1)}
                onRemove={() => onRemove(i.key)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4 space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <span className="uppercase font-medium tracking-tight">Total</span>
          <span className="text-2xl font-semibold">{formatRupiah(total)}</span>
        </div>
        <POSButton
          variant="accent"
          size="xl"
          className="w-full"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Bayar
        </POSButton>
        {onClear && items.length > 0 && (
          <button
            onClick={onClear}
            className="w-full text-xs uppercase tracking-widest text-destructive flex items-center justify-center gap-1 hover:underline"
          >
            <Trash2 className="w-3 h-3" /> Kosongkan Keranjang
          </button>
        )}
      </div>
    </div>
  );
}
