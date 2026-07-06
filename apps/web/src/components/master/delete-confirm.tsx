"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  POSButton,
} from "@homwok/ui";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
}

/** Reusable destructive confirmation dialog for master-data deletes. */
export function DeleteConfirm({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: DeleteConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 uppercase font-semibold tracking-tight">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <POSButton variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </POSButton>
          <POSButton
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Hapus
          </POSButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
