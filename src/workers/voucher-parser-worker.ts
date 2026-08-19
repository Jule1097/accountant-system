import "src/lib/helpers/load-env";
import { ParserQueueService } from "src/services/parser-queue.service";
import { PersistenceQueueService } from "src/services/persistence-queue.service";
import { VoucherParserService } from "src/services/voucher-parser.service";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function run(): Promise<void> {
  const queueService = new ParserQueueService();
  const persistenceQueueService = new PersistenceQueueService();
  const parserService = new VoucherParserService();
  const persistenceService = new VoucherPersistenceService();

  for (; ;) {
    try {
      const job = await queueService.dequeue();

      if (job) {
        await parserService.processItem(job.itemId);
        continue;
      }

      const persistenceJob = await persistenceQueueService.dequeue();

      if (persistenceJob) {
        await persistenceService.processJob(persistenceJob);
        continue;
      }

      const recoveredItems = await parserService.recoverPendingItems(100);

      if (recoveredItems > 0) {
        continue;
      }

      await parserService.cleanupExpiredItems(20);
      await wait(1500);
    } catch (error: unknown) {
      console.error("Voucher parser worker failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown worker error",
      });
      await wait(1500);
    }
  }
}

void run();
