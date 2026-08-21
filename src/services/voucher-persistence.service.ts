import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { voucherSchema } from "src/lib/schemas/voucher-schemas";
import { normalizeVoucherFormPayload } from "src/lib/helpers/voucher-form";
import { VoucherService } from "src/services/voucher.service";
import { AsyncBatchRunner } from "src/types/async-batch-runner";
import { ConciliationPersistResult } from "src/types/conciliations";
import { GeminiParserResponse } from "src/types/gemini-parser";
import { ParserBatchItemContextRecord, ParserBatchPersistenceJob } from "src/types/parser-batch";
import { VoucherFormPayload } from "src/types/voucher-form";
import { AsyncBatchRunnerService } from "./async-batch-runner.service";

function isDuplicateVoucherError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("duplicate");
}

function buildParsedPayloadFallback(item: ParserBatchItemContextRecord): GeminiParserResponse {
  return item.parsedPayload || {
    posNumber: null,
    number: null,
    date: null,
    currency: null,
    exchangeRate: null,
    subtotal: null,
    vatAmount: null,
    nonTaxableAmount: null,
    exemptAmount: null,
    otherTaxesAmount: null,
    totalAmount: null,
    concept: null,
    paymentMethod: null,
    status: null,
    paymentDate: null,
    paidAmount: null,
    comments: null,
    thirdPartyCuit: null,
    thirdPartyName: null,
    voucherType: null,
    voucherLetter: null,
    vatDetails: [],
    retentions: [],
    perceptions: [],
    thirdPartyId: null,
  };
}

export class VoucherPersistenceService {
  private readonly batchRepository: ParserBatchRepository;
  private readonly asyncBatchRunner: AsyncBatchRunner | null;
  private readonly voucherService: VoucherService;

  constructor(asyncBatchRunner: AsyncBatchRunner | null = new AsyncBatchRunnerService()) {
    this.batchRepository = new ParserBatchRepository();
    this.asyncBatchRunner = asyncBatchRunner;
    this.voucherService = new VoucherService();
  }

  private getRequiredAsyncBatchRunner(): AsyncBatchRunner {
    if (!this.asyncBatchRunner) {
      throw new Error("Async batch runner is not configured");
    }

    return this.asyncBatchRunner;
  }

  private async resolveValidatedItem(companyId: string, itemId: string): Promise<ParserBatchItemContextRecord> {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new Error("No se encontró el ítem solicitado");
    }

    if (item.status !== "validated" || !item.validatedPayload) {
      throw new Error("La factura no está lista para guardarse");
    }

    return item;
  }

  private async persistStagedItem(item: ParserBatchItemContextRecord): Promise<ConciliationPersistResult> {
    try {
      const normalizedPayload = {
        ...normalizeVoucherFormPayload(item.validatedPayload as VoucherFormPayload),
        companyId: item.batch.companyId,
      };
      const parsedPayload = voucherSchema.safeParse(normalizedPayload);

      if (!parsedPayload.success) {
        throw new Error("Validated voucher payload is invalid");
      }

      await this.voucherService.createVoucher(parsedPayload.data);
      await this.batchRepository.markItemPersisted(item.id);
      return {
        status: "persisted",
        message: "La factura se persistió correctamente.",
      };
    } catch (error: unknown) {
      if (isDuplicateVoucherError(error)) {
        await this.batchRepository.markItemDuplicate(
          item.id,
          buildParsedPayloadFallback(item),
          item.inputStrategy || "image-visual"
        );
        return {
          status: "duplicate",
          message: "La factura ya existe en la base de datos.",
        };
      }

      const errorMessage = error instanceof Error ? error.message : "Persistence failed";
      await this.batchRepository.markItemPersistenceFailed(item.id, errorMessage);
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
