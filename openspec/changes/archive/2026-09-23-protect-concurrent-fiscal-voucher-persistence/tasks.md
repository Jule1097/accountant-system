## 1. Concurrency Contracts and Tests

- [x] 1.1 Add failing domain and repository tests for fiscal identity matching, including company isolation and absent applicable party values.
- [x] 1.2 Add failing persistence tests for concurrent individual, batch, mixed, and same-batch fiscal voucher creation, asserting one voucher plus staging and temporary-file removal for all losing items.
- [x] 1.3 Add failing tests that restore validated payloads after non-duplicate technical persistence failures and keep them outside parser regeneration eligibility.
- [x] 1.4 Add regression tests confirming confirmed non-fiscal purchase duplicates remain permitted.

## 2. Fiscal Persistence Integrity

- [x] 2.1 Define the named fiscal identity constraint and add the database migration preflight that detects historical duplicate groups without changing records.
- [x] 2.2 Add the database uniqueness guarantee for fiscal sales and purchases, including parity with current null-party duplicate semantics.
- [x] 2.3 Map the named fiscal uniqueness violation to the existing domain duplicate error while preserving unexpected database errors.
- [x] 2.4 Ensure asynchronous parser persistence removes staging and the temporary source file when an item loses a fiscal identity race.
- [x] 2.5 Restore validated items after non-duplicate persistence failures instead of marking them as parser errors.

## 3. Migration and Verification

- [x] 3.1 Run the migration preflight against staging data and document any duplicate groups requiring manual reconciliation.
- [x] 3.2 Run focused voucher, parser persistence, API/security, and concurrency Jest suites.
- [x] 3.3 Run Prisma validation, lint, type checks, and relevant production build validation.
- [x] 3.4 Verify migration readiness before applying the fiscal uniqueness constraint; production verification is out of scope by user decision.
