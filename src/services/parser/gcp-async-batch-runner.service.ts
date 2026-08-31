import { GcpCloudRunRepository } from "src/repositories/parser/gcp-cloud-run.repository";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";

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
