## Why

The current database schema was designed assuming that all tax withholdings (retentions) are subtracted from the total voucher amount. This logic is correct for sales receipts, but it fails to support purchase invoices where perceptions must be added to the gross value. Additionally, the system needs to separate exempt, non-taxable amounts, and other taxes to accurately generate VAT books and AFIP reports in Argentina.

## What Changes

- Create a new catalog model `PerceptionConcept` to define perception concepts (e.g., "Percepción IIBB", "Percepción IVA").
- Create a new transactional model `VoucherPerception` to record the perceptions applied to a voucher, which will be added to the total amount.
- Modify the `Voucher` model to include `nonTaxableAmount`, `exemptAmount`, and `otherTaxesAmount` fields.
- Update the mathematical formula documented in the `Voucher` model: the voucher's total will include the subtotal (taxable net) plus VAT, perceptions, exempt, non-taxable amounts, and other taxes.

## Capabilities

### New Capabilities
- `voucher-taxes-and-perceptions`: Management of perceptions, exempt amounts, non-taxable amounts, and other taxes at the voucher level.

### Modified Capabilities

## Impact

- `prisma/schema.prisma`: Two new models will be created and fields in the `Voucher` model will be modified.
- Prisma Client Generator: Must be updated to reflect the new fields and relationships.
