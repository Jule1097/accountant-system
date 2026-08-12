"use client";

import { Component, ReactNode, Suspense, useMemo, use } from "react";
import { VoucherModalLoading, VoucherModalReady } from "src/components/vouchers/voucher-modal";
import { VoucherFormOptionsData, useVoucherFormOptions } from "src/hooks/use-voucher-form-options";
import { Voucher } from "src/models/Voucher";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher";

interface VoucherDetailModalProps {
  voucherId: string | null;
  promise: Promise<Voucher> | null;
  type: VoucherScreenType;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voucher: Voucher, mode: VoucherModalMode) => void;
  onLoadError: (error: unknown) => void;
}

interface VoucherDetailModalBoundaryProps {
  children: ReactNode;
  onError: (error: unknown) => void;
  resetKey: string | null;
}

interface VoucherDetailModalBoundaryState {
  hasError: boolean;
}

interface VoucherDetailModalResource {
  voucher: Voucher;
  options: VoucherFormOptionsData;
}

class VoucherDetailModalBoundary extends Component<
  VoucherDetailModalBoundaryProps,
  VoucherDetailModalBoundaryState
> {
  state: VoucherDetailModalBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): VoucherDetailModalBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    this.props.onError(error);
  }

  componentDidUpdate(previousProps: VoucherDetailModalBoundaryProps): void {
    if (previousProps.resetKey === this.props.resetKey || !this.state.hasError) {
      return;
    }

    this.setState({ hasError: false });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function VoucherDetailModalContent({
  resourcePromise,
  type,
  onOpenChange,
  onSuccess,
}: {
  resourcePromise: Promise<VoucherDetailModalResource>;
  type: VoucherScreenType;
  onOpenChange: (open: boolean) => void;
  onSuccess: (voucher: Voucher, mode: VoucherModalMode) => void;
}) {
  const resource = use(resourcePromise);

  return (
    <VoucherModalReady
      isOpen
      onOpenChange={onOpenChange}
      type={type}
      mode="edit"
      initialVoucher={resource.voucher}
      onSuccess={onSuccess}
      options={resource.options}
    />
  );
}

export function VoucherDetailModal({
  voucherId,
  promise,
  type,
  onOpenChange,
  onSuccess,
  onLoadError,
}: VoucherDetailModalProps) {
  const { promise: optionsPromise } = useVoucherFormOptions({ isOpen: Boolean(voucherId), type });

  const resourcePromise = useMemo(() => {
    if (!voucherId || !promise || !optionsPromise) {
      return null;
    }

    return Promise.all([promise, optionsPromise]).then(([voucher, options]) => ({
      voucher,
      options,
    }));
  }, [optionsPromise, promise, voucherId]);

  if (!voucherId || !resourcePromise) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <VoucherModalLoading
          isOpen
          onOpenChange={onOpenChange}
          type={type}
          mode="edit"
          title="Cargando comprobante"
          description="Estamos trayendo la información para editarla."
        />
      }
    >
      <VoucherDetailModalBoundary onError={onLoadError} resetKey={voucherId}>
        <VoucherDetailModalContent
          resourcePromise={resourcePromise}
          type={type}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </VoucherDetailModalBoundary>
    </Suspense>
  );
}
