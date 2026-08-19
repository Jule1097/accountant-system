## Why

Once batch parsing exists, users still need an efficient way to review parsed vouchers before anything is persisted as a real accounting record. A dedicated `conciliations` workflow and completion notification model are needed so users can validate each parsed item with its source document preview, retry failures, and enqueue only approved vouchers for final persistence.

## What Changes

- Add a dedicated `conciliations` route that lets users inspect parsed items for a specific batch after background processing completes.
- Scope the `conciliations` route by `batchId`, `tab`, and `page` URL params, keeping `batchId` as the batch source of truth.
- Reuse the existing voucher modal for review, extending it with the temporary source document preview stored in Supabase Storage and rendered alongside the form.
- Treat accepting the review as validation, making the item eligible for either direct individual persistence or batch persistence queue handoff.
- Add per-item contextual actions so failed items can be retried in place, successful parsed items can be reviewed, and operational staged items can be removed.
- Add direct individual confirmation that persists one validated item immediately.
- Add mass confirmation behavior that enqueues all validated items of a batch for asynchronous real voucher persistence.
- Add multi-select removal behavior so users can discard multiple staged items from conciliations in one action.
- Add completion notifications that tell the user when a parsing batch is ready to review.
- Remove discarded items from temporary staging instead of keeping historical discard records.
- Normalize staged item status identifiers in English while keeping Spanish labels in the UI.
- Stabilize the main conciliations layout so card width changes do not shift pagination position across pages.
- Organize conciliations into operational status sections instead of a single mixed queue, keeping the screen focused on actions rather than analytical summaries.
- Replace text-heavy per-item actions with compact icon actions and tooltips for a denser operational UI.
- Redirect notification-driven `batchId` links back to the tab-level conciliations view when the target batch no longer contains operational items.
- Add explicit in-card loading feedback while validation acceptance or direct individual persistence is still running, so users know they must wait before the item changes state.

## Capabilities

### New Capabilities
- `bulk-voucher-review`: Defines the batch review workflow, modal-based validation, preview behavior, and validated-item persistence handoff.
- `user-batch-notifications`: Defines the notification behavior that announces when a parsing batch is ready for review.

### Modified Capabilities
- `voucher-tables`: Aligns route behavior with the dedicated `conciliations` review entrypoint and notification-driven navigation model.

## Impact

- Affects the `conciliations` route, temporary file preview handling, direct and queued persistence handoff for real voucher persistence, batch-level notifications, card-list layout stability, and the notification deep-link recovery flow.
- Reuses and extends the current voucher edit modal instead of introducing a separate validation form.
- Depends on the temporary staging and parsing lifecycle delivered by the parser pipeline change.
- Requires synchronous persistence handling for individual confirmation and asynchronous persistence handling for mass confirmation of validated items.
