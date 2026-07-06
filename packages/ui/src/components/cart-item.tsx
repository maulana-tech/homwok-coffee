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
        "flex items-center gap-3 p-3 rounded-lg bg-card border border-border",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border border-border"
          onClick={onDecrease}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border border-border"
          onClick={onIncrease}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium uppercase truncate">{name}</h4>
        <p className="text-sm text-muted-foreground">
          @ Rp {price.toLocaleString("id-ID")}
        </p>
      </div>

      <div className="text-right">
        <p className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</p>
        <button
          onClick={onRemove}
          className="text-destructive hover:text-destructive/80 text-xs flex items-center gap-1 mt-1"
        >
          <Trash2 className="w-3 h-3" /> Hapus
        </button>
      </div>
    </div>
  )
);
CartItem.displayName = "CartItem";

export { CartItem };
