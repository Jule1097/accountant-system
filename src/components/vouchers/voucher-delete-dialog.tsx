"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { VoucherApiResponse } from "src/types/voucher/voucher-api";

interface VoucherDeleteDialogProps {
  isOpen: boolean;
  voucher: VoucherApiResponse | null;
  isDeleting: boolean;
  title?: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function resolveDeleteDescription(voucher: VoucherApiResponse | null, description?: string): string {
  if (description) {
    return description;
  }

  if (voucher) {
    return `Vas a eliminar el comprobante ${voucher.posNumber}-${voucher.number}. Esta acción no se puede deshacer.`;
  }

  return "Esta acción no se puede deshacer.";
}

export function VoucherDeleteDialog({
  isOpen,
  voucher,
  isDeleting,
  title,
  description,
  onOpenChange,
  onConfirm,
}: VoucherDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "Eliminar comprobante"}</DialogTitle>
          <DialogDescription>{resolveDeleteDescription(voucher, description)}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
