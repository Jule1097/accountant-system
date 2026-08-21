import { VoucherBatchExecutionService } from "src/services/voucher-batch-execution.service";
import { AsyncBatchRunner, AsyncBatchWorkloadKind } from "src/types/async-batch-runner";

export class LocalAsyncBatchRunnerService implements AsyncBatchRunner {
  private readonly batchExecutionService: VoucherBatchExecutionService;

  constructor() {
    this.batchExecutionService = new VoucherBatchExecutionService();
  }

  private schedule(workload: AsyncBatchWorkloadKind, batchId: string): void {
    console.info("Scheduled local batch execution", {
      operation: "schedule-local-batch-execution",
      workflowState: "scheduled",
      providerName: "local",
      workload,
      batchId,
    });

    setTimeout(() => {
      const execution = workload === "parser"
        ? this.batchExecutionService.runParserBatch(batchId)
        : this.batchExecutionService.runPersistenceBatch(batchId);

      void execution.catch((error: unknown) => {
        console.error("Local batch execution failed", {
          operation: "local-batch-execution",
          workflowState: "failed",
          providerName: "local",
          workload,
          batchId,
          errorMessage: error instanceof Error ? error.message : "Unknown batch execution error",
        });
      });
    }, 0);
  }

  async triggerParserBatch(batchId: string): Promise<void> {
    this.schedule("parser", batchId);
  }

  async triggerPersistenceBatch(batchId: string): Promise<void> {
    this.schedule("persistence", batchId);
  }
}
