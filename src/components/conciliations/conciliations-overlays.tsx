import { ConciliationReviewModal } from "src/components/conciliations/conciliation-review-modal";
import { VoucherDeleteDialog } from "src/components/vouchers/voucher-delete-dialog";
import type { ConciliationsOverlaysProps } from "src/types/conciliation/conciliations";

export function ConciliationsOverlays({
  activeTab,
  isReviewModalOpen,
  reviewItem,
  isReviewItemLoading,
  reviewSourceUrl,
  onReviewModalOpenChange,
  onReviewSubmit,
  deleteDialogState,
  isDeleting,
  onDeleteDialogOpenChange,
  onConfirmDelete,
  isManualRecovery = false,
}: ConciliationsOverlaysProps) {
  return (
    <>
      {isReviewModalOpen ? (
        <ConciliationReviewModal
          isOpen
          type={activeTab}
          item={reviewItem}
          isLoading={isReviewItemLoading}
          sourceUrl={reviewSourceUrl}
          isManualRecovery={isManualRecovery}
          onOpenChange={onReviewModalOpenChange}
          onSubmit={onReviewSubmit}
        />
      ) : null}
      {deleteDialogState.isOpen ? (
        <VoucherDeleteDialog
          isOpen
          voucher={null}
          isDeleting={isDeleting}
          title={deleteDialogState.title}
          description={deleteDialogState.description}
          onOpenChange={onDeleteDialogOpenChange}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </>
  );
}
