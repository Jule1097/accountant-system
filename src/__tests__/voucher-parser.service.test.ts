import { CompanyRepository } from "src/repositories/company.repository";
import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { VoucherParserService } from "src/services/voucher-parser.service";
import { ParserStorageService } from "src/services/parser-storage.service";
import { AsyncBatchRunner } from "src/types/async-batch-runner";
import { ParserAcceptedFile } from "src/lib/helpers/parser-file";

jest.mock("src/repositories/company.repository");
jest.mock("src/repositories/parser-batch.repository");
jest.mock("src/services/parser-storage.service");

const companyId = "123e4567-e89b-12d3-a456-426614174001";
const userId = "123e4567-e89b-12d3-a456-426614174002";
const batchId = "123e4567-e89b-12d3-a456-426614174003";
const itemId = "123e4567-e89b-12d3-a456-426614174004";

function createAcceptedFile(): ParserAcceptedFile {
  return {
    fileName: "invoice.pdf",
    mimeType: "application/pdf",
    fileSize: 1000,
    fileHash: "hash-1",
    buffer: Buffer.from("content"),
  };
}

describe("VoucherParserService", () => {
  let service: VoucherParserService;
  let asyncBatchRunnerMock: jest.Mocked<AsyncBatchRunner>;
  let batchRepositoryMock: jest.Mocked<ParserBatchRepository>;
  let storageServiceMock: jest.Mocked<ParserStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    asyncBatchRunnerMock = {
      triggerParserBatch: jest.fn(),
      triggerPersistenceBatch: jest.fn(),
    };
    service = new VoucherParserService(asyncBatchRunnerMock);
    batchRepositoryMock = new ParserBatchRepository() as jest.Mocked<ParserBatchRepository>;
    storageServiceMock = new ParserStorageService() as jest.Mocked<ParserStorageService>;

    (service as unknown as { batchRepository: ParserBatchRepository }).batchRepository = batchRepositoryMock;
    (service as unknown as { storageService: ParserStorageService }).storageService = storageServiceMock;

    (CompanyRepository as jest.MockedClass<typeof CompanyRepository>).prototype.findById = jest.fn().mockResolvedValue({
      id: companyId,
      cuit: "30-11111111-9",
    });
  });

  it("triggers parser batch execution after creating the batch", async () => {
    const file = createAcceptedFile();

    storageServiceMock.uploadFile.mockResolvedValue();
    batchRepositoryMock.createBatchWithItems.mockResolvedValue({
      id: batchId,
      companyId,
      createdByUserId: userId,
      voucherType: "sale",
      status: "queued",
      totalFiles: 1,
      expiresAt: "2026-08-21T00:00:00.000Z",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      items: [],
    });

    const response = await service.createBatch(companyId, userId, "sale", [file]);

    expect(response.mode).toBe("batch");
    expect(asyncBatchRunnerMock.triggerParserBatch).toHaveBeenCalledWith(batchId);
  });

  it("retries the whole batch when a parser item is requeued", async () => {
    batchRepositoryMock.findItemById.mockResolvedValue({
      id: itemId,
      batchId,
      fileName: "invoice.pdf",
      mimeType: "application/pdf",
      fileSize: 1000,
      fileHash: "hash-1",
      storagePath: "path",
      inputStrategy: "pdf-text",
      status: "failed",
      parsedPayload: null,
      validatedPayload: null,
      currentError: "error",
      currentAttempt: 1,
      queuedAt: null,
      processedAt: null,
      expiresAt: "2026-08-21T00:00:00.000Z",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      batch: {
        id: batchId,
        companyId,
        createdByUserId: userId,
        voucherType: "sale",
        status: "partial",
        expiresAt: "2026-08-21T00:00:00.000Z",
      },
    });
    batchRepositoryMock.requeueItem.mockResolvedValue({
      id: itemId,
      batchId,
      fileName: "invoice.pdf",
      mimeType: "application/pdf",
      fileSize: 1000,
      fileHash: "hash-1",
      storagePath: "path",
      inputStrategy: "pdf-text",
      status: "queued",
      parsedPayload: null,
      validatedPayload: null,
      currentError: null,
      currentAttempt: 1,
      queuedAt: null,
      processedAt: null,
      expiresAt: "2026-08-21T00:00:00.000Z",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      batch: {
        id: batchId,
        companyId,
        createdByUserId: userId,
        voucherType: "sale",
        status: "queued",
        expiresAt: "2026-08-21T00:00:00.000Z",
      },
    });

    await service.retryItem(companyId, itemId);

    expect(asyncBatchRunnerMock.triggerParserBatch).toHaveBeenCalledWith(batchId);
  });
});
