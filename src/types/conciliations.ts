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

export interface ConciliationBulkDiscardPayload {
  itemIds: string[];
}

export interface ConciliationBulkDiscardResponse {
  removedItems: number;
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
  batchId?: string;
  selectedValidatedCount: number;
  canPersist: boolean;
}

export interface ConciliationDeleteDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  mode: "single" | "bulk" | null;
}
