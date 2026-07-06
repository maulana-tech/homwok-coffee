"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Input,
  Label,
  POSButton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homwok/ui";
import { formatDate, formatRupiah } from "@homwok/lib";
import type { KartuPersediaanRow } from "@homwok/types";
import { useBahan, useKartuPersediaan } from "@/hooks/use-data";
import { toast } from "sonner";

const num = (n: number) => n.toLocaleString("id-ID");

export default function KartuPersediaanPage() {
  const { data: bahanList } = useBahan();
  const [idBahan, setIdBahan] = useState<number | null>(null);

  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Pilih bahan pertama begitu daftar tersedia.
  useEffect(() => {
    if (idBahan === null && bahanList && bahanList.length > 0) {
      setIdBahan(bahanList[0].id_bahan);
    }
  }, [bahanList, idBahan]);

  const { data: gerak, isLoading } = useKartuPersediaan(idBahan);
  const bahan = bahanList?.find((b) => b.id_bahan === idBahan);
  const satuan = bahan?.satuan ?? "";

  // Filter periode + hitung saldo berjalan (qty & nilai) — sama seperti API.
  const rows = useMemo(() => {
    const src = (gerak ?? [])
      .filter((r) => {
        if (from && r.tanggal < from) return false;
        if (to && r.tanggal > to) return false;
        return true;
      })
      .slice()
      .sort((a, b) =>
        a.tanggal === b.tanggal
          ? a.keterangan.localeCompare(b.keterangan) // Pembelian sebelum Penjualan
          : a.tanggal.localeCompare(b.tanggal),
      );

    let sqty = 0;
    let snilai = 0;
    return src.map((r): Required<KartuPersediaanRow> => {
      sqty += r.masuk_qty - r.keluar_qty;
      snilai += r.masuk_total - r.keluar_total;
      return { ...r, saldo_qty: sqty, saldo_nilai: snilai };
    });
  }, [gerak, from, to]);

  const summary = useMemo(
    () => ({
      masukQty: rows.reduce((s, r) => s + r.masuk_qty, 0),
      masukNilai: rows.reduce((s, r) => s + r.masuk_total, 0),
      keluarQty: rows.reduce((s, r) => s + r.keluar_qty, 0),
      keluarNilai: rows.reduce((s, r) => s + r.keluar_total, 0),
      saldoQty: rows.length ? rows[rows.length - 1].saldo_qty : 0,
      saldoNilai: rows.length ? rows[rows.length - 1].saldo_nilai : 0,
    }),
    [rows],
  );

  const applyFilter = () => {
    setFrom(fromInput);
    setTo(toInput);
  };

  const handleExport = (type: "excel" | "pdf") => {
    // TODO: api.get('/laporan/kartu-persediaan', { params: { id_bahan, from, to, export: type }, responseType: 'blob' })
    toast.info("Export butuh backend", { description: `Format: ${type.toUpperCase()}` });
  };

  return (
    <div className="space-y-6">
      {/* Header + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Laporan
          </p>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Kartu Persediaan
          </h1>
          <p className="text-xs text-muted-foreground">
            Kartu stok metode FIFO — barang tertua keluar lebih dulu.
          </p>
        </div>
        <div className="flex gap-2">
          <POSButton variant="outline" onClick={() => handleExport("excel")}>
            Excel
          </POSButton>
          <POSButton variant="outline" onClick={() => handleExport("pdf")}>
            PDF
          </POSButton>
        </div>
      </div>

      {/* Bahan + period filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-4 shadow-md">
        <div className="space-y-1 min-w-[220px]">
          <Label className="uppercase text-xs font-medium">Bahan Baku</Label>
          <Select
            value={idBahan ? String(idBahan) : undefined}
            onValueChange={(v) => setIdBahan(Number(v))}
          >
            <SelectTrigger className="rounded-lg border border-border">
              <SelectValue placeholder="Pilih bahan" />
            </SelectTrigger>
            <SelectContent>
              {(bahanList ?? []).map((b) => (
                <SelectItem key={b.id_bahan} value={String(b.id_bahan)}>
                  {b.nama_bahan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="from" className="uppercase text-xs font-medium">
            Dari
          </Label>
          <Input
            id="from"
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="rounded-lg border border-border"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to" className="uppercase text-xs font-medium">
            Sampai
          </Label>
          <Input
            id="to"
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="rounded-lg border border-border"
          />
        </div>
        <POSButton variant="accent" onClick={applyFilter}>
          Terapkan
        </POSButton>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Total Masuk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {num(summary.masukQty)} {satuan}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatRupiah(summary.masukNilai)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Total Keluar (HPP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {num(summary.keluarQty)} {satuan}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatRupiah(summary.keluarNilai)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-primary text-primary-foreground shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest text-primary-foreground/80">
              Saldo Akhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {num(summary.saldoQty)} {satuan}
            </p>
            <p className="text-xs font-mono text-primary-foreground/80">
              {formatRupiah(summary.saldoNilai)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kartu stok */}
      <div className="rounded-lg border border-border bg-background shadow-md overflow-x-auto">
        <Table>
          <TableCaption className="pb-4">
            {bahan ? `Kartu stok: ${bahan.nama_bahan}` : "Pilih bahan"}
            {from || to ? ` · periode ${from || "…"} s/d ${to || "…"}` : ""}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-medium">Tanggal</TableHead>
              <TableHead className="uppercase font-medium">Referensi</TableHead>
              <TableHead className="uppercase font-medium">Ket.</TableHead>
              <TableHead className="uppercase font-medium text-right">Masuk</TableHead>
              <TableHead className="uppercase font-medium text-right">Masuk Rp</TableHead>
              <TableHead className="uppercase font-medium text-right">Keluar</TableHead>
              <TableHead className="uppercase font-medium text-right">Keluar Rp</TableHead>
              <TableHead className="uppercase font-medium text-right">Saldo</TableHead>
              <TableHead className="uppercase font-medium text-right">Saldo Rp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 uppercase text-sm tracking-widest text-muted-foreground"
                >
                  Belum ada pergerakan untuk bahan ini
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{formatDate(r.tanggal)}</TableCell>
                  <TableCell className="font-mono">{r.referensi}</TableCell>
                  <TableCell>{r.keterangan}</TableCell>
                  <TableCell className="text-right font-mono">
                    {r.masuk_qty
                      ? `${num(r.masuk_qty)} × ${num(r.masuk_harga)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.masuk_total ? formatRupiah(r.masuk_total) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.keluar_qty
                      ? `${num(r.keluar_qty)} × ${num(r.keluar_harga)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.keluar_total ? formatRupiah(r.keluar_total) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {num(r.saldo_qty)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatRupiah(r.saldo_nilai)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
