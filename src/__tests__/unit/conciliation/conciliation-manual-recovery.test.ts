import { ConciliationsService } from "src/services/conciliation/Conciliations";
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { ParserStorageService } from "src/services/parser/ParserStorage";
import { VoucherService } from "src/services/voucher/Voucher";
import type { ParserBatchItemContextRecord } from "src/types/parser/parser-batch";
import type { VoucherFactoryInput } from "src/types/voucher/domain";

jest.mock("src/repositories/parser/parser-batch.repository");
jest.mock("src/services/parser/ParserStorage");
jest.mock("src/services/voucher/Voucher");

const failedItem: ParserBatchItemContextRecord = {
  id: "item-1",
  batchId: "batch-1",
  fileName: "factura.pdf",
  mimeType: "application/pdf",
  fileSize: 100,
  fileHash: "hash-1",
  storagePath: "batch-1/factura.pdf",
  inputStrategy: "pdf-visual",
  status: "failed",
  parsedPayload: null,
  validatedPayload: null,
  currentError: "No se pudo procesar la factura.",
  currentAttempt: 1,
  queuedAt: null,
  processedAt: "2026-10-01T00:00:00.000Z",
  expiresAt: "2026-10-08T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  batch: {
    id: "batch-1",
    companyId: "company-1",
    createdByUserId: "user-1",
    voucherType: "sale",
    status: "partial",
    expiresAt: "2026-10-08T00:00:00.000Z",
  },
};

const recoveryInput = { companyId: "company-1", type: "sale" } as VoucherFactoryInput;

describe("ConciliationsService manual recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ParserBatchRepository).prototype.findItemById.mockResolvedValue(failedItem);
    jest.mocked(ParserBatchRepository).prototype.deleteItem.mockResolvedValue();
    jest.mocked(ParserBatchRepository).prototype.markItemCleanupPending.mockResolvedValue(failedItem);
    jest.mocked(ParserStorageService).prototype.deleteFile.mockResolvedValue();
    jest.mocked(VoucherService).prototype.createVoucher.mockResolvedValue({} as never);
  });

  it("creates the voucher and removes the source item after successful recovery", async () => {
    const service = new ConciliationsService();

    const result = await service.recoverFailedItem("company-1", "item-1", recoveryInput);

    expect(VoucherService.prototype.createVoucher).toHaveBeenCalledWith(recoveryInput);
    expect(ParserStorageService.prototype.deleteFile).toHaveBeenCalledWith(failedItem.storagePath);
    expect(ParserBatchRepository.prototype.deleteItem).toHaveBeenCalledWith(failedItem.id);
    expect(result.status).toBe("recovered");
  });

  it("keeps the created voucher and marks cleanup as pending when source deletion fails", async () => {
    jest.mocked(ParserStorageService).prototype.deleteFile.mockRejectedValue(new Error("storage unavailable"));
    const service = new ConciliationsService();

    const result = await service.recoverFailedItem("company-1", "item-1", recoveryInput);

    expect(VoucherService.prototype.createVoucher).toHaveBeenCalledWith(recoveryInput);
    expect(ParserBatchRepository.prototype.markItemCleanupPending).toHaveBeenCalledWith("item-1");
    expect(ParserBatchRepository.prototype.deleteItem).not.toHaveBeenCalled();
    expect(result.status).toBe("cleanup_pending");
  });

  it("rejects items from another company before creating a voucher", async () => {
    jest.mocked(ParserBatchRepository).prototype.findItemById.mockResolvedValue({
      ...failedItem,
      batch: { ...failedItem.batch, companyId: "company-2" },
    });
    const service = new ConciliationsService();

    await expect(service.recoverFailedItem("company-1", "item-1", recoveryInput)).rejects.toThrow("No se encontr");
    expect(VoucherService.prototype.createVoucher).not.toHaveBeenCalled();
  });

  it("removes cleanup-pending items after retrying their cleanup", async () => {
    jest.mocked(ParserBatchRepository).prototype.findItemById.mockResolvedValue({ ...failedItem, status: "cleanup_pending" });
    const service = new ConciliationsService();

    await service.discardItem("company-1", "item-1");

    expect(ParserStorageService.prototype.deleteFile).toHaveBeenCalledWith(failedItem.storagePath);
    expect(ParserBatchRepository.prototype.deleteItem).toHaveBeenCalledWith(failedItem.id);
    expect(ParserBatchRepository.prototype.discardItem).not.toHaveBeenCalled();
  });
});
