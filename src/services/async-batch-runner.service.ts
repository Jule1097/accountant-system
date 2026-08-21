import { getWorkflowDriver, validateWorkflowDriverConfiguration } from "src/lib/helpers/async-batch-runner";
import { AsyncBatchRunner } from "src/types/async-batch-runner";
import { GcpAsyncBatchRunnerService } from "src/services/gcp-async-batch-runner.service";
import { LocalAsyncBatchRunnerService } from "src/services/local-async-batch-runner.service";

function createAsyncBatchRunner(): AsyncBatchRunner {
  validateWorkflowDriverConfiguration();

  if (getWorkflowDriver() === "gcp") {
    return new GcpAsyncBatchRunnerService();
  }

  return new LocalAsyncBatchRunnerService();
}

export class AsyncBatchRunnerService implements AsyncBatchRunner {
  private readonly runner: AsyncBatchRunner;

  constructor() {
    this.runner = createAsyncBatchRunner();
  }

  async triggerParserBatch(batchId: string): Promise<void> {
    await this.runner.triggerParserBatch(batchId);
  }

  async triggerPersistenceBatch(batchId: string): Promise<void> {
    await this.runner.triggerPersistenceBatch(batchId);
  }
}
