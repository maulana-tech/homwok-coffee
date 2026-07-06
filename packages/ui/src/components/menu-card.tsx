import * as React from "react";
import { Coffee, CupSoda, Cookie, UtensilsCrossed } from "lucide-react";

import { cn } from "../lib/utils";
import { Badge } from "./badge";

interface MenuCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  name: string;
  price: number;
  category: string;
  /** URL foto menu; kosong → tampilkan ikon fallback per kategori. */
  imageUrl?: string | null;
  stockStatus?: "available" | "low" | "out";
  selected?: boolean;
}

/** Ikon fallback berdasarkan kategori saat foto belum ada. */
function categoryIcon(category: string) {
  const key = category.toLowerCase();
  if (key.includes("non")) return CupSoda; // Non-Coffee
  if (key.includes("coffee") || key.includes("kopi")) return Coffee;
  if (key.includes("snack") || key.includes("makan")) return Cookie;
  return UtensilsCrossed;
}

const MenuCard = React.forwardRef<HTMLButtonElement, MenuCardProps>(
  (
    {
      className,
      name,
      price,
      category,
      imageUrl,
      stockStatus = "available",
      selected,
      ...props
    },
    ref,
  ) => {
    const [imgError, setImgError] = React.useState(false);
    const FallbackIcon = categoryIcon(category);
    const showImage = Boolean(imageUrl) && !imgError;

    return (
      <button
        ref={ref}
        disabled={stockStatus === "out"}
        className={cn(
          "relative group flex flex-col overflow-hidden rounded-lg border text-left transition-all duration-200",
          "hover:shadow-md hover:-translate-y-0.5",
          selected
            ? "border-transparent ring-2 ring-primary shadow-md"
            : "bg-card text-card-foreground border-border",
          stockStatus === "out" && "opacity-40 cursor-not-allowed grayscale",
          className,
        )}
        {...props}
      >
        {/* Area gambar */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl as string}
              alt={name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FallbackIcon
                className="h-10 w-10 text-muted-foreground/40"
                strokeWidth={1.5}
              />
            </div>
          )}

          <Badge
            variant="secondary"
            className="absolute left-2 top-2 text-xs uppercase tracking-wider shadow-sm"
          >
            {category}
          </Badge>

          {stockStatus === "low" && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500 ring-2 ring-background" />
          )}
          {stockStatus === "out" && (
            <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-[10px] font-medium uppercase tracking-widest text-background">
              Habis
            </span>
          )}
        </div>

        {/* Konten */}
        <div className="flex flex-1 flex-col p-3">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold uppercase tracking-tight">
            {name}
          </h3>
          <p className="mt-auto text-lg font-semibold">
            Rp {price.toLocaleString("id-ID")}
          </p>
        </div>
      </button>
    );
  },
);
MenuCard.displayName = "MenuCard";

export { MenuCard };
