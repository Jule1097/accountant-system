import { randomUUID } from "node:crypto";
import { parseInvoiceImage, parseInvoiceMarkdown, parseInvoiceVisualFieldRepair } from "src/lib/integrations/gemini";
import {
  getParserBatchExpirationDate,
  hasReviewableParsedPayload,
  isParserBatchExpired,
} from "src/lib/helpers/parser/parser-batch";
import {
  buildParserStoragePath,
  createParserAcceptedFile,
  ensureParserStoredFileMetadata,
  ensureParserUploadMetadata,
  ensureParserTotalFileSize,
  isParserImageMimeType,
  isParserPdfMimeType,
  sanitizeParserFileName,
  ParserAcceptedFile,
} from "src/lib/helpers/parser/parser-file";
import { createParserUploadPlanToken, verifyParserUploadPlanToken } from "src/lib/helpers/parser/parser-upload-plan";
import { resolveParserPdfStrategy } from "src/lib/helpers/parser/parser-pdf";
import { getGeminiRepairFields, mergeGeminiRepairFields } from "src/lib/helpers/parser/parser-repair";
import { CompanyRepository } from "src/repositories/company/company.repository";
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { ParserBatchAsyncResponse, ParserBatchQueueJob, ParserBatchSingleResponse, ParserBatchUploadResponse, ParserFailureReason, ParserInputStrategy, ParserRetryResponse, ParserVoucherType } from "src/types/parser/parser-batch";
import { RawGeminiParsedVoucher } from "src/types/parser/gemini-parser";
import { AsyncBatchRunnerService } from "./AsyncBatchRunner";
import { CompanyNotificationService } from "src/services/company/CompanyNotification";
import { ParserResponseService } from "./ParserResponse";
import { ParserStorageService } from "./ParserStorage";
import { applicationErrorCodes } from "src/lib/constants/application-error";
import { apiResponseMessages } from "src/lib/constants/api-response";
import { ApplicationError } from "src/lib/errors/application-error";
import { parserFileValidationMessages, parserInternalMessages, parserResponseModes, parserRetryMessages } from "src/lib/constants/parser";
import { parserUploadMessages, parserUploadPlanDurationMs } from "src/lib/constants/parser-upload";
import { ParserFailureStage, resolveParserFailureMessage, resolveParserFailureReason } from "src/lib/helpers/parser/parser-failure";
import { ParserUploadConfirmationInput, ParserUploadPlan, ParserUploadPlanInput, ParserUploadPlanResponse } from "src/types/parser/parser-upload";

interface PreparedParserPayload {
  strategy: "pdf-text" | "pdf-visual" | "image-visual";
  execute: () => Promise<RawGeminiParsedVoucher>;
}

function isTerminalParserItemStatus(status: string | undefined): boolean {
  return status === "parsed"
    || status === "expired"
    || status === "duplicate"
    || status === "validated"
    || status === "persisting"
    || status === "persisted"
    || status === "discarded";
}

function resolveFallbackInputStrategy(mimeType: string): ParserInputStrategy {
  return isParserImageMimeType(mimeType) ? "image-visual" : "pdf-visual";
}

function ensureParserFilesAreUnique(files: ParserAcceptedFile[]): void {
  const hashes = new Set<string>();

  for (const file of files) {
    if (hashes.has(file.fileHash)) {
      throw new ApplicationError(applicationErrorCodes.validation, parserFileValidationMessages.duplicateFile(file.fileName), "Parser duplicate file validation failed");
    }

    hashes.add(file.fileHash);
  }
}

export class VoucherParserService {
  private readonly companyRepository: CompanyRepository;
  private readonly batchRepository: ParserBatchRepository;
  private readonly asyncBatchRunner: AsyncBatchRunner | null;
  private readonly responseService: ParserResponseService;
  private readonly storageService: ParserStorageService;
  private readonly notificationService: CompanyNotificationService;

  constructor(asyncBatchRunner: AsyncBatchRunner | null = new AsyncBatchRunnerService()) {
    this.companyRepository = new CompanyRepository();
    this.batchRepository = new ParserBatchRepository();
    this.asyncBatchRunner = asyncBatchRunner;
    this.responseService = new ParserResponseService();
    this.storageService = new ParserStorageService();
    this.notificationService = new CompanyNotificationService();
  }

