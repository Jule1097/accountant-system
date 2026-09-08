"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "src/components/ui/button";
import type { VoucherModalMode } from "src/types/voucher/voucher";

interface VoucherModalActionsProps {
  mode: VoucherModalMode;
  isProcessing: boolean;
  isValid: boolean;
  primaryButtonLabel: string;
  onClose: () => void;
}

export function VoucherModalActions({ mode, isProcessing, isValid, primaryButtonLabel, onClose }: VoucherModalActionsProps) {
  if (mode === "view") {
    return <Button type="button" onClick={onClose} className="w-full h-10 !bg-[#FF5C00] hover:!bg-[#FF5C00]/90 !text-white text-sm font-medium rounded-md">Cerrar</Button>;
  }
  return <Button type="submit" className="w-full h-10 !bg-[#FF5C00] hover:!bg-[#FF5C00]/90 !text-white text-sm font-medium rounded-md" disabled={!isValid || isProcessing}>{isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{primaryButtonLabel}</Button>;
}
