ALTER TABLE "retention_concept" DROP COLUMN IF EXISTS "type";

DO $$
DECLARE
  canonical_record RECORD;
  duplicate_id UUID;
BEGIN
  FOR canonical_record IN
    SELECT canonical.id::UUID AS target_id, canonical.name AS canonical_name
    FROM (VALUES
      ('d126dc29-3ebc-4b68-b854-e0eadf536304', 'Retención de Ganancias'),
      ('49fb0762-ca71-410a-86a9-267b977c3cf6', 'Retención de IIBB'),
      ('8e2739fe-e477-4007-99ec-9782a1326be2', 'Retención de IVA'),
      ('aed304a0-4552-45ec-a90c-42267ef2f8a1', 'Retención OSSEG/ANSAL')
    ) AS canonical(id, name)
  LOOP
    IF EXISTS (SELECT 1 FROM "retention_concept" WHERE "id" = canonical_record.target_id) THEN
      duplicate_id := NULL;
      SELECT "id" INTO duplicate_id
      FROM "retention_concept"
      WHERE "name" = canonical_record.canonical_name
        AND "id" <> canonical_record.target_id;

      IF duplicate_id IS NOT NULL THEN
        UPDATE "voucher_retention"
        SET "retentionConceptId" = canonical_record.target_id
        WHERE "retentionConceptId" = duplicate_id;

        DELETE FROM "retention_concept"
        WHERE "id" = duplicate_id;
      END IF;

      UPDATE "retention_concept"
      SET "name" = canonical_record.canonical_name
      WHERE "id" = canonical_record.target_id;
    END IF;
  END LOOP;
END $$;

DELETE FROM "retention_concept"
WHERE "id" IN (
  'e91f6b54-01cb-444c-b953-db9b7cd81135',
  '2f50d269-5038-44d7-abb4-2aa4a8fc1621',
  '49898156-d483-4341-a60f-da52f0c52bba',
  'af59faf9-e45e-411f-8845-349df03a71cb',
  '25ceed96-0eac-4cc1-9767-6cf76e55ed9b',
  '1b41cee8-216e-4ad1-bad8-db0fdca77e0c'
);

DO $$
DECLARE
  duplicate_id UUID;
BEGIN
  duplicate_id := NULL;
  SELECT "id" INTO duplicate_id
  FROM "perception_concept"
  WHERE "name" = 'Percepción de IIBB'
    AND "id" <> 'ea4607c4-fa7f-4c33-b3ef-2c4dbb72c25b';

  IF duplicate_id IS NOT NULL THEN
    UPDATE "voucher_perception"
    SET "perceptionConceptId" = 'ea4607c4-fa7f-4c33-b3ef-2c4dbb72c25b'
    WHERE "perceptionConceptId" = duplicate_id;

    DELETE FROM "perception_concept"
    WHERE "id" = duplicate_id;
  END IF;

  UPDATE "perception_concept"
  SET "name" = 'Percepción de IIBB'
  WHERE "id" = 'ea4607c4-fa7f-4c33-b3ef-2c4dbb72c25b';
END $$;

DELETE FROM "perception_concept"
WHERE "id" = 'caa68a9f-9f4b-4c00-a590-8d5c17bd1bbf';

INSERT INTO "perception_concept" ("name")
VALUES ('Otros Impuestos')
ON CONFLICT ("name") DO NOTHING;
