import { VoucherBatchExecutionService } from "src/services/parser/VoucherBatchExecution";
import { AsyncBatchRunner, AsyncBatchWorkloadKind } from "src/types/parser/async-batch-runner";

export class LocalAsyncBatchRunnerService implements AsyncBatchRunner {
  private readonly batchExecutionService: VoucherBatchExecutionService;

  constructor() {
    this.batchExecutionService = new VoucherBatchExecutionService();
  }

  private schedule(workload: AsyncBatchWorkloadKind, batchId: string): void {

    setTimeout(() => {
      const execution = workload === "parser"
        ? this.batchExecutionService.runParserBatch(batchId)
        : this.batchExecutionService.runPersistenceBatch(batchId);

      void execution.catch(() => {});
    }, 0);
  }

  async triggerParserBatch(batchId: string): Promise<void> {
    this.schedule("parser", batchId);
  }

  async triggerPersistenceBatch(batchId: string): Promise<void> {
    this.schedule("persistence", batchId);
  }
}
