import { getWorkflowDriver, parseBatchIdArg, validateWorkflowDriverConfiguration } from "../lib/helpers/async-batch-runner";
import { AsyncBatchRunnerService } from "../../src/services/async-batch-runner.service";
import { GcpAsyncBatchRunnerService } from "../../src/services/gcp-async-batch-runner.service";
import { LocalAsyncBatchRunnerService } from "../../src/services/local-async-batch-runner.service";

jest.mock("../../src/services/gcp-async-batch-runner.service");
jest.mock("../../src/services/local-async-batch-runner.service");

describe("async batch runner configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.WORKFLOW_DRIVER;
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_REGION;
    delete process.env.GCP_PARSER_JOB_NAME;
    delete process.env.GCP_PERSISTENCE_JOB_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("defaults to the local workflow driver", () => {
    expect(getWorkflowDriver()).toBe("local");
  });

  it("requires the GCP workflow configuration when the gcp driver is selected", () => {
    process.env.WORKFLOW_DRIVER = "gcp";

    expect(() => validateWorkflowDriverConfiguration()).toThrow("Missing GCP_PROJECT_ID");
  });

  it("parses the batch id from cli args", () => {
    expect(parseBatchIdArg(["--batch-id", "batch-1"])).toBe("batch-1");
    expect(parseBatchIdArg(["--batch-id=batch-2"])).toBe("batch-2");
  });

  it("routes parser batch execution to the local runner by default", async () => {
    const localRunnerMock = {
      triggerParserBatch: jest.fn(),
      triggerPersistenceBatch: jest.fn(),
    };

    (LocalAsyncBatchRunnerService as jest.MockedClass<typeof LocalAsyncBatchRunnerService>).mockImplementation(
      () => localRunnerMock as never
    );

    const service = new AsyncBatchRunnerService();
    await service.triggerParserBatch("batch-1");

    expect(localRunnerMock.triggerParserBatch).toHaveBeenCalledWith("batch-1");
  });

  it("routes persistence batch execution to the gcp runner when configured", async () => {
    process.env.WORKFLOW_DRIVER = "gcp";
    process.env.GCP_PROJECT_ID = "project-id";
    process.env.GCP_REGION = "us-central1";
    process.env.GCP_PARSER_JOB_NAME = "parser-job";
    process.env.GCP_PERSISTENCE_JOB_NAME = "persistence-job";

    const gcpRunnerMock = {
      triggerParserBatch: jest.fn(),
      triggerPersistenceBatch: jest.fn(),
    };

    (GcpAsyncBatchRunnerService as jest.MockedClass<typeof GcpAsyncBatchRunnerService>).mockImplementation(
      () => gcpRunnerMock as never
    );

    const service = new AsyncBatchRunnerService();
    await service.triggerPersistenceBatch("batch-1");

    expect(gcpRunnerMock.triggerPersistenceBatch).toHaveBeenCalledWith("batch-1");
  });
});
