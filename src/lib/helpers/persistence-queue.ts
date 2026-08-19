import { ParserBatchPersistenceJob } from "src/types/parser-batch";

const persistenceQueueKey = "voucher-persistence:jobs";

export function getPersistenceQueueKey(): string {
  return persistenceQueueKey;
}

export function serializePersistenceQueueJob(job: ParserBatchPersistenceJob): string {
  return JSON.stringify(job);
}

function isPersistenceQueueJob(value: unknown): value is ParserBatchPersistenceJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ParserBatchPersistenceJob>;
  return typeof candidate.batchId === "string" && typeof candidate.itemId === "string";
}

export function deserializePersistenceQueueJob(value: unknown): ParserBatchPersistenceJob | null {
  if (!value) {
    return null;
  }

  if (isPersistenceQueueJob(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsedValue = JSON.parse(value) as unknown;

  if (!isPersistenceQueueJob(parsedValue)) {
    return null;
  }

  return parsedValue;
}
