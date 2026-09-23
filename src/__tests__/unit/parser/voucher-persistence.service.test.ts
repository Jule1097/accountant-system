import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { VoucherService } from "src/services/voucher/Voucher";
import { VoucherPersistenceService } from "src/services/parser/VoucherPersistence";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { ParserBatchItemContextRecord } from "src/types/parser/parser-batch";
import { VoucherFormPayload } from "src/types/voucher/voucher-form";
import { ParserStorageService } from "src/services/parser/ParserStorage";
import { applicationErrorCodes } from "src/lib/constants/application-error";
import { ApplicationError } from "src/lib/errors/application-error";
import { apiResponseMessages } from "src/lib/constants/api-response";

jest.mock("src/repositories/parser/parser-batch.repository");
jest.mock("src/services/voucher/Voucher");

const companyId = "123e4567-e89b-12d3-a456-426614174001";
const supplierId = "123e4567-e89b-12d3-a456-426614174002";
const userId = "123e4567-e89b-12d3-a456-426614174003";

const validatedPayload: VoucherFormPayload = {
  type: "purchase",
  voucherTypeId: "123e4567-e89b-12d3-a456-426614174004",
  voucherLetterId: "123e4567-e89b-12d3-a456-426614174005",
  posNumber: "00003",
  number: "00000456",
  clientId: null,
  supplierId,
  date: "2026-08-18",
  currency: "$",
  exchangeRate: 1,
  subtotal: 100,
  vatAmount: 21,
  nonTaxableAmount: 0,
  exemptAmount: 0,
  otherTaxesAmount: 0,
  totalAmount: 121,
  concept: "Honorarios",
  paymentMethod: "Transferencia",
  status: "pending",
  paymentDate: null,
  paidAmount: 0,
  comments: "Observacion",
  createdByUserId: userId,
  retentions: [],
  perceptions: [],
  vatDetails: [],
};

function createPersistingItem(): ParserBatchItemContextRecord {
  return {
    id: "item-1",
    batchId: "batch-1",
    fileName: "voucher.pdf",
    mimeType: "application/pdf",
    fileSize: 1200,
    fileHash: "hash-1",
    storagePath: "company/batch/item/file.pdf",
    inputStrategy: "pdf-text",
    status: "persisting",
    parsedPayload: null,
    validatedPayload,
    currentError: null,
    currentAttempt: 1,
    queuedAt: "2026-08-18T00:00:00.000Z",
    processedAt: "2026-08-18T00:00:00.000Z",
    expiresAt: "2026-08-19T00:00:00.000Z",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z",
    attempts: [],
    batch: {
      id: "batch-1",
      companyId,
      createdByUserId: userId,
      voucherType: "purchase",
      status: "partial",
      expiresAt: "2026-08-19T00:00:00.000Z",
    },
  };
}

