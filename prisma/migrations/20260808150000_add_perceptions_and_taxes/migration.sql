-- AlterTable
ALTER TABLE "voucher" ADD COLUMN     "exemptAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "nonTaxableAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "otherTaxesAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE "perception_concept" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "perception_concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_perception" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucherId" UUID NOT NULL,
    "perceptionConceptId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "province" VARCHAR(100),

    CONSTRAINT "voucher_perception_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perception_concept_name_key" ON "perception_concept"("name");

-- AddForeignKey
ALTER TABLE "voucher_perception" ADD CONSTRAINT "voucher_perception_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_perception" ADD CONSTRAINT "voucher_perception_perceptionConceptId_fkey" FOREIGN KEY ("perceptionConceptId") REFERENCES "perception_concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
