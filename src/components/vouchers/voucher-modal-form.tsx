"use client";

import { useState } from "react";
import { Button } from "src/components/ui/button";
import { ClientSupplierModal } from "src/components/third-party/third-party-modal";
import { ConciliationReviewPreview } from "src/components/conciliations/conciliation-review-preview";
import { VoucherModalActions } from "src/components/vouchers/voucher-modal-actions";
import { VoucherModalCoreFields } from "src/components/vouchers/voucher-modal-core-fields";
import { VoucherModalDropzone } from "src/components/vouchers/voucher-modal-dropzone";
import { VoucherModalTaxSections } from "src/components/vouchers/voucher-modal-tax-sections";
import { resolveClientSupplierAddButtonLabel } from "src/lib/helpers/third-party/third-party-ui";
import { useVoucherForm } from "src/hooks/voucher/use-voucher-form";
import type { UseVoucherFormProps } from "src/hooks/voucher/use-voucher-form";
import { useVoucherInlineThirdParty } from "src/hooks/voucher/use-voucher-inline-third-party";
import type { VoucherFormOptionsData } from "src/hooks/voucher/use-voucher-form-options";
import type { VoucherModalMode } from "src/types/voucher/voucher";

export interface VoucherModalFormProps extends Omit<UseVoucherFormProps, "catalogs" | "thirdParties"> {
  options: VoucherFormOptionsData;
}

function resolvePrimaryButtonLabel(
  mode: VoucherModalMode,
  isProcessing: boolean,
  submitButtonLabel?: string,
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

export function VoucherModalForm({
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
  const [thirdParties, setThirdParties] = useState(options.thirdParties);
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
    handleOpenChange,
    handlePosBlur,
    handleNumberBlur,
    previewDocument,
    currentParsedData,
  } = useVoucherForm({
    isOpen,
    onOpenChange,
    type,
    mode,
    catalogs: options.catalogs,
    thirdParties,
    initialVoucher,
    initialParsedData,
    resetKey,
    submitAction,
    submitButtonLabel,
    onSuccess,
  });
  const {
    isInlineModalOpen,
    inlineModalType,
    inlineInitialValues,
    shouldShowInlineAction,
    openInlineModal,
    handleInlineModalOpenChange,
    handleInlineSuccess,
    resolveDuplicateRecord,
  } = useVoucherInlineThirdParty({
    type,
    form,
    parsedData: currentParsedData,
    thirdParties,
    setThirdParties,
  });
  const {
    handleSubmit,
    formState: { isValid },
  } = form;
  const isEditing = mode === "edit";
  const isViewing = mode === "view";
  const shouldShowDropzone = !isEditing && !isViewing && !initialParsedData && !submitAction;
  const primaryButtonLabel = resolvePrimaryButtonLabel(mode, isProcessing, submitButtonLabel);
  const thirdPartyAction = !shouldShowInlineAction || isViewing ? null : (
    <Button type="button" variant="outline" className="w-full" onClick={openInlineModal}>
      {resolveClientSupplierAddButtonLabel(inlineModalType)}
    </Button>
  );
  const taxSections = (
    <VoucherModalTaxSections
      form={form}
      type={type}
      catalogs={options.catalogs}
      retentionFields={retentionFields}
      appendRetention={appendRetention}
      removeRetention={removeRetention}
      perceptionFields={perceptionFields}
      appendPerception={appendPerception}
      removePerception={removePerception}
      disabled={isProcessing || isViewing}
    />
  );
  const fields = (
    <VoucherModalCoreFields
      form={form}
      isProcessing={isProcessing}
      catalogs={options.catalogs}
      thirdParties={thirdParties}
      type={type}
      mode={mode}
      initialVoucher={initialVoucher}
      handlePosBlur={handlePosBlur}
      handleNumberBlur={handleNumberBlur}
      thirdPartyAction={thirdPartyAction}
      taxListsNode={taxSections}
    />
  );
  const actions = (
    <VoucherModalActions
      mode={mode}
      isProcessing={isProcessing}
      isValid={isValid}
      primaryButtonLabel={primaryButtonLabel}
      onClose={() => handleOpenChange(false)}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
      {shouldShowDropzone ? (
        <VoucherModalDropzone
          isProcessing={isProcessing}
          fileInputRef={fileInputRef}
          onFileChange={onFileChange}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          onDropzoneClick={onDropzoneClick}
        />
      ) : null}
      {previewDocument ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)]">
          <div className="grid min-w-0 gap-4">
            {fields}
            {actions}
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
          {fields}
          {actions}
        </>
      )}
      <ClientSupplierModal
        isOpen={isInlineModalOpen}
        type={inlineModalType}
        mode="create"
        initialValues={inlineInitialValues}
        onOpenChange={handleInlineModalOpenChange}
        onSuccess={handleInlineSuccess}
        onResolveDuplicate={resolveDuplicateRecord}
      />
    </form>
  );
}
