ALTER TABLE "supplier" ADD COLUMN "taxIdentificationMode" VARCHAR(20);
UPDATE "supplier" SET "taxIdentificationMode" = 'with_cuit' WHERE "taxIdentificationMode" IS NULL;
ALTER TABLE "supplier" ALTER COLUMN "taxIdentificationMode" SET DEFAULT 'with_cuit';
ALTER TABLE "supplier" ALTER COLUMN "taxIdentificationMode" SET NOT NULL;
ALTER TABLE "supplier" ALTER COLUMN "cuit" DROP NOT NULL;
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_tax_identification_mode_check" CHECK ("taxIdentificationMode" IN ('with_cuit', 'without_cuit'));

ALTER TABLE "voucher_type" ADD COLUMN "applicability" VARCHAR(20);
UPDATE "voucher_type" SET "applicability" = 'both' WHERE "applicability" IS NULL;
ALTER TABLE "voucher_type" ALTER COLUMN "applicability" SET DEFAULT 'both';
ALTER TABLE "voucher_type" ALTER COLUMN "applicability" SET NOT NULL;
ALTER TABLE "voucher_type" ADD CONSTRAINT "voucher_type_applicability_check" CHECK ("applicability" IN ('sale', 'purchase', 'both'));

ALTER TABLE "voucher" ADD COLUMN "documentIdentificationMode" VARCHAR(20);
UPDATE "voucher" SET "documentIdentificationMode" = 'fiscal' WHERE "documentIdentificationMode" IS NULL;
ALTER TABLE "voucher" ALTER COLUMN "documentIdentificationMode" SET DEFAULT 'fiscal';
ALTER TABLE "voucher" ALTER COLUMN "documentIdentificationMode" SET NOT NULL;
ALTER TABLE "voucher" ALTER COLUMN "voucherLetterId" DROP NOT NULL;
ALTER TABLE "voucher" ALTER COLUMN "posNumber" DROP NOT NULL;
ALTER TABLE "voucher" ALTER COLUMN "number" DROP NOT NULL;
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_document_identification_mode_check" CHECK ("documentIdentificationMode" IN ('fiscal', 'non_fiscal'));
CREATE INDEX "voucher_non_fiscal_duplicate_lookup_idx" ON "voucher" ("companyId", "supplierId", "date", "totalAmount", "documentIdentificationMode");
