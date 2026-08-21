import { randomUUID } from "node:crypto";
import { getBatchExecutionLockKey, getBatchExecutionLockSeconds } from "src/lib/helpers/batch-execution-lock";
import { getRedisClient } from "src/lib/redis";
import { AsyncBatchWorkloadKind } from "src/types/async-batch-runner";

export class BatchExecutionLockService {
  async acquire(workload: AsyncBatchWorkloadKind, batchId: string): Promise<string | null> {
    const redis = getRedisClient();
    const token = randomUUID();
    const result = await redis.set(
      getBatchExecutionLockKey(workload, batchId),
      token,
      { nx: true, ex: getBatchExecutionLockSeconds() }
    );

    return result ? token : null;
  }

  async release(workload: AsyncBatchWorkloadKind, batchId: string, token: string): Promise<void> {
    const redis = getRedisClient();
    const lockKey = getBatchExecutionLockKey(workload, batchId);
    const currentToken = await redis.get<string>(lockKey);

    if (currentToken !== token) {
      return;
    }

    await redis.del(lockKey);
  }
}
