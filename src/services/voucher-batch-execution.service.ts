import { BatchExecutionLockService } from "src/services/batch-execution-lock.service";
import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { VoucherParserService } from "src/services/voucher-parser.service";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";
import { AsyncBatchWorkloadKind } from "src/types/async-batch-runner";
import { ParserBatchItemStatus } from "src/types/parser-batch";

function getBatchExecutionStatuses(workload: AsyncBatchWorkloadKind): ParserBatchItemStatus[] {
  return workload === "parser" ? ["queued", "processing"] : ["persisting"];
}

export class VoucherBatchExecutionService {
  private readonly batchRepository: ParserBatchRepository;
  private readonly lockService: BatchExecutionLockService;
  private readonly parserService: VoucherParserService;
  private readonly persistenceService: VoucherPersistenceService;

  constructor() {
    this.batchRepository = new ParserBatchRepository();
    this.lockService = new BatchExecutionLockService();
    this.parserService = new VoucherParserService(null);
    this.persistenceService = new VoucherPersistenceService(null);
  }

  private async runLockedBatch(workload: AsyncBatchWorkloadKind, batchId: string): Promise<void> {
    const lockToken = await this.lockService.acquire(workload, batchId);

    if (!lockToken) {
      return;
    }

    try {
      const itemIds = await this.batchRepository.listItemIdsByBatchAndStatuses(batchId, getBatchExecutionStatuses(workload));

      for (const itemId of itemIds) {
        if (workload === "parser") {
          await this.parserService.processItem(itemId);
          continue;
        }

        await this.persistenceService.processJob({ batchId, itemId });
      }
    } finally {
      await this.lockService.release(workload, batchId, lockToken);
    }
  }

  async runParserBatch(batchId: string): Promise<void> {
    await this.runLockedBatch("parser", batchId);
  }

  async runPersistenceBatch(batchId: string): Promise<void> {
    await this.runLockedBatch("persistence", batchId);
  }
}
