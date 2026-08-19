import { GeminiParserResponse } from "src/types/gemini-parser";
import { VoucherFormPayload } from "src/types/voucher-form";

export type ParserVoucherType = "sale" | "purchase";

export type ParserBatchStatus = "queued" | "processing" | "partial" | "completed" | "expired";

export type ParserBatchItemStatus =
  | "queued"
  | "processing"
  | "parsed"
  | "duplicate"
  | "failed"
  | "expired"
  | "validated"
  | "persisting"
  | "persisted"
  | "discarded";

export type ParserInputStrategy = "pdf-text" | "pdf-visual" | "image-visual";

export interface ParserBatchItemAttemptTrace {
  id: string;
  attemptNumber: number;
  status: ParserBatchItemStatus;
  inputStrategy: ParserInputStrategy | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ParserBatchItemRecord {
  id: string;
  batchId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  storagePath: string;
  inputStrategy: ParserInputStrategy | null;
  status: ParserBatchItemStatus;
  parsedPayload: GeminiParserResponse | null;
  validatedPayload: VoucherFormPayload | null;
  currentError: string | null;
  currentAttempt: number;
  queuedAt: string | null;
  processedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  attempts?: ParserBatchItemAttemptTrace[];
}

export interface ParserBatchRecord {
  id: string;
  companyId: string;
  createdByUserId: string;
  voucherType: ParserVoucherType;
  status: ParserBatchStatus;
  totalFiles: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  items?: ParserBatchItemRecord[];
}

export interface ParserBatchItemContextRecord extends ParserBatchItemRecord {
  batch: Pick<ParserBatchRecord, "id" | "companyId" | "createdByUserId" | "voucherType" | "status" | "expiresAt">;
}

export interface ParserBatchCreateInput {
  id: string;
  companyId: string;
  createdByUserId: string;
  voucherType: ParserVoucherType;
  totalFiles: number;
  expiresAt: Date;
}

export interface ParserBatchItemCreateInput {
  id: string;
  batchId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  storagePath: string;
  expiresAt: Date;
}

export interface ParserBatchQueueJob {
  batchId: string;
  itemId: string;
}

export interface ParserBatchPersistenceJob {
  batchId: string;
  itemId: string;
}

export interface ParserBatchSingleResponse {
  mode: "single";
  data: GeminiParserResponse;
}

export interface ParserBatchAsyncResponse {
  mode: "batch";
  batch: ParserBatchRecord;
}

export type ParserBatchUploadResponse = ParserBatchSingleResponse | ParserBatchAsyncResponse;
