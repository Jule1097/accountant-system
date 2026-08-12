-- CreateTable
CREATE TABLE "tax_jurisdiction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tax_jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_jurisdiction_name_key" ON "tax_jurisdiction"("name");

-- AlterTable
ALTER TABLE "voucher_retention" ADD COLUMN "taxJurisdictionId" UUID;
ALTER TABLE "voucher_perception" ADD COLUMN "taxJurisdictionId" UUID;

-- Seed existing jurisdictions found in legacy rows
INSERT INTO "tax_jurisdiction" ("name")
SELECT DISTINCT normalized_name
FROM (
    SELECT
        CASE UPPER(TRIM("province"))
            WHEN 'CABA' THEN 'CABA'
            WHEN 'CIUDAD AUTONOMA DE BUENOS AIRES' THEN 'CABA'
            WHEN 'BUENOS AIRES' THEN 'Buenos Aires'
            WHEN 'PBA' THEN 'Buenos Aires'
            WHEN 'CORDOBA' THEN 'Cordoba'
            WHEN 'CÓRDOBA' THEN 'Cordoba'
            WHEN 'TUCUMAN' THEN 'Tucuman'
            WHEN 'TUCUMÁN' THEN 'Tucuman'
            WHEN 'LA PAMPA' THEN 'La Pampa'
            WHEN 'MENDOZA' THEN 'Mendoza'
            WHEN 'SANTA FE' THEN 'Santa Fe'
            WHEN 'MISIONES' THEN 'Misiones'
            WHEN 'SANTA CRUZ' THEN 'Santa Cruz'
            WHEN 'NEUQUEN' THEN 'Neuquen'
            WHEN 'NEUQUÉN' THEN 'Neuquen'
            WHEN 'ENTRE RIOS' THEN 'Entre Rios'
            WHEN 'ENTRE RÍOS' THEN 'Entre Rios'
            ELSE NULL
        END AS normalized_name
    FROM "voucher_retention"
    WHERE "province" IS NOT NULL

    UNION

    SELECT
        CASE UPPER(TRIM("province"))
            WHEN 'CABA' THEN 'CABA'
            WHEN 'CIUDAD AUTONOMA DE BUENOS AIRES' THEN 'CABA'
            WHEN 'BUENOS AIRES' THEN 'Buenos Aires'
            WHEN 'PBA' THEN 'Buenos Aires'
            WHEN 'CORDOBA' THEN 'Cordoba'
            WHEN 'CÓRDOBA' THEN 'Cordoba'
            WHEN 'TUCUMAN' THEN 'Tucuman'
            WHEN 'TUCUMÁN' THEN 'Tucuman'
            WHEN 'LA PAMPA' THEN 'La Pampa'
            WHEN 'MENDOZA' THEN 'Mendoza'
            WHEN 'SANTA FE' THEN 'Santa Fe'
            WHEN 'MISIONES' THEN 'Misiones'
            WHEN 'SANTA CRUZ' THEN 'Santa Cruz'
            WHEN 'NEUQUEN' THEN 'Neuquen'
            WHEN 'NEUQUÉN' THEN 'Neuquen'
            WHEN 'ENTRE RIOS' THEN 'Entre Rios'
            WHEN 'ENTRE RÍOS' THEN 'Entre Rios'
            ELSE NULL
        END AS normalized_name
    FROM "voucher_perception"
    WHERE "province" IS NOT NULL
) normalized_jurisdictions
WHERE normalized_name IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

-- Backfill relations from legacy text values
UPDATE "voucher_retention" retention
SET "taxJurisdictionId" = jurisdiction."id"
FROM "tax_jurisdiction" jurisdiction
WHERE jurisdiction."name" = CASE UPPER(TRIM(retention."province"))
    WHEN 'CABA' THEN 'CABA'
    WHEN 'CIUDAD AUTONOMA DE BUENOS AIRES' THEN 'CABA'
    WHEN 'BUENOS AIRES' THEN 'Buenos Aires'
    WHEN 'PBA' THEN 'Buenos Aires'
    WHEN 'CORDOBA' THEN 'Cordoba'
    WHEN 'CÓRDOBA' THEN 'Cordoba'
    WHEN 'TUCUMAN' THEN 'Tucuman'
    WHEN 'TUCUMÁN' THEN 'Tucuman'
    WHEN 'LA PAMPA' THEN 'La Pampa'
    WHEN 'MENDOZA' THEN 'Mendoza'
    WHEN 'SANTA FE' THEN 'Santa Fe'
    WHEN 'MISIONES' THEN 'Misiones'
    WHEN 'SANTA CRUZ' THEN 'Santa Cruz'
    WHEN 'NEUQUEN' THEN 'Neuquen'
    WHEN 'NEUQUÉN' THEN 'Neuquen'
    WHEN 'ENTRE RIOS' THEN 'Entre Rios'
    WHEN 'ENTRE RÍOS' THEN 'Entre Rios'
    ELSE NULL
END;

UPDATE "voucher_perception" perception
SET "taxJurisdictionId" = jurisdiction."id"
FROM "tax_jurisdiction" jurisdiction
WHERE jurisdiction."name" = CASE UPPER(TRIM(perception."province"))
    WHEN 'CABA' THEN 'CABA'
    WHEN 'CIUDAD AUTONOMA DE BUENOS AIRES' THEN 'CABA'
    WHEN 'BUENOS AIRES' THEN 'Buenos Aires'
    WHEN 'PBA' THEN 'Buenos Aires'
    WHEN 'CORDOBA' THEN 'Cordoba'
    WHEN 'CÓRDOBA' THEN 'Cordoba'
    WHEN 'TUCUMAN' THEN 'Tucuman'
    WHEN 'TUCUMÁN' THEN 'Tucuman'
    WHEN 'LA PAMPA' THEN 'La Pampa'
    WHEN 'MENDOZA' THEN 'Mendoza'
    WHEN 'SANTA FE' THEN 'Santa Fe'
    WHEN 'MISIONES' THEN 'Misiones'
    WHEN 'SANTA CRUZ' THEN 'Santa Cruz'
    WHEN 'NEUQUEN' THEN 'Neuquen'
    WHEN 'NEUQUÉN' THEN 'Neuquen'
    WHEN 'ENTRE RIOS' THEN 'Entre Rios'
    WHEN 'ENTRE RÍOS' THEN 'Entre Rios'
    ELSE NULL
END;

-- Drop legacy free-text columns
ALTER TABLE "voucher_retention" DROP COLUMN "province";
ALTER TABLE "voucher_perception" DROP COLUMN "province";

-- CreateIndex
CREATE INDEX "voucher_retention_taxJurisdictionId_idx" ON "voucher_retention"("taxJurisdictionId");
CREATE INDEX "voucher_perception_taxJurisdictionId_idx" ON "voucher_perception"("taxJurisdictionId");

-- AddForeignKey
ALTER TABLE "voucher_retention" ADD CONSTRAINT "voucher_retention_taxJurisdictionId_fkey" FOREIGN KEY ("taxJurisdictionId") REFERENCES "tax_jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "voucher_perception" ADD CONSTRAINT "voucher_perception_taxJurisdictionId_fkey" FOREIGN KEY ("taxJurisdictionId") REFERENCES "tax_jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
