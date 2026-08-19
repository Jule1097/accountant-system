"use client";

import { VoucherModal } from "src/components/vouchers/voucher-modal";
import { ConciliationReviewPreview } from "src/components/conciliations/conciliation-review-preview";
import { ParserBatchItemContextRecord } from "src/types/parser-batch";
import { VoucherFormPayload } from "src/types/voucher-form";
import { VoucherScreenType } from "src/types/voucher";

interface ConciliationReviewModalProps {
  isOpen: boolean;
  type: VoucherScreenType;
  item: ParserBatchItemContextRecord | undefined;
  isLoading: boolean;
  sourceUrl: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: VoucherFormPayload) => Promise<void>;
}

function resolveReviewDescription(type: VoucherScreenType): string {
  if (type === "sales") {
    return "Revisa la factura de venta, comparala con el documento y validala.";
  }

  return "Revisa la factura de compra, comparala con el documento y validala.";
}

export function ConciliationReviewModal({
  isOpen,
  type,
  item,
  isLoading,
  sourceUrl,
  onOpenChange,
  onSubmit,
}: ConciliationReviewModalProps) {
  return (
    <VoucherModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      type={type}
      mode="create"
      initialParsedData={item?.parsedPayload || null}
      isLoadingDetail={isLoading}
      resetKey={item?.id}
      submitAction={onSubmit}
      submitButtonLabel="Validar factura"
      titleOverride="Revisar factura"
      descriptionOverride={resolveReviewDescription(type)}
      sidePanel={
        <ConciliationReviewPreview
          sourceUrl={sourceUrl}
          mimeType={item?.mimeType || null}
          fileName={item?.fileName || null}
        />
      }
    />
  );
}