  private getRequiredAsyncBatchRunner(): AsyncBatchRunner {
    if (!this.asyncBatchRunner) {
      throw new ApplicationError(applicationErrorCodes.unexpected, "Error procesando el documento", "Async batch runner is not configured");
    }

    return this.asyncBatchRunner;
  }

  private async getActiveCompanyCuit(companyId: string): Promise<string | undefined> {
    const company = await this.companyRepository.findById(companyId);
    return company?.cuit;
  }

  private buildUploadPlan(companyId: string, userId: string, input: ParserUploadPlanInput): ParserUploadPlan {
    const planId = randomUUID();
    const batchId = randomUUID();
    const expiresAt = Date.now() + parserUploadPlanDurationMs;
    const items = input.files.map((file) => {
      const itemId = randomUUID();
      const fileName = sanitizeParserFileName(file.fileName);
      return { itemId, fileName, mimeType: file.mimeType, fileSize: file.fileSize, storagePath: buildParserStoragePath(companyId, batchId, itemId, fileName) };
    });
    return { planId, batchId, userId, companyId, voucherType: input.voucherKind, expiresAt, items };
  }

  private ensureUploadPlanOwnership(plan: ParserUploadPlan, companyId: string, userId: string): void {
    if (plan.companyId !== companyId || plan.userId !== userId) throw new ApplicationError(applicationErrorCodes.forbidden, parserUploadMessages.ownershipDenied, "Parser upload plan ownership validation failed");
  }

  private ensureUploadPlanItems(plan: ParserUploadPlan, itemIds: string[]): void {
    const expectedItemIds = new Set(plan.items.map((item) => item.itemId));
    const receivedItemIds = new Set(itemIds);
    const hasExpectedItems = itemIds.every((itemId) => expectedItemIds.has(itemId));
    if (itemIds.length !== plan.items.length || receivedItemIds.size !== itemIds.length || !hasExpectedItems) throw new ApplicationError(applicationErrorCodes.validation, parserUploadMessages.incompleteUpload, "Parser upload plan item validation failed");
  }

  private async authorizeUploadPlan(plan: ParserUploadPlan): Promise<ParserUploadPlanResponse> {
    const planToken = createParserUploadPlanToken(plan);
    const uploads = [];
    for (const item of plan.items) {
      const authorization = await this.storageService.createSignedUploadUrl(item.storagePath);
      uploads.push({ itemId: item.itemId, fileName: item.fileName, mimeType: item.mimeType, fileSize: item.fileSize, path: authorization.path, token: authorization.token });
    }
    return { planToken, expiresAt: new Date(plan.expiresAt).toISOString(), bucket: this.storageService.getBucketName(), uploads };
  }

  private async validateStoredFile(item: ParserUploadPlan["items"][number]): Promise<ParserAcceptedFile> {
    const metadata = await this.storageService.getFileMetadata(item.storagePath);
    if (!metadata) throw new ApplicationError(applicationErrorCodes.validation, parserUploadMessages.storageFileMissing, "Parser upload object is missing");
    ensureParserStoredFileMetadata(item, metadata);
    const buffer = await this.storageService.downloadFile(item.storagePath);
    return createParserAcceptedFile(item.fileName, metadata.mimeType, buffer);
  }

  private async cleanupUploadPlan(plan: ParserUploadPlan): Promise<void> {
    for (const item of plan.items) {
      try {
        await this.storageService.deleteFile(item.storagePath);
      } catch (error: unknown) {
        const errorName = error instanceof Error ? error.name : parserInternalMessages.unknownErrorName;
        console.error(parserInternalMessages.temporaryObjectCleanupFailed, { operation: parserInternalMessages.uploadCleanupOperation, entityId: plan.planId, provider: parserInternalMessages.storageProvider, errorName });
      }
    }
  }

  private async validateStoredPlan(plan: ParserUploadPlan): Promise<ParserAcceptedFile[]> {
    const files: ParserAcceptedFile[] = [];
    try {
      for (const item of plan.items) files.push(await this.validateStoredFile(item));
      ensureParserTotalFileSize(files);
      ensureParserFilesAreUnique(files);
      return files;
    } catch (error: unknown) {
      await this.cleanupUploadPlan(plan);
      throw error;
    }
  }

  private async parseConfirmedSingleFile(companyId: string, plan: ParserUploadPlan, file: ParserAcceptedFile): Promise<ParserBatchSingleResponse> {
    try {
      return await this.parseSingleFile(companyId, plan.voucherType, file);
    } finally {
      await this.cleanupUploadPlan(plan);
    }
  }

