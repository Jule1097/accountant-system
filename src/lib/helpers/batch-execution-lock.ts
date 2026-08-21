import { AsyncBatchWorkloadKind } from "src/types/async-batch-runner";

const batchExecutionLockSeconds = 900;

export function getBatchExecutionLockKey(workload: AsyncBatchWorkloadKind, batchId: string): string {
  return `voucher-batch-lock:${workload}:${batchId}`;
}

export function getBatchExecutionLockSeconds(): number {
  return batchExecutionLockSeconds;
}
