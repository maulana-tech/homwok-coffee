"use client";

import { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Skeleton,
} from "@homwok/ui";
import { formatDateTime, formatRupiah } from "@homwok/lib";
import { toast } from "sonner";
import { Search, Eye } from "lucide-react";
import { usePenjualan } from "@/hooks/use-data";
import api from "@/lib/api";

interface SaleDetail {
  id_penjualan: number;
  nomor_nota: string;
  tanggal_jual: string;
  total_jual: number;
  total_diskon: number;
  pajak: number;
  grand_total: number;
  pegawai?: {
    nama_lengkap: string;
  };
  detail_penjualan?: Array<{
    qty: number;
    harga_jual: number;
    subtotal: number;
    menu?: {
      nama_menu: string;
    };
  }>;
}

export default function PenjualanPage() {
  const { data: list, isLoading } = usePenjualan();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch sale details when a transaction is selected
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const response = await api.get(`/penjualan/${selectedId}`);
        setDetail(response.data);
      } catch (error) {
        console.error("Gagal memuat detail penjualan:", error);
        toast.error("Gagal memuat detail struk belanja");
        setSelectedId(null);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const raw = list ?? [];
    if (!search.trim()) return raw;
    const q = search.toLowerCase().trim();
    return raw.filter(
      (p) =>
        p.nomor_nota.toLowerCase().includes(q) ||
        (p.pegawai?.nama_lengkap ?? "").toLowerCase().includes(q),
    );
  }, [list, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Riwayat Transaksi
          </p>
          <h1 className="text-2xl font-semibold uppercase tracking-tight">
            Daftar Penjualan
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nomor nota atau nama kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg border border-border"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border border-border bg-background shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-medium">No. Nota</TableHead>
              <TableHead className="uppercase font-medium">Tanggal</TableHead>
              <TableHead className="uppercase font-medium">Kasir</TableHead>
              <TableHead className="uppercase font-medium text-right">
                Grand Total
              </TableHead>
              <TableHead className="uppercase font-medium text-center w-28">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 uppercase text-sm tracking-widest text-muted-foreground"
                >
                  Belum ada data penjualan atau pencarian tidak ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id_penjualan}>
                  <TableCell className="font-mono font-medium">
                    {p.nomor_nota}
                  </TableCell>
                  <TableCell>{formatDateTime(p.tanggal_jual)}</TableCell>
                  <TableCell>{p.pegawai?.nama_lengkap ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatRupiah(p.grand_total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <POSButton
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedId(p.id_penjualan)}
                      className="flex items-center gap-1.5 mx-auto"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </POSButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receipt Detail Modal */}
      <Dialog open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-md border-2 border-border shadow-xl rounded-lg">
          <DialogHeader>
            <DialogTitle className="uppercase text-center text-lg tracking-tight font-semibold">
              Detail Struk Belanja
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <div className="space-y-2 pt-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ) : detail ? (
            <div className="space-y-4 text-sm font-mono py-2">
              <div className="text-center border-b border-dashed border-border pb-4">
                <h3 className="font-bold text-base uppercase">Homwok Coffee</h3>
                <p className="text-xs text-muted-foreground">Jl. Maulana Tech Coffee No. 12</p>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-1.5 border-b border-dashed border-border pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Nota:</span>
                  <span className="font-semibold">{detail.nomor_nota}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span>{formatDateTime(detail.tanggal_jual)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kasir:</span>
                  <span>{detail.pegawai?.nama_lengkap ?? "-"}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 py-2 border-b border-dashed border-border">
                {detail.detail_penjualan?.map((item, index) => (
                  <div key={index} className="space-y-0.5">
                    <div className="flex justify-between font-medium">
                      <span>{item.menu?.nama_menu ?? "Item"}</span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.qty} x {formatRupiah(item.harga_jual)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Jual:</span>
                  <span>{formatRupiah(detail.total_jual)}</span>
                </div>
                {detail.total_diskon > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(detail.total_diskon)}</span>
                  </div>
                )}
                {detail.pajak > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak:</span>
                    <span>{formatRupiah(detail.pajak)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-border pt-3 text-base font-bold">
                  <span>GRAND TOTAL:</span>
                  <span>{formatRupiah(detail.grand_total)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4 uppercase">
                Terima Kasih Atas Kunjungan Anda
              </div>
            </div>
          ) : (
            <div className="text-center py-6 uppercase text-sm text-muted-foreground">
              Gagal memuat data struk belanja
            </div>
          )}

          <DialogFooter className="sm:justify-center border-t border-border pt-4">
            <POSButton
              onClick={() => setSelectedId(null)}
              className="w-full sm:w-28 rounded-lg"
            >
              Tutup
            </POSButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
