import type { ParserBatchItemContextRecord } from "src/types/parser/parser-batch"
import type { VoucherFormPayload } from "src/types/voucher/voucher-form"

export type ConciliationTab = "sales" | "purchases";

export type ConciliationVisibleStatus =
  | "Procesando"
  | "Lista"
  | "Validada"
  | "Duplicada"
  | "Error";

export type ConciliationSectionKey =
  | "processing"
  | "ready"
  | "validated"
  | "duplicate"
  | "error";

export interface ConciliationItem {
  id: string;
  batchId: string;
  type: ConciliationTab;
  documentId: string;
  date: string | null;
  thirdParty: string | null;
  amount: number | null;
  currency: string | null;
  status: ConciliationVisibleStatus;
  message: string;
  canReview: boolean;
  canRetry: boolean;
  canDiscard: boolean;
}

export interface ConciliationSectionData {
  key: ConciliationSectionKey;
  title: string;
  items: ConciliationItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface ConciliationSectionSelectionState {
  discardableItemIds: string[]
  validatedItemIds: string[]
  failedItemIds: string[]
  selectedDiscardableItemIds: string[]
  selectedValidatedItemIds: string[]
  selectedFailedItemIds: string[]
  allDiscardableSelected: boolean
}

export interface ConciliationSectionProps {
  section: ConciliationSectionData
  selection: ConciliationSectionSelectionState
  loadingVouchers: Record<string, ConciliationItemAction | undefined>
  isVoucherSelected: (itemId: string) => boolean
  onToggleVisibleSelection: (itemIds: string[], checked: boolean) => void
  onToggleItemSelection: (voucher: ConciliationItem, checked: boolean) => void
  onReview: (voucher: ConciliationItem) => void
  onRegenerate: (voucher: ConciliationItem) => void
  onPersist: (voucher: ConciliationItem) => void
  onDelete: (voucher: ConciliationItem) => void
  onPersistSelected: () => void
  onDeleteSelected: () => void
  onRetrySelected: () => void
  isRetryingSelected: boolean
}

export interface ConciliationBulkDiscardPayload {
  itemIds: string[];
}

export interface ConciliationBulkDiscardResponse {
  removedItems: number;
}

export interface ConciliationBulkPersistPayload {
  itemIds: string[];
}

export interface ConciliationBulkPersistResponse {
  queuedItems: number;
}

export interface ConciliationBulkRetryResponse {
  requeuedItems: number;
  affectedBatches: number;
  dispatchRecovered: boolean;
  message: string;
}

export type ConciliationPersistResultStatus = "persisted" | "duplicate" | "failed";

export interface ConciliationPersistResult {
  status: ConciliationPersistResultStatus;
  message: string;
}

export type ConciliationItemAction = "reviewing" | "retrying" | "persisting" | "deleting";

export interface ConciliationsQueryState {
  batchId?: string;
  tab: ConciliationTab;
  page: number;
}

export interface ConciliationsPageData {
  sections: ConciliationSectionData[];
  totalCount: number;
  processingCount: number;
  readyCount: number;
  validatedCount: number;
  totalPages: number;
  currentPage: number;
  startIndex: number;
}

export interface ConciliationPersistBatchActionState {
  itemIds: string[];
  selectedValidatedCount: number;
  canPersist: boolean;
}

export interface ConciliationDeleteDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  mode: "single" | "bulk" | null;
}

export interface ConciliationRetryBatchActionState {
  itemIds: string[];
  selectedFailedCount: number;
  canRetry: boolean;
  isPending: boolean;
}

export interface ConciliationsOverlaysProps {
  activeTab: ConciliationTab
  isReviewModalOpen: boolean
  reviewItem: ParserBatchItemContextRecord | undefined
  isReviewItemLoading: boolean
  reviewSourceUrl: string | null
  onReviewModalOpenChange: (open: boolean) => void
  onReviewSubmit: (payload: VoucherFormPayload) => Promise<void>
  deleteDialogState: ConciliationDeleteDialogState
  isDeleting: boolean
  onDeleteDialogOpenChange: (open: boolean) => void
  onConfirmDelete: () => Promise<void>
}
