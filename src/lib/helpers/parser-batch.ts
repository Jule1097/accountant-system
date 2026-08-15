import {
  ParserBatchItemRecord,
  ParserBatchItemStatus,
  ParserBatchRecord,
  ParserBatchStatus,
} from "src/types/parser-batch";

const parserBatchExpirationHours = 24;
const parserBatchMaxFiles = 20;

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
  const hasCompletedItems = hasItemsWithStatus(items, ["parsed", "validated", "discarded"]);

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
