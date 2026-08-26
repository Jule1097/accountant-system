import { CompanyRepository } from "src/repositories/company/company.repository";
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { CatalogRepository } from "src/repositories/catalog/catalog.repository";
import { ClientRepository } from "src/repositories/client-supplier/client.repository";
import { SupplierRepository } from "src/repositories/client-supplier/supplier.repository";
import { VoucherParserService } from "src/services/parser/voucher-parser.service";
import { ParserStorageService } from "src/services/parser/parser-storage.service";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { ParserAcceptedFile } from "src/lib/helpers/parser/parser-file";
import { parseInvoiceImage } from "src/lib/integrations/gemini";

jest.mock("src/repositories/company/company.repository");
jest.mock("src/repositories/parser/parser-batch.repository");
jest.mock("src/repositories/catalog/catalog.repository");
jest.mock("src/repositories/client-supplier/client.repository");
jest.mock("src/repositories/client-supplier/supplier.repository");
jest.mock("src/services/parser/parser-storage.service");
jest.mock("src/lib/integrations/gemini");

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
    (CatalogRepository as jest.MockedClass<typeof CatalogRepository>).prototype.getVatRates = jest.fn().mockResolvedValue([]);
    (CatalogRepository as jest.MockedClass<typeof CatalogRepository>).prototype.getRetentionConcepts = jest.fn().mockResolvedValue([]);
    (CatalogRepository as jest.MockedClass<typeof CatalogRepository>).prototype.getPerceptionConcepts = jest.fn().mockResolvedValue([]);
    (CatalogRepository as jest.MockedClass<typeof CatalogRepository>).prototype.getTaxJurisdictions = jest.fn().mockResolvedValue([]);
    (ClientRepository as jest.MockedClass<typeof ClientRepository>).prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null);
    (SupplierRepository as jest.MockedClass<typeof SupplierRepository>).prototype.findByCuitAndCompany = jest.fn().mockResolvedValue(null);
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

  it("normalizes FCE voucher data while processing batch items", async () => {
    batchRepositoryMock.findItemById
      .mockResolvedValueOnce({
        id: itemId,
        batchId,
        fileName: "invoice.pdf",
        mimeType: "image/png",
        fileSize: 1000,
        fileHash: "hash-1",
        storagePath: "path",
        inputStrategy: null,
        status: "queued",
        parsedPayload: null,
        validatedPayload: null,
        currentError: null,
        currentAttempt: 0,
        queuedAt: null,
        processedAt: null,
        expiresAt: "2026-08-30T00:00:00.000Z",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
        batch: {
          id: batchId,
          companyId,
          createdByUserId: userId,
          voucherType: "sale",
          status: "queued",
          expiresAt: "2026-08-30T00:00:00.000Z",
        },
      })
      .mockResolvedValueOnce({
        id: itemId,
        batchId,
        fileName: "invoice.pdf",
        mimeType: "image/png",
        fileSize: 1000,
        fileHash: "hash-1",
        storagePath: "path",
        inputStrategy: "image-visual",
        status: "parsed",
        parsedPayload: null,
        validatedPayload: null,
        currentError: null,
        currentAttempt: 1,
        queuedAt: null,
        processedAt: "2026-08-20T00:00:00.000Z",
        expiresAt: "2026-08-30T00:00:00.000Z",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
        batch: {
          id: batchId,
          companyId,
          createdByUserId: userId,
          voucherType: "sale",
          status: "partial",
          expiresAt: "2026-08-30T00:00:00.000Z",
        },
      });
    storageServiceMock.downloadFile.mockResolvedValue(Buffer.from("content"));
    (parseInvoiceImage as jest.Mock).mockResolvedValue({
      voucherType: "Factura de Crédito Electrónica MiPyME (FCE)",
      voucherLetter: "Letra A",
      posNumber: "1",
      number: "123",
    });

    await service.processItem(itemId);

    expect(batchRepositoryMock.markItemParsed).toHaveBeenCalledWith(
      itemId,
      expect.objectContaining({
        voucherType: "Factura de Crédito Electrónica MiPyME (FCE)",
        voucherLetter: "A",
      }),
      "image-visual",
    );
  });
});
