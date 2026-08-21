import "src/lib/helpers/load-env";
import { parseBatchIdArg } from "src/lib/helpers/async-batch-runner";
import { VoucherBatchExecutionService } from "src/services/voucher-batch-execution.service";

async function run(): Promise<void> {
  const batchId = parseBatchIdArg(process.argv.slice(2));
  const batchExecutionService = new VoucherBatchExecutionService();
  console.info("Started persistence batch job", {
    operation: "persistence-batch-job",
    workflowState: "started",
    providerName: "job-runtime",
    batchId,
  });
  await batchExecutionService.runPersistenceBatch(batchId);
  console.info("Completed persistence batch job", {
    operation: "persistence-batch-job",
    workflowState: "completed",
    providerName: "job-runtime",
    batchId,
  });
}

void run();
