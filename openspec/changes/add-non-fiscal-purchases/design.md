## Context

The current supplier and voucher persistence models require a CUIT, voucher letter, point of sale, and voucher number. Voucher duplicate detection assumes every purchase has the same fiscal identity shape. Supplier and voucher forms, tables, details, deletion copy, parsers, and exports consume those required fields directly.

See proposal.md for the motivation and the delta specifications for the behavioral contract.

## Goals / Non-Goals

**Goals:**

- Represent absent supplier CUIT and absent purchase fiscal numbering explicitly, without sentinel values.
- Enforce the supplier-to-purchase compatibility rules at server boundaries and preserve historical purchase behavior.
- Keep catalog applicability, UI rendering, exports, parser review, and duplicate detection aligned with persisted state.

**Non-Goals:**

- Changing client or sale voucher identification rules.
- Adding supplier tax-verification integrations or automatic CUIT lookup.
- Creating suppliers automatically from unresolved parser output.
- Adding a supplier preference that can override the mandatory CUIT-to-purchase-mode rule.

## Decisions

### Persist separate supplier and purchase modes

`Supplier` will persist a tax-identification mode with `with_cuit` and `without_cuit`, and its CUIT will become nullable. `Voucher` will persist a document-identification mode with `fiscal` and `non_fiscal`; fiscal fields (`voucherLetterId`, `posNumber`, and `number`) will become nullable.

The supplier mode controls new purchase creation. The voucher mode is a historical snapshot: an existing non-fiscal purchase remains non-fiscal after its supplier later gains a CUIT. A purchase can retain a mode that no longer matches its supplier only when it retains the same supplier and is not explicitly converted. Changing the supplier requires conversion to the selected supplier's current mode.

An implicit `null`-means-non-fiscal approach was rejected because it cannot distinguish intentional non-fiscal records from invalid or incomplete data.

### Keep fiscality out of the purchase form as a free choice

The purchase form will resolve the identification mode from the selected supplier rather than presenting a manual mode selector. It will hide fiscal fields for a supplier without a CUIT and require them for a supplier with a CUIT. A supplier change that requires a mode change will use an explicit conversion confirmation before clearing fields or requiring fiscal values.

This prevents a supplier with a CUIT from being recorded as non-fiscal and prevents accidental loss of fiscal numbering during supplier changes.

### Enforce compatibility in validation and service layers

Form validation improves immediate feedback, but server-side validation remains authoritative. Supplier creation and update validation will require a valid CUIT only for `with_cuit`; a `without_cuit` supplier persists `cuit: null`. The supplier service will reject a `with_cuit` to `without_cuit` transition if purchases exist.

Purchase create and update flows will load the selected supplier inside the company scope, resolve or validate the requested historical mode, normalize fiscal fields to null for non-fiscal purchases, and reject incompatible direct API payloads. Shared domain constants will define modes, UI labels, validation messages, and duplication criteria.

### Preserve duplicate protection with an explicit confirmation protocol

Fiscal purchases retain the current strict duplicate lookup. For non-fiscal purchases, the repository will look up same-company records by supplier, date, total amount, and non-fiscal mode. The API will return a recoverable possible-duplicate response unless the request carries an explicit confirmation flag. The confirmation flag is transient and is never persisted.

The UI will show a confirmation dialog with `Cancelar` and `Guardar de todos modos`, then resend only the confirmed non-fiscal request. This protects API consumers and batch persistence from silently bypassing duplicate awareness while retaining the permitted repeated-record workflow.

### Persist voucher-type applicability

`VoucherType` will persist applicability values `sale`, `purchase`, or `both`. A migration will set all current catalog rows to `both` and seed four `purchase` rows: `Liquidación de expensas`, `Pago de impuesto`, `Resumen bancario`, and `Otro comprobante`.

Catalog loading and server validation will filter or validate the voucher type against the voucher flow. Deriving applicability from displayed voucher-type names was rejected because names are user-facing catalog data and do not provide a stable technical contract.

### Use explicit UI placeholders and export values

Purchase table cells will render `—` for a non-applicable letter, `Sin numeración fiscal` for the voucher identifier, and `Sin CUIT` for an intentionally absent supplier CUIT. Voucher details will use `No aplica` for non-applicable fiscal fields. The deletion confirmation will use generic copy for every voucher.

Exports will use empty cells for absent fiscal values and add a purchase identification column. This preserves spreadsheet compatibility while making the absence interpretable without inventing identifiers.

### Leave uncertain parsed suppliers in review

Parser persistence will create or associate a supplier only when current identification rules can establish the intended supplier. Otherwise it will leave the item pending review. The review flow may select an existing supplier or create one explicitly with either tax-identification mode.

## Risks / Trade-offs

- [Existing UI and API contracts expect non-null CUIT and fiscal fields] → Update DTOs, serializers, form initial values, mappers, and focused regression tests together.
- [A supplier updated with a CUIT may make its historical non-fiscal vouchers look inconsistent] → Preserve document-identification mode on the voucher and render its historical mode independently from the supplier's current CUIT.
- [Possible duplicate warnings can be bypassed by direct callers] → Require an explicit transient confirmation flag at the API boundary only when a matching non-fiscal record exists.
- [Nullable composite CUIT uniqueness permits multiple missing CUIT values] → Preserve normalized company-scoped name duplicate checks for suppliers without a CUIT.
- [Voucher type catalog migration may affect existing selector behavior] → Default existing types to `both`, validate applicability server-side, and test both screens.

## Migration Plan

1. Add nullable CUIT and supplier tax-identification mode, nullable fiscal voucher fields and document-identification mode, and voucher-type applicability through a Prisma migration.
2. Backfill existing suppliers as `with_cuit`, existing vouchers as `fiscal`, and existing voucher types as `both` before applying non-null mode constraints.
3. Seed purchase-only voucher types idempotently.
4. Deploy server validation and read mappings before UI changes so old fiscal clients continue to submit valid payloads.
5. Deploy supplier and purchase UI, duplicate confirmation, parser review adaptation, and export changes.
6. Roll back application behavior independently if necessary; the added mode fields and nullable columns remain backward compatible with existing fiscal records.
