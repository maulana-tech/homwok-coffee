"use client";

import { useEffect, useMemo, useState } from "react";
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
import api from "@/lib/api";

/** margin % = laba_kotor / grand_total. */
const marginPct = (laba: number, total: number): number =>
  total > 0 ? (laba / total) * 100 : 0;

const formatPct = (n: number): string => `${n.toFixed(1)}%`;

export default function LaporanHppPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHpp = async () => {
      setLoading(true);
      try {
        const res = await api.get("/laporan/hpp");
        setRows(res.data.data);
      } catch (err) {
        console.warn("Gagal mengambil data dari API, menggunakan mock data:", err);
        setRows(
          samplePenjualan.map((s) => ({
            id_penjualan: s.id_penjualan,
            nomor_nota: s.nomor_nota,
            tanggal_jual: s.tanggal_jual,
            grand_total: s.grand_total,
            total_hpp: s.total_hpp,
            laba_kotor: s.laba_kotor,
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHpp();
  }, []);

  const summary = useMemo(() => {
    const totalHpp = rows.reduce((s, r) => s + r.total_hpp, 0);
    const totalPenjualan = rows.reduce((s, r) => s + r.grand_total, 0);
    const totalLaba = rows.reduce((s, r) => s + (r.laba_kotor ?? (r.grand_total - r.total_hpp)), 0);
    return {
      totalHpp,
      totalPenjualan,
      avgMargin: marginPct(totalLaba, totalPenjualan),
    };
  }, [rows]);

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      const response = await api.get("/laporan/hpp", {
        params: { export: type },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = type === "pdf" ? "pdf" : "csv";
      link.setAttribute("download", `laporan-hpp-${Date.now()}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Laporan berhasil diexport!");
    } catch (err) {
      toast.error("Gagal melakukan export laporan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + export actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Laporan
          </p>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">HPP</h1>
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

        <Card className="rounded-lg border border-border bg-primary text-primary-foreground shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest text-primary-foreground/80">
              Rata-rata Margin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold font-mono">
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
              <TableHead className="uppercase font-medium">No. Nota</TableHead>
              <TableHead className="uppercase font-medium">Tanggal</TableHead>
              <TableHead className="uppercase font-medium text-right">
                Penjualan
              </TableHead>
              <TableHead className="uppercase font-medium text-right">HPP</TableHead>
              <TableHead className="uppercase font-medium text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 uppercase text-sm tracking-widest text-muted-foreground"
                >
                  Tidak ada transaksi pada periode ini
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id_penjualan}>
                  <TableCell className="font-mono font-medium">{s.nomor_nota}</TableCell>
                  <TableCell>{formatDate(s.tanggal_jual)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatRupiah(s.grand_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRupiah(s.total_hpp)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatPct(marginPct(s.laba_kotor, s.grand_total))}
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
