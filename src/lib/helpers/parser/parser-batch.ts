import {
  ParserBatchItemRecord,
  ParserBatchItemStatus,
  ParserBatchRecord,
  ParserBatchStatus,
} from "src/types/parser/parser-batch";
import { inputLimits } from "src/lib/constants/input-limits";
import { ParsedVoucherData } from "src/types/parser/gemini-parser";

const parserBatchExpirationHours = 24;
const parserBatchMaxFiles = inputLimits.maxParserFiles;

function hasItemsWithStatus(items: ParserBatchItemRecord[], statuses: ParserBatchItemStatus[]): boolean {
  return items.some((item) => statuses.includes(item.status));
}

export function getParserBatchExpirationDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + parserBatchExpirationHours * 60 * 60 * 1000);
}

export function getParserBatchMaxFiles(): number {
  return parserBatchMaxFiles;
}

export function resolveParserBatchStatus(items: ParserBatchItemRecord[]): ParserBatchStatus {
  if (!items.length) {
    return "queued";
  }

  if (hasItemsWithStatus(items, ["expired"])) {
    return "expired";
  }

  if (hasItemsWithStatus(items, ["processing"])) {
    return "processing";
  }

  const hasQueuedItems = hasItemsWithStatus(items, ["queued"]);
  const hasFailedItems = hasItemsWithStatus(items, ["failed"]);
  const hasCompletedItems = hasItemsWithStatus(items, ["parsed", "duplicate", "validated", "persisting", "persisted", "discarded"]);

  if (hasFailedItems && hasCompletedItems) {
    return "partial";
  }

  if (hasFailedItems && hasQueuedItems) {
    return "processing";
  }

  if (hasQueuedItems) {
    return "queued";
  }

  if (hasFailedItems) {
    return "partial";
  }

  return "completed";
}

export function withParserBatchStatus(batch: ParserBatchRecord): ParserBatchRecord {
  return {
    ...batch,
    status: resolveParserBatchStatus(batch.items || []),
  };
}

export function isParserBatchExpired(expiresAt: string, now: Date = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

function hasMeaningfulNumber(value: string | null): boolean {
  return !!value && /[1-9]/.test(value);
}

function hasMeaningfulText(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return !!normalizedValue && normalizedValue !== "null" && normalizedValue !== "sin tercero identificado";
}

function hasMeaningfulTaxItems(items: Array<{ amount: number | null }>): boolean {
  return items.some((item) => typeof item.amount === "number" && item.amount > 0);
}

function hasMeaningfulVatDetails(items: Array<{ subtotal: number | null; vatAmount: number | null }>): boolean {
  return items.some((item) => (typeof item.subtotal === "number" && item.subtotal > 0) || (typeof item.vatAmount === "number" && item.vatAmount > 0));
}

export function hasReviewableParsedPayload(payload: ParsedVoucherData | null): boolean {
  if (!payload) {
    return false;
  }

  return (hasMeaningfulNumber(payload.posNumber) && hasMeaningfulNumber(payload.number))
    || hasMeaningfulText(payload.date)
    || (typeof payload.totalAmount === "number" && payload.totalAmount > 0)
    || hasMeaningfulText(payload.thirdPartyCuit)
    || hasMeaningfulText(payload.thirdPartyName)
    || hasMeaningfulVatDetails(payload.vatDetails)
    || hasMeaningfulTaxItems(payload.retentions)
    || hasMeaningfulTaxItems(payload.perceptions);
}
