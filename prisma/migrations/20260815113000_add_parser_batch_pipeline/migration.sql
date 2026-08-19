CREATE TABLE "parser_batch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "voucherType" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "totalFiles" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "parser_batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parser_batch_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batchId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" VARCHAR(64) NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "inputStrategy" VARCHAR(30),
    "status" VARCHAR(30) NOT NULL,
    "parsedPayload" JSONB,
    "currentError" TEXT,
    "currentAttempt" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMPTZ,
    "processedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "parser_batch_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parser_batch_item_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "itemId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "inputStrategy" VARCHAR(30),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "parser_batch_item_attempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "parser_batch_companyId_status_idx" ON "parser_batch"("companyId", "status");
CREATE INDEX "parser_batch_expiresAt_idx" ON "parser_batch"("expiresAt");
CREATE UNIQUE INDEX "parserBatchItemBatchFileHashUnique" ON "parser_batch_item"("batchId", "fileHash");
CREATE INDEX "parser_batch_item_batchId_status_idx" ON "parser_batch_item"("batchId", "status");
CREATE INDEX "parser_batch_item_expiresAt_idx" ON "parser_batch_item"("expiresAt");
CREATE UNIQUE INDEX "parserBatchItemAttemptItemAttemptNumberUnique" ON "parser_batch_item_attempt"("itemId", "attemptNumber");
CREATE INDEX "parser_batch_item_attempt_itemId_createdAt_idx" ON "parser_batch_item_attempt"("itemId", "createdAt");

ALTER TABLE "parser_batch"
ADD CONSTRAINT "parser_batch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parser_batch"
ADD CONSTRAINT "parser_batch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parser_batch_item"
ADD CONSTRAINT "parser_batch_item_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "parser_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parser_batch_item_attempt"
ADD CONSTRAINT "parser_batch_item_attempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "parser_batch_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
