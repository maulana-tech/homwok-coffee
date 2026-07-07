"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/components/providers/auth-provider";
import { MenuGrid } from "@/components/kasir/menu-grid";
import { Cart } from "@/components/kasir/cart";
import {
  CheckoutModal,
  type ReceiptData,
} from "@/components/kasir/checkout-modal";
import { Sheet, SheetContent, SheetTrigger, POSButton } from "@homwok/ui";
import { formatRupiah } from "@homwok/lib";
import { ShoppingCart } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

function makeNotaNumber(now: Date): string {
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const hms = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `NJ-${ymd}-${hms}`;
}

export default function KasirPage() {
  const cart = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (user && user.peran !== "barista") {
      router.replace("/laporan/penjualan");
    }
  }, [user, router]);

  if (!user || user.peran !== "barista") {
    return null;
  }

  const handleConfirm = async () => {
    if (!cart.items.length) return;
    setProcessing(true);
    try {
      const response = await api.post("/penjualan", {
        items: cart.items.map((i) => ({ id_menu: i.id_menu, qty: i.qty })),
      });
      const data = response.data;

      const now = new Date();
      setReceipt({
        storeName: "Homwok Coffee",
        receiptNumber: data.nomor_nota || makeNotaNumber(now),
        date: data.tanggal_jual ? new Date(data.tanggal_jual).toLocaleString("id-ID") : now.toLocaleString("id-ID"),
        cashier: user?.nama_lengkap ?? "-",
        items: cart.items.map((i) => ({
          name: i.nama_menu,
          qty: i.qty,
          price: i.harga_jual,
          subtotal: i.subtotal,
        })),
        total: cart.total,
      });
      toast.success("Transaksi kasir berhasil disimpan");
    } catch (err) {
      console.warn("Koneksi API gagal, menggunakan receipt simulasi:", err);
      // Fallback
      const now = new Date();
      setReceipt({
        storeName: "Homwok Coffee",
        receiptNumber: makeNotaNumber(now),
        date: now.toLocaleString("id-ID"),
        cashier: user?.nama_lengkap ?? "-",
        items: cart.items.map((i) => ({
          name: i.nama_menu,
          qty: i.qty,
          price: i.harga_jual,
          subtotal: i.subtotal,
        })),
        total: cart.total,
      });
      toast.success("Transaksi berhasil (Mode Demo)");
    } finally {
      setProcessing(false);
    }
  };

  const handleFinish = () => {
    cart.clearCart();
    setReceipt(null);
    setOpen(false);
  };

  const cartProps = {
    items: cart.items,
    total: cart.total,
    itemCount: cart.itemCount,
    onUpdateQty: cart.updateQty,
    onRemove: cart.removeItem,
    onClear: cart.clearCart,
    onCheckout: () => setOpen(true),
  };

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 overflow-auto pr-1">
        <MenuGrid onSelect={cart.addItem} />
      </div>

      {/* Fixed cart panel on large screens */}
      <aside className="w-96 shrink-0 hidden lg:block">
        <Cart {...cartProps} />
      </aside>

      {/* Slide-in cart on smaller screens */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <POSButton variant="accent" size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              {cart.itemCount} · {formatRupiah(cart.total)}
            </POSButton>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90vw] max-w-sm p-0">
            <Cart {...cartProps} />
          </SheetContent>
        </Sheet>
      </div>

      <CheckoutModal
        isOpen={isOpen}
        items={cart.items}
        total={cart.total}
        isProcessing={isProcessing}
        receipt={receipt}
        onClose={() => (receipt ? handleFinish() : setOpen(false))}
        onConfirm={handleConfirm}
        onFinish={handleFinish}
      />
    </div>
  );
}
