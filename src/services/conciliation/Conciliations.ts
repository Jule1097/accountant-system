import { applicationErrorCodes } from "src/lib/constants/application-error"
import { conciliationErrorMessages } from "src/lib/constants/conciliation-error"
import { conciliationRecoveryLogContext, conciliationRecoveryMessages } from "src/lib/constants/conciliation"
import { buildConciliationsPageData, isDiscardableStatus, resolveVoucherType } from "src/lib/helpers/conciliation/conciliations"
import { ApplicationError } from "src/lib/errors/application-error"
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository"
import { VoucherRepository } from "src/repositories/voucher/voucher.repository"
import { ParserStorageService } from "src/services/parser/ParserStorage"
import { ConciliationsPageData, ConciliationTab } from "src/types/conciliation/conciliations"
import { ParserBatchItemContextRecord } from "src/types/parser/parser-batch"
import { VoucherFormPayload } from "src/types/voucher/voucher-form"
import { VoucherFactoryInput } from "src/types/voucher/domain"
import { ConciliationManualRecoveryResult } from "src/types/conciliation/conciliations"
import { SupplierRepository } from "src/repositories/third-party/supplier.repository"
import { VoucherService } from "src/services/voucher/Voucher"

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError"
}

export class ConciliationsService {
  private readonly batchRepository: ParserBatchRepository
  private readonly storageService: ParserStorageService
  private readonly voucherRepository: VoucherRepository
  private readonly voucherService: VoucherService

  constructor() {
    this.batchRepository = new ParserBatchRepository()
    this.storageService = new ParserStorageService()
    this.voucherRepository = new VoucherRepository()
    this.voucherService = new VoucherService(undefined, new SupplierRepository())
  }

  private async resolveDuplicateItems(items: ParserBatchItemContextRecord[]): Promise<ParserBatchItemContextRecord[]> {
    const resolvedItems: ParserBatchItemContextRecord[] = []
    for (const item of items) {
      if (item.status !== "parsed" || !item.parsedPayload) {
        resolvedItems.push(item)
        continue
      }
      const duplicate = await this.voucherRepository.findDuplicateByParsedPayload(item.batch.companyId, item.batch.voucherType, item.parsedPayload)
      resolvedItems.push(duplicate ? { ...item, status: "duplicate" } : item)
    }
    return resolvedItems
  }

  async getPage(companyId: string, batchId: string | undefined, tab: ConciliationTab, page: number): Promise<ConciliationsPageData> {
    const items = await this.batchRepository.listReviewItems({ companyId, voucherType: resolveVoucherType(tab), batchId })
    const resolvedItems = await this.resolveDuplicateItems(items)
    return buildConciliationsPageData({ batchId, tab, page }, resolvedItems)
  }

  async validateItem(companyId: string, itemId: string, validatedPayload: VoucherFormPayload) {
    const item = await this.batchRepository.findItemById(itemId)
    if (!item || item.batch.companyId !== companyId) throw new ApplicationError(applicationErrorCodes.notFound, conciliationErrorMessages.itemNotFound, "Conciliation item not found")
    if (item.status !== "parsed") throw new ApplicationError(applicationErrorCodes.conflict, conciliationErrorMessages.itemUnavailableForReview, "Conciliation item is not available for review")
    return this.batchRepository.markItemValidated(itemId, validatedPayload)
  }

  async discardItem(companyId: string, itemId: string): Promise<void> {
    const item = await this.batchRepository.findItemById(itemId)
    if (!item || item.batch.companyId !== companyId) throw new ApplicationError(applicationErrorCodes.notFound, conciliationErrorMessages.itemNotFound, "Conciliation item not found")
    if (!isDiscardableStatus(item.status)) throw new ApplicationError(applicationErrorCodes.conflict, conciliationErrorMessages.itemCannotDiscard, "Conciliation item cannot be discarded in its current state")
    await this.storageService.deleteFile(item.storagePath)
    if (item.status === "cleanup_pending") {
      await this.batchRepository.deleteItem(itemId)
      return
    }
    await this.batchRepository.discardItem(itemId)
  }

  async discardItems(companyId: string, itemIds: string[]): Promise<number> {
    const uniqueItemIds = [...new Set(itemIds)]
    for (const itemId of uniqueItemIds) await this.discardItem(companyId, itemId)
    return uniqueItemIds.length
  }

  async recoverFailedItem(companyId: string, itemId: string, input: VoucherFactoryInput): Promise<ConciliationManualRecoveryResult> {
    const item = await this.batchRepository.findItemById(itemId)
    if (!item || item.batch.companyId !== companyId) throw new ApplicationError(applicationErrorCodes.notFound, conciliationErrorMessages.itemNotFound, "Conciliation item not found")
    if (item.status !== "failed") throw new ApplicationError(applicationErrorCodes.conflict, conciliationErrorMessages.itemUnavailableForRecovery, "Conciliation item is not eligible for manual recovery")

    await this.voucherService.createVoucher({ ...input, companyId })

    try {
      await this.storageService.deleteFile(item.storagePath)
      await this.batchRepository.deleteItem(item.id)
      return { status: "recovered", message: conciliationRecoveryMessages.recovered }
    } catch (error: unknown) {
      console.error("Manual conciliation recovery cleanup failed", {
        path: conciliationRecoveryLogContext.path,
        operation: "manual conciliation recovery cleanup",
        workflowState: "cleanup_pending",
        entityId: item.id,
        companyId,
        providerName: conciliationRecoveryLogContext.providerName,
        errorName: getErrorName(error),
      })
      await this.batchRepository.markItemCleanupPending(item.id)
      return { status: "cleanup_pending", message: conciliationRecoveryMessages.cleanupPending }
    }
  }

  async getSourceFile(companyId: string, itemId: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const item = await this.batchRepository.findItemById(itemId)
    if (!item || item.batch.companyId !== companyId) throw new ApplicationError(applicationErrorCodes.notFound, conciliationErrorMessages.itemNotFound, "Conciliation item not found")
    const buffer = await this.storageService.downloadFile(item.storagePath)
    return { buffer, mimeType: item.mimeType, fileName: item.fileName }
  }
}
