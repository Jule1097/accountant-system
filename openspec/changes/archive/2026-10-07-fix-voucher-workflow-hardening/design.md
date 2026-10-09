# Design

## Context

See proposal.md for motivation. Current forms accept an editable total and the client recalculates only sales subtotal from a parser or manually supplied total. The domain already recalculates sales and purchase amounts, but export and parser jurisdiction handling still rely on fixed source-code lists. Failed conciliation items have source files and recovery actions but cannot be manually persisted.

## Goals / Non-Goals

**Goals:**

- Establish one reusable calculation contract for form presentation and backend persistence.
- Make catalog changes visible in exports without deploys.
- Turn invalid boundary values into controlled validation responses.
- Recover failed parser items without a validation staging step.

**Non-Goals:**

- Modify or backfill historical voucher records.
- Change PDF preview controls or add unsupported upload formats.
- Add new persisted monetary columns solely for gross display values.

## Decisions

### Derived amount contract

The form will derive read-only gross and net display values from the same calculation rules used by the voucher domain. The backend will recalculate amounts immediately before persistence and will not trust a client or parser total. Sales will force purchase-only amounts to zero; purchase gross remains a derived display value while persisted `totalAmount` and `netAmount` retain their established final-payable behavior.

Using client-only calculations was rejected because manipulated requests and parser inconsistencies would remain possible. Persisting an additional gross column was rejected because it duplicates derivable accounting data.

### Parser amount boundary

`totalAmount` will be removed from the parser's client-facing structured response, repair fields, form patches, persistence payloads, and parser tests. The provider-level raw extraction may include a transient `taxIncludedAmount` only for sales vouchers of letter B. The backend response service will calculate `subtotal = taxIncludedAmount - vatAmount`, omit `taxIncludedAmount` from `ParsedVoucherData`, and never expose or persist it. The form will receive only component fields so the user can complete absent values manually.

Keeping a parser total as an advisory client or persistence value was rejected because it creates a conflicting source of truth. The backend-only tax-included source is retained solely to resolve the source document's B-voucher subtotal before the client boundary.

### Purchase other-tax boundary

Purchase forms will not expose a direct `otherTaxesAmount` input. New and updated purchases will persist `otherTaxesAmount` as zero, while the existing database column remains available for historical records without backfill. Recognized perception concepts remain separate. Unmapped purchase tax lines will be aggregated into one perception using the catalog concept `Otros Impuestos`. If mapped or unmapped perception lines exist, their sum takes precedence over the provider's generic `otherTaxesAmount`; the generic value is converted into one `Otros Impuestos` perception only when no applicable tax lines exist. These amounts contribute to purchase perceptions and therefore net payable, not gross display.

### Dynamic export jurisdictions

The export service will request tax jurisdictions from the catalog repository and construct stable, catalog-driven jurisdiction columns and row keys. Row assignment will use the persisted jurisdiction relation/name, not the parser's static alias table. Existing non-jurisdiction concept columns remain catalog-driven.

Static jurisdiction arrays were rejected because they require releases for normal catalog maintenance. Unmapped historical values will retain the existing safe fallback behavior where applicable, without changing stored data.

### Validation boundary alignment

Constants will define input limits shared by UI and Zod schemas. Server validation will enforce storage-compatible point-of-sale, voucher-number, and payment-method lengths before repository calls. Parser aggregate-size errors will remain application validation errors and receive route-level regression coverage.

### Public API error boundary

Known validation and request-shape failures will be represented by the existing application error response boundary so every route returns its actionable Spanish message in the top-level `error` field. Shared request parsing and validation response helpers will be reused by JSON and multipart endpoints. The client API resolver and existing toast flow remain unchanged because they already consume that field.

Malformed request bodies will return controlled HTTP 400 responses. Unexpected errors will remain HTTP 500 responses with the generic public message, while internal logs retain contextual diagnostics without exposing implementation details.

### Canonical date integrity

One shared date guard will validate exact `YYYY-MM-DD` syntax, real calendar validity, and the inclusive business range from `1900-01-01` through `2100-12-31`. Zod schemas will reuse that guard at user-facing and transport boundaries so forms can show field errors and APIs can reject bypassed requests. Domain and persistence adapters will invoke the same guard as their final application-level check.

Voucher `date`, `accountingPeriod`, and `paymentDate` are the only user-supplied date columns currently stored as database dates, so a migration will add range checks for those columns. Parser/import outputs with invalid dates will remain reviewable but cannot become validated or persisted. Read mapping will surface an integrity error for corrupt legacy data rather than correcting it, while route-level isolation prevents an affected resource from collapsing unrelated dashboard requests.

Relying only on `z.coerce.date` was rejected because it permits coercion and does not protect domain, persistence, database, or corrupted-read boundaries. Duplicating calendar logic in each layer was rejected because it creates inconsistent acceptance rules.

### Preview interaction model

A reusable raster preview state will own zoom and rotation. It resets on unmount/close and is used wherever PNG/JPEG voucher documents are previewed. PDF state remains isolated because its page controls are not meaningful for images.

### Manual failed-item recovery

A dedicated authenticated endpoint will verify company ownership and failed status, validate the voucher input, create the voucher through the normal service, then remove the source object and parser item. Failure before successful persistence leaves the item intact. Cleanup failure after persistence will retain a cleanup-pending item that exposes only explicit deletion, while logs record item, company, workflow, and storage-provider context without exposing internals to the user.

Reusing the validated persistence queue was rejected because the user explicitly requires direct creation from an Error item without the Validada state.

## Risks / Trade-offs

- [Client and backend calculations diverge] → Reuse an extracted calculation contract and cover both layers with regression tests.
- [Catalog changes produce a wide workbook] → Preserve Excel horizontal layout and generate columns deterministically.
- [Direct recovery creates a voucher but cleanup fails] → Treat creation as successful, log contextual cleanup failure, and expose a cleanup-pending item with only a user-triggered deletion retry.
- [Validation messages regress to generic errors] → Add API-level tests for database-bound lengths and aggregate uploads.
- [Known route errors are replaced by generic toast messages] → Normalize top-level `error` responses across JSON, multipart, parser, voucher, client, supplier, and conciliation endpoints while preserving the unexpected-error boundary.
- [Invalid or corrupt dates reach a non-Zod path] → Apply the shared canonical guard at transport, domain, persistence, and read-mapping boundaries, with database checks for stored user dates.

## Migration Plan

1. Deploy the application changes and database range constraints without a data backfill.
2. New and updated vouchers use the derived calculation and canonical date validation behavior.
3. Existing unedited vouchers retain all persisted values; corrupt legacy reads surface integrity errors rather than transformations.
4. Roll back application code independently; retain database constraints because unsupported values must not be reintroduced.