describe("VoucherPersistenceService", () => {
  let service: VoucherPersistenceService;
  let batchRepositoryMock: jest.Mocked<ParserBatchRepository>;
  let voucherServiceMock: jest.Mocked<VoucherService>;
  let asyncBatchRunnerMock: jest.Mocked<AsyncBatchRunner>;
  let storageServiceMock: jest.Mocked<ParserStorageService>;
  let deleteItemMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    asyncBatchRunnerMock = {
      triggerParserBatch: jest.fn(),
      triggerPersistenceBatch: jest.fn(),
    };
    service = new VoucherPersistenceService(asyncBatchRunnerMock);
    batchRepositoryMock = new ParserBatchRepository() as jest.Mocked<ParserBatchRepository>;
    voucherServiceMock = new VoucherService() as jest.Mocked<VoucherService>;
    storageServiceMock = Object.create(ParserStorageService.prototype) as jest.Mocked<ParserStorageService>;
    storageServiceMock.deleteFile = jest.fn();
    deleteItemMock = jest.fn();
    Object.defineProperty(batchRepositoryMock, "deleteItem", { value: deleteItemMock, writable: true });

    Object.defineProperty(service, "batchRepository", { value: batchRepositoryMock, writable: true });
    Object.defineProperty(service, "voucherService", { value: voucherServiceMock, writable: true });
    Object.defineProperty(service, "storageService", { value: storageServiceMock, writable: true });
  });

  it("persists the validated purchase payload without losing voucher number or supplier", async () => {
    const item = createPersistingItem();

    batchRepositoryMock.findItemById.mockResolvedValue(item);
    batchRepositoryMock.markItemPersisted.mockResolvedValue();
    voucherServiceMock.createVoucher.mockResolvedValue({} as never);

    await service.processJob({
      batchId: "batch-1",
      itemId: "item-1",
    });

    expect(voucherServiceMock.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId,
        type: "purchase",
        posNumber: "00003",
        number: "00000456",
        clientId: null,
        supplierId,
      }),
    );
    expect(batchRepositoryMock.markItemPersisted).toHaveBeenCalledWith("item-1");
  });

  it("marks the item as failed when the validated payload has a zeroed voucher number", async () => {
    const item = createPersistingItem();

    item.validatedPayload = {
      ...validatedPayload,
      posNumber: "00000",
      number: "00000000",
    };

    batchRepositoryMock.findItemById.mockResolvedValue(item);
    batchRepositoryMock.markItemPersistenceFailed.mockResolvedValue();

    await service.processJob({
      batchId: "batch-1",
      itemId: "item-1",
    });

    expect(voucherServiceMock.createVoucher).not.toHaveBeenCalled();
    expect(batchRepositoryMock.markItemPersistenceFailed).toHaveBeenCalledWith("item-1", apiResponseMessages.conciliation.itemPersistFailed);
  });

  it("restores validated work instead of exposing provider details after a technical failure", async () => {
    const item = createPersistingItem();
    const secret = "database-password-token-user-email@example.com";

    batchRepositoryMock.findItemById.mockResolvedValue(item);
    batchRepositoryMock.restoreItemsToValidated.mockResolvedValue();
    voucherServiceMock.createVoucher.mockRejectedValue(new Error(secret));

    await service.processJob({ batchId: "batch-1", itemId: "item-1" });

    expect(batchRepositoryMock.restoreItemsToValidated).toHaveBeenCalledWith(["item-1"]);
    expect(batchRepositoryMock.restoreItemsToValidated.mock.calls.flat()).not.toContain(secret);
  });

  it("physically removes a losing duplicate item and its temporary source file", async () => {
    const item = createPersistingItem();

    batchRepositoryMock.findItemById.mockResolvedValue(item);
    voucherServiceMock.createVoucher.mockRejectedValue(new ApplicationError(applicationErrorCodes.duplicate, "Comprobante duplicado detectado."));
    storageServiceMock.deleteFile.mockResolvedValue();

    await service.processJob({ batchId: "batch-1", itemId: "item-1" });

    expect(storageServiceMock.deleteFile).toHaveBeenCalledWith(item.storagePath);
    expect(deleteItemMock).toHaveBeenCalledWith(item.id);
  });

  it.each([
    { name: "two independent persistence jobs", firstBatchId: "batch-1", secondBatchId: "batch-2", mixed: false },
    { name: "an individual persistence request and a batch job", firstBatchId: "batch-1", secondBatchId: "batch-1", mixed: true },
    { name: "two equivalent items from one batch", firstBatchId: "batch-1", secondBatchId: "batch-1", mixed: false },
  ])("keeps one voucher and removes every losing item when $name race", async ({ firstBatchId, secondBatchId, mixed }) => {
    const firstItem = createPersistingItem();
    firstItem.id = "item-1";
    firstItem.batchId = firstBatchId;
    firstItem.status = mixed ? "validated" : "persisting";
    firstItem.storagePath = `${firstBatchId}/first.pdf`;
    firstItem.batch = { ...firstItem.batch, id: firstBatchId };
    const secondItem = createPersistingItem();
    secondItem.id = "item-2";
    secondItem.batchId = secondBatchId;
    secondItem.storagePath = `${secondBatchId}/second.pdf`;
    secondItem.batch = { ...secondItem.batch, id: secondBatchId };
    const items = new Map([[firstItem.id, firstItem], [secondItem.id, secondItem]]);

    batchRepositoryMock.findItemById.mockImplementation(async (itemId) => items.get(itemId) || null);
    batchRepositoryMock.claimValidatedItemForPersistence.mockResolvedValue({ ...firstItem, status: "persisting" });
    batchRepositoryMock.markItemPersisted.mockResolvedValue();
    voucherServiceMock.createVoucher.mockResolvedValueOnce({} as never).mockRejectedValueOnce(new ApplicationError(applicationErrorCodes.duplicate, "Comprobante duplicado detectado."));
    storageServiceMock.deleteFile.mockResolvedValue();

    const operations = mixed
      ? [service.persistItem(companyId, firstItem.id), service.processJob({ batchId: secondBatchId, itemId: secondItem.id })]
      : [service.processJob({ batchId: firstBatchId, itemId: firstItem.id }), service.processJob({ batchId: secondBatchId, itemId: secondItem.id })];

    await Promise.all(operations);

    expect(voucherServiceMock.createVoucher).toHaveBeenCalledTimes(2);
    expect(batchRepositoryMock.markItemPersisted).toHaveBeenCalledTimes(1);
    expect(storageServiceMock.deleteFile).toHaveBeenCalledTimes(1);
    expect(deleteItemMock).toHaveBeenCalledTimes(1);
  });

  it("triggers the async persistence runner for validated batch items", async () => {
    const item = createPersistingItem();

    item.status = "validated";
    batchRepositoryMock.listValidatedItemsByBatch.mockResolvedValue([item]);
    batchRepositoryMock.claimValidatedItemForPersistence.mockResolvedValue(createPersistingItem());

    const queuedItems = await service.enqueueBatch(companyId, "batch-1");

    expect(queuedItems).toBe(1);
    expect(asyncBatchRunnerMock.triggerPersistenceBatch).toHaveBeenCalledWith("batch-1");
  });

  it("restores validated items when triggering the async runner fails", async () => {
    const item = createPersistingItem();

    item.status = "validated";
    batchRepositoryMock.listValidatedItemsByBatch.mockResolvedValue([item]);
    batchRepositoryMock.claimValidatedItemForPersistence.mockResolvedValue(createPersistingItem());
    batchRepositoryMock.restoreItemsToValidated.mockResolvedValue();
    asyncBatchRunnerMock.triggerPersistenceBatch.mockRejectedValue(new Error("Failed to trigger"));

    await expect(service.enqueueBatch(companyId, "batch-1")).rejects.toThrow("Failed to trigger");
    expect(batchRepositoryMock.restoreItemsToValidated).toHaveBeenCalledWith(["item-1"]);
  });
});
