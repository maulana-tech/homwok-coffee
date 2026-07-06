"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Input,
  Label,
  POSButton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homwok/ui";
import { formatDateTime, formatRupiah } from "@homwok/lib";
import { samplePenjualan } from "@/lib/sample-data";
import { toast } from "sonner";

export default function LaporanPenjualanPage() {
  // Input state vs. applied filter — the range only updates on "Terapkan".
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Filter penjualan by tanggal_jual (compare on the date portion only).
  const filtered = useMemo(
    () =>
      samplePenjualan.filter((s) => {
        const d = s.tanggal_jual.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }),
    [from, to],
  );

  const summary = useMemo(
    () => ({
      count: filtered.length,
      totalPenjualan: filtered.reduce((s, r) => s + r.grand_total, 0),
      totalHpp: filtered.reduce((s, r) => s + r.total_hpp, 0),
      labaKotor: filtered.reduce((s, r) => s + r.laba_kotor, 0),
    }),
    [filtered],
  );

  const applyFilter = () => {
    setFrom(fromInput);
    setTo(toInput);
  };

  const handleExport = (type: "excel" | "pdf") => {
    // TODO: api.get('/laporan/penjualan', { params: { from, to, export: type }, responseType: 'blob' })
    toast.info("Export butuh backend", { description: `Format: ${type.toUpperCase()}` });
  };

  return (
    <div className="space-y-6">
      {/* Header + export actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Laporan
          </p>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Penjualan
          </h1>
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

      {/* Period filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-4 shadow-md">
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Jumlah Transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold font-mono">{summary.count}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Total Penjualan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {formatRupiah(summary.totalPenjualan)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Total HPP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {formatRupiah(summary.totalHpp)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-primary text-primary-foreground shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest text-primary-foreground/80">
              Laba Kotor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {formatRupiah(summary.labaKotor)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <div className="rounded-lg border border-border bg-background shadow-md">
        <Table>
          <TableCaption className="pb-4">
            {filtered.length} transaksi
            {from || to
              ? ` · periode ${from || "…"} s/d ${to || "…"}`
              : " · semua periode"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-medium">No. Nota</TableHead>
              <TableHead className="uppercase font-medium">Tanggal</TableHead>
              <TableHead className="uppercase font-medium text-right">
                Grand Total
              </TableHead>
              <TableHead className="uppercase font-medium text-right">HPP</TableHead>
              <TableHead className="uppercase font-medium text-right">
                Laba Kotor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 uppercase text-sm tracking-widest text-muted-foreground"
                >
                  Tidak ada transaksi pada periode ini
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id_penjualan}>
                  <TableCell className="font-mono font-medium">
                    {s.nomor_nota}
                  </TableCell>
                  <TableCell>{formatDateTime(s.tanggal_jual)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatRupiah(s.grand_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRupiah(s.total_hpp)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatRupiah(s.laba_kotor)}
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
