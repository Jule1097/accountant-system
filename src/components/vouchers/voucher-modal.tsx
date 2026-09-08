"use client";

import type { ReactNode } from "react";
import { Suspense, use } from "react";
import { DialogLoadingState } from "src/components/ui/dialog-loading-state";
import { ResourceModal } from "src/components/ui/resource-modal";
import { VoucherModalForm } from "src/components/vouchers/voucher-modal-form";
import type { VoucherModalFormProps } from "src/components/vouchers/voucher-modal-form";
import { useVoucherFormOptions } from "src/hooks/voucher/use-voucher-form-options";
import type { VoucherFormOptionsData } from "src/hooks/voucher/use-voucher-form-options";
import type { ParsedVoucherData } from "src/types/parser/gemini-parser";
import type { VoucherApiResponse } from "src/types/voucher/voucher-api";
import type { VoucherModalMode, VoucherScreenType } from "src/types/voucher/voucher";

interface VoucherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  initialVoucher?: VoucherApiResponse | null;
  initialParsedData?: ParsedVoucherData | null;
  isLoadingDetail?: boolean;
  resetKey?: string;
  submitAction?: VoucherModalFormProps["submitAction"];
  submitButtonLabel?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  sidePanel?: ReactNode;
  onSuccess?: (voucher: VoucherApiResponse, mode: VoucherModalMode) => void;
}

export interface VoucherModalReadyProps extends VoucherModalProps {
  options: VoucherFormOptionsData;
}

interface VoucherModalAsyncFormProps extends VoucherModalProps {
  optionsPromise: Promise<VoucherFormOptionsData> | null;
}

function resolveVoucherModalTitle(type: VoucherScreenType, mode: VoucherModalMode, titleOverride?: string): string {
  if (titleOverride) {
    return titleOverride;
  }

  if (mode === "create") {
    return `Agregar Comprobante de ${type === "sales" ? "Venta" : "Compra"}`;
  }

  return "Detalle del Comprobante";
}

function resolveVoucherModalDescription(type: VoucherScreenType, mode: VoucherModalMode, descriptionOverride?: string): string {
  if (descriptionOverride) {
    return descriptionOverride;
  }

  if (mode === "view") {
    return "Visualiza la información del comprobante.";
  }

  if (mode === "edit") {
    return "Revisa el comprobante y ajusta la información cargada desde la base.";
  }

  return "Sube el comprobante (PDF/JPG) para procesarlo con IA o completa los datos manualmente.";
}

function resolveVoucherModalSize(mode: VoucherModalMode, sidePanel?: ReactNode): "default" | "wide" {
  return mode === "create" || Boolean(sidePanel) ? "wide" : "default";
}

function VoucherModalAsyncForm({ optionsPromise, ...props }: VoucherModalAsyncFormProps) {
  if (!optionsPromise) {
    return null;
  }

  const options = use(optionsPromise);

  return <VoucherModalForm {...props} options={options} />;
}

function VoucherModalLoadingState({ title, description }: { title: string; description: string }) {
  return (
    <DialogLoadingState
      title={title}
      description={description}
      minHeightClassName="min-h-[320px]"
    />
  );
}

export function VoucherModalReady({
  isOpen,
  onOpenChange,
  type,
  mode,
  initialVoucher,
  initialParsedData,
  isLoadingDetail = false,
  resetKey,
  submitAction,
  submitButtonLabel,
  titleOverride,
  descriptionOverride,
  sidePanel,
  onSuccess,
  options,
}: VoucherModalReadyProps) {
  return (
    <ResourceModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={resolveVoucherModalTitle(type, mode, titleOverride)}
      description={resolveVoucherModalDescription(type, mode, descriptionOverride)}
      size={resolveVoucherModalSize(mode, sidePanel)}
      sidePanel={sidePanel}
      isLoading={isLoadingDetail}
      loadingState={
        <VoucherModalLoadingState
          title="Cargando comprobante"
          description="Estamos trayendo la información para editarla."
        />
      }
    >
      <VoucherModalForm
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        type={type}
        mode={mode}
        initialVoucher={initialVoucher}
        initialParsedData={initialParsedData}
        resetKey={resetKey}
        submitAction={submitAction}
        submitButtonLabel={submitButtonLabel}
        onSuccess={onSuccess}
        options={options}
      />
    </ResourceModal>
  );
}

export function VoucherModal({
  isOpen,
  onOpenChange,
  type,
  mode,
  initialVoucher,
  initialParsedData,
  isLoadingDetail = false,
  resetKey,
  submitAction,
  submitButtonLabel,
  titleOverride,
  descriptionOverride,
  sidePanel,
  onSuccess,
}: VoucherModalProps) {
  const { promise: optionsPromise } = useVoucherFormOptions({ isOpen, type });

  return (
    <ResourceModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={resolveVoucherModalTitle(type, mode, titleOverride)}
      description={resolveVoucherModalDescription(type, mode, descriptionOverride)}
      size={resolveVoucherModalSize(mode, sidePanel)}
      sidePanel={sidePanel}
      isLoading={isLoadingDetail}
      loadingState={
        <VoucherModalLoadingState
          title="Cargando comprobante"
          description="Estamos trayendo la información para editarla."
        />
      }
    >
      <Suspense
        fallback={
          <VoucherModalLoadingState
            title="Cargando formulario"
            description="Estamos preparando las opciones del comprobante."
          />
        }
      >
        <VoucherModalAsyncForm
          optionsPromise={optionsPromise}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          type={type}
          mode={mode}
          initialVoucher={initialVoucher}
          initialParsedData={initialParsedData}
          resetKey={resetKey}
          submitAction={submitAction}
          submitButtonLabel={submitButtonLabel}
          onSuccess={onSuccess}
        />
      </Suspense>
    </ResourceModal>
  );
}

export function VoucherModalLoading({
  isOpen,
  onOpenChange,
  type,
  mode,
  title,
  description,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  title: string;
  description: string;
}) {
  return (
    <ResourceModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={resolveVoucherModalTitle(type, mode)}
      description={resolveVoucherModalDescription(type, mode)}
      size={resolveVoucherModalSize(mode)}
      isLoading
      loadingState={<VoucherModalLoadingState title={title} description={description} />}
    >
      {null}
    </ResourceModal>
  );
}
