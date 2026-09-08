import { randomUUID } from "node:crypto";
import { parseInvoiceImage, parseInvoiceMarkdown, parseInvoiceVisualFieldRepair } from "src/lib/integrations/gemini";
import {
  getParserBatchExpirationDate,
  getParserBatchMaxFiles,
  isParserBatchExpired,
} from "src/lib/helpers/parser/parser-batch";
import {
  buildParserStoragePath,
  isParserImageMimeType,
  isParserPdfMimeType,
  ParserAcceptedFile,
} from "src/lib/helpers/parser/parser-file";
import { resolveParserPdfStrategy } from "src/lib/helpers/parser/parser-pdf";
import { getGeminiRepairFields, mergeGeminiRepairFields } from "src/lib/helpers/parser/parser-repair";
import { CompanyRepository } from "src/repositories/company/company.repository";
import { ParserBatchRepository } from "src/repositories/parser/parser-batch.repository";
import { AsyncBatchRunner } from "src/types/parser/async-batch-runner";
import { ParserBatchAsyncResponse, ParserBatchQueueJob, ParserBatchSingleResponse, ParserVoucherType } from "src/types/parser/parser-batch";
import { RawGeminiParsedVoucher } from "src/types/parser/gemini-parser";
import { AsyncBatchRunnerService } from "./AsyncBatchRunner";
import { CompanyNotificationService } from "src/services/company/CompanyNotification";
import { ParserResponseService } from "./ParserResponse";
import { ParserStorageService } from "./ParserStorage";
import { applicationErrorCodes } from "src/lib/constants/application-error";
import { ApplicationError } from "src/lib/errors/application-error";

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

function ensureParserFileLimit(files: ParserAcceptedFile[]): void {
  if (files.length > getParserBatchMaxFiles()) {
    throw new ApplicationError(applicationErrorCodes.validation, `Se permiten hasta ${getParserBatchMaxFiles()} archivos por carga.`, "Parser batch file limit validation failed");
  }
}

function ensureParserFilesAreUnique(files: ParserAcceptedFile[]): void {
  const hashes = new Set<string>();

  for (const file of files) {
    if (hashes.has(file.fileHash)) {
      throw new ApplicationError(applicationErrorCodes.validation, `El archivo ${file.fileName} est\u00e1 duplicado dentro del lote.`, "Parser duplicate file validation failed");
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
      mode: "single",
      data,
    };
  }

  async createBatch(
    companyId: string,
    userId: string,
    voucherKind: ParserVoucherType,
    files: ParserAcceptedFile[]
  ): Promise<ParserBatchAsyncResponse> {
    ensureParserFileLimit(files);
    ensureParserFilesAreUnique(files);

    const batchId = randomUUID();
    const expiresAt = getParserBatchExpirationDate();
    const items = files.map((file) => {
      const itemId = randomUUID();

      return {
        id: itemId,
        batchId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        fileHash: file.fileHash,
        storagePath: buildParserStoragePath(companyId, batchId, itemId, file.fileName),
        expiresAt,
        buffer: file.buffer,
      };
    });
    const uploadedPaths: string[] = [];
    let batchCreated = false;

    try {
      for (const item of items) {
        await this.storageService.uploadFile(item.storagePath, item.buffer, item.mimeType);
        uploadedPaths.push(item.storagePath);
      }

      const batch = await this.batchRepository.createBatchWithItems(
        {
          id: batchId,
          companyId,
          createdByUserId: userId,
          voucherType: voucherKind,
          totalFiles: items.length,
          expiresAt,
        },
        items.map((item) => ({
          id: item.id,
          batchId: item.batchId,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          fileHash: item.fileHash,
          storagePath: item.storagePath,
          expiresAt: item.expiresAt,
        }))
      );
      batchCreated = true;

      await this.getRequiredAsyncBatchRunner().triggerParserBatch(batch.id);

      return {
        mode: "batch",
        batch,
      };
    } catch (error: unknown) {
      if (!batchCreated) {
        for (const uploadedPath of uploadedPaths) {
          await this.storageService.deleteFile(uploadedPath);
        }
      }

      throw error;
    }
  }

  async getBatch(companyId: string, batchId: string) {
    return this.batchRepository.findBatchById(companyId, batchId);
  }

  async retryBatch(companyId: string, batchId: string): Promise<void> {
    const batch = await this.batchRepository.findBatchById(companyId, batchId);

    if (!batch) {
      throw new ApplicationError(applicationErrorCodes.notFound, "No se encontr\u00f3 el batch solicitado", "Parser batch not found");
    }

    await this.getRequiredAsyncBatchRunner().triggerParserBatch(batchId);
  }

  async getItem(companyId: string, itemId: string) {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
      throw new ApplicationError(applicationErrorCodes.notFound, "No se encontr\u00f3 el \u00edtem solicitado", "Parser item not found");
      return null;
    }

    return item;
  }

  async retryItem(companyId: string, itemId: string): Promise<ParserBatchQueueJob> {
    const item = await this.batchRepository.findItemById(itemId);

    if (!item || item.batch.companyId !== companyId) {
    }

    const requeuedItem = await this.batchRepository.requeueItem(itemId);
    const job = {
      batchId: requeuedItem.batchId,
      itemId: requeuedItem.id,
    };

    await this.getRequiredAsyncBatchRunner().triggerParserBatch(requeuedItem.batchId);

    return job;
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

    const buffer = await this.storageService.downloadFile(item.storagePath);
    const file: ParserAcceptedFile = {
      fileName: item.fileName,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      fileHash: item.fileHash,
      buffer,
    };
    const activeCompanyCuit = await this.getActiveCompanyCuit(item.batch.companyId);
    const payload = await this.preparePayload(file, item.batch.voucherType, activeCompanyCuit);
    const nextAttempt = item.currentAttempt + 1;

    await this.batchRepository.markItemProcessing(item.id, nextAttempt, payload.strategy);

    try {
      const rawResponse = await payload.execute();
      const response = await this.responseService.buildResponse(item.batch.companyId, item.batch.voucherType, rawResponse);
      await this.batchRepository.markItemParsed(item.id, response, payload.strategy);
    } catch (error: unknown) {
      await this.batchRepository.markItemFailed(
        item.id,
        error instanceof Error ? error.message : "Unknown parser error",
        payload.strategy,
        { attemptNumber: nextAttempt }
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
