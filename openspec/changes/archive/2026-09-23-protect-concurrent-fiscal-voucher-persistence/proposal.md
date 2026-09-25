## Why

Fiscal voucher duplicate detection currently checks for an existing record before inserting, which is correct for serial requests but can allow two concurrent persistence operations from separate batches to insert the same voucher. The database must enforce the fiscal document identity so background and individual persistence cannot create duplicates under timing races.

## What Changes

- Define a database-enforced uniqueness guarantee for fiscal vouchers using the same identity used by duplicate detection.
- Preserve the current behavior that allows explicitly confirmed non-fiscal duplicate purchases.
- Remove the losing staged item and its temporary source file when fiscal uniqueness is lost during persistence; do not leave an operational duplicate message in conciliations.
- Restore validated items after non-duplicate technical persistence failures so they can be saved again without reparsing.
- Add migration preflight that blocks safely when historical fiscal duplicates exist; it MUST not automatically delete or merge voucher records.
- Add concurrency coverage for individual persistence, independent persistence batches, and mixed persistence paths.

## Capabilities

### New Capabilities

- `fiscal-voucher-persistence-integrity`: Defines concurrent persistence protection and safe migration behavior for fiscal voucher identity.

### Modified Capabilities

- None.

## Impact

- Affects the voucher database schema and migration process, voucher creation error handling, parser persistence results, and persistence tests.
- Applies to fiscal sales and purchases only; non-fiscal purchase confirmation remains unchanged.
- Requires deployment verification against existing production data before the uniqueness constraint is enabled.
