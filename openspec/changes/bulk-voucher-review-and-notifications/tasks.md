## 1. Review Data Access

- [ ] 1.1 Add batch-scoped review data loading on top of staged parser items for the `conciliations` route using `batchId`, `tab`, and `page`
- [ ] 1.2 Add per-item review actions for retry, review, validation acceptance, and discard, keeping progress scoped to the affected card
- [ ] 1.3 Add discard behavior that removes the staged item and its temporary source file from the operational review dataset
- [ ] 1.4 Add contextual empty states and card-based batch summaries for the current `conciliations` tab

## 2. Modal-Based Validation

- [ ] 2.1 Extend the existing voucher modal so it can load staged parser payloads in `conciliations` review mode for both sales and purchases
- [ ] 2.2 Add temporary source document preview support to the review modal without duplicating the voucher form flow, rendering the document alongside the form
- [ ] 2.3 Ensure accepting the review marks the item as validated and eligible for asynchronous persistence

## 3. Asynchronous Persistence Handoff

- [ ] 3.1 Implement queue handoff for individual validated-item confirmation
- [ ] 3.2 Implement mass confirmation that enqueues all validated items of the current batch
- [ ] 3.3 Re-check voucher duplicate rules and payload validity during persistence handoff before creating real vouchers
- [ ] 3.4 Remove an accepted item from the visible `conciliations` dataset immediately after it is handed off for persistence

## 4. Notifications

- [ ] 4.1 Add persisted review-ready notifications for completed parsing batches
- [ ] 4.2 Add live delivery of review-ready notifications for connected users
- [ ] 4.3 Route the user from a review-ready notification into the corresponding `conciliations` batch URL
- [ ] 4.4 Delete a review-ready notification only after the target batch loads successfully

## 5. Validation

- [ ] 5.1 Add or update Jest coverage for batch review actions, modal-based staged validation, discard removal behavior, and item-level progress states
- [ ] 5.2 Add or update Jest coverage for individual and mass persistence queue handoff plus duplicate rejection at persistence time
- [ ] 5.3 Add or update Jest coverage for review-ready notification creation, live delivery, URL navigation, and deletion after successful batch load
- [ ] 5.4 Run the relevant Jest suites for review flows, persistence handoff, and notifications before handoff
