import "src/lib/helpers/platform/load-env";
import { parseBatchIdArg } from "src/lib/helpers/parser/async-batch-runner";
import { logBatchWorkerFailure } from "src/lib/helpers/parser/batch-worker";
import { VoucherBatchExecutionService } from "src/services/parser/VoucherBatchExecution";

async function run(): Promise<void> {
  const batchId = parseBatchIdArg(process.argv.slice(2));
  const batchExecutionService = new VoucherBatchExecutionService();

  try {
    await batchExecutionService.runParserBatch(batchId);
  } catch (error: unknown) {
    logBatchWorkerFailure(error, { operation: "run-parser-batch-job", workflowState: "failed", providerName: "gcp", batchId });
    process.exitCode = 1;
  }
}

void run();
