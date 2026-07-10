"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@homwok/ui";
import { Type } from "lucide-react";
import {
  useFontSize,
  type FontSize,
} from "@/components/providers/font-size-provider";

const FONT_OPTIONS: {
  value: FontSize;
  label: string;
  desc: string;
  preview: string;
}[] = [
  { value: "kecil", label: "Kecil", desc: "Lebih padat", preview: "text-xs" },
  { value: "normal", label: "Normal", desc: "Bawaan", preview: "text-sm" },
  { value: "besar", label: "Besar", desc: "Lebih lega", preview: "text-base" },
];

export default function PengaturanPage() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold uppercase tracking-tight">
          Pengaturan
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          Preferensi tampilan aplikasi
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Ukuran Font
          </CardTitle>
          <CardDescription>
            Atur besar kecilnya tampilan teks & antarmuka. Pilihan tersimpan
            otomatis di perangkat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {FONT_OPTIONS.map((opt) => {
              const active = fontSize === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFontSize(opt.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-primary bg-secondary"
                      : "border-border bg-background hover:border-primary hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold leading-none",
                      opt.value === "kecil" && "text-base",
                      opt.value === "normal" && "text-lg",
                      opt.value === "besar" && "text-xl",
                    )}
                  >
                    Aa
                  </span>
                  <span className="text-sm font-medium uppercase tracking-tight">
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-dashed border-border bg-secondary/50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Pratinjau
            </p>
            <p className="mt-1">
              Kopi susu aren &mdash; Rp 22.000. Perubahan ukuran langsung
              terlihat di seluruh halaman.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
