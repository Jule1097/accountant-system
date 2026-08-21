import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { BatchExecutionLockService } from "src/services/batch-execution-lock.service";
import { VoucherBatchExecutionService } from "src/services/voucher-batch-execution.service";
import { VoucherParserService } from "src/services/voucher-parser.service";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";

jest.mock("src/repositories/parser-batch.repository");
jest.mock("src/services/batch-execution-lock.service");
jest.mock("src/services/voucher-parser.service");
jest.mock("src/services/voucher-persistence.service");

describe("VoucherBatchExecutionService", () => {
  let batchRepositoryMock: jest.Mocked<ParserBatchRepository>;
  let lockServiceMock: jest.Mocked<BatchExecutionLockService>;
  let parserServiceMock: jest.Mocked<VoucherParserService>;
  let persistenceServiceMock: jest.Mocked<VoucherPersistenceService>;

  beforeEach(() => {
    jest.clearAllMocks();
    batchRepositoryMock = {
      listItemIdsByBatchAndStatuses: jest.fn(),
    } as unknown as jest.Mocked<ParserBatchRepository>;
    lockServiceMock = {
      acquire: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<BatchExecutionLockService>;
    parserServiceMock = {
      processItem: jest.fn(),
    } as unknown as jest.Mocked<VoucherParserService>;
    persistenceServiceMock = {
      processJob: jest.fn(),
    } as unknown as jest.Mocked<VoucherPersistenceService>;

    (ParserBatchRepository as jest.MockedClass<typeof ParserBatchRepository>).mockImplementation(() => batchRepositoryMock);
    (BatchExecutionLockService as jest.MockedClass<typeof BatchExecutionLockService>).mockImplementation(() => lockServiceMock);
    (VoucherParserService as jest.MockedClass<typeof VoucherParserService>).mockImplementation(() => parserServiceMock);
    (VoucherPersistenceService as jest.MockedClass<typeof VoucherPersistenceService>).mockImplementation(() => persistenceServiceMock);
  });

  it("skips parser execution when the batch lock cannot be acquired", async () => {
    const service = new VoucherBatchExecutionService();

    lockServiceMock.acquire.mockResolvedValue(null);

    await service.runParserBatch("batch-1");

    expect(batchRepositoryMock.listItemIdsByBatchAndStatuses).not.toHaveBeenCalled();
    expect(parserServiceMock.processItem).not.toHaveBeenCalled();
  });

  it("processes parser batch items sequentially when the lock is acquired", async () => {
    const service = new VoucherBatchExecutionService();

    lockServiceMock.acquire.mockResolvedValue("lock-token");
    lockServiceMock.release.mockResolvedValue();
    batchRepositoryMock.listItemIdsByBatchAndStatuses.mockResolvedValue(["item-1", "item-2"]);
    parserServiceMock.processItem.mockResolvedValue();

    await service.runParserBatch("batch-1");

    expect(batchRepositoryMock.listItemIdsByBatchAndStatuses).toHaveBeenCalledWith("batch-1", ["queued", "processing"]);
    expect(parserServiceMock.processItem).toHaveBeenNthCalledWith(1, "item-1");
    expect(parserServiceMock.processItem).toHaveBeenNthCalledWith(2, "item-2");
    expect(lockServiceMock.release).toHaveBeenCalledWith("parser", "batch-1", "lock-token");
  });

  it("processes persistence batch items sequentially when the lock is acquired", async () => {
    const service = new VoucherBatchExecutionService();

    lockServiceMock.acquire.mockResolvedValue("lock-token");
    lockServiceMock.release.mockResolvedValue();
    batchRepositoryMock.listItemIdsByBatchAndStatuses.mockResolvedValue(["item-1"]);
    persistenceServiceMock.processJob.mockResolvedValue();

    await service.runPersistenceBatch("batch-1");

    expect(batchRepositoryMock.listItemIdsByBatchAndStatuses).toHaveBeenCalledWith("batch-1", ["persisting"]);
    expect(persistenceServiceMock.processJob).toHaveBeenCalledWith({ batchId: "batch-1", itemId: "item-1" });
    expect(lockServiceMock.release).toHaveBeenCalledWith("persistence", "batch-1", "lock-token");
  });
});
