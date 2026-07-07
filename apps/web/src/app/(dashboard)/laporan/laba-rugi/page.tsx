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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { samplePenjualan } from "@/lib/sample-data";
import { toast } from "sonner";
import api from "@/lib/api";

const formatPct = (n: number): string => `${n.toFixed(1)}%`;

export default function LaporanLabaRugiPage() {
  // Optional period filter — applied only on "Terapkan".
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [laba, setLaba] = useState({ pendapatan: 0, hpp: 0, labaKotor: 0, margin: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabaRugi = async () => {
      setLoading(true);
      try {
        const res = await api.get("/laporan/laba-rugi", { params: { from, to } });
        setLaba({
          pendapatan: Number(res.data.pendapatan),
          hpp: Number(res.data.hpp),
          labaKotor: Number(res.data.laba_kotor),
          margin: Number(res.data.margin),
        });
      } catch (err) {
        console.warn("Gagal mengambil data dari API, menggunakan mock data:", err);
        // Fallback
        const filtered = samplePenjualan.filter((s) => {
          const d = s.tanggal_jual.slice(0, 10);
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
        const pendapatan = filtered.reduce((s, r) => s + r.grand_total, 0);
        const hpp = filtered.reduce((s, r) => s + r.total_hpp, 0);
        const labaKotor = filtered.reduce((s, r) => s + r.laba_kotor, 0);
        const margin = pendapatan > 0 ? (labaKotor / pendapatan) * 100 : 0;
        setLaba({ pendapatan, hpp, labaKotor, margin });
      } finally {
        setLoading(false);
      }
    };
    fetchLabaRugi();
  }, [from, to]);

  const applyFilter = () => {
    setFrom(fromInput);
    setTo(toInput);
  };

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      const response = await api.get("/laporan/laba-rugi", {
        params: { from, to, export: type },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = type === "pdf" ? "pdf" : "csv";
      link.setAttribute("download", `laporan-laba-rugi-${Date.now()}.${ext}`);
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
          <h1 className="text-2xl font-semibold uppercase tracking-tight">Laba Rugi</h1>
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

      {/* Optional period filter */}
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

      {/* Big stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Pendapatan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              {formatRupiah(laba.pendapatan)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              HPP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">{formatRupiah(laba.hpp)}</p>
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
              {formatRupiah(laba.labaKotor)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-xs font-medium tracking-widest">
              Margin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold font-mono">{formatPct(laba.margin)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown table */}
      <div className="rounded-lg border border-border bg-background shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-medium">Komponen</TableHead>
              <TableHead className="uppercase font-medium text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium uppercase">Pendapatan</TableCell>
              <TableCell className="text-right font-mono font-medium">
                {formatRupiah(laba.pendapatan)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium uppercase">(−) HPP</TableCell>
              <TableCell className="text-right font-mono font-medium">
                ({formatRupiah(laba.hpp)})
              </TableCell>
            </TableRow>
            <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
              <TableCell className="font-medium uppercase tracking-tight">
                (=) Laba Kotor
              </TableCell>
              <TableCell className="text-right font-mono font-semibold text-lg">
                {formatRupiah(laba.labaKotor)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
