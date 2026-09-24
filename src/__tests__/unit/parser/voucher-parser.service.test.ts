import { CompanyRepository } from "src/repositories/company/company.repository";
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { CatalogRepository } from "src/repositories/catalog/catalog.repository";
import { ClientRepository } from "src/repositories/third-party/client.repository";
import { SupplierRepository } from "src/repositories/third-party/supplier.repository";
import { VoucherParserService } from "src/services/parser/VoucherParser";
import { ParserStorageService } from "src/services/parser/ParserStorage";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { ParserAcceptedFile } from "src/lib/helpers/parser/parser-file";
import { parseInvoiceImage } from "src/lib/integrations/gemini";
import { ParserBatchItemContextRecord } from "src/types/parser/parser-batch";
import { ApplicationError } from "src/lib/errors/application-error";
import { applicationErrorCodes } from "src/lib/constants/application-error";

jest.mock("src/repositories/company/company.repository");
jest.mock("src/repositories/parser/parser-batch.repository");
jest.mock("src/repositories/catalog/catalog.repository");
jest.mock("src/repositories/third-party/client.repository");
jest.mock("src/repositories/third-party/supplier.repository");
jest.mock("src/services/parser/ParserStorage");
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
    Object.defineProperty(batchRepositoryMock, "requeueFailedItems", { value: jest.fn(), writable: true });
    storageServiceMock.downloadFile = jest.fn();

    Object.defineProperty(service, "batchRepository", { value: batchRepositoryMock, writable: true });
    Object.defineProperty(service, "storageService", { value: storageServiceMock, writable: true });

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
    batchRepositoryMock.requeueFailedItems.mockResolvedValue([{
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
    }]);

    await service.retryItem(companyId, itemId);

    expect(asyncBatchRunnerMock.triggerParserBatch).toHaveBeenCalledWith(batchId);
  });

  it("deduplicates bulk retries and dispatches one workload per affected batch", async () => {
    const secondItemId = "123e4567-e89b-12d3-a456-426614174005";
    batchRepositoryMock.requeueFailedItems.mockResolvedValue([
      { id: itemId, batchId, batch: expect.anything() } as never,
      { id: secondItemId, batchId, batch: expect.anything() } as never,
      { id: "123e4567-e89b-12d3-a456-426614174006", batchId: "123e4567-e89b-12d3-a456-426614174007", batch: expect.anything() } as never,
    ]);

    const response = await service.retryItems(companyId, [itemId, itemId, secondItemId, "123e4567-e89b-12d3-a456-426614174006"]);

    expect(batchRepositoryMock.requeueFailedItems).toHaveBeenCalledWith(companyId, [itemId, secondItemId, "123e4567-e89b-12d3-a456-426614174006"]);
    expect(asyncBatchRunnerMock.triggerParserBatch).toHaveBeenCalledTimes(2);
    expect(asyncBatchRunnerMock.triggerParserBatch).toHaveBeenCalledWith(batchId);
    expect(asyncBatchRunnerMock.triggerParserBatch).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174007");
    expect(response).toEqual(expect.objectContaining({ requeuedItems: 3, affectedBatches: 2, dispatchRecovered: true }));
  });

  it("does not dispatch or partially retry when bulk eligibility validation fails", async () => {
    batchRepositoryMock.requeueFailedItems.mockRejectedValue(new ApplicationError(applicationErrorCodes.conflict, "No se puede regenerar la factura seleccionada."));

    await expect(service.retryItems(companyId, [itemId])).rejects.toMatchObject({ code: applicationErrorCodes.conflict });
    expect(asyncBatchRunnerMock.triggerParserBatch).not.toHaveBeenCalled();
  });

  it("rejects expired items before dispatching a parser workload", async () => {
    batchRepositoryMock.requeueFailedItems.mockRejectedValue(new ApplicationError(applicationErrorCodes.conflict, "La factura no está disponible para regeneración."));

    await expect(service.retryItems(companyId, [itemId])).rejects.toMatchObject({ code: applicationErrorCodes.conflict });
    expect(batchRepositoryMock.requeueFailedItems).toHaveBeenCalledWith(companyId, [itemId]);
    expect(asyncBatchRunnerMock.triggerParserBatch).not.toHaveBeenCalled();
  });

  it("rejects items whose failure did not originate in parser processing", async () => {
    batchRepositoryMock.requeueFailedItems.mockRejectedValue(new ApplicationError(applicationErrorCodes.conflict, "La factura no está disponible para regeneración."));

    await expect(service.retryItems(companyId, [itemId])).rejects.toMatchObject({ code: applicationErrorCodes.conflict });
    expect(asyncBatchRunnerMock.triggerParserBatch).not.toHaveBeenCalled();
  });

  it("returns recovery feedback when a batch workload cannot be dispatched", async () => {
    batchRepositoryMock.requeueFailedItems.mockResolvedValue([
      { id: itemId, batchId, batch: expect.anything() } as never,
    ]);
    asyncBatchRunnerMock.triggerParserBatch.mockRejectedValue(new Error("dispatch failed"));

    const response = await service.retryItems(companyId, [itemId]);

    expect(response).toEqual(expect.objectContaining({ requeuedItems: 1, affectedBatches: 1, dispatchRecovered: false }));
    expect(response.message).toMatch(/reencol/i);
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
        expiresAt: "2026-09-30T00:00:00.000Z",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
        batch: {
          id: batchId,
          companyId,
          createdByUserId: userId,
          voucherType: "sale",
          status: "queued",
          expiresAt: "2026-09-30T00:00:00.000Z",
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
        status: "processing",
        parsedPayload: null,
        validatedPayload: null,
        currentError: null,
        currentAttempt: 1,
        queuedAt: null,
        processedAt: "2026-08-20T00:00:00.000Z",
        expiresAt: "2026-09-30T00:00:00.000Z",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
        batch: {
          id: batchId,
          companyId,
          createdByUserId: userId,
          voucherType: "sale",
          status: "partial",
          expiresAt: "2026-09-30T00:00:00.000Z",
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

  it("stores a generic parser error instead of provider details", async () => {
    const item: ParserBatchItemContextRecord = {
      id: itemId,
      batchId,
      fileName: "invoice.png",
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
      expiresAt: "2026-09-30T00:00:00.000Z",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      batch: {
        id: batchId,
        companyId,
        createdByUserId: userId,
        voucherType: "sale",
        status: "queued",
        expiresAt: "2026-09-30T00:00:00.000Z",
      },
    };
    const secret = "gemini-api-key-user-email@example.com";
    batchRepositoryMock.findItemById.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    storageServiceMock.downloadFile.mockResolvedValue(Buffer.from("content"));
    (parseInvoiceImage as jest.Mock).mockRejectedValue(Object.assign(new Error(secret), { code: 400, status: "INVALID_ARGUMENT" }));

    await service.processItem(itemId);

    expect(batchRepositoryMock.markItemFailed).toHaveBeenCalledWith(itemId, expect.stringMatching(/servicio|regenerar/i), "image-visual", { attemptNumber: 1 }, "temporary_service", 1);
    expect(batchRepositoryMock.markItemFailed.mock.calls.flat()).not.toContain(secret);
  });

  it("stores an actionable preparation failure when the source file cannot be downloaded", async () => {
    const item: ParserBatchItemContextRecord = {
      id: itemId,
      batchId,
      fileName: "invoice.png",
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
      expiresAt: "2026-09-30T00:00:00.000Z",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      batch: {
        id: batchId,
        companyId,
        createdByUserId: userId,
        voucherType: "sale",
        status: "queued",
        expiresAt: "2026-09-30T00:00:00.000Z",
      },
    };
    batchRepositoryMock.findItemById.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    storageServiceMock.downloadFile.mockRejectedValue(new Error("storage secret"));

    await service.processItem(itemId);

    expect(batchRepositoryMock.markItemFailed).toHaveBeenCalledWith(
      itemId,
      expect.stringMatching(/preparar|regenerar/i),
      "image-visual",
      { attemptNumber: 1 },
      "preparation_failed",
      1,
    );
  });

  it("stores insufficient extraction as a parser failure", async () => {
    const item: ParserBatchItemContextRecord = {
      id: itemId,
      batchId,
      fileName: "invoice.png",
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
      expiresAt: "2026-09-30T00:00:00.000Z",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      batch: {
        id: batchId,
        companyId,
        createdByUserId: userId,
        voucherType: "sale",
        status: "queued",
        expiresAt: "2026-09-30T00:00:00.000Z",
      },
    };
    batchRepositoryMock.findItemById.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    storageServiceMock.downloadFile.mockResolvedValue(Buffer.from("content"));
    (parseInvoiceImage as jest.Mock).mockResolvedValue({});
    Object.defineProperty(service, "responseService", { value: { buildResponse: jest.fn().mockResolvedValue({}) }, writable: true });

    await service.processItem(itemId);

    expect(batchRepositoryMock.markItemFailed).toHaveBeenCalledWith(
      itemId,
      expect.stringMatching(/informaci[oó]n suficiente|regenerar/i),
      "image-visual",
      { attemptNumber: 1 },
      "insufficient_extraction",
      1,
    );
  });
});
