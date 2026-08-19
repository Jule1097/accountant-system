import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { voucherSchema } from "src/lib/schemas/voucher-schemas";
import { normalizeVoucherFormPayload } from "src/lib/helpers/voucher-form";
import { VoucherService } from "src/services/voucher.service";
import { ConciliationPersistResult } from "src/types/conciliations";
import { GeminiParserResponse } from "src/types/gemini-parser";
import { ParserBatchItemContextRecord, ParserBatchPersistenceJob } from "src/types/parser-batch";
import { VoucherFormPayload } from "src/types/voucher-form";
import { PersistenceQueueService } from "./persistence-queue.service";

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
  private readonly queueService: PersistenceQueueService;
  private readonly voucherService: VoucherService;

  constructor() {
    this.batchRepository = new ParserBatchRepository();
    this.queueService = new PersistenceQueueService();
    this.voucherService = new VoucherService();
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
    const persistingItem = await this.batchRepository.markItemPersisting(itemId);
    return this.persistStagedItem(persistingItem);
  }

  async enqueueBatch(companyId: string, batchId: string): Promise<number> {
    const items = await this.batchRepository.listValidatedItemsByBatch(companyId, batchId);

    for (const item of items) {
      await this.batchRepository.markItemPersisting(item.id);
      await this.queueService.enqueue({
        batchId,
        itemId: item.id,
      });
    }

    return items.length;
  }

  async processJob(job: ParserBatchPersistenceJob): Promise<void> {
    const item = await this.batchRepository.findItemById(job.itemId);

    if (!item || item.status !== "persisting" || !item.validatedPayload) {
      return;
    }
    await this.persistStagedItem(item);
  }
}
