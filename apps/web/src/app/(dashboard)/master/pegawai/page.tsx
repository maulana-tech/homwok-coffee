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
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Pegawai } from "@homwok/types";
import { usePegawai } from "@/hooks/use-data";
import { DataTable, type DataTableColumn } from "@/components/master/data-table";
import { DeleteConfirm } from "@/components/master/delete-confirm";

type Role = Pegawai["peran"];

interface PegawaiForm {
  nama_lengkap: string;
  username: string;
  peran: Role;
  password: string;
  aktif: boolean;
}

const EMPTY_FORM: PegawaiForm = {
  nama_lengkap: "",
  username: "",
  peran: "barista",
  password: "",
  aktif: true,
};

export default function MasterPegawaiPage() {
  const { data, isLoading } = usePegawai();
  const [rows, setRows] = useState<Pegawai[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pegawai | null>(null);
  const [form, setForm] = useState<PegawaiForm>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Pegawai | null>(null);

  // Seed local state once the query resolves (no backend yet).
  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (pegawai: Pegawai) => {
    setEditing(pegawai);
    setForm({
      nama_lengkap: pegawai.nama_lengkap,
      username: pegawai.username,
      peran: pegawai.peran,
      password: "",
      aktif: pegawai.aktif,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const nama = form.nama_lengkap.trim();
    const username = form.username.trim();
    if (!nama) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    if (!username) {
      toast.error("Username wajib diisi");
      return;
    }
    if (!editing && !form.password.trim()) {
      toast.error("Kata sandi wajib diisi untuk pegawai baru");
      return;
    }

    if (editing) {
      setRows((prev) =>
        prev.map((p) =>
          p.id_pegawai === editing.id_pegawai
            ? {
                ...p,
                nama_lengkap: nama,
                username,
                peran: form.peran,
                aktif: form.aktif,
              }
            : p,
        ),
      );
      // TODO: await api.put(`/pegawai/${editing.id_pegawai}`, values)
      toast.success(`Pegawai "${nama}" diperbarui`);
    } else {
      const nextId =
        rows.reduce((max, p) => Math.max(max, p.id_pegawai), 0) + 1;
      const created: Pegawai = {
        id_pegawai: nextId,
        nama_lengkap: nama,
        username,
        peran: form.peran,
        aktif: form.aktif,
      };
      setRows((prev) => [...prev, created]);
      // TODO: await api.post('/pegawai', { ...values, kata_sandi: form.password })
      toast.success(`Pegawai "${nama}" ditambahkan`);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRows((prev) =>
      prev.filter((p) => p.id_pegawai !== deleteTarget.id_pegawai),
    );
    // TODO: await api.delete(`/pegawai/${deleteTarget.id_pegawai}`)
    toast.success(`Pegawai "${deleteTarget.nama_lengkap}" dihapus`);
    setDeleteTarget(null);
  };

  const columns: DataTableColumn<Pegawai>[] = [
    {
      key: "nama_lengkap",
      header: "Nama Lengkap",
      className: "font-medium uppercase",
    },
    { key: "username", header: "Username" },
    {
      key: "peran",
      header: "Peran",
      render: (p) => (
        <Badge variant={p.peran === "manager" ? "default" : "secondary"}>
          {p.peran}
        </Badge>
      ),
    },
    {
      key: "aktif",
      header: "Status",
      render: (p) => (
        <Badge variant={p.aktif ? "default" : "outline"}>
          {p.aktif ? "Aktif" : "Non-Aktif"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Pegawai
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            {rows.length} Pegawai
          </p>
        </div>
        <POSButton variant="accent" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Pegawai
        </POSButton>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        getRowKey={(p) => p.id_pegawai}
        emptyText="Belum ada pegawai"
        actions={(p) => (
          <div className="flex justify-end gap-2">
            <POSButton
              size="sm"
              variant="outline"
              aria-label={`Edit ${p.nama_lengkap}`}
              onClick={() => openEdit(p)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </POSButton>
            <POSButton
              size="sm"
              variant="destructive"
              aria-label={`Hapus ${p.nama_lengkap}`}
              onClick={() => setDeleteTarget(p)}
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
              {editing ? "Edit Pegawai" : "Tambah Pegawai"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Perbarui data pegawai."
                : "Tambahkan pegawai baru beserta kata sandi awal."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="nama_lengkap"
                className="uppercase text-xs font-medium"
              >
                Nama Lengkap
              </Label>
              <Input
                id="nama_lengkap"
                value={form.nama_lengkap}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama_lengkap: e.target.value }))
                }
                className="rounded-lg border border-border"
                placeholder="mis. Barista Satu"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="uppercase text-xs font-medium">
                Username
              </Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className="rounded-lg border border-border"
                placeholder="mis. barista"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="uppercase text-xs font-medium">Peran</Label>
              <Select
                value={form.peran}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, peran: v as Role }))
                }
              >
                <SelectTrigger className="rounded-lg border border-border">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barista">barista</SelectItem>
                  <SelectItem value="manager">manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!editing && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="uppercase text-xs font-medium"
                >
                  Kata Sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="rounded-lg border border-border"
                  placeholder="••••••••"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aktif: e.target.checked }))
                }
                className="w-5 h-5 rounded-lg border border-border accent-black"
              />
              <span className="uppercase text-sm font-medium">Pegawai Aktif</span>
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

      <DeleteConfirm
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Pegawai"
        description={
          deleteTarget
            ? `Yakin hapus "${deleteTarget.nama_lengkap}"? Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
