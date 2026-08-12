## 1. OpenSpec Alignment

- [x] 1.1 Add the `voucher-crud-api` capability spec covering create, detail-by-id, update, and physical delete behavior
- [x] 1.2 Modify the `voucher-tables` capability spec to replace disabled CRUD placeholders with the persisted UI behavior
- [x] 1.3 Modify the `gemini-parser-api` capability spec so the parser contract matches the current taxes, perceptions, jurisdiction, and third-party response model

## 2. Voucher API Completion

- [x] 2.1 Review the voucher POST, GET by id, PUT, and DELETE handlers to ensure they return the statuses and Spanish error messages required by the new spec
- [x] 2.2 Update voucher service and repository flows as needed so create, update, and delete behave consistently for both sales and purchases
- [x] 2.3 Ensure missing-voucher responses are handled consistently for detail retrieval, update, and delete

## 3. Query-Driven Voucher Detail

- [x] 3.1 Update the sales and purchases view containers to drive the detail modal from the `voucherId` query string
- [x] 3.2 Fetch voucher detail by id when opening edit mode, render a loader inside the modal while the request is pending, and clear invalid query params after missing-voucher failures
- [x] 3.3 Keep the create modal local-state driven while reusing the shared voucher modal and form flow

## 4. Persistent Create and Edit UX

- [x] 4.1 Replace the current create toast-only submit path with persistent voucher creation for sales and purchases
- [x] 4.2 Replace the current edit local-state-only submit path with persistent voucher updates
- [x] 4.3 Refresh the voucher tables and surface success or error toasts after create and update operations

## 5. Delete Confirmation UX

- [x] 5.1 Replace the row actions dropdown with a visible delete icon action in the voucher tables
- [x] 5.2 Add a confirmation modal for voucher deletion with accept and cancel actions
- [x] 5.3 Perform physical deletion on confirmation, refresh the table, show success feedback, and clear `voucherId` when needed

## 6. Verification

- [x] 6.1 Update or add Jest tests for create, edit, delete, and missing-voucher API behavior
- [x] 6.2 Update or add Jest tests for query-driven modal opening, missing-voucher toast handling, and delete confirmation behavior in the vouchers UI
- [x] 6.3 Update or add Jest tests for Gemini parser extraction, null fallback, tax enrichment, and third-party resolution behavior
- [x] 6.4 Run the relevant Jest test suites for vouchers and parser flows before handoff

## 7. Gemini Parser Alignment

- [x] 7.1 Update the Gemini prompt and response schema so extraction explicitly covers voucher taxes, perceptions, retentions, and conservative null fallback behavior
- [x] 7.2 Replace purchase-specific parser field naming with shared third-party naming and keep a single resolved third-party identifier in the response contract
- [x] 7.3 Move parser normalization and enrichment business logic into a dedicated model under `src/models`
- [x] 7.4 Update the parser route and form mapping to use the aligned parser contract
