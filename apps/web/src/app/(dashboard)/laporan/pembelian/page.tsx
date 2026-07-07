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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homwok/ui";
import { formatDate, formatRupiah } from "@homwok/lib";
import { samplePembelian } from "@/lib/sample-data";
import { toast } from "sonner";
import api from "@/lib/api";

export default function LaporanPembelianPage() {
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPembelian = async () => {
      setLoading(true);
      try {
        const res = await api.get("/laporan/pembelian", { params: { from, to } });
        setFiltered(res.data.data);
      } catch (err) {
        console.warn("Gagal mengambil data dari API, menggunakan mock data:", err);
        setFiltered(
          samplePembelian.filter((p) => {
            const d = p.tanggal_beli.slice(0, 10);
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
          })
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPembelian();
  }, [from, to]);

  const summary = useMemo(
    () => ({
      count: filtered.length,
      totalPembelian: filtered.reduce((s, r) => s + r.total_beli, 0),
      totalItem: filtered.reduce((s, r) => s + (r.jumlah_item ?? 0), 0),
    }),
    [filtered],
  );

  const applyFilter = () => {
    setFrom(fromInput);
    setTo(toInput);
  };

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      const response = await api.get("/laporan/pembelian", {
        params: { from, to, export: type },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = type === "pdf" ? "pdf" : "csv";
      link.setAttribute("download", `laporan-pembelian-${Date.now()}.${ext}`);
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
      {/* Header + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Laporan
          </p>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Pembelian
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Total Item (Lot)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold font-mono">{summary.totalItem}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-primary text-primary-foreground shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest text-primary-foreground/80">
              Total Pembelian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {formatRupiah(summary.totalPembelian)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <div className="rounded-lg border border-border bg-background shadow-md">
        <Table>
          <TableCaption className="pb-4">
            {filtered.length} pembelian
            {from || to
              ? ` · periode ${from || "…"} s/d ${to || "…"}`
              : " · semua periode"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-medium">No. Pembelian</TableHead>
              <TableHead className="uppercase font-medium">Tanggal</TableHead>
              <TableHead className="uppercase font-medium">Pemasok</TableHead>
              <TableHead className="uppercase font-medium text-center">Item</TableHead>
              <TableHead className="uppercase font-medium text-right">
                Total Beli
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
                  Tidak ada pembelian pada periode ini
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id_pembelian}>
                  <TableCell className="font-mono font-medium">
                    {p.nomor_pembelian}
                  </TableCell>
                  <TableCell>{formatDate(p.tanggal_beli)}</TableCell>
                  <TableCell>{p.pemasok}</TableCell>
                  <TableCell className="text-center">{p.jumlah_item}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatRupiah(p.total_beli)}
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
