import { GcpCloudRunRepository } from "src/repositories/gcp-cloud-run.repository";
import { AsyncBatchRunner } from "src/types/async-batch-runner";

export class GcpAsyncBatchRunnerService implements AsyncBatchRunner {
  private readonly cloudRunRepository: GcpCloudRunRepository;

  constructor() {
    this.cloudRunRepository = new GcpCloudRunRepository();
  }

  async triggerParserBatch(batchId: string): Promise<void> {
    await this.cloudRunRepository.runBatchJob("parser", batchId);
  }

  async triggerPersistenceBatch(batchId: string): Promise<void> {
    await this.cloudRunRepository.runBatchJob("persistence", batchId);
  }
}
