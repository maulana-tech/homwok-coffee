"use client";

import { useEffect, useState, type ChangeEvent } from "react";
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
  cn,
} from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ImagePlus, ImageOff, X, BookOpen } from "lucide-react";
import { useMenus } from "@/hooks/use-data";
import type { Menu } from "@homwok/types";
import { DataTable, type DataTableColumn } from "@/components/master/data-table";
import { DeleteConfirm } from "@/components/master/delete-confirm";

interface MenuForm {
  nama_menu: string;
  kategori: string;
  harga_jual: string;
  aktif: boolean;
  /** URL preview foto (object URL saat file baru dipilih, atau foto_url lama). */
  foto_url: string | null;
  /** File yang dipilih — dikirim sebagai multipart ke API saat wiring nyata. */
  fotoFile: File | null;
}

const EMPTY_FORM: MenuForm = {
  nama_menu: "",
  kategori: "Coffee",
  harga_jual: "",
  aktif: true,
  foto_url: null,
  fotoFile: null,
};

const MAX_FOTO_MB = 2;

export default function MasterMenuPage() {
  const { data, isLoading } = useMenus();
  const [rows, setRows] = useState<Menu[]>([]);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [selectedRecipeMenu, setSelectedRecipeMenu] = useState<Menu | null>(null);

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

  const openEdit = (menu: Menu) => {
    setEditing(menu);
    setForm({
      nama_menu: menu.nama_menu,
      kategori: menu.kategori,
      harga_jual: String(menu.harga_jual),
      aktif: menu.aktif,
      foto_url: menu.foto_url ?? null,
      fotoFile: null,
    });
    setFormOpen(true);
  };

  const handlePickFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // izinkan pilih file sama lagi setelah dihapus
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > MAX_FOTO_MB * 1024 * 1024) {
      toast.error(`Ukuran foto maksimal ${MAX_FOTO_MB} MB`);
      return;
    }
    setForm((f) => ({
      ...f,
      fotoFile: file,
      foto_url: URL.createObjectURL(file),
    }));
  };

  const removeFoto = () =>
    setForm((f) => ({ ...f, fotoFile: null, foto_url: null }));

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
                foto_url: form.foto_url,
              }
            : m,
        ),
      );
      // TODO: kirim multipart (POST + _method=PUT karena file):
      //   const fd = new FormData();
      //   fd.append("nama_menu", nama); ...; if (form.fotoFile) fd.append("foto", form.fotoFile);
      //   await api.post(`/menu/${editing.id_menu}?_method=PUT`, fd);
      toast.success(`Menu "${nama}" diperbarui`);
    } else {
      const nextId =
        rows.reduce((max, m) => Math.max(max, m.id_menu), 0) + 1;
      const created: Menu = {
        id_menu: nextId,
        nama_menu: nama,
        kategori: form.kategori,
        harga_jual: harga,
        aktif: form.aktif,
        foto_url: form.foto_url,
      };
      setRows((prev) => [...prev, created]);
      // TODO: const fd = new FormData(); ...; if (form.fotoFile) fd.append("foto", form.fotoFile);
      //       await api.post("/menu", fd);
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

  const columns: DataTableColumn<Menu>[] = [
    {
      key: "foto",
      header: "Foto",
      className: "w-14",
      render: (m) =>
        m.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.foto_url}
            alt={m.nama_menu}
            className="h-10 w-10 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
            <ImageOff className="h-4 w-4 text-muted-foreground/50" />
          </div>
        ),
    },
    { key: "nama_menu", header: "Nama Menu", className: "font-medium uppercase" },
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
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
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
              title="Lihat Resep"
              aria-label={`Lihat resep ${m.nama_menu}`}
              onClick={() => setSelectedRecipeMenu(m)}
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
            </POSButton>
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

      {/* Add / Edit drawer */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md rounded-l-2xl"
        >
          <SheetHeader className="border-b border-border px-5 pb-3 pt-5 pr-12">
            <SheetTitle className="uppercase font-semibold tracking-tight">
              {editing ? "Edit Menu" : "Tambah Menu"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Perbarui detail menu."
                : "Tambahkan menu baru ke daftar."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama_menu" className="uppercase text-xs font-medium">
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
              <Label className="uppercase text-xs font-medium">Kategori</Label>
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
                className="uppercase text-xs font-medium"
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

            <div className="space-y-1.5">
              <Label className="uppercase text-xs font-medium">Foto Menu</Label>
              {form.foto_url ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.foto_url}
                    alt="Preview foto menu"
                    className="h-28 w-28 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeFoto}
                    aria-label="Hapus foto"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-secondary">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px] uppercase tracking-wider">
                    Pilih foto
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePickFoto}
                  />
                </label>
              )}
              <p className="text-[11px] text-muted-foreground">
                JPG/PNG/WebP, maks {MAX_FOTO_MB} MB.
              </p>
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
              <span className="uppercase text-sm font-medium">Menu Aktif</span>
            </label>
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

      {/* Recipe details dialog */}
      <Dialog open={selectedRecipeMenu !== null} onOpenChange={(open) => !open && setSelectedRecipeMenu(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase font-semibold tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Resep: {selectedRecipeMenu?.nama_menu}
            </DialogTitle>
            <DialogDescription>
              Komposisi bahan baku yang digunakan untuk membuat 1 porsi menu ini.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedRecipeMenu?.resep && selectedRecipeMenu.resep.length > 0 ? (
              <div className="border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground border-b border-black">
                      <th className="p-3 text-xs font-semibold uppercase tracking-wider">Bahan Baku</th>
                      <th className="p-3 text-xs font-semibold uppercase tracking-wider text-right">Takaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecipeMenu.resep.map((r, i) => (
                      <tr
                        key={r.id_resep}
                        className={cn(
                          "border-b border-black last:border-0",
                          i % 2 === 0 ? "bg-background" : "bg-muted/40"
                        )}
                      >
                        <td className="p-3 text-sm font-medium uppercase">
                          {r.bahan_baku?.nama_bahan}
                        </td>
                        <td className="p-3 text-sm font-mono text-right">
                          {r.takaran} {r.satuan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-lg bg-muted/20 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase">Belum ada resep</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Menu ini belum memiliki komposisi bahan baku terdaftar.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <POSButton variant="outline" onClick={() => setSelectedRecipeMenu(null)}>
              Tutup
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
