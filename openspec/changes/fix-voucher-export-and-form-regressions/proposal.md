## Why

Voucher exports and voucher form recovery flows have regressions that produce unusable local dates, incorrect purchase tax columns and values, missing third-party recovery actions, and inconsistent voucher-letter selection. The tax concept catalogs also contain misclassified and duplicated records that conflict with the sales-retention and purchase-perception workflows.

## What Changes

- Export sales and purchases dates as locally formatted Excel date values.
- Update purchase exports so exempt amounts are included in Subtotal, the Exento column and OSSEG perceptions are removed.
- Preserve subtractive export values for credit notes and sales retentions; MiPyME electronic credit invoices remain positive.
- Keep the inline client or supplier creation action available whenever the voucher form has no selected third party, including when AI parsing returns no usable identity data.
- Invalidate voucher-form third-party option caches after clients or suppliers are created from their management screens.
- Strengthen parsed voucher-letter selection, including a standard invoice with letter A.
- Keep retention and perception concepts in separate catalogs, remove the redundant retention applicability field, and normalize each catalog to its approved short labels.
- Keep AI-parsed tax data aligned with the active voucher workflow and classify `Otros Impuestos` exclusively as a purchase perception when it is identified as such.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `voucher-export`: Local Excel date values, purchase export layout, OSSEG exclusion, and signed amount behavior.
- `voucher-tables`: Voucher modal third-party recovery, parsed voucher-letter selection, and canonical tax concept options.
- `third-party-domain`: Client and supplier creation must refresh dependent voucher-form option data.

## Impact

- Affects the Prisma schema, catalog migration and seed data, voucher tax selectors, export mapping, and Excel workbook generation.
- Affects AI parser responses and prompts, voucher form parsing, inline third-party UI, and third-party management cache invalidation.
- Adds focused Jest coverage for exports, modal interaction, parsed form state, and third-party option refreshes.
