import { buildConciliationsPageData, isDiscardableStatus, resolveVoucherType } from "src/lib/helpers/conciliations";
import { normalizeVoucherFormPayload } from "src/lib/helpers/voucher-form";
import { ParserBatchRepository } from "src/repositories/parser-batch.repository";
import { VoucherRepository } from "src/repositories/voucher.repository";
import { ConciliationsPageData, ConciliationTab } from "src/types/conciliations";
import { ParserBatchItemContextRecord } from "src/types/parser-batch";
import { VoucherFormPayload } from "src/types/voucher-form";
import { ParserStorageService } from "./parser-storage.service";


export class ConciliationsService {
  private readonly batchRepository: ParserBatchRepository;
  private readonly storageService: ParserStorageService;
  private readonly voucherRepository: VoucherRepository;

  constructor() {
    this.batchRepository = new ParserBatchRepository();
    this.storageService = new ParserStorageService();
    this.voucherRepository = new VoucherRepository();
  }

  private async resolveDuplicateItems(items: ParserBatchItemContextRecord[]): Promise<ParserBatchItemContextRecord[]> {
    const resolvedItems: ParserBatchItemContextRecord[] = [];

    for (const item of items) {
      if (item.status !== "parsed" || !item.parsedPayload) {
        resolvedItems.push(item);
        continue;
      }

      const duplicate = await this.voucherRepository.findDuplicateByParsedPayload(
        item.batch.companyId,
        item.batch.voucherType,
        item.parsedPayload
      );

      if (!duplicate) {
        resolvedItems.push(item);
        continue;
      }

      resolvedItems.push({
        ...item,
        status: "duplicate",
      });
    }

    return resolvedItems;
  }

  async getPage(companyId: string, batchId: string | undefined, tab: ConciliationTab, page: number): Promise<ConciliationsPageData> {
    const items = await this.batchRepository.listReviewItems({
      companyId,
      voucherType: resolveVoucherType(tab),
      batchId,
    });
    const resolvedItems = await this.resolveDuplicateItems(items);
    const pageData = buildConciliationsPageData({ batchId, tab, page }, resolvedItems);

    return pageData;
  }

  async validateItem(companyId: string, itemId: string, validatedPayload: VoucherFormPayload) {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new Error("No se encontró el ítem solicitado");
    }

    if (item.status !== "parsed") {
      throw new Error("La factura no está disponible para revisión");
    }

    return this.batchRepository.markItemValidated(itemId, normalizeVoucherFormPayload(validatedPayload));
  }

  async discardItem(companyId: string, itemId: string): Promise<void> {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new Error("No se encontró el ítem solicitado");
    }

    if (!isDiscardableStatus(item.status)) {
      throw new Error("La factura no se puede descartar en este estado");
    }

    await this.storageService.deleteFile(item.storagePath);
    await this.batchRepository.discardItem(itemId);
  }

  async discardItems(companyId: string, itemIds: string[]): Promise<number> {
    const uniqueItemIds = [...new Set(itemIds)];

    for (const itemId of uniqueItemIds) {
      await this.discardItem(companyId, itemId);
    }

    return uniqueItemIds.length;
  }

  async getSourceFile(companyId: string, itemId: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new Error("No se encontró el ítem solicitado");
    }

    const buffer = await this.storageService.downloadFile(item.storagePath);

    return {
      buffer,
      mimeType: item.mimeType,
      fileName: item.fileName,
    };
  }
}
