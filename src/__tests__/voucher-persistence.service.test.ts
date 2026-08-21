import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { VoucherService } from "src/services/voucher.service";
import { VoucherPersistenceService } from "src/services/voucher-persistence.service";
import { AsyncBatchRunner } from "src/types/async-batch-runner";
import { ParserBatchItemContextRecord } from "src/types/parser-batch";
import { VoucherFormPayload } from "src/types/voucher-form";

jest.mock("src/repositories/parser-batch.repository");
jest.mock("src/services/voucher.service");

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

  beforeEach(() => {
    jest.clearAllMocks();
    asyncBatchRunnerMock = {
      triggerParserBatch: jest.fn(),
      triggerPersistenceBatch: jest.fn(),
    };
    service = new VoucherPersistenceService(asyncBatchRunnerMock);
    batchRepositoryMock = new ParserBatchRepository() as jest.Mocked<ParserBatchRepository>;
    voucherServiceMock = new VoucherService() as jest.Mocked<VoucherService>;

    (service as unknown as { batchRepository: ParserBatchRepository }).batchRepository = batchRepositoryMock;
    (service as unknown as { voucherService: VoucherService }).voucherService = voucherServiceMock;
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
    expect(batchRepositoryMock.markItemPersistenceFailed).toHaveBeenCalledWith(
      "item-1",
      "Validated voucher payload is invalid",
    );
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
