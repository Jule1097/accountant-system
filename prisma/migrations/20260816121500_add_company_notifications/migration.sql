CREATE TABLE "public"."company_notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "targetPath" VARCHAR(500) NOT NULL,
  "sourceId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "company_notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."company_notification"
ADD CONSTRAINT "company_notification_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "public"."company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "companyNotificationSourceUnique"
ON "public"."company_notification"("companyId", "category", "sourceId");

CREATE INDEX "company_notification_companyId_createdAt_idx"
ON "public"."company_notification"("companyId", "createdAt" DESC);
