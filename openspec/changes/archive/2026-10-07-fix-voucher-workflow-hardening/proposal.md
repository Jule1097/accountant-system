# Proposal

## Why

Voucher entry, parser, Excel export, and conciliation recovery currently use inconsistent calculations, fixed tax-jurisdiction lists, and incomplete validation boundaries. This can hide dynamically configured jurisdictions, allow database constraint failures to surface as internal errors, and force failed parser items into a recovery path that cannot be completed manually.

## What Changes

- Build retention and perception Excel columns from the tax jurisdictions configured in the catalog instead of fixed source-code lists.
- Add `Concepto`, `Comentarios`, and localized `Estado` columns only to current-view Excel exports.
- Make voucher amounts derived and read-only in the form: sales expose gross and net totals; purchases expose gross and net payable totals.
- Remove `totalAmount` from the parser's client and persistence contract, while allowing a backend-only tax-included source amount for sales vouchers of letter B so the backend can derive subtotal as tax-included amount minus parsed VAT.
- Hide non-taxable, exempt, and other-tax form fields for sales and force their persisted values to zero for new or updated sales vouchers.
- Unify purchase other taxes under the `Otros Impuestos` perception concept by removing the direct purchase input, aggregating unmapped parser tax lines into one perception, and persisting purchase `otherTaxesAmount` as zero for new or updated vouchers.
- Align form, API, and database input limits so invalid lengths return actionable validation responses instead of internal errors.
- Add a comprehensive canonical-date guard across every user-supplied date boundary, using the supported range from `1900-01-01` through `2100-12-31` without silent correction or fallback.
- Preserve actionable client error messages across voucher creation, editing, and parser batch uploads.
- Add image zoom and 90-degree rotation controls to voucher previews while preserving PDF-specific controls.
- Allow users to manually create a voucher from a failed conciliation item, then remove its temporary file and batch item after successful direct persistence or expose a cleanup-pending state when cleanup fails.
- Preserve all historical database records unchanged; the new calculation rules apply only to newly created or subsequently updated vouchers.

## Capabilities

### New Capabilities

- `voucher-form-calculations`: Defines calculated voucher-entry totals, parser amount boundaries, validation limits, and image preview interactions.
- `conciliation-manual-recovery`: Defines direct manual recovery of failed parser items with source preview and cleanup.
- `api-error-responses`: Defines the public backend error contract for actionable client errors, parser limits, malformed request bodies, and unexpected failures.

### Modified Capabilities

- `voucher-export`: Make tax-jurisdiction columns catalog-driven and add current-view operational detail columns.
- `voucher-tables`: Update voucher modal behavior for sales-only and purchase-only amount fields and calculated totals.

## Impact

- Affected areas: voucher domain models, form hooks and modal components, shared date validation, Zod schemas, parser contracts, Excel export service, catalog repository usage, conciliation services and routes, preview components, database constraints, and their Jest suites.
- API contracts change for parsed voucher payloads and voucher create/update payload validation; the backend remains the source of truth for derived amounts.
- A database constraint migration is included; no historical-data migration, backfill, or update is included.
