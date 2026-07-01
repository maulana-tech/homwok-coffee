"use client";

import { useEffect, useState } from "react";
import {
  POSButton,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useMenus } from "@/hooks/use-data";
import type { SampleMenu } from "@/lib/sample-data";
import { DataTable, type DataTableColumn } from "@/components/master/data-table";
import { DeleteConfirm } from "@/components/master/delete-confirm";

interface MenuForm {
  nama_menu: string;
  kategori: string;
  harga_jual: string;
  aktif: boolean;
}

const EMPTY_FORM: MenuForm = {
  nama_menu: "",
  kategori: "Coffee",
  harga_jual: "",
  aktif: true,
};

export default function MasterMenuPage() {
  const { data, isLoading } = useMenus();
  const [rows, setRows] = useState<SampleMenu[]>([]);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SampleMenu | null>(null);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<SampleMenu | null>(null);

  // Seed local state once the query resolves (no backend yet).
  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const categories = Array.from(new Set(rows.map((r) => r.kategori)));
  const categoryOptions = categories.length
    ? categories
    : ["Coffee", "Non-Coffee", "Snack"];

  const filtered = rows.filter((m) =>
    m.nama_menu.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (menu: SampleMenu) => {
    setEditing(menu);
    setForm({
      nama_menu: menu.nama_menu,
      kategori: menu.kategori,
      harga_jual: String(menu.harga_jual),
      aktif: menu.aktif,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const nama = form.nama_menu.trim();
    const harga = Number(form.harga_jual);
    if (!nama) {
      toast.error("Nama menu wajib diisi");
      return;
    }
    if (!Number.isFinite(harga) || harga <= 0) {
      toast.error("Harga jual harus lebih dari 0");
      return;
    }

    if (editing) {
      setRows((prev) =>
        prev.map((m) =>
          m.id_menu === editing.id_menu
            ? {
                ...m,
                nama_menu: nama,
                kategori: form.kategori,
                harga_jual: harga,
                aktif: form.aktif,
              }
            : m,
        ),
      );
      // TODO: await api.put(`/menu/${editing.id_menu}`, values)
      toast.success(`Menu "${nama}" diperbarui`);
    } else {
      const nextId =
        rows.reduce((max, m) => Math.max(max, m.id_menu), 0) + 1;
      const created: SampleMenu = {
        id_menu: nextId,
        nama_menu: nama,
        kategori: form.kategori,
        harga_jual: harga,
        aktif: form.aktif,
        stockStatus: "available",
      };
      setRows((prev) => [...prev, created]);
      // TODO: await api.post('/menu', values)
      toast.success(`Menu "${nama}" ditambahkan`);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRows((prev) => prev.filter((m) => m.id_menu !== deleteTarget.id_menu));
    // TODO: await api.delete(`/menu/${deleteTarget.id_menu}`)
    toast.success(`Menu "${deleteTarget.nama_menu}" dihapus`);
    setDeleteTarget(null);
  };

  const columns: DataTableColumn<SampleMenu>[] = [
    { key: "nama_menu", header: "Nama Menu", className: "font-bold uppercase" },
    { key: "kategori", header: "Kategori" },
    {
      key: "harga_jual",
      header: "Harga Jual",
      render: (m) => formatRupiah(m.harga_jual),
    },
    {
      key: "aktif",
      header: "Status",
      render: (m) => (
        <Badge variant={m.aktif ? "default" : "outline"}>
          {m.aktif ? "Aktif" : "Non-Aktif"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">
            Master Menu
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            {rows.length} Menu Terdaftar
          </p>
        </div>
        <POSButton variant="accent" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Menu
        </POSButton>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama menu…"
          className="rounded-lg border border-border pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        getRowKey={(m) => m.id_menu}
        emptyText={search ? "Menu tidak ditemukan" : "Belum ada menu"}
        actions={(m) => (
          <div className="flex justify-end gap-2">
            <POSButton
              size="sm"
              variant="outline"
              aria-label={`Edit ${m.nama_menu}`}
              onClick={() => openEdit(m)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </POSButton>
            <POSButton
              size="sm"
              variant="destructive"
              aria-label={`Hapus ${m.nama_menu}`}
              onClick={() => setDeleteTarget(m)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </POSButton>
          </div>
        )}
      />

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase font-bold tracking-tight">
              {editing ? "Edit Menu" : "Tambah Menu"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui detail menu."
                : "Tambahkan menu baru ke daftar."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nama_menu" className="uppercase text-xs font-bold">
                Nama Menu
              </Label>
              <Input
                id="nama_menu"
                value={form.nama_menu}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama_menu: e.target.value }))
                }
                className="rounded-lg border border-border"
                placeholder="mis. Caffe Latte"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="uppercase text-xs font-bold">Kategori</Label>
              <Select
                value={form.kategori}
                onValueChange={(v) => setForm((f) => ({ ...f, kategori: v }))}
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="harga_jual"
                className="uppercase text-xs font-bold"
              >
                Harga Jual
              </Label>
              <Input
                id="harga_jual"
                type="number"
                min={0}
                value={form.harga_jual}
                onChange={(e) =>
                  setForm((f) => ({ ...f, harga_jual: e.target.value }))
                }
                className="rounded-lg border border-border"
                placeholder="25000"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aktif: e.target.checked }))
                }
                className="w-5 h-5 rounded-lg border border-border accent-black"
              />
              <span className="uppercase text-sm font-bold">Menu Aktif</span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <POSButton variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </POSButton>
            <POSButton variant="accent" onClick={handleSave}>
              Simpan
            </POSButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Menu"
        description={
          deleteTarget
            ? `Yakin hapus "${deleteTarget.nama_menu}"? Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
