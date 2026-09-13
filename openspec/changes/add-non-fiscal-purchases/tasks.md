## 1. Persistence and contract tests

- [x] 1.1 Add failing unit and integration tests for supplier tax-identification modes, nullable supplier CUITs, company-scoped duplicate names, and prohibited CUIT removal after purchases exist.
- [x] 1.2 Add failing unit and integration tests for fiscal and non-fiscal purchase modes, supplier-change conversions, historical purchase editability, and duplicate confirmation behavior.
- [x] 1.3 Add failing tests for voucher-type applicability, including purchase-only catalog filtering and sale API rejection.
- [x] 1.4 Add a Prisma migration for supplier tax-identification mode and nullable CUIT, voucher document-identification mode and nullable fiscal fields, and voucher-type applicability.
- [x] 1.5 Backfill existing supplier, voucher, and voucher-type records and add idempotent seeds for purchase-only voucher types.

## 2. Server-side business rules

- [x] 2.1 Update supplier domain models, schemas, DTOs, mappers, repositories, and services to support `with_cuit` and `without_cuit` while keeping clients unchanged.
- [x] 2.2 Update voucher domain inputs, persistence mappings, serializers, schemas, and service validation to persist purchase identification modes and preserve historical non-fiscal purchases.
- [x] 2.3 Enforce compatible supplier changes, normalize non-fiscal fiscal fields to null, and reject incompatible direct API requests with Spanish user-facing errors.
- [x] 2.4 Implement strict fiscal duplicate checks and confirmation-gated non-fiscal duplicate warnings at repository and API boundaries.
- [x] 2.5 Add voucher-type applicability to catalog loading and server-side voucher validation.

## 3. Supplier and purchase user experience

- [x] 3.1 Update supplier create, edit, detail, inline-create, and table views for `Con CUIT` and `Sin CUIT` behavior and labels.
- [x] 3.2 Update purchase form state and validation to derive fiscal field visibility and requiredness from the selected supplier without a manual mode selector.
- [x] 3.3 Add explicit purchase conversion confirmation when changing suppliers requires a fiscality change.
- [x] 3.4 Add the non-fiscal possible-duplicate confirmation flow with `Cancelar` and `Guardar de todos modos`.
- [x] 3.5 Update purchase table, voucher detail, and generic deletion confirmation copy to render non-fiscal values without null-derived identifiers.
- [x] 3.6 Filter voucher-type selectors by applicability on Sales and Purchases screens.

## 4. Parser and export integration

- [x] 4.1 Keep unresolved purchase parser and batch items pending review rather than creating an unidentified supplier automatically.
- [x] 4.2 Update purchase export rows and worksheets to add identification, preserve empty non-fiscal cells, and retain fiscal export behavior.

## 5. Verification

- [x] 5.1 Update and run focused Jest suites for supplier, voucher, parser, table, modal, API, repository, and export behavior.
- [x] 5.2 Run Prisma validation and migration checks, lint, type checks, and the relevant production build checks.
- [x] 5.3 Review changed UI copy, API errors, logs, exports, and generated artifacts for Spanish user-facing text, English technical text, absence of sentinel values, and absence of secrets or temporary files.