  private async createConfirmedBatch(companyId: string, userId: string, plan: ParserUploadPlan, files: ParserAcceptedFile[]): Promise<ParserBatchAsyncResponse> {
    const expiresAt = getParserBatchExpirationDate();
    let batchCreated = false;
    try {
      const batch = await this.batchRepository.createBatchWithItems(
        { id: plan.batchId, companyId, createdByUserId: userId, voucherType: plan.voucherType, totalFiles: plan.items.length, expiresAt },
        plan.items.map((item, index) => ({ id: item.itemId, batchId: plan.batchId, fileName: item.fileName, mimeType: item.mimeType, fileSize: item.fileSize, fileHash: files[index].fileHash, storagePath: item.storagePath, expiresAt }))
      );
      batchCreated = true;
      await this.getRequiredAsyncBatchRunner().triggerParserBatch(batch.id);
      return { mode: parserResponseModes.batch, batch };
    } catch (error: unknown) {
      if (!batchCreated) await this.cleanupUploadPlan(plan);
      throw error;
    }
  }

  async createUploadPlan(companyId: string, userId: string, input: ParserUploadPlanInput): Promise<ParserUploadPlanResponse> {
    ensureParserUploadMetadata(input.files);
    const plan = this.buildUploadPlan(companyId, userId, input);
    return this.authorizeUploadPlan(plan);
  }

  async confirmUpload(companyId: string, userId: string, input: ParserUploadConfirmationInput): Promise<ParserBatchUploadResponse> {
    const plan = verifyParserUploadPlanToken(input.planToken);
    this.ensureUploadPlanOwnership(plan, companyId, userId);
    this.ensureUploadPlanItems(plan, input.itemIds);
    const existingBatch = plan.items.length > 1 ? await this.batchRepository.findBatchById(companyId, plan.batchId) : null;
    if (existingBatch) return { mode: parserResponseModes.batch, batch: existingBatch };
    const files = await this.validateStoredPlan(plan);
    if (files.length === 1) return this.parseConfirmedSingleFile(companyId, plan, files[0]);
    return this.createConfirmedBatch(companyId, userId, plan, files);
  }

  private async preparePayload(
    file: ParserAcceptedFile,
    voucherKind: ParserVoucherType,
    activeCompanyCuit?: string
  ): Promise<PreparedParserPayload> {
    const base64Document = file.buffer.toString("base64");

    if (isParserImageMimeType(file.mimeType)) {
      return {
        strategy: "image-visual",
        execute: () => parseInvoiceImage(base64Document, file.mimeType, { voucherKind, activeCompanyCuit }),
      };
    }

    if (!isParserPdfMimeType(file.mimeType)) {
      throw new ApplicationError(applicationErrorCodes.validation, `El archivo ${file.fileName} tiene un tipo no soportado.`, "Parser file type validation failed");
    }

    const strategy = await resolveParserPdfStrategy(file.buffer);

    if (strategy.strategy === "pdf-text" && strategy.markdown) {
      return {
        strategy: "pdf-text",
        execute: async () => {
          try {
            const markdownPayload = await parseInvoiceMarkdown(strategy.markdown as string, { voucherKind, activeCompanyCuit });
            const repairFields = getGeminiRepairFields(markdownPayload);

            if (repairFields.length === 0) {
              return markdownPayload;
            }

            const repairedFields = await parseInvoiceVisualFieldRepair(
              base64Document,
              file.mimeType,
              repairFields,
              { voucherKind, activeCompanyCuit }
            );

            return mergeGeminiRepairFields(markdownPayload, repairFields, repairedFields);
          } catch {
            return parseInvoiceImage(base64Document, file.mimeType, { voucherKind, activeCompanyCuit });
          }
        },
      };
    }

    return {
      strategy: "pdf-visual",
      execute: () => parseInvoiceImage(base64Document, file.mimeType, { voucherKind, activeCompanyCuit }),
    };
  }

  async parseSingleFile(
    companyId: string,
    voucherKind: ParserVoucherType,
    file: ParserAcceptedFile
  ): Promise<ParserBatchSingleResponse> {
    const activeCompanyCuit = await this.getActiveCompanyCuit(companyId);
    const payload = await this.preparePayload(file, voucherKind, activeCompanyCuit);
    const rawResponse = await payload.execute();
    const data = await this.responseService.buildResponse(companyId, voucherKind, rawResponse);

    return {
      mode: parserResponseModes.single,
      data,
    };
  }

