"use client";

import { useEffect, useState } from "react";
import {
  POSButton,
  Input,
  Label,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useBahan } from "@/hooks/use-data";
import type { SampleBahan } from "@/lib/sample-data";
import { DataTable, type DataTableColumn } from "@/components/master/data-table";
import { DeleteConfirm } from "@/components/master/delete-confirm";

interface BahanForm {
  nama_bahan: string;
  satuan: string;
  stok_minimum: string;
}

const EMPTY_FORM: BahanForm = {
  nama_bahan: "",
  satuan: "gram",
  stok_minimum: "",
};

const DEFAULT_SATUAN = ["gram", "ml", "pcs"];

/** Warning when remaining stock dips to/below the minimum. */
function deriveStatus(sisaStok: number, stokMinimum: number): SampleBahan["status"] {
  return sisaStok <= stokMinimum ? "warning" : "ok";
}

export default function MasterBahanPage() {
  const { data, isLoading } = useBahan();
  const [rows, setRows] = useState<SampleBahan[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SampleBahan | null>(null);
  const [form, setForm] = useState<BahanForm>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<SampleBahan | null>(null);

  // Seed local state once the query resolves (no backend yet).
  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const satuanOptions = Array.from(
    new Set([...DEFAULT_SATUAN, ...rows.map((r) => r.satuan)]),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (bahan: SampleBahan) => {
    setEditing(bahan);
    setForm({
      nama_bahan: bahan.nama_bahan,
      satuan: bahan.satuan,
      stok_minimum: String(bahan.stok_minimum),
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const nama = form.nama_bahan.trim();
    const stokMin = Number(form.stok_minimum);
    if (!nama) {
      toast.error("Nama bahan wajib diisi");
      return;
    }
    if (!Number.isFinite(stokMin) || stokMin < 0) {
      toast.error("Stok minimum tidak valid");
      return;
    }

    if (editing) {
      setRows((prev) =>
        prev.map((b) =>
          b.id_bahan === editing.id_bahan
            ? {
                ...b,
                nama_bahan: nama,
                satuan: form.satuan,
                stok_minimum: stokMin,
                status: deriveStatus(b.sisa_stok, stokMin),
              }
            : b,
        ),
      );
      // TODO: await api.put(`/bahan/${editing.id_bahan}`, values)
      toast.success(`Bahan "${nama}" diperbarui`);
    } else {
      const nextId =
        rows.reduce((max, b) => Math.max(max, b.id_bahan), 0) + 1;
      const created: SampleBahan = {
        id_bahan: nextId,
        nama_bahan: nama,
        satuan: form.satuan,
        stok_minimum: stokMin,
        // New material has no purchase lots yet.
        sisa_stok: 0,
        harga_rata: 0,
        nilai_persediaan: 0,
        status: deriveStatus(0, stokMin),
      };
      setRows((prev) => [...prev, created]);
      // TODO: await api.post('/bahan', values)
      toast.success(`Bahan "${nama}" ditambahkan`);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRows((prev) => prev.filter((b) => b.id_bahan !== deleteTarget.id_bahan));
    // TODO: await api.delete(`/bahan/${deleteTarget.id_bahan}`)
    toast.success(`Bahan "${deleteTarget.nama_bahan}" dihapus`);
    setDeleteTarget(null);
  };

  const warningCount = rows.filter((b) => b.status === "warning").length;

  const columns: DataTableColumn<SampleBahan>[] = [
    {
      key: "nama_bahan",
      header: "Nama Bahan",
      render: (b) => (
        <span className="flex items-center gap-2 font-medium uppercase">
          {b.status === "warning" && (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          )}
          {b.nama_bahan}
        </span>
      ),
    },
    { key: "satuan", header: "Satuan" },
    {
      key: "sisa_stok",
      header: "Sisa Stok",
      render: (b) => `${b.sisa_stok.toLocaleString("id-ID")} ${b.satuan}`,
    },
    {
      key: "stok_minimum",
      header: "Stok Minimum",
      render: (b) => b.stok_minimum.toLocaleString("id-ID"),
    },
    {
      key: "nilai_persediaan",
      header: "Nilai Persediaan",
      render: (b) => formatRupiah(b.nilai_persediaan),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <Badge variant={b.status === "ok" ? "default" : "destructive"}>
          {b.status === "ok" ? "Aman" : "Menipis"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Bahan Baku
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            {rows.length} Bahan
            {warningCount > 0 && ` · ${warningCount} Menipis`}
          </p>
        </div>
        <POSButton variant="accent" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Bahan
        </POSButton>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        getRowKey={(b) => b.id_bahan}
        emptyText="Belum ada bahan baku"
        rowClassName={(b) =>
          b.status === "warning" ? "border-l-4 border-destructive" : undefined
        }
        actions={(b) => (
          <div className="flex justify-end gap-2">
            <POSButton
              size="sm"
              variant="outline"
              aria-label={`Edit ${b.nama_bahan}`}
              onClick={() => openEdit(b)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </POSButton>
            <POSButton
              size="sm"
              variant="destructive"
              aria-label={`Hapus ${b.nama_bahan}`}
              onClick={() => setDeleteTarget(b)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </POSButton>
          </div>
        )}
      />

      {/* Add / Edit drawer */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md rounded-l-2xl"
        >
          <SheetHeader className="border-b border-border px-5 pb-3 pt-5 pr-12">
            <SheetTitle className="uppercase font-semibold tracking-tight">
              {editing ? "Edit Bahan" : "Tambah Bahan"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Perbarui data bahan baku. Sisa stok mengikuti pembelian (FIFO)."
                : "Tambahkan bahan baku baru. Stok terisi lewat pembelian."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama_bahan" className="uppercase text-xs font-medium">
                Nama Bahan
              </Label>
              <Input
                id="nama_bahan"
                value={form.nama_bahan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama_bahan: e.target.value }))
                }
                className="rounded-lg border border-border"
                placeholder="mis. Biji Kopi Arabika"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="uppercase text-xs font-medium">Satuan</Label>
              <Select
                value={form.satuan}
                onValueChange={(v) => setForm((f) => ({ ...f, satuan: v }))}
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {satuanOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="stok_minimum"
                className="uppercase text-xs font-medium"
              >
                Stok Minimum
              </Label>
              <Input
                id="stok_minimum"
                type="number"
                min={0}
                value={form.stok_minimum}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stok_minimum: e.target.value }))
                }
                className="rounded-lg border border-border"
                placeholder="1000"
              />
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
            <POSButton variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </POSButton>
            <POSButton variant="accent" onClick={handleSave}>
              Simpan
            </POSButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirm
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Bahan"
        description={
          deleteTarget
            ? `Yakin hapus "${deleteTarget.nama_bahan}"? Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
