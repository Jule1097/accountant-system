## 1. Review Data Access

- [ ] 1.1 Add company-scoped review data loading on top of staged parser items for the `conciliations` route using `batchId`, `tab`, and `page`, rebuilding the visible state from backend data after refresh or navigation
- [x] 1.2 Add per-item review actions for retry, review, validation acceptance, direct individual confirmation, and discard, keeping progress scoped to the affected card
- [x] 1.3 Add discard behavior that removes staged items and their temporary source files from the operational review dataset for `Lista`, `Validada`, `Error`, and `Duplicada`
- [x] 1.4 Add multi-select state and bulk discard actions in conciliations for staged operational items
- [x] 1.5 Add the top processing section, contextual empty states, card ordering, and stable list-container width for the current `conciliations` tab using the visible priority `Procesando`, `Lista`, `Validada`, `Duplicada`, `Error`
- [x] 1.6 Rework conciliations into dedicated state sections so `Lista` and `Validada` are not rendered as one mixed queue
- [x] 1.7 Replace text-heavy per-item actions with icon buttons and tooltips while keeping the cards compact and operational
- [x] 1.8 Add explicit loading feedback for in-flight validation acceptance and direct individual persistence in conciliations

## 2. Modal-Based Validation

- [x] 2.1 Extend the existing voucher modal so it can load staged parser payloads in `conciliations` review mode for both sales and purchases
- [x] 2.2 Add temporary source document preview support to the review modal without duplicating the voucher form flow, rendering the document alongside the form
- [x] 2.3 Ensure accepting the review marks the item as validated, shows it as `Validada`, and leaves it eligible for immediate individual persistence or batch persistence handoff

## 3. Persistence Handoff

- [x] 3.1 Implement direct persistence for individual validated-item confirmation
- [x] 3.2 Implement mass confirmation that enqueues all validated items of the current batch
- [x] 3.3 Re-check voucher duplicate rules and payload validity during both individual persistence and batch persistence handoff before creating real vouchers
- [x] 3.4 Remove an accepted item from the visible `conciliations` dataset immediately after persistence succeeds or after batch queue handoff succeeds

## 4. Notifications

- [x] 4.1 Add persisted completion notifications for parsing batches that finish processing, including batches with only duplicate or error outcomes
- [ ] 4.2 Add live delivery of completion notifications for connected users without emitting duplicates for the same batch
- [x] 4.3 Route the user from a review-ready notification into the corresponding `conciliations` batch URL
- [x] 4.4 Delete a review-ready notification only after the target batch loads successfully
- [x] 4.5 Redirect stale notification `batchId` links to the tab-level conciliations view when the batch no longer contains operational items

## 5. Validation

- [x] 5.1 Add or update Jest coverage for batch review actions, modal-based staged validation, single and bulk discard removal behavior, and item-level progress states
- [ ] 5.2 Add or update Jest coverage for direct individual persistence, mass persistence queue handoff, and duplicate rejection at persistence time
- [ ] 5.3 Add or update Jest coverage for review-ready notification creation, live delivery, URL navigation, and deletion after successful batch load
- [x] 5.4 Run the relevant Jest suites for review flows, persistence handoff, and notifications before handoff
- [ ] 5.5 Add or update Jest coverage for sectioned conciliations rendering, icon actions, and stale `batchId` redirect behavior
- [ ] 5.6 Add or update Jest coverage for visible loading states during validation acceptance and direct individual persistence
