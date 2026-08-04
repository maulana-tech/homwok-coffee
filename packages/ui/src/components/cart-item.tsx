import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";

interface CartItemProps {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  className?: string;
}

const CartItem = React.forwardRef<HTMLDivElement, CartItemProps>(
  (
    {
      className,
      name,
      price,
      quantity,
      subtotal,
      onIncrease,
      onDecrease,
      onRemove,
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3 p-3.5 rounded-xl bg-card border border-border shadow-sm transition-all hover:border-primary/30",
        className
      )}
    >
      {/* Top Row: Name and Delete Button */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold uppercase text-sm leading-tight text-foreground line-clamp-2">
            {name}
          </h4>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            @ Rp {price.toLocaleString("id-ID")}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
          title="Hapus pesanan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Row: Quantity Controls and Subtotal */}
      <div className="flex items-end justify-between mt-1">
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1 border border-border/50">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md bg-background shadow-sm hover:bg-secondary border-border"
            onClick={onDecrease}
          >
            <Minus className="h-3.5 w-3.5 text-foreground" />
          </Button>
          <span className="w-8 text-center font-bold text-sm">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md bg-background shadow-sm hover:bg-secondary border-border"
            onClick={onIncrease}
          >
            <Plus className="h-3.5 w-3.5 text-foreground" />
          </Button>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-0.5">
            Subtotal
          </span>
          <p className="font-bold text-[15px] text-primary">
            Rp {subtotal.toLocaleString("id-ID")}
          </p>
        </div>
      </div>
    </div>
  )
);
CartItem.displayName = "CartItem";

export { CartItem };
