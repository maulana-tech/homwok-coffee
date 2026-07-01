"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  POSButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homwok/ui";
import type { Pembelian } from "@homwok/types";
import { formatDate, formatRupiah } from "@homwok/lib";
import { usePembelian, useBahan } from "@/hooks/use-data";
import { toast } from "sonner";

/** Table row = a purchase header plus its line-item count (from the sample data). */
type PembelianRow = Pembelian & { jumlah_item: number };

/** A single editable line in the add-purchase form. */
interface LineItem {
  key: number;
  id_bahan: string; // Select values are strings
  qty: string;
  harga_beli: string; // price per base unit
}

const emptyLine = (key: number): LineItem => ({
  key,
  id_bahan: "",
  qty: "",
  harga_beli: "",
});

/** PO-YYYYMMDD-XXXX, mirroring the seeded nomor_pembelian format. */
function makePoNumber(dateStr: string, seq: number): string {
  const ymd = (dateStr || new Date().toISOString().slice(0, 10)).replaceAll("-", "");
  return `PO-${ymd}-${String(seq).padStart(4, "0")}`;
}

export default function PembelianPage() {
  const { data: pembelian, isLoading } = usePembelian();
  const { data: bahan } = useBahan();

  // Locally-created purchases (demo only) shown on top of the fetched list.
  const [created, setCreated] = useState<PembelianRow[]>([]);

  // Add-purchase dialog + form state.
  const [open, setOpen] = useState(false);
  const [pemasok, setPemasok] = useState("");
  const [tanggalBeli, setTanggalBeli] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine(0)]);
  const [keySeq, setKeySeq] = useState(1);

  const rows: PembelianRow[] = [...created, ...(pembelian ?? [])];
  const bahanList = bahan ?? [];

  // Live total of the form = Σ(qty × harga_beli) across all lines.
  const formTotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.harga_beli) || 0),
        0,
      ),
    [lines],
  );

  const updateLine = (key: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(keySeq)]);
    setKeySeq((k) => k + 1);
  };

  const removeLine = (key: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const resetForm = () => {
    setPemasok("");
    setTanggalBeli("");
    setLines([emptyLine(0)]);
    setKeySeq(1);
  };

  const handleSave = () => {
    const validLines = lines.filter(
      (l) => l.id_bahan && Number(l.qty) > 0 && Number(l.harga_beli) > 0,
    );

    if (!pemasok.trim() || !tanggalBeli) {
      toast.error("Pemasok dan tanggal beli wajib diisi");
      return;
    }
    if (validLines.length === 0) {
      toast.error("Tambahkan minimal satu baris bahan yang valid");
      return;
    }

    // Each valid line becomes one FIFO lot on the backend: a `detail_pembelian`
    // row created with qty_awal = sisa_qty = qty (harga_beli per base unit).
    // TODO: await api.post('/pembelian', {
    //   pemasok, tanggal_beli: tanggalBeli,
    //   items: validLines.map((l) => ({
    //     id_bahan: Number(l.id_bahan), qty: Number(l.qty), harga_beli: Number(l.harga_beli),
    //   })),
    // });

    const seq = rows.length + 1;
    const newRow: PembelianRow = {
      id_pembelian: Date.now(),
      id_pegawai: 0,
      nomor_pembelian: makePoNumber(tanggalBeli, seq),
      tanggal_beli: tanggalBeli,
      pemasok: pemasok.trim(),
      total_beli: formTotal,
      jumlah_item: validLines.length,
    };

    setCreated((prev) => [newRow, ...prev]);
    toast.success(`Pembelian ${newRow.nomor_pembelian} tersimpan`);
    resetForm();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Transaksi
          </p>
          <h1 className="text-2xl font-bold uppercase tracking-tight">
            Pembelian
          </h1>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <POSButton variant="accent">+ Tambah Pembelian</POSButton>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="uppercase font-bold tracking-tight">
                Tambah Pembelian
              </DialogTitle>
              <DialogDescription>
                Setiap baris bahan menjadi satu lot FIFO (detail_pembelian).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Header fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pemasok" className="uppercase text-xs font-bold">
                    Pemasok
                  </Label>
                  <Input
                    id="pemasok"
                    value={pemasok}
                    onChange={(e) => setPemasok(e.target.value)}
                    placeholder="Nama pemasok"
                    className="rounded-lg border border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tanggal" className="uppercase text-xs font-bold">
                    Tanggal Beli
                  </Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={tanggalBeli}
                    onChange={(e) => setTanggalBeli(e.target.value)}
                    className="rounded-lg border border-border"
                  />
                </div>
              </div>

              {/* Dynamic line items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="uppercase text-xs font-bold tracking-widest">
                    Rincian Bahan
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg border border-border uppercase font-bold"
                    onClick={addLine}
                  >
                    + Tambah Baris
                  </Button>
                </div>

                {lines.map((line) => {
                  const subtotal =
                    (Number(line.qty) || 0) * (Number(line.harga_beli) || 0);
                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-12 gap-2 items-end rounded-lg border border-border p-2"
                    >
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <Label className="uppercase text-[10px] font-bold">
                          Bahan
                        </Label>
                        <Select
                          value={line.id_bahan}
                          onValueChange={(v) => updateLine(line.key, { id_bahan: v })}
                        >
                          <SelectTrigger className="rounded-lg border border-border">
                            <SelectValue placeholder="Pilih bahan" />
                          </SelectTrigger>
                          <SelectContent>
                            {bahanList.map((b) => (
                              <SelectItem key={b.id_bahan} value={String(b.id_bahan)}>
                                {b.nama_bahan} ({b.satuan})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="uppercase text-[10px] font-bold">Qty</Label>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={line.qty}
                          onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                          className="rounded-lg border border-border"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-3 space-y-1">
                        <Label className="uppercase text-[10px] font-bold">
                          Harga/Unit
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={line.harga_beli}
                          onChange={(e) =>
                            updateLine(line.key, { harga_beli: e.target.value })
                          }
                          className="rounded-lg border border-border"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2 flex flex-col items-end justify-end">
                        <span className="font-mono font-bold text-sm">
                          {formatRupiah(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="text-[10px] uppercase tracking-widest text-destructive hover:underline disabled:opacity-30"
                          disabled={lines.length === 1}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live total */}
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="uppercase font-bold tracking-tight">Total Beli</span>
                <span className="text-2xl font-bold font-mono">
                  {formatRupiah(formTotal)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <POSButton variant="outline">Batal</POSButton>
              </DialogClose>
              <POSButton variant="accent" onClick={handleSave}>
                Simpan Pembelian
              </POSButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchases table */}
      <div className="rounded-lg border border-border bg-background shadow-md">
        <Table>
          <TableCaption className="pb-4">
            Riwayat pembelian bahan baku — sumber lot FIFO.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-bold">No. Pembelian</TableHead>
              <TableHead className="uppercase font-bold">Tanggal</TableHead>
              <TableHead className="uppercase font-bold">Pemasok</TableHead>
              <TableHead className="uppercase font-bold text-center">Item</TableHead>
              <TableHead className="uppercase font-bold text-right">Total Beli</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 uppercase text-sm tracking-widest text-muted-foreground"
                >
                  Belum ada pembelian
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id_pembelian}>
                  <TableCell className="font-mono font-bold">
                    {p.nomor_pembelian}
                  </TableCell>
                  <TableCell>{formatDate(p.tanggal_beli)}</TableCell>
                  <TableCell className="uppercase">{p.pemasok}</TableCell>
                  <TableCell className="text-center font-bold">
                    {p.jumlah_item}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
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
