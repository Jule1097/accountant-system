import { ParserBatchQueueJob } from "src/types/parser-batch";

const parserQueueKey = "voucher-parser:jobs";

export function getParserQueueKey(): string {
  return parserQueueKey;
}

export function serializeParserQueueJob(job: ParserBatchQueueJob): string {
  return JSON.stringify(job);
}

export function deserializeParserQueueJob(value: string | null): ParserBatchQueueJob | null {
  if (!value) {
    return null;
  }

  const parsedValue = JSON.parse(value) as Partial<ParserBatchQueueJob>;

  if (!parsedValue.batchId || !parsedValue.itemId) {
    return null;
  }

  return {
    batchId: parsedValue.batchId,
    itemId: parsedValue.itemId,
  };
}
