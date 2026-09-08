/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { ConciliationsOverlays } from "src/components/conciliations/conciliations-overlays";
import { buildConciliationSectionSelectionState } from "src/lib/helpers/conciliation/conciliations-state";
import type { ConciliationSectionData } from "src/types/conciliation/conciliations";

jest.mock("src/components/conciliations/conciliation-review-modal", () => ({
  ConciliationReviewModal: () => null,
}));

jest.mock("src/components/vouchers/voucher-delete-dialog", () => ({
  VoucherDeleteDialog: ({ onConfirm }: { onConfirm: () => Promise<void> }) => (
    <button type="button" onClick={() => void onConfirm()}>Confirmar eliminación</button>
  ),
}));

const section: ConciliationSectionData = {
  key: "validated",
  title: "Validadas",
  totalCount: 3,
  hasMore: false,
  items: [
    { id: "discardable", batchId: "batch-1", type: "sales", documentId: "A-1", date: null, thirdParty: null, amount: null, currency: null, status: "Validada", message: "", canReview: false, canRetry: false, canDiscard: true },
    { id: "not-discardable", batchId: "batch-1", type: "sales", documentId: "A-2", date: null, thirdParty: null, amount: null, currency: null, status: "Error", message: "", canReview: false, canRetry: true, canDiscard: false },
    { id: "ready", batchId: "batch-1", type: "sales", documentId: "A-3", date: null, thirdParty: null, amount: null, currency: null, status: "Lista", message: "", canReview: true, canRetry: false, canDiscard: true },
  ],
};

describe("conciliation presentation boundaries", () => {
  it("prepares selectable action IDs outside the section component", () => {
    expect(buildConciliationSectionSelectionState(section, ["discardable", "ready"])).toEqual({
      discardableItemIds: ["discardable", "ready"],
      validatedItemIds: ["discardable"],
      selectedDiscardableItemIds: ["discardable", "ready"],
      selectedValidatedItemIds: ["discardable"],
      allDiscardableSelected: true,
    });
  });

  it("forwards one prepared delete callback for bulk overlays", async () => {
    const onConfirmDelete = jest.fn().mockResolvedValue(undefined);
    render(
      <ConciliationsOverlays
        activeTab="sales"
        isReviewModalOpen={false}
        reviewItem={undefined}
        isReviewItemLoading={false}
        reviewSourceUrl={null}
        onReviewModalOpenChange={jest.fn()}
        onReviewSubmit={jest.fn()}
        deleteDialogState={{ isOpen: true, title: "Eliminar facturas", description: "Confirmar", mode: "bulk" }}
        isDeleting={false}
        onDeleteDialogOpenChange={jest.fn()}
        onConfirmDelete={onConfirmDelete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));

    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });
});
