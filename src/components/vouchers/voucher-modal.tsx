"use client";

import type { ReactNode } from "react";
import { Suspense, use } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { ConciliationReviewPreview } from "src/components/conciliations/conciliation-review-preview";
import { VoucherModalCoreFields } from "src/components/vouchers/voucher-modal-core-fields";
import { VoucherModalDropzone } from "src/components/vouchers/voucher-modal-dropzone";
import { VoucherModalPerceptions } from "src/components/vouchers/voucher-modal-perceptions";
import { VoucherModalRetentions } from "src/components/vouchers/voucher-modal-retentions";
import { UseVoucherFormProps, useVoucherForm } from "src/hooks/use-voucher-form";
import { VoucherFormOptionsData, useVoucherFormOptions } from "src/hooks/use-voucher-form-options";
import { Voucher } from "src/models/Voucher";
import { VoucherParsedData } from "src/types/voucher-form";
import { VoucherModalMode, VoucherScreenType } from "src/types/voucher";

interface VoucherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  initialVoucher?: Voucher | null;
  initialParsedData?: VoucherParsedData | null;
  isLoadingDetail?: boolean;
  resetKey?: string;
  submitAction?: UseVoucherFormProps["submitAction"];
  submitButtonLabel?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  sidePanel?: ReactNode;
  onSuccess?: (voucher: Voucher, mode: VoucherModalMode) => void;
}

export interface VoucherModalReadyProps extends VoucherModalProps {
  options: VoucherFormOptionsData;
}

interface VoucherModalFormProps extends Omit<UseVoucherFormProps, "catalogs" | "thirdParties"> {
  options: VoucherFormOptionsData;
}

interface VoucherModalAsyncFormProps extends VoucherModalProps {
  optionsPromise: Promise<VoucherFormOptionsData> | null;
}

function resolvePrimaryButtonLabel(
  mode: VoucherModalMode,
  isProcessing: boolean,
  submitButtonLabel?: string
): string {
  if (!isProcessing) {
    return submitButtonLabel || (mode === "edit" ? "Guardar cambios" : "Guardar Comprobante");
  }

  if (submitButtonLabel === "Validar factura") {
    return "Validando factura...";
  }

  if (mode === "edit") {
    return "Guardando cambios...";
  }

  return "Guardando comprobante...";
}

function VoucherModalLoadingState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 py-6 text-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-[#FF5C00]" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function VoucherModalShell({
  isOpen,
  onOpenChange,
  type,
  mode,
  children,
  titleOverride,
  descriptionOverride,
  sidePanel,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: VoucherScreenType;
  mode: VoucherModalMode;
  children: ReactNode;
  titleOverride?: string;
  descriptionOverride?: string;
  sidePanel?: ReactNode;
}) {
  const isEditing = mode === "edit";
  const title = titleOverride || (isEditing ? "Detalle del Comprobante" : `Agregar Comprobante de ${type === "sales" ? "Venta" : "Compra"}`);
  const description = descriptionOverride || (
    isEditing
      ? "Revisa el comprobante y ajusta la información cargada desde la base."
      : "Sube el comprobante (PDF/JPG) para procesarlo con IA o completa los datos manualmente."
  );
  const dialogWidthClass = sidePanel
    ? "sm:max-w-[1180px]"
    : mode === "create"
      ? "sm:max-w-[1180px]"
      : "sm:max-w-[720px]";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${dialogWidthClass}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {sidePanel ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)] lg:items-start">
            <div className="min-w-0">{children}</div>
            <div className="min-w-0 lg:sticky lg:top-0">{sidePanel}</div>
          </div>
        ) : children}
      </DialogContent>
    </Dialog>
  );
}

