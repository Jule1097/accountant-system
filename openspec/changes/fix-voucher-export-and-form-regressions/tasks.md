## 1. Tax catalog normalization

- [x] 1.1 Add failing tests for the canonical retention and perception options shown by the sales and purchases tax selectors.
- [x] 1.2 Add failing export tests proving sales retention columns consume the canonical retention catalog without an applicability field.
- [x] 1.3 Create and verify a Prisma migration that removes `retention_concept.type`, renames valid retention labels, removes the audited unreferenced invalid records, and inserts `Otros Impuestos` as a perception concept.
- [x] 1.4 Update seed data, catalog contracts, and UI/export consumption to use the separate canonical catalogs without retention applicability filtering.
- [x] 1.5 Add failing parser tests for canonical tax concept resolution, workflow-specific tax arrays, unresolved applicable taxes, and `Otros Impuestos` classification.

## 2. Regression coverage

- [x] 2.1 Add failing export tests for Excel date cell values, Argentina-local formatting, and calendar-day preservation in sales and purchases.
- [x] 2.2 Add failing purchase export tests for merged subtotal and exempt amounts, Exento VAT-detail precedence, letter C values, absent Exento and OSSEG columns, and retained sales OSSEG columns.
- [x] 2.3 Add failing export tests proving credit notes and sales retentions are subtractive while MiPyME/FCE invoices and other standard amounts remain non-negative.
- [x] 2.4 Add failing voucher form and modal tests for explicit invoice letter A and an unresolved client or supplier with no parsed identity data.
- [x] 2.5 Add failing cache lifecycle tests proving management-route creation refreshes subsequent voucher-form options and inline creation revalidates the active modal select.

## 3. Voucher export corrections

- [x] 3.1 Normalize export date values for Excel while preserving empty payment dates and source calendar days.
- [x] 3.2 Update purchase export mapping and columns to merge the authoritative exempt amount into subtotal for every letter and remove the Exento column.
- [x] 3.3 Exclude OSSEG only from purchase perception columns and preserve sales retention behavior.
- [x] 3.4 Apply credit-note and sales-retention subtractive sign rules without negating other standard amounts.

## 4. Voucher form and third-party recovery

- [x] 4.1 Make inline client and supplier creation available whenever no third party is selected, retaining parsed prefill when present and revalidating the active select after creation.
- [x] 4.2 Correct the parsed standard-invoice letter A selection path using the existing catalog option contract.
- [x] 4.3 Invalidate the role-specific voucher-form option cache after successful client or supplier management-route creation.

## 5. AI parser tax consistency

- [x] 5.1 Update the AI parser prompt to use canonical tax labels, classify identified `Otros Impuestos` exclusively as a purchase perception, and retain generic other-tax totals only in `otherTaxesAmount`.
- [x] 5.2 Filter parsed tax arrays by the active voucher workflow while preserving unresolved applicable items for warning and manual review.

## 6. Validation

- [x] 6.1 Run the focused Jest suites for voucher export, voucher forms, inline third parties, third-party management, and parser behavior.
- [x] 6.2 Run the complete Jest suite and diagnose or resolve any remaining runner failure before handoff.
- [x] 6.3 Run lint and type/build validation relevant to the changed files.
