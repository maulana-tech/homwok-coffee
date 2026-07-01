"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  POSButton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homwok/ui";
import { formatDate, formatRupiah } from "@homwok/lib";
import { samplePenjualan } from "@/lib/sample-data";
import { toast } from "sonner";

/** margin % = laba_kotor / grand_total. */
const marginPct = (laba: number, total: number): number =>
  total > 0 ? (laba / total) * 100 : 0;

const formatPct = (n: number): string => `${n.toFixed(1)}%`;

export default function LaporanHppPage() {
  const summary = useMemo(() => {
    const totalHpp = samplePenjualan.reduce((s, r) => s + r.total_hpp, 0);
    const totalPenjualan = samplePenjualan.reduce((s, r) => s + r.grand_total, 0);
    const totalLaba = samplePenjualan.reduce((s, r) => s + r.laba_kotor, 0);
    return {
      totalHpp,
      totalPenjualan,
      avgMargin: marginPct(totalLaba, totalPenjualan),
    };
  }, []);

  const handleExport = (type: "excel" | "pdf") => {
    // TODO: api.get('/laporan/hpp', { params: { export: type }, responseType: 'blob' })
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
          <h1 className="text-2xl font-bold uppercase tracking-tight">HPP</h1>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-bold tracking-widest">
              Total HPP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {formatRupiah(summary.totalHpp)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-bold tracking-widest">
              Total Penjualan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {formatRupiah(summary.totalPenjualan)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-primary text-primary-foreground shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-bold tracking-widest text-primary-foreground/80">
              Rata-rata Margin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">
              {formatPct(summary.avgMargin)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-sale HPP table */}
      <div className="rounded-lg border border-border bg-background shadow-md">
        <Table>
          <TableCaption className="pb-4">
            HPP tingkat transaksi. Rincian potongan FIFO per lot (pemakaian_bahan)
            memerlukan backend — data sampel hanya menyimpan HPP per nota.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-bold">No. Nota</TableHead>
              <TableHead className="uppercase font-bold">Tanggal</TableHead>
              <TableHead className="uppercase font-bold text-right">
                Penjualan
              </TableHead>
              <TableHead className="uppercase font-bold text-right">HPP</TableHead>
              <TableHead className="uppercase font-bold text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samplePenjualan.map((s) => (
              <TableRow key={s.id_penjualan}>
                <TableCell className="font-mono font-bold">{s.nomor_nota}</TableCell>
                <TableCell>{formatDate(s.tanggal_jual)}</TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatRupiah(s.grand_total)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatRupiah(s.total_hpp)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatPct(marginPct(s.laba_kotor, s.grand_total))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
