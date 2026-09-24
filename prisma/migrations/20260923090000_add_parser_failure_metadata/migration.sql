ALTER TABLE "parser_batch_item"
ADD COLUMN "failureOrigin" VARCHAR(20),
ADD COLUMN "failureReason" VARCHAR(40);

UPDATE "parser_batch_item"
SET "failureOrigin" = 'parser', "failureReason" = 'unknown'
WHERE "status" = 'failed';
