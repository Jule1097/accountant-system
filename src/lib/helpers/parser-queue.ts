import { ParserBatchQueueJob } from "src/types/parser-batch";

const parserQueueKey = "voucher-parser:jobs";

export function getParserQueueKey(): string {
  return parserQueueKey;
}

export function serializeParserQueueJob(job: ParserBatchQueueJob): string {
  return JSON.stringify(job);
}

function isParserQueueJob(value: unknown): value is ParserBatchQueueJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ParserBatchQueueJob>;
  return typeof candidate.batchId === "string" && typeof candidate.itemId === "string";
}

export function deserializeParserQueueJob(value: unknown): ParserBatchQueueJob | null {
  if (!value) {
    return null;
  }

  if (isParserQueueJob(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsedValue = JSON.parse(value) as unknown;

  if (!isParserQueueJob(parsedValue)) {
    return null;
  }

  return parsedValue;
}
