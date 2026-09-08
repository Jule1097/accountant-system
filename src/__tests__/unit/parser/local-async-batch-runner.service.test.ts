import { LocalAsyncBatchRunnerService } from "src/services/parser/LocalAsyncBatchRunner";
import { VoucherBatchExecutionService } from "src/services/parser/VoucherBatchExecution";

jest.mock("src/services/parser/VoucherBatchExecution");

describe("LocalAsyncBatchRunnerService", () => {
  let batchExecutionServiceMock: jest.Mocked<VoucherBatchExecutionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    batchExecutionServiceMock = new VoucherBatchExecutionService() as jest.Mocked<VoucherBatchExecutionService>;
    batchExecutionServiceMock.runParserBatch = jest.fn().mockResolvedValue(undefined);
    batchExecutionServiceMock.runPersistenceBatch = jest.fn().mockResolvedValue(undefined);

    (VoucherBatchExecutionService as jest.MockedClass<typeof VoucherBatchExecutionService>).mockImplementation(
      () => batchExecutionServiceMock
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs parser batches asynchronously after the request returns", async () => {
    const service = new LocalAsyncBatchRunnerService();

    await service.triggerParserBatch("batch-1");
    expect(batchExecutionServiceMock.runParserBatch).not.toHaveBeenCalled();

    jest.runAllTimers();
    await Promise.resolve();

    expect(batchExecutionServiceMock.runParserBatch).toHaveBeenCalledWith("batch-1");
  });

  it("runs persistence batches asynchronously after the request returns", async () => {
    const service = new LocalAsyncBatchRunnerService();

    await service.triggerPersistenceBatch("batch-1");
    expect(batchExecutionServiceMock.runPersistenceBatch).not.toHaveBeenCalled();

    jest.runAllTimers();
    await Promise.resolve();

    expect(batchExecutionServiceMock.runPersistenceBatch).toHaveBeenCalledWith("batch-1");
  });
});
