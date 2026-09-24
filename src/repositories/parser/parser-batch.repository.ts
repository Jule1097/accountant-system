import prisma from "src/lib/database/prisma";
import { Prisma } from "src/generated/prisma/client";
import { resolveParserBatchStatus } from "src/lib/helpers/parser/parser-batch";
import {
  ParserBatchCreateInput,
  ParserBatchItemContextRecord,
  ParserBatchItemCreateInput,
  ParserBatchItemRecord,
  ParserBatchItemStatus,
  ParserBatchRecord,
  ParserInputStrategy,
} from "src/types/parser/parser-batch";
import { ParsedVoucherData } from "src/types/parser/gemini-parser";
import { VoucherFormPayload } from "src/types/voucher/voucher-form";
import { ApplicationError } from "src/lib/errors/application-error";
import { applicationErrorCodes } from "src/lib/constants/application-error";
import { parserRetryMessages } from "src/lib/constants/parser";
import { isParserBatchExpired } from "src/lib/helpers/parser/parser-batch";

interface ParserBatchReviewFilter {
  companyId: string;
  voucherType: ParserBatchRecord["voucherType"];
  batchId?: string;
}

function toPrismaJsonValue(value: object): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

const parserBatchInclude = {
  items: {
    include: {
      attempts: {
        orderBy: {
          attemptNumber: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.ParserBatchInclude;

const parserBatchItemInclude = {
  attempts: {
    orderBy: {
      attemptNumber: "asc",
    },
  },
  batch: true,
} satisfies Prisma.ParserBatchItemInclude;

async function syncBatchStatus(
  tx: Prisma.TransactionClient,
  batchId: string
): Promise<void> {
  const items = await tx.parserBatchItem.findMany({
    where: {
      batchId,
    },
    include: {
      attempts: true,
    },
  });
  const status = resolveParserBatchStatus(items.map(mapParserBatchItem));

  await tx.parserBatch.update({
    where: {
      id: batchId,
    },
    data: {
      status,
    },
  });
}

function mapParserBatchItem(record: Prisma.ParserBatchItemGetPayload<{ include: { attempts: true } }>): ParserBatchItemRecord {
  return {
    id: record.id,
    batchId: record.batchId,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    fileHash: record.fileHash,
    storagePath: record.storagePath,
    inputStrategy: record.inputStrategy as ParserInputStrategy | null,
    status: record.status as ParserBatchItemStatus,
    parsedPayload: record.parsedPayload as ParsedVoucherData | null,
    validatedPayload: record.validatedPayload as VoucherFormPayload | null,
    currentError: record.currentError,
    failureOrigin: record.failureOrigin === "parser" ? "parser" : null,
    failureReason: record.failureReason as ParserBatchItemRecord["failureReason"],
    currentAttempt: record.currentAttempt,
    queuedAt: record.queuedAt?.toISOString() || null,
    processedAt: record.processedAt?.toISOString() || null,
    expiresAt: record.expiresAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    attempts: record.attempts.map((attempt) => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status as ParserBatchItemStatus,
      inputStrategy: attempt.inputStrategy as ParserInputStrategy | null,
      errorMessage: attempt.errorMessage,
      metadata: attempt.metadata as Record<string, unknown> | null,
      startedAt: attempt.startedAt?.toISOString() || null,
      completedAt: attempt.completedAt?.toISOString() || null,
      createdAt: attempt.createdAt.toISOString(),
    })),
  };
}

function mapParserBatch(record: Prisma.ParserBatchGetPayload<{ include: typeof parserBatchInclude }>): ParserBatchRecord {
  const items = record.items.map(mapParserBatchItem);

  return {
    id: record.id,
    companyId: record.companyId,
    createdByUserId: record.createdByUserId,
    voucherType: record.voucherType as ParserBatchRecord["voucherType"],
    status: resolveParserBatchStatus(items),
    totalFiles: record.totalFiles,
    expiresAt: record.expiresAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    items,
  };
}

function mapParserBatchItemContext(
  record: Prisma.ParserBatchItemGetPayload<{ include: typeof parserBatchItemInclude }>
): ParserBatchItemContextRecord {
  return {
    ...mapParserBatchItem(record),
    batch: {
      id: record.batch.id,
      companyId: record.batch.companyId,
      createdByUserId: record.batch.createdByUserId,
      voucherType: record.batch.voucherType as ParserBatchRecord["voucherType"],
      status: record.batch.status as ParserBatchRecord["status"],
      expiresAt: record.batch.expiresAt.toISOString(),
    },
  };
}

function buildReviewWhereClause(filter: ParserBatchReviewFilter): Prisma.ParserBatchItemWhereInput {
  return {
    status: {
      notIn: ["expired", "persisting", "persisted", "discarded"],
    },
    batch: {
      companyId: filter.companyId,
      voucherType: filter.voucherType,
      id: filter.batchId,
    },
  };
}

export class ParserBatchRepository {
  async createBatchWithItems(batch: ParserBatchCreateInput, items: ParserBatchItemCreateInput[]): Promise<ParserBatchRecord> {
    const record = await prisma.parserBatch.create({
      data: {
        id: batch.id,
        companyId: batch.companyId,
        createdByUserId: batch.createdByUserId,
        voucherType: batch.voucherType,
        status: "queued",
        totalFiles: batch.totalFiles,
        expiresAt: batch.expiresAt,
        items: {
          create: items.map((item) => ({
            id: item.id,
            fileName: item.fileName,
            mimeType: item.mimeType,
            fileSize: item.fileSize,
            fileHash: item.fileHash,
            storagePath: item.storagePath,
            status: "queued",
            expiresAt: item.expiresAt,
            queuedAt: new Date(),
          })),
        },
      },
      include: parserBatchInclude,
    });

    return mapParserBatch(record);
  }

  async findBatchById(companyId: string, batchId: string): Promise<ParserBatchRecord | null> {
    const record = await prisma.parserBatch.findFirst({
      where: {
        id: batchId,
        companyId,
      },
      include: parserBatchInclude,
    });

    if (!record) {
      return null;
    }

    return mapParserBatch(record);
  }

  async hasActiveBatch(companyId: string): Promise<boolean> {
    const batch = await prisma.parserBatch.findFirst({
      where: {
        companyId,
        status: {
          in: ["queued", "processing"],
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    })

    return Boolean(batch)
  }

  async findItemById(itemId: string): Promise<ParserBatchItemContextRecord | null> {
    const record = await prisma.parserBatchItem.findUnique({
      where: {
        id: itemId,
      },
      include: parserBatchItemInclude,
    });

    if (!record) {
      return null;
    }

    return mapParserBatchItemContext(record);
  }

  async listReviewItems(filter: ParserBatchReviewFilter): Promise<ParserBatchItemContextRecord[]> {
    const records = await prisma.parserBatchItem.findMany({
      where: buildReviewWhereClause(filter),
      include: parserBatchItemInclude,
      orderBy: [
        {
          batch: {
            createdAt: "desc",
          },
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return records.map(mapParserBatchItemContext);
  }

  async listRecoverableItems(limit: number): Promise<ParserBatchItemContextRecord[]> {
    const records = await prisma.parserBatchItem.findMany({
      where: {
        status: {
          in: ["queued", "processing"],
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      include: parserBatchItemInclude,
      take: limit,
      orderBy: [
        {
          queuedAt: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return records.map(mapParserBatchItemContext);
  }

  async listItemIdsByBatchAndStatuses(batchId: string, statuses: ParserBatchItemStatus[]): Promise<string[]> {
    const records = await prisma.parserBatchItem.findMany({
      where: {
        batchId,
        status: {
          in: statuses,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map((record) => record.id);
  }

  async markItemProcessing(itemId: string, attemptNumber: number, inputStrategy: ParserInputStrategy): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "processing",
          inputStrategy,
          currentAttempt: attemptNumber,
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      await tx.parserBatchItemAttempt.create({
        data: {
          itemId,
          attemptNumber,
          status: "processing",
          inputStrategy,
          startedAt: new Date(),
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async markItemParsed(itemId: string, payload: ParsedVoucherData, inputStrategy: ParserInputStrategy): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "parsed",
          inputStrategy,
          parsedPayload: toPrismaJsonValue(payload),
          validatedPayload: Prisma.JsonNull,
          processedAt: new Date(),
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      await tx.parserBatchItemAttempt.update({
        where: {
          parserBatchItemAttemptItemAttemptNumberUnique: {
            itemId,
            attemptNumber: item.currentAttempt,
          },
        },
        data: {
          status: "parsed",
          completedAt: new Date(),
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async markItemDuplicate(itemId: string, payload: ParsedVoucherData, inputStrategy: ParserInputStrategy): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "duplicate",
          inputStrategy,
          parsedPayload: toPrismaJsonValue(payload),
          validatedPayload: Prisma.JsonNull,
          processedAt: new Date(),
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      await tx.parserBatchItemAttempt.update({
        where: {
          parserBatchItemAttemptItemAttemptNumberUnique: {
            itemId,
            attemptNumber: item.currentAttempt,
          },
        },
        data: {
          status: "duplicate",
          completedAt: new Date(),
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async markItemFailed(
    itemId: string,
    errorMessage: string,
    inputStrategy: ParserInputStrategy,
    metadata: Record<string, unknown>,
    failureReason: ParserBatchItemRecord["failureReason"] = "unknown",
    attemptNumber?: number,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.findUniqueOrThrow({
        where: {
          id: itemId,
        },
      });
      const resolvedAttemptNumber = attemptNumber || item.currentAttempt || 1;

      await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "failed",
          inputStrategy,
          currentError: errorMessage,
          failureOrigin: "parser",
          failureReason,
          currentAttempt: resolvedAttemptNumber,
          processedAt: new Date(),
        },
      });

      const attempt = await tx.parserBatchItemAttempt.findUnique({
        where: {
          parserBatchItemAttemptItemAttemptNumberUnique: {
            itemId,
            attemptNumber: resolvedAttemptNumber,
          },
        },
      });

      if (attempt) {
        await tx.parserBatchItemAttempt.update({
          where: {
            parserBatchItemAttemptItemAttemptNumberUnique: {
              itemId,
              attemptNumber: resolvedAttemptNumber,
            },
          },
          data: {
            status: "failed",
            inputStrategy,
            errorMessage,
            metadata: toPrismaJsonValue(metadata),
            completedAt: new Date(),
          },
        });
      }

      if (!attempt) {
        await tx.parserBatchItemAttempt.create({
          data: {
            itemId,
            attemptNumber: resolvedAttemptNumber,
            status: "failed",
            inputStrategy,
            errorMessage,
            metadata: toPrismaJsonValue(metadata),
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      }

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async requeueItem(itemId: string): Promise<ParserBatchItemContextRecord> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "queued",
          currentError: null,
          failureOrigin: null,
          failureReason: null,
          queuedAt: new Date(),
          processedAt: null,
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });

    const item = await this.findItemById(itemId);

    if (!item) {
      throw new Error("Parser item not found");
    }

    return item;
  }

  async requeueFailedItems(companyId: string, itemIds: string[]): Promise<ParserBatchItemContextRecord[]> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const records = await tx.parserBatchItem.findMany({
        where: {
          id: { in: itemIds },
          batch: { companyId },
        },
        include: parserBatchItemInclude,
      });
      const items = records.map(mapParserBatchItemContext);

      if (items.length !== itemIds.length) {
        throw new ApplicationError(applicationErrorCodes.notFound, parserRetryMessages.itemUnavailable, "Parser retry item is not available for the active company");
      }

      for (const item of items) {
        if (item.status !== "failed" || (item.failureOrigin && item.failureOrigin !== "parser")) {
          throw new ApplicationError(applicationErrorCodes.conflict, parserRetryMessages.itemUnavailable, "Parser retry item is not eligible");
        }

        if (isParserBatchExpired(item.expiresAt, now)) {
          throw new ApplicationError(applicationErrorCodes.conflict, parserRetryMessages.itemUnavailable, "Parser retry item has expired");
        }
      }

      const updateResult = await tx.parserBatchItem.updateMany({
        where: {
          id: { in: itemIds },
          status: "failed",
          expiresAt: { gt: now },
          batch: { companyId },
        },
        data: {
          status: "queued",
          currentError: null,
          failureOrigin: null,
          failureReason: null,
          queuedAt: new Date(),
          processedAt: null,
        },
      });

      if (updateResult.count !== itemIds.length) {
        throw new ApplicationError(applicationErrorCodes.conflict, parserRetryMessages.itemUnavailable, "Parser retry item changed before requeue");
      }

      const batchIds = [...new Set(items.map((item) => item.batchId))];
      for (const batchId of batchIds) {
        await syncBatchStatus(tx, batchId);
      }

      const updatedRecords = await tx.parserBatchItem.findMany({
        where: { id: { in: itemIds } },
        include: parserBatchItemInclude,
      });

      return updatedRecords.map(mapParserBatchItemContext);
    });
  }

  async listExpiredItems(now: Date, limit: number): Promise<ParserBatchItemContextRecord[]> {
    const records = await prisma.parserBatchItem.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        status: {
          notIn: ["expired", "validated", "persisting", "persisted", "discarded"],
        },
      },
      include: parserBatchItemInclude,
      take: limit,
      orderBy: {
        expiresAt: "asc",
      },
    });

    return records.map(mapParserBatchItemContext);
  }

  async markItemExpired(itemId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "expired",
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async markItemValidated(itemId: string, validatedPayload: VoucherFormPayload): Promise<ParserBatchItemContextRecord> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "validated",
          validatedPayload: toPrismaJsonValue(validatedPayload),
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });

    const item = await this.findItemById(itemId);

    if (!item) {
      throw new Error("Parser item not found");
    }

    return item;
  }

  async listValidatedItemsByBatch(companyId: string, batchId: string): Promise<ParserBatchItemContextRecord[]> {
    const records = await prisma.parserBatchItem.findMany({
      where: {
        batchId,
        status: "validated",
        batch: {
          companyId,
        },
      },
      include: parserBatchItemInclude,
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map(mapParserBatchItemContext);
  }

  async claimValidatedItemForPersistence(itemId: string): Promise<ParserBatchItemContextRecord | null> {
    const result = await prisma.parserBatchItem.updateMany({
      where: {
        id: itemId,
        status: "validated",
      },
      data: {
        status: "persisting",
        currentError: null,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findItemById(itemId);
  }

  async markItemPersisting(itemId: string): Promise<ParserBatchItemContextRecord> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "persisting",
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });

    const item = await this.findItemById(itemId);

    if (!item) {
      throw new Error("Parser item not found");
    }

    return item;
  }

  async restoreItemsToValidated(itemIds: string[]): Promise<void> {
    if (!itemIds.length) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      const items = await tx.parserBatchItem.findMany({
        where: {
          id: { in: itemIds },
          status: "persisting",
        },
        select: { batchId: true },
      });

      await tx.parserBatchItem.updateMany({
        where: {
          id: { in: itemIds },
          status: "persisting",
        },
        data: {
          status: "validated",
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      for (const batchId of [...new Set(items.map((item) => item.batchId))]) {
        await syncBatchStatus(tx, batchId);
      }
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.findUniqueOrThrow({
        where: {
          id: itemId,
        },
        select: {
          batchId: true,
        },
      });

      await tx.parserBatchItem.delete({
        where: {
          id: itemId,
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async markItemPersisted(itemId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "persisted",
          currentError: null,
          failureOrigin: null,
          failureReason: null,
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });
  }

  async markItemPersistenceFailed(itemId: string, errorMessage: string): Promise<void> {
    void errorMessage;
    await this.restoreItemsToValidated([itemId]);
  }

  async discardItem(itemId: string): Promise<ParserBatchItemContextRecord> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "discarded",
        },
      });

      await syncBatchStatus(tx, item.batchId);
    });

    const item = await this.findItemById(itemId);

    if (!item) {
      throw new Error("Parser item not found");
    }

    return item;
  }
}
