import * as React from "react";

import { cn } from "../lib/utils";

interface ReceiptProps {
  storeName: string;
  receiptNumber: string;
  date: string;
  cashier: string;
  items: Array<{ name: string; qty: number; price: number; subtotal: number }>;
  total: number;
  className?: string;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ storeName, receiptNumber, date, cashier, items, total, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        "receipt w-full max-w-[300px] mx-auto bg-white text-black p-6 font-mono text-xs rounded-lg border border-border",
        className
      )}
    >
      <div className="text-center mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tighter mb-1">
          {storeName}
        </h2>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Coffee &amp; Co
        </p>
      </div>

      <div className="space-y-1 mb-4 text-[10px] uppercase">
        <div className="flex justify-between">
          <span>No</span>
          <span className="font-bold">{receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between">
          <span>Ksr</span>
          <span>{cashier}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border my-4" />

      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between font-bold uppercase">
              <span>{item.name}</span>
              <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {item.qty} x Rp {item.price.toLocaleString("id-ID")}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-border my-4" />

      <div className="flex justify-between text-lg font-bold uppercase mb-4">
        <span>Total</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>

      <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mt-6 pt-4 border-t border-border">
        <p>Terima Kasih</p>
        <p className="mt-1">***</p>
      </div>
    </div>
  )
);
Receipt.displayName = "Receipt";

export { Receipt };
