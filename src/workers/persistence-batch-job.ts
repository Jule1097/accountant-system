import "src/lib/helpers/platform/load-env";
import { parseBatchIdArg } from "src/lib/helpers/parser/async-batch-runner";
import { VoucherBatchExecutionService } from "src/services/parser/VoucherBatchExecution";

async function run(): Promise<void> {
  const batchId = parseBatchIdArg(process.argv.slice(2));
  const batchExecutionService = new VoucherBatchExecutionService();

  await batchExecutionService.runPersistenceBatch(batchId);
}

void run();
