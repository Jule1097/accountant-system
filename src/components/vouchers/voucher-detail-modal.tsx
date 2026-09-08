"use client";

import { Suspense, use, useEffect } from "react";
import { VoucherModalLoading, VoucherModalReady } from "src/components/vouchers/voucher-modal";
import { VoucherFormOptionsData, useVoucherFormOptions } from "src/hooks/voucher/use-voucher-form-options";
import { buildVoucherViewOptions } from "src/lib/helpers/voucher/voucher-form";
import { VoucherApiResponse } from "src/types/voucher/voucher-api";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher/voucher";

interface VoucherDetailModalProps {
  voucherId: string | null;
  voucher: VoucherApiResponse | undefined;
  error: unknown;
  isLoading: boolean;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voucher: VoucherApiResponse, mode: VoucherModalMode) => Promise<void>;
  onLoadError: (error: unknown) => void;
}

function VoucherDetailModalContent({
  voucher,
  optionsPromise,
  type,
  mode,
  onOpenChange,
  onSuccess,
}: {
  voucher: VoucherApiResponse;
  optionsPromise: Promise<VoucherFormOptionsData> | null;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voucher: VoucherApiResponse, mode: VoucherModalMode) => Promise<void>;
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
      mode={mode}
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
  mode,
  onOpenChange,
  onSuccess,
  onLoadError,
}: VoucherDetailModalProps) {
  const { promise: optionsPromise } = useVoucherFormOptions({ isOpen: Boolean(voucherId) && mode !== "view", type });

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
        mode={mode}
        title="Cargando comprobante"
        description="Estamos trayendo la información para editarla."
      />
    );
  }

  if (mode === "view") {
    return (
      <VoucherModalReady
        isOpen
        onOpenChange={onOpenChange}
        type={type}
        mode={mode}
        initialVoucher={voucher}
        onSuccess={onSuccess}
        options={buildVoucherViewOptions(voucher, type)}
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
          mode={mode}
          title="Cargando formulario"
          description="Estamos preparando las opciones del comprobante."
        />
      }
    >
      <VoucherDetailModalContent
        voucher={voucher}
        optionsPromise={optionsPromise}
        type={type}
        mode={mode}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </Suspense>
  );
}
