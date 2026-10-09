# Tasks

## 1. Calculation and validation contracts

- [x] 1.1 Add failing unit and API regression tests for derived sales and purchase amounts, sales zeroed purchase-only fields, database-compatible text and document-number limits, aggregate parser upload errors, and canonical invalid-date cases; verify the targeted Jest suites fail before production changes.
- [x] 1.2 Extract reusable voucher calculation helpers and update form/domain boundary contracts so new and updated vouchers derive totals authoritatively; verify the calculation and voucher service Jest suites pass.
- [x] 1.3 Remove `totalAmount` from parser client contracts, repair flows, and form patches; support the backend-only `taxIncludedAmount` source for sales letter B subtotal derivation, aggregate unmapped purchase taxes into one `Otros Impuestos` perception without generic-total duplication, update parser fixtures, and verify parser Jest suites pass.
- [x] 1.4 Align UI input attributes, form schemas, API schemas, and shared constants with database limits and Spanish validation messages; remove the purchase other-taxes input, normalize new and updated purchase `otherTaxesAmount` to zero, and verify invalid create and update API tests return client errors without repository persistence.
- [x] 1.5 Implement the shared canonical date guard for exact format, real calendar dates, and the 1900-2100 range across forms, filters, APIs, parser/import paths, domain validation, persistence, and read mapping; verify date tests cover malformed, impossible, and out-of-range values without fallback.
- [x] 1.6 Add and verify database range constraints for voucher date, accounting period, and payment date, plus diagnosable integrity logging and errors for corrupt legacy date reads; verify direct-write and isolated-read regression coverage.

## 2. Voucher modal experience

- [x] 2.1 Read the applicable installed Next.js documentation from `node_modules/next/dist/docs/` before changing modal UI code, and record the relevant rendering constraint in the implementation review.
- [x] 2.2 Add reactive read-only gross and net amount displays to the shared voucher modal, remove direct total editing, and conditionally hide sales purchase-only amount fields; verify modal interaction tests cover sales and purchases.
- [x] 2.3 Implement reusable PNG/JPEG zoom and 90-degree rotation preview state while preserving PDF behavior and reset-on-close semantics; verify preview component and hook Jest tests pass.

## 3. Dynamic Excel exports

- [x] 3.1 Add failing export regressions for catalog-added tax jurisdictions and current-view-only Concepto, Comentarios, and localized Estado columns; verify the export Jest suite fails before production changes.
- [x] 3.2 Load tax jurisdictions through the catalog boundary and build deterministic retention and perception columns and values from catalog data; verify export tests cover sales and purchases with a new jurisdiction.
- [x] 3.3 Add operational detail values only for current-view workbook rows and columns while preserving declaration layout; verify export service and API Jest suites pass.

## 4. Manual recovery of failed conciliation items

- [x] 4.1 Add failing service, API, hook, and presentation tests for manually recovering an Error item with source preview, direct persistence, company isolation, successful cleanup, and cleanup-pending behavior; verify the targeted Jest suites fail before production changes.
- [x] 4.2 Add the direct failed-item recovery service and authenticated endpoint using the established voucher validation and creation path, with contextual English logs and cleanup-pending state when post-persistence cleanup fails; verify service and API Jest suites pass.
- [x] 4.3 Add the Error-item action and reuse the voucher modal and preview for manual entry, then render cleanup-pending items with only a deletion retry and refresh only affected conciliation data after success; verify conciliation UI Jest suites pass.

## 5. Integrated verification

- [x] 5.1 Run the touched voucher, parser, conciliation, security, and export Jest suites; verify all pass with no historical-data migration or persistence writes outside test mocks.
- [x] 5.2 Run lint and type checks for the touched application areas; verify no secrets, temporary files, or unrelated changes are introduced.

## 6. Public API error responses

- [x] 6.1 Add failing route and helper tests for top-level Spanish validation responses, malformed JSON and multipart bodies, parser count and size limits, and preservation of generic unexpected 500 responses.
- [x] 6.2 Reuse the existing application error boundary through shared request parsing and validation-response helpers across the audited JSON, multipart, voucher, parser, client, supplier, auth, and conciliation endpoints; verify no known client error reaches the generic internal-error response.
- [x] 6.3 Run the affected API, parser, hook, and toast resolution suites and update the archived capability status after implementation.
- [x] 6.4 Configure the Next.js proxy body limit above the parser aggregate limit and add a regression test proving complete multipart payloads reach the parser route.
