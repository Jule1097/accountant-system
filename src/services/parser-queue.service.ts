import redis from "src/lib/redis";
import {
  deserializeParserQueueJob,
  getParserQueueKey,
  serializeParserQueueJob,
} from "src/lib/helpers/parser-queue";
import { ParserBatchQueueJob } from "src/types/parser-batch";

export class ParserQueueService {
  async enqueue(job: ParserBatchQueueJob): Promise<void> {
    await redis.rpush(getParserQueueKey(), serializeParserQueueJob(job));
  }

  async dequeue(): Promise<ParserBatchQueueJob | null> {
    const value = await redis.lpop<string>(getParserQueueKey());
    return deserializeParserQueueJob(value || null);
  }
}
