"use client";

import { Suspense, use, useEffect } from "react";
import { VoucherModalLoading, VoucherModalReady } from "src/components/vouchers/voucher-modal";
import { VoucherFormOptionsData, useVoucherFormOptions } from "src/hooks/use-voucher-form-options";
import { Voucher } from "src/models/Voucher";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher";

interface VoucherDetailModalProps {
  voucherId: string | null;
  voucher: Voucher | undefined;
  error: unknown;
  isLoading: boolean;
  type: VoucherScreenType;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voucher: Voucher, mode: VoucherModalMode) => Promise<void>;
  onLoadError: (error: unknown) => void;
}

function VoucherDetailModalContent({
  voucher,
  optionsPromise,
  type,
  onOpenChange,
  onSuccess,
}: {
  voucher: Voucher;
  optionsPromise: Promise<VoucherFormOptionsData> | null;
  type: VoucherScreenType;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voucher: Voucher, mode: VoucherModalMode) => Promise<void>;
}) {
  if (!optionsPromise) {
    return null;
  }

  const options = use(optionsPromise);

  return (
    <VoucherModalReady
      isOpen
      onOpenChange={onOpenChange}
      type={type}
      mode="edit"
      initialVoucher={voucher}
      onSuccess={onSuccess}
      options={options}
    />
  );
}

export function VoucherDetailModal({
  voucherId,
  voucher,
  error,
  isLoading,
  type,
  onOpenChange,
  onSuccess,
  onLoadError,
}: VoucherDetailModalProps) {
  const { promise: optionsPromise } = useVoucherFormOptions({ isOpen: Boolean(voucherId), type });

  useEffect(() => {
    if (!error) {
      return;
    }

    onLoadError(error);
  }, [error, onLoadError]);

  if (!voucherId) {
    return null;
  }

  if (isLoading || !voucher) {
    return (
      <VoucherModalLoading
        isOpen
        onOpenChange={onOpenChange}
        type={type}
        mode="edit"
        title="Cargando comprobante"
        description="Estamos trayendo la información para editarla."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <VoucherModalLoading
          isOpen
          onOpenChange={onOpenChange}
          type={type}
          mode="edit"
          title="Cargando formulario"
          description="Estamos preparando las opciones del comprobante."
        />
      }
    >
      <VoucherDetailModalContent
        voucher={voucher}
        optionsPromise={optionsPromise}
        type={type}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </Suspense>
  );
}
