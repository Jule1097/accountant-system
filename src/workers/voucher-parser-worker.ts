import { ParserQueueService } from "src/services/parser-queue.service";
import { VoucherParserService } from "src/services/voucher-parser.service";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function run(): Promise<void> {
  const queueService = new ParserQueueService();
  const parserService = new VoucherParserService();

  for (;;) {
    try {
      const job = await queueService.dequeue();

      if (!job) {
        await parserService.cleanupExpiredItems(20);
        await wait(1500);
        continue;
      }

      await parserService.processItem(job.itemId);
    } catch (error: unknown) {
      console.error("Voucher parser worker failed:", error);
      await wait(1500);
    }
  }
}

void run();
