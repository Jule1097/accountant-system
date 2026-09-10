import { isError } from "src/lib/helpers/shared/type-guards";

export interface BatchWorkerFailureContext {
  operation: string;
  workflowState: string;
  providerName: string;
  batchId: string;
}

export function logBatchWorkerFailure(error: unknown, context: BatchWorkerFailureContext): void {
  console.error("Batch job failed", {
    ...context,
    errorName: isError(error) ? error.name : "UnknownError",
  });
}
