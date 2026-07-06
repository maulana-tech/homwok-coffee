"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  POSButton,
  Receipt,
  Separator,
} from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { CheckCircle2, Printer } from "lucide-react";
import type { CartLine } from "@/hooks/use-cart";

export interface ReceiptData {
  storeName: string;
  receiptNumber: string;
  date: string;
  cashier: string;
  items: Array<{ name: string; qty: number; price: number; subtotal: number }>;
  total: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartLine[];
  total: number;
  isProcessing: boolean;
  receipt: ReceiptData | null;
  onClose: () => void;
  onConfirm: () => void;
  onFinish: () => void;
}

export function CheckoutModal({
  isOpen,
  items,
  total,
  isProcessing,
  receipt,
  onClose,
  onConfirm,
  onFinish,
}: CheckoutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {receipt ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Transaksi Berhasil
              </DialogTitle>
              <DialogDescription>
                Struk siap dicetak. Tekan Selesai untuk transaksi berikutnya.
              </DialogDescription>
            </DialogHeader>

            <Receipt {...receipt} />

            <div className="flex gap-2 print:hidden">
              <POSButton
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-1" /> Cetak
              </POSButton>
              <POSButton variant="accent" className="flex-1" onClick={onFinish}>
                Selesai
              </POSButton>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
              <DialogDescription>
                Periksa pesanan sebelum menyelesaikan transaksi.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {items.map((i) => (
                <div key={i.id_menu} className="flex justify-between text-sm">
                  <span className="uppercase font-medium">
                    {i.qty}× {i.nama_menu}
                  </span>
                  <span>{formatRupiah(i.subtotal)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="uppercase font-medium">Total</span>
              <span className="text-2xl font-semibold">{formatRupiah(total)}</span>
            </div>

            <POSButton
              variant="accent"
              size="xl"
              className="w-full"
              disabled={isProcessing || items.length === 0}
              onClick={onConfirm}
            >
              {isProcessing ? "Memproses…" : `Bayar ${formatRupiah(total)}`}
            </POSButton>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
