import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { voucherSchema } from "src/lib/schemas/voucher/voucher-schemas";
import { mapVoucherSchemaToDomainInput } from "src/lib/helpers/voucher/voucher-factory-input";
import { VoucherService } from "src/services/voucher/Voucher";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { ConciliationPersistResult } from "src/types/conciliation/conciliations";
import { ParserBatchItemContextRecord, ParserBatchPersistenceJob } from "src/types/parser/parser-batch";
import { AsyncBatchRunnerService } from "./AsyncBatchRunner";
import { applicationErrorCodes } from "src/lib/constants/application-error";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { conciliationErrorMessages } from "src/lib/constants/conciliation-error";
import { ApplicationError, isApplicationError } from "src/lib/errors/application-error";
import { ParserStorageService } from "src/services/parser/ParserStorage";

function isDuplicateVoucherError(error: unknown): boolean {
  return isApplicationError(error) && error.code === applicationErrorCodes.duplicate;
}

export class VoucherPersistenceService {
  private readonly batchRepository: ParserBatchRepository;
  private readonly asyncBatchRunner: AsyncBatchRunner | null;
  private readonly voucherService: VoucherService;
  private storageService: ParserStorageService | null;

  constructor(asyncBatchRunner: AsyncBatchRunner | null = new AsyncBatchRunnerService(), storageService: ParserStorageService | null = null) {
    this.batchRepository = new ParserBatchRepository();
    this.asyncBatchRunner = asyncBatchRunner;
    this.voucherService = new VoucherService();
    this.storageService = storageService;
  }

  private getStorageService(): ParserStorageService {
    this.storageService ??= new ParserStorageService();
    return this.storageService;
  }

  private async removeDuplicateItem(item: ParserBatchItemContextRecord): Promise<void> {
    await this.getStorageService().deleteFile(item.storagePath);
    await this.batchRepository.deleteItem(item.id);
  }

  private getRequiredAsyncBatchRunner(): AsyncBatchRunner {
    if (!this.asyncBatchRunner) {
      throw new ApplicationError(applicationErrorCodes.unexpected, "No se pudo enviar la factura a persistencia", "Async batch runner is not configured");
    }

    return this.asyncBatchRunner;
  }

  private async resolveValidatedItem(companyId: string, itemId: string): Promise<ParserBatchItemContextRecord> {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new ApplicationError(applicationErrorCodes.notFound, conciliationErrorMessages.itemNotFound, "Conciliation item not found");
    }

    if (item.status !== "validated" || !item.validatedPayload) {
      throw new ApplicationError(applicationErrorCodes.conflict, "La factura no est\u00e1 lista para guardarse", "Conciliation item is not ready for persistence");
    }

    return item;
  }

  private async persistStagedItem(item: ParserBatchItemContextRecord): Promise<ConciliationPersistResult> {
    try {
      const parsedPayload = voucherSchema.safeParse({ ...item.validatedPayload, companyId: item.batch.companyId });

      if (!parsedPayload.success) {
        throw new ApplicationError(applicationErrorCodes.validation, "Los datos validados son inv\u00e1lidos", "Validated voucher payload is invalid");
      }

      await this.voucherService.createVoucher(mapVoucherSchemaToDomainInput(parsedPayload.data));
      await this.batchRepository.markItemPersisted(item.id);
      return {
        status: "persisted",
        message: "La factura se persistió correctamente.",
      };
    } catch (error: unknown) {
      if (isDuplicateVoucherError(error)) {
        await this.removeDuplicateItem(item);
        return {
          status: "duplicate",
          message: "La factura ya existe en la base de datos.",
        };
      }

      if (isApplicationError(error) && error.code === applicationErrorCodes.validation) {
        await this.batchRepository.markItemPersistenceFailed(item.id, apiResponseMessages.conciliation.itemPersistFailed);
        return {
          status: "failed",
          message: "No se pudo persistir la factura.",
        };
      }

      await this.batchRepository.restoreItemsToValidated([item.id]);
      return {
        status: "failed",
        message: "No se pudo persistir la factura.",
      };
    }
  }

  async persistItem(companyId: string, itemId: string): Promise<ConciliationPersistResult> {
    await this.resolveValidatedItem(companyId, itemId);
    const persistingItem = await this.batchRepository.claimValidatedItemForPersistence(itemId);

    if (!persistingItem) {
      return {
        status: "failed",
        message: "La factura ya se está guardando.",
      };
    }

    return this.persistStagedItem(persistingItem);
  }

  async enqueueBatch(companyId: string, batchId: string): Promise<number> {
    const items = await this.batchRepository.listValidatedItemsByBatch(companyId, batchId);
    return this.enqueueValidatedItems(items);
  }

  async enqueueItems(companyId: string, itemIds: string[]): Promise<number> {
    const uniqueItemIds = [...new Set(itemIds)];
    const items: ParserBatchItemContextRecord[] = [];

    for (const itemId of uniqueItemIds) {
      const item = await this.resolveValidatedItem(companyId, itemId);
      items.push(item);
    }

    return this.enqueueValidatedItems(items);
  }

  async processJob(job: ParserBatchPersistenceJob): Promise<void> {
    const item = await this.batchRepository.findItemById(job.itemId);

    if (!item || item.status !== "persisting" || !item.validatedPayload) {
      return;
    }
    await this.persistStagedItem(item);
  }

  private async enqueueValidatedItems(items: ParserBatchItemContextRecord[]): Promise<number> {
    const persistingItemIds: string[] = [];
    const batchIds = new Set<string>();

    for (const item of items) {
      const persistingItem = await this.batchRepository.claimValidatedItemForPersistence(item.id);

      if (!persistingItem) {
        continue;
      }

      persistingItemIds.push(persistingItem.id);
      batchIds.add(persistingItem.batchId);
    }

    if (!persistingItemIds.length) {
      return 0;
    }

    try {
      for (const batchId of batchIds) {
        await this.getRequiredAsyncBatchRunner().triggerPersistenceBatch(batchId);
      }
    } catch (error: unknown) {
      await this.batchRepository.restoreItemsToValidated(persistingItemIds);
      throw error;
    }

    return persistingItemIds.length;
  }
}
