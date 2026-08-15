import prisma from "src/lib/prisma";
import { Prisma } from "src/generated/prisma/client";
import { resolveParserBatchStatus } from "src/lib/helpers/parser-batch";
import {
  ParserBatchCreateInput,
  ParserBatchItemContextRecord,
  ParserBatchItemCreateInput,
  ParserBatchItemRecord,
  ParserBatchItemStatus,
  ParserBatchRecord,
  ParserInputStrategy,
} from "src/types/parser-batch";
import { GeminiParserResponse } from "src/types/gemini-parser";

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
    parsedPayload: record.parsedPayload as GeminiParserResponse | null,
    currentError: record.currentError,
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

  async markItemParsed(itemId: string, payload: GeminiParserResponse, inputStrategy: ParserInputStrategy): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "parsed",
          inputStrategy,
          parsedPayload: payload as unknown as Prisma.InputJsonValue,
          processedAt: new Date(),
          currentError: null,
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

  async markItemFailed(
    itemId: string,
    errorMessage: string,
    inputStrategy: ParserInputStrategy,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.parserBatchItem.findUniqueOrThrow({
        where: {
          id: itemId,
        },
      });

      await tx.parserBatchItem.update({
        where: {
          id: itemId,
        },
        data: {
          status: "failed",
          inputStrategy,
          currentError: errorMessage,
          processedAt: new Date(),
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
          status: "failed",
          errorMessage,
          metadata: metadata as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

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

  async listExpiredItems(now: Date, limit: number): Promise<ParserBatchItemContextRecord[]> {
    const records = await prisma.parserBatchItem.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        status: {
          notIn: ["expired", "validated", "discarded"],
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
}
