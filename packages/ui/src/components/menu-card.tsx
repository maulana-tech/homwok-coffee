import * as React from "react";

import { cn } from "../lib/utils";
import { Badge } from "./badge";

interface MenuCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  name: string;
  price: number;
  category: string;
  stockStatus?: "available" | "low" | "out";
  selected?: boolean;
}

const MenuCard = React.forwardRef<HTMLButtonElement, MenuCardProps>(
  (
    {
      className,
      name,
      price,
      category,
      stockStatus = "available",
      selected,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={stockStatus === "out"}
      className={cn(
        "relative group flex flex-col items-start p-4 rounded-lg border text-left transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "bg-primary text-primary-foreground border-transparent shadow-md"
          : "bg-card text-card-foreground border-border",
        stockStatus === "out" && "opacity-40 cursor-not-allowed grayscale",
        className,
      )}
      {...props}
    >
      <Badge
        variant={selected ? "secondary" : "outline"}
        className="mb-3 text-xs uppercase tracking-wider"
      >
        {category}
      </Badge>

      <div className="flex-1 w-full">
        <h3 className="font-bold text-lg uppercase tracking-tight line-clamp-2 mb-2">
          {name}
        </h3>
        <p className="text-2xl font-bold">Rp {price.toLocaleString("id-ID")}</p>
      </div>

      {stockStatus === "low" && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-current rounded-full animate-pulse" />
      )}
    </button>
  ),
);
MenuCard.displayName = "MenuCard";

export { MenuCard };
