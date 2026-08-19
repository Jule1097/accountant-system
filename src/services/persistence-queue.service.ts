import redis from "src/lib/redis";
import {
  deserializePersistenceQueueJob,
  getPersistenceQueueKey,
  serializePersistenceQueueJob,
} from "src/lib/helpers/persistence-queue";
import { ParserBatchPersistenceJob } from "src/types/parser-batch";

export class PersistenceQueueService {
  async enqueue(job: ParserBatchPersistenceJob): Promise<void> {
    await redis.rpush(getPersistenceQueueKey(), serializePersistenceQueueJob(job));
  }

  async dequeue(): Promise<ParserBatchPersistenceJob | null> {
    const value = await redis.lpop<string>(getPersistenceQueueKey());
    const job = deserializePersistenceQueueJob(value || null);

    return job;
  }
}