function VoucherModalForm({
  isOpen,
  onOpenChange,
  type,
  mode,
  initialVoucher,
  initialParsedData,
  resetKey,
  submitAction,
  submitButtonLabel,
  onSuccess,
  options,
}: VoucherModalFormProps) {
  const {
    form,
    retentionFields,
    appendRetention,
    removeRetention,
    perceptionFields,
    appendPerception,
    removePerception,
    isProcessing,
    fileInputRef,
    handleDrop,
    handleDragOver,
    onDropzoneClick,
    onFileChange,
    onSubmit,
    handlePosBlur,
    handleNumberBlur,
    previewDocument,
  } = useVoucherForm({
    isOpen,
    onOpenChange,
    type,
    mode,
    catalogs: options.catalogs,
    thirdParties: options.thirdParties,
    initialVoucher,
    initialParsedData,
    resetKey,
    submitAction,
    submitButtonLabel,
    onSuccess,
  });
  const {
    handleSubmit,
    formState: { isValid },
  } = form;
  const isEditing = mode === "edit";
  const shouldShowDropzone = !isEditing && !initialParsedData && !submitAction;
  const primaryButtonLabel = resolvePrimaryButtonLabel(mode, isProcessing, submitButtonLabel);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
      {shouldShowDropzone && (
        <VoucherModalDropzone
          isProcessing={isProcessing}
          fileInputRef={fileInputRef}
          onFileChange={onFileChange}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          onDropzoneClick={onDropzoneClick}
        />
      )}

      {previewDocument ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)] lg:items-start">
          <div className="grid min-w-0 gap-4">
            <VoucherModalCoreFields
              form={form}
              isProcessing={isProcessing}
              catalogs={options.catalogs}
              thirdParties={options.thirdParties}
              type={type}
              handlePosBlur={handlePosBlur}
              handleNumberBlur={handleNumberBlur}
              taxListsNode={
                <>
                  {type === "sales" && (
                    <VoucherModalRetentions
                      form={form}
                      fields={retentionFields}
                      append={appendRetention}
                      remove={removeRetention}
                      catalogs={options.catalogs}
                    />
                  )}
                  {type === "purchases" && (
                    <VoucherModalPerceptions
                      form={form}
                      fields={perceptionFields}
                      append={appendPerception}
                      remove={removePerception}
                      catalogs={options.catalogs}
                    />
                  )}
                </>
              }
            />

            <Button type="submit" className="w-full h-10 !bg-[#FF5C00] hover:!bg-[#FF5C00]/90 !text-white text-sm font-medium rounded-md" disabled={!isValid || isProcessing}>
              {isProcessing && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {primaryButtonLabel}
            </Button>
          </div>

          <div className="min-w-0 lg:sticky lg:top-0">
            <ConciliationReviewPreview
              sourceUrl={previewDocument.sourceUrl}
              mimeType={previewDocument.mimeType}
              fileName={previewDocument.fileName}
            />
          </div>
        </div>
      ) : (
        <>
          <VoucherModalCoreFields
            form={form}
            isProcessing={isProcessing}
            catalogs={options.catalogs}
            thirdParties={options.thirdParties}
            type={type}
            handlePosBlur={handlePosBlur}
            handleNumberBlur={handleNumberBlur}
            taxListsNode={
              <>
                {type === "sales" && (
                  <VoucherModalRetentions
                    form={form}
                    fields={retentionFields}
                    append={appendRetention}
                    remove={removeRetention}
                    catalogs={options.catalogs}
                  />
                )}
                {type === "purchases" && (
                  <VoucherModalPerceptions
                    form={form}
                    fields={perceptionFields}
                    append={appendPerception}
                    remove={removePerception}
                    catalogs={options.catalogs}
                  />
                )}
              </>
            }
          />

          <Button type="submit" className="w-full h-10 !bg-[#FF5C00] hover:!bg-[#FF5C00]/90 !text-white text-sm font-medium rounded-md" disabled={!isValid || isProcessing}>
            {isProcessing && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {primaryButtonLabel}
          </Button>
        </>
      )}
    </form>
  );
}

function VoucherModalAsyncForm({ optionsPromise, ...props }: VoucherModalAsyncFormProps) {
  if (!optionsPromise) {
    return null;
  }

  const options = use(optionsPromise);

  return <VoucherModalForm {...props} options={options} />;
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
    <VoucherModalShell
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      type={type}
      mode={mode}
      titleOverride={titleOverride}
      descriptionOverride={descriptionOverride}
      sidePanel={sidePanel}
    >
      {isLoadingDetail ? (
        <VoucherModalLoadingState
          title="Cargando comprobante"
          description="Estamos trayendo la información para editarla."
        />
      ) : (
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
      )}
    </VoucherModalShell>
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
    <VoucherModalShell
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      type={type}
      mode={mode}
      titleOverride={titleOverride}
      descriptionOverride={descriptionOverride}
      sidePanel={sidePanel}
    >
      {isLoadingDetail ? (
        <VoucherModalLoadingState
          title="Cargando comprobante"
          description="Estamos trayendo la información para editarla."
        />
      ) : (
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
      )}
    </VoucherModalShell>
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
    <VoucherModalShell isOpen={isOpen} onOpenChange={onOpenChange} type={type} mode={mode}>
      <VoucherModalLoadingState title={title} description={description} />
    </VoucherModalShell>
  );
}
