import { GcpCloudRunRepository } from "src/repositories/parser/gcp-cloud-run.repository";
import { LocalAsyncBatchRunnerService } from "src/services/parser/LocalAsyncBatchRunner";
import { ParserStorageService } from "src/services/parser/ParserStorage";
import { VoucherBatchExecutionService } from "src/services/parser/VoucherBatchExecution";
import { createSupabaseAdminClient } from "src/lib/integrations/supabase-server";
import { logBatchWorkerFailure } from "src/lib/helpers/parser/batch-worker";

jest.mock("src/lib/helpers/parser/async-batch-runner", () => ({
  buildGcpJobRunUrl: jest.fn().mockReturnValue("https://run.googleapis.com/v2/projects/project-id/locations/us-central1/jobs/parser-job:run"),
  getGcpWorkflowConfig: jest.fn().mockReturnValue({
    projectId: "project-id",
    region: "us-central1",
    parserJobName: "parser-job",
    persistenceJobName: "persistence-job",
  }),
}));

jest.mock("src/lib/helpers/parser/gcp-workflow-auth", () => ({
  getGcpWorkflowAccessToken: jest.fn().mockResolvedValue("access-token"),
}));

jest.mock("src/services/parser/VoucherBatchExecution");

jest.mock("src/lib/integrations/supabase-server", () => ({
  createSupabaseAdminClient: jest.fn(),
}));

describe("error disclosure security boundary", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("does not propagate external provider response bodies in GCP errors", async () => {
    const secret = "service-account-token-database-password";
    global.fetch = jest.fn().mockResolvedValue(new Response(secret, { status: 500 }));

    const error = await new GcpCloudRunRepository().runBatchJob("parser", "batch-1").catch((value: unknown) => value);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Failed to trigger GCP parser job: 500");
    expect((error as Error).message).not.toContain(secret);
  });

  it("does not write raw asynchronous execution errors to logs", async () => {
    const secret = "gemini-api-key-user-email@example.com";
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    jest.useFakeTimers();
    const batchExecutionServiceMock = new VoucherBatchExecutionService() as jest.Mocked<VoucherBatchExecutionService>;
    batchExecutionServiceMock.runParserBatch = jest.fn().mockRejectedValue(new Error(secret));
    (VoucherBatchExecutionService as jest.MockedClass<typeof VoucherBatchExecutionService>).mockImplementation(() => batchExecutionServiceMock);

    const service = new LocalAsyncBatchRunnerService();
    await service.triggerParserBatch("batch-1");
    jest.runAllTimers();
    await Promise.resolve();

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(secret);
  });

  it("does not propagate raw storage provider errors", async () => {
    const secret = "storage-token-private-path";
    const upload = jest.fn().mockResolvedValue({ error: { message: secret } });
    const from = jest.fn().mockReturnValue({ upload });
    jest.mocked(createSupabaseAdminClient).mockReturnValue({ storage: { from } } as never);

    const error = await new ParserStorageService().uploadFile("safe/path.pdf", Buffer.from("pdf"), "application/pdf").catch((value: unknown) => value);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Parser storage operation failed");
    expect((error as Error).message).not.toContain(secret);
  });

  it("does not write raw worker failures to logs", () => {
    const secret = "private-key-database-password";
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    logBatchWorkerFailure(new Error(secret), {
      operation: "run-parser-batch-job",
      workflowState: "failed",
      providerName: "gcp",
      batchId: "batch-1",
    });

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(secret);
  });
});
