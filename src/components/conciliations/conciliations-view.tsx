"use client";

import { ConciliationSection } from "src/components/conciliations/conciliation-section";
import { ConciliationTabs } from "src/components/conciliations/conciliation-tabs";
import { ConciliationsContentState } from "src/components/conciliations/conciliations-content-state";
import { ConciliationsOverlays } from "src/components/conciliations/conciliations-overlays";
import { ConciliationsPagination } from "src/components/conciliations/conciliations-pagination";
import { ConciliationsToolbar } from "src/components/conciliations/conciliations-toolbar";
import { useConciliations } from "src/hooks/conciliation/use-conciliations";
import type { ConciliationSectionData } from "src/types/conciliation/conciliations";

export function ConciliationsView() {
  const {
    activeTab,
    currentPage,
    totalPages,
    readyCount,
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
    handleDelete,
    confirmDeleteDialog,
    getSectionSelectionState,
    handlePersistSection,
    handleDeleteSection,
    isVoucherSelected,
  } = useConciliations();

  return (
    <div className="flex-1 space-y-6">
      <ConciliationsToolbar />
      <ConciliationTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <ConciliationsContentState isLoading={isPageLoading} sections={sections}>
        {sections.map((section: ConciliationSectionData) => (
          <ConciliationSection
            key={section.key}
            section={section}
            selection={getSectionSelectionState(section)}
            loadingVouchers={loadingVouchers}
            isVoucherSelected={isVoucherSelected}
            onToggleVisibleSelection={handleToggleVisibleSelection}
            onToggleItemSelection={handleToggleItemSelection}
            onReview={handleReview}
            onRegenerate={handleRegenerate}
            onPersist={handlePersist}
            onDelete={handleDelete}
            onPersistSelected={() => handlePersistSection(section)}
            onDeleteSelected={() => handleDeleteSection(section)}
          />
        ))}
      </ConciliationsContentState>
      <ConciliationsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={readyCount}
        startIndex={startIndex}
        onPageChange={handlePageChange}
      />
      <ConciliationsOverlays
        activeTab={activeTab}
        isReviewModalOpen={isReviewModalOpen}
        reviewItem={reviewItem}
        isReviewItemLoading={isReviewItemLoading}
        reviewSourceUrl={reviewSourceUrl}
        onReviewModalOpenChange={handleReviewModalOpenChange}
        onReviewSubmit={handleReviewSubmit}
        deleteDialogState={deleteDialogState}
        isDeleting={isDeleting}
        onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
        onConfirmDelete={confirmDeleteDialog}
      />
    </div>
  );
}
