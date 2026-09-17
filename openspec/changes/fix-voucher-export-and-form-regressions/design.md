## Context

See proposal.md for motivation. Export rows currently carry date strings into ExcelJS, purchase mapping exposes exempt and every non-IIBB perception as separate columns, and voucher-form options use a role-specific promise cache. Inline third-party visibility also depends on parsed identity data even when no third party is selected. Retention selectors and sales exports additionally rely on a retention applicability field even though purchase vouchers reject retentions by domain invariant.

## Goals / Non-Goals

**Goals:**

- Preserve existing export API contracts while correcting workbook cell values and purchase-only columns.
- Reuse existing voucher form, cache, parsed catalog, and third-party option boundaries.
- Add behavior-focused Jest tests before production changes.
- Normalize the tax concept schema and catalog data without merging the two role-specific relations.

**Non-Goals:**

- Changing stored voucher monetary values or voucher categories.
- Altering sales OSSEG behavior.
- Redesigning the voucher or third-party management UI.

## Decisions

### Export date values

Convert valid export date strings into date cell values before workbook generation while retaining the existing date column format. The conversion MUST preserve the source calendar day independently of the server timezone. This lets Excel render and sort dates locally. Formatting a string alone is insufficient because ExcelJS stores it as text.

### Purchase-only export normalization

Derive purchase-export subtotal from the signed ARS subtotal plus the exempt component, omit the standalone exempt column, and filter OSSEG at purchase perception-column selection. When an `Exento` VAT detail exists, it is the source of the exempt component; otherwise use `exemptAmount`. The resulting subtotal applies to every purchase voucher, including letter C. This keeps persistence unchanged and scopes the accounting presentation rule to exports.

### Voucher sign source of truth

Credit notes MUST negate their exported monetary amounts. Sales retention columns remain subtractive and MUST export as negative amounts regardless of voucher category. Other standard invoice amounts, including MiPyME/FCE invoices and non-retention taxes, remain non-negative. Tests will protect this behavior without inferring signs from voucher names.

### Separate tax concept catalogs without retention applicability

Retentions and perceptions remain separate catalog tables and separate voucher relations because that schema enforces the sales-versus-purchases distinction structurally. Remove the redundant `type` field from retention concepts because purchase voucher invariants already prohibit retentions. Update the sales retention selector and export column source to use the complete retention catalog instead of filtering it by applicability.

Normalize the catalog names to the approved short labels. Rename the four valid existing retention records in place to preserve their IDs. Delete the audited unreferenced misclassified retention records and the unreferenced OSSEG perception, and add `Otros Impuestos` to the perception catalog. Update seed data so fresh environments converge on the same canonical values.

### AI tax parsing respects the voucher workflow

The parser already resolves tax concepts by catalog ID and normalized name, so removal of the retention applicability field does not require a parser catalog contract change. Its normalization recognizes `IIBB` and permits historical labels containing `Sufrida` to match their canonical counterparts.

The parser response MUST retain only retentions for sales and only perceptions for purchases, even if the AI returns both arrays. Unrecognized items from the applicable array remain in the technical response without a catalog ID, are not hydrated into the form, and produce a user-visible warning for manual review. This establishes the domain invariant at the parser boundary instead of relying on form persistence to discard the non-applicable array. The AI prompt MUST use the canonical labels and instruct that a document item identified as `Otros Impuestos` is emitted exclusively as a purchase perception, not duplicated into `otherTaxesAmount`. A generic other-tax total without that identified concept remains exclusively in `otherTaxesAmount`.

### Third-party recovery and cache lifecycle

Show the existing inline action whenever there is no selected third party. Reuse its existing initial-value resolver so it pre-fills parsed data when present and stays empty otherwise. After successful inline creation, revalidate the matching role-specific option source before updating the active modal select. Invalidate the existing role-specific voucher form option cache after successful management-route creation so later modal loads request current data.

### Letter selection regression coverage

Extend the existing parsed voucher patch and modal tests for a standard invoice with explicit `A`. The test will exercise the same catalog ID used by the native select rather than introduce a parallel selection mechanism.

## Risks / Trade-offs

- [Date-only strings can shift calendar day when parsed as UTC] → Normalize them as date-only values for workbook cells and assert the displayed local day.
- [Cache invalidation can refresh the wrong role] → Invalidate only the cache key matching the created client or supplier role.
- [Adding an always-visible inline action can offer an empty form] → This is intentional; the modal still validates required identity fields before creation.
- [A catalog record becomes referenced unexpectedly during deployment] → Rely on the database foreign-key constraint to fail and roll back the migration; no separate application-level reference precheck is required.
- [AI can return taxes in the wrong array or duplicate Other Taxes] → Enforce workflow-specific response arrays and add prompt and parser regression tests.

## Migration Plan

Deploy the Prisma schema and catalog migration before the application release. The migration renames valid retention records in place, inserts the missing perception concept, and removes the audited invalid records. If deployment fails before commit, including due to a foreign-key constraint, the transaction rolls back; if an application issue is observed after deployment, restore the application release while retaining the canonical catalog schema.