  async getBatch(companyId: string, batchId: string) {
    return this.batchRepository.findBatchById(companyId, batchId);
  }

  async getItem(companyId: string, itemId: string) {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new ApplicationError(applicationErrorCodes.notFound, apiResponseMessages.parser.itemNotFound, "Parser item not found");
    }

    return item;
  }

  async retryItem(companyId: string, itemId: string): Promise<ParserBatchQueueJob> {
    const item = await this.getItem(companyId, itemId);
    await this.retryItems(companyId, [item.id]);
    const requeuedItem = await this.getItem(companyId, itemId);
    const job = {
      batchId: requeuedItem.batchId,
      itemId: requeuedItem.id,
    };

    return job;
  }

  async retryItems(companyId: string, itemIds: string[]): Promise<ParserRetryResponse> {
    const uniqueItemIds = [...new Set(itemIds)];
    const requeuedItems = await this.batchRepository.requeueFailedItems(companyId, uniqueItemIds);
    const batchIds = [...new Set(requeuedItems.map((item) => item.batchId))];
    let dispatchRecovered = true;

    for (const batchId of batchIds) {
      try {
        await this.getRequiredAsyncBatchRunner().triggerParserBatch(batchId);
      } catch {
        dispatchRecovered = false;
      }
    }

    return {
      requeuedItems: requeuedItems.length,
      affectedBatches: batchIds.length,
      dispatchRecovered,
      message: dispatchRecovered
        ? parserRetryMessages.bulkSuccess(requeuedItems.length, batchIds.length)
        : parserRetryMessages.dispatchPending(requeuedItems.length),
    };
  }

  async recoverPendingItems(limit: number): Promise<number> {
    const items = await this.batchRepository.listRecoverableItems(limit);

    if (!items.length) {
      return 0;
    }

    const batchIds = new Set<string>();

    for (const item of items) {
      const requeuedItem = await this.batchRepository.requeueItem(item.id);
      batchIds.add(requeuedItem.batchId);
    }

    for (const batchId of batchIds) {
      await this.getRequiredAsyncBatchRunner().triggerParserBatch(batchId);
    }

    return items.length;
  }

  async processItem(itemId: string): Promise<void> {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || isTerminalParserItemStatus(item.status)) {
      return;
    }

    if (isParserBatchExpired(item.expiresAt)) {
      await this.storageService.deleteFile(item.storagePath);
      await this.batchRepository.markItemExpired(item.id);

      return;
    }

    const nextAttempt = item.currentAttempt + 1;
    let stage: ParserFailureStage = "download";
    let inputStrategy = resolveFallbackInputStrategy(item.mimeType);

    try {
      const buffer = await this.storageService.downloadFile(item.storagePath);
      const file: ParserAcceptedFile = {
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        fileHash: item.fileHash,
        buffer,
      };
      const activeCompanyCuit = await this.getActiveCompanyCuit(item.batch.companyId);
      stage = "preparation";
      const payload = await this.preparePayload(file, item.batch.voucherType, activeCompanyCuit);
      inputStrategy = payload.strategy;
      await this.batchRepository.markItemProcessing(item.id, nextAttempt, inputStrategy);
      stage = "execution";
      const rawResponse = await payload.execute();
      stage = "response";
      const response = await this.responseService.buildResponse(item.batch.companyId, item.batch.voucherType, rawResponse);
      stage = "extraction";
      if (!hasReviewableParsedPayload(response)) {
        throw new Error("Insufficient parser extraction");
      }
      await this.batchRepository.markItemParsed(item.id, response, payload.strategy);
    } catch (error: unknown) {
      const failureReason: ParserFailureReason = resolveParserFailureReason(stage, error);
      await this.batchRepository.markItemFailed(
        item.id,
        resolveParserFailureMessage(failureReason),
        inputStrategy,
        { attemptNumber: nextAttempt },
        failureReason,
        nextAttempt,
      );
    }

    const batch = await this.batchRepository.findBatchById(item.batch.companyId, item.batch.id);

    if (!batch) {
      return;
    }
    await this.notificationService.notifyBatchCompleted(batch);
  }

  async cleanupExpiredItems(limit: number): Promise<void> {
    const items = await this.batchRepository.listExpiredItems(new Date(), limit);

    for (const item of items) {
      await this.storageService.deleteFile(item.storagePath);
      await this.batchRepository.markItemExpired(item.id);
    }
  }
}
