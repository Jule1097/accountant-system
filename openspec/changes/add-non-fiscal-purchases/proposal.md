## Why

Some purchase records, such as expense settlements and banking or tax payments, do not have a supplier CUIT or a fiscal letter, point of sale, and voucher number. The current mandatory fiscal fields prevent recording those purchases accurately and cause artificial values or false duplicate conflicts.

## What Changes

- Allow suppliers to be registered with or without a CUIT, while preserving company-scoped duplicate protection.
- Derive each purchase voucher's fiscal or non-fiscal identification mode from its supplier and preserve that mode as historical voucher data.
- Require fiscal numbering only for purchases from suppliers with a CUIT; store fiscal numbering fields as null for purchases from suppliers without a CUIT.
- Keep strict duplicate prevention for fiscal purchases and add a confirmation-based duplicate warning for non-fiscal purchases with the same supplier, date, and total amount.
- Add purchase-only voucher types and persist voucher type applicability so Sales and Purchases expose and validate only compatible catalog entries.
- Update supplier and purchase UI, voucher tables, details, deletion copy, and exports to display intentional missing fiscal data clearly.
- Keep AI or batch items pending review when their supplier cannot be identified, instead of automatically creating a supplier without a CUIT.

## Capabilities

### New Capabilities

- `non-fiscal-purchases`: Records and presents purchases without fiscal numbering based on supplier tax identification.

### Modified Capabilities

- `third-party-domain`: Suppliers may have an explicit tax-identification mode and an optional CUIT.
- `voucher-tables`: Purchase tables and forms adapt fiscal fields and presentation to the persisted purchase identification mode.
- `voucher-export`: Purchase exports represent non-fiscal identification explicitly and safely handle absent CUIT and numbering values.

## Impact

- Affected persistence and migrations: `Supplier`, `Voucher`, and `VoucherType` tables and Prisma schema.
- Affected validation and domain contracts: supplier, voucher, catalog, duplicate detection, API DTOs, and serializer mappings.
- Affected UI: supplier dialogs and tables; purchase form, detail, table, deletion dialog, duplicate confirmation, and export columns.
- Affected parser workflow: unresolved supplier identification remains a review state.
- Requires Jest coverage for schemas, services, repositories, API routes, UI behavior, parser persistence, and exports.
