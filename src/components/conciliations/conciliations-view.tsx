"use client";

import { CheckCircle } from "lucide-react";
import { ConciliationReviewModal } from "src/components/conciliations/conciliation-review-modal";
import { ConciliationSection } from "src/components/conciliations/conciliation-section";
import { ConciliationsPagination } from "src/components/conciliations/conciliations-pagination";
import { ConciliationsToolbar } from "src/components/conciliations/conciliations-toolbar";
import { VoucherDeleteDialog } from "src/components/vouchers/voucher-delete-dialog";
import { useConciliations } from "src/hooks/use-conciliations";
import { ConciliationSectionData } from "src/types/conciliations";

function ConciliationsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
        <div className="h-4 w-32 rounded bg-muted/70" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-xl border border-border/50 bg-card px-4 py-4">
          <div className="space-y-3">
            <div className="h-4 w-40 rounded bg-muted/70" />
            <div className="h-4 w-60 rounded bg-muted/60" />
            <div className="h-3 w-48 rounded bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConciliationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-12 text-center">
      <CheckCircle className="mb-3 h-8 w-8 text-emerald-500" />
      <div className="text-sm font-semibold text-foreground">¡Todo al día!</div>
      <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
        No hay facturas pendientes de conciliación en esta lista.
      </p>
    </div>
  );
}

export function ConciliationsView() {
  const {
    activeTab,
    currentPage,
    totalPages,
    readyCount,
    validatedCount,
    persistBatchAction,
    startIndex,
    isPageLoading,
    isDeleting,
    deleteDialogState,
    sections,
    loadingVouchers,
    isReviewModalOpen,
    reviewItem,
    isReviewItemLoading,
    reviewSourceUrl,
    handleTabChange,
    handlePageChange,
    handleToggleItemSelection,
    handleToggleVisibleSelection,
    handleReview,
    handleReviewModalOpenChange,
    handleDeleteDialogOpenChange,
    handleReviewSubmit,
    handleRegenerate,
    handlePersist,
    handlePersistBatch,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    confirmDeleteSelected,
    isVoucherSelected,
    getSelectedCount,
    areAllSectionItemsSelected,
  } = useConciliations();

  return (
    <div className="flex-1 space-y-6">
      <ConciliationsToolbar
        canPersistBatch={persistBatchAction.canPersist}
        persistLabel={persistBatchAction.selectedValidatedCount > 0
          ? `Guardar validadas (${persistBatchAction.selectedValidatedCount})`
          : `Guardar validadas (${validatedCount})`}
        onPersistBatch={() => {
          void handlePersistBatch();
        }}
      />

      <div className="flex w-full gap-4 border-b border-border/40">
        <button
          type="button"
          onClick={() => handleTabChange("sales")}
          className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === "sales"
            ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Ventas
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("purchases")}
          className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === "purchases"
            ? "text-[#FF5C00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF5C00]"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Compras
        </button>
      </div>

      <div className="space-y-4">
        {isPageLoading ? (
          <ConciliationsLoadingState />
        ) : sections.length === 0 ? (
          <ConciliationsEmptyState />
        ) : (
          sections.map((section: ConciliationSectionData) => (
            <ConciliationSection
              key={section.key}
              section={section}
              loadingVouchers={loadingVouchers}
              getSelectedCount={getSelectedCount}
              areAllSectionItemsSelected={areAllSectionItemsSelected}
              isVoucherSelected={isVoucherSelected}
              onToggleVisibleSelection={handleToggleVisibleSelection}
              onToggleItemSelection={handleToggleItemSelection}
              onReview={handleReview}
              onRegenerate={handleRegenerate}
              onPersist={handlePersist}
              onDelete={handleDelete}
              onDeleteSelected={(itemIds) => {
                void handleDeleteSelected(itemIds);
              }}
            />
          ))
        )}
      </div>

      <ConciliationsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={readyCount}
        startIndex={startIndex}
        onPageChange={handlePageChange}
      />

      <ConciliationReviewModal
        isOpen={isReviewModalOpen}
        type={activeTab}
        item={reviewItem}
        isLoading={isReviewItemLoading}
        sourceUrl={reviewSourceUrl}
        onOpenChange={handleReviewModalOpenChange}
        onSubmit={handleReviewSubmit}
      />

      <VoucherDeleteDialog
        isOpen={deleteDialogState.isOpen}
        voucher={null}
        isDeleting={isDeleting}
        title={deleteDialogState.title}
        description={deleteDialogState.description}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={() => {
          if (deleteDialogState.mode === "bulk") {
            void confirmDeleteSelected();
            return;
          }

          void confirmDelete();
        }}
      />
    </div>
  );
}
