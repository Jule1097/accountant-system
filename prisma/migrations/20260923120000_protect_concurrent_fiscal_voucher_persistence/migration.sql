DO $$
DECLARE
  duplicate_groups TEXT;
BEGIN
  SELECT string_agg(
    format('company=%s type=%s voucher_type=%s client=%s count=%s', "companyId", "type", "voucherTypeId", "clientId", duplicate_count),
    '; '
  )
  INTO duplicate_groups
  FROM (
    SELECT "companyId", "type", "voucherTypeId", "clientId", COUNT(*) AS duplicate_count
    FROM "voucher"
    WHERE "documentIdentificationMode" = 'fiscal' AND "type" = 'sale'
    GROUP BY "companyId", "type", "voucherTypeId", "voucherLetterId", "posNumber", "number", "clientId"
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
    LIMIT 20
  ) AS sale_duplicates;

  IF duplicate_groups IS NOT NULL THEN
    RAISE EXCEPTION 'Historical fiscal sale voucher duplicates require manual reconciliation' USING DETAIL = duplicate_groups;
  END IF;

  SELECT string_agg(
    format('company=%s type=%s voucher_type=%s supplier=%s count=%s', "companyId", "type", "voucherTypeId", "supplierId", duplicate_count),
    '; '
  )
  INTO duplicate_groups
  FROM (
    SELECT "companyId", "type", "voucherTypeId", "supplierId", COUNT(*) AS duplicate_count
    FROM "voucher"
    WHERE "documentIdentificationMode" = 'fiscal' AND "type" = 'purchase'
    GROUP BY "companyId", "type", "voucherTypeId", "voucherLetterId", "posNumber", "number", "supplierId"
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
    LIMIT 20
  ) AS purchase_duplicates;

  IF duplicate_groups IS NOT NULL THEN
    RAISE EXCEPTION 'Historical fiscal purchase voucher duplicates require manual reconciliation' USING DETAIL = duplicate_groups;
  END IF;
END $$;

CREATE UNIQUE INDEX "voucher_fiscal_sale_identity_unique"
ON "voucher" ("companyId", "type", "voucherTypeId", "voucherLetterId", "posNumber", "number", "clientId") NULLS NOT DISTINCT
WHERE "documentIdentificationMode" = 'fiscal' AND "type" = 'sale';

CREATE UNIQUE INDEX "voucher_fiscal_purchase_identity_unique"
ON "voucher" ("companyId", "type", "voucherTypeId", "voucherLetterId", "posNumber", "number", "supplierId") NULLS NOT DISTINCT
WHERE "documentIdentificationMode" = 'fiscal' AND "type" = 'purchase';
