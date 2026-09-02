import { getWorkflowDriver, validateWorkflowDriverConfiguration } from "src/lib/helpers/parser/async-batch-runner";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { GcpAsyncBatchRunnerService } from "src/services/parser/GcpAsyncBatchRunner";
import { LocalAsyncBatchRunnerService } from "src/services/parser/LocalAsyncBatchRunner";

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
