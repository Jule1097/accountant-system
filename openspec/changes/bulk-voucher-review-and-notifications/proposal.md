## Why

Once batch parsing exists, users still need an efficient way to review parsed vouchers before anything is persisted as a real accounting record. A dedicated `conciliations` workflow and completion notification model are needed so users can validate each parsed item with its source document preview, retry failures, and enqueue only approved vouchers for final persistence.

## What Changes

- Add a dedicated `conciliations` route that lets users inspect parsed items for a specific batch after background processing completes.
- Scope the `conciliations` route by `batchId`, `tab`, and `page` URL params, keeping `batchId` as the batch source of truth.
- Reuse the existing voucher modal for review, extending it with the temporary source document preview stored in Supabase Storage and rendered alongside the form.
- Treat accepting the review as validation, making the item eligible for the persistence queue that creates the real voucher in the database.
- Add per-item contextual actions so failed items can be retried in place, successful parsed items can be reviewed, and duplicates can be removed.
- Add mass confirmation behavior that enqueues all validated items of a batch for asynchronous real voucher persistence.
- Add completion notifications that tell the user when a parsing batch is ready to review.
- Remove discarded items from temporary staging instead of keeping historical discard records.
- Normalize staged item status identifiers in English while keeping Spanish labels in the UI.

## Capabilities

### New Capabilities
- `bulk-voucher-review`: Defines the batch review workflow, modal-based validation, preview behavior, and validated-item persistence handoff.
- `user-batch-notifications`: Defines the notification behavior that announces when a parsing batch is ready for review.

### Modified Capabilities
- `voucher-tables`: Aligns route behavior with the dedicated `conciliations` review entrypoint and notification-driven navigation model.

## Impact

- Affects the `conciliations` route, temporary file preview handling, queue handoff for real voucher persistence, and batch-level notifications.
- Reuses and extends the current voucher edit modal instead of introducing a separate validation form.
- Depends on the temporary staging and parsing lifecycle delivered by the parser pipeline change.
- Requires asynchronous persistence handling for both individual acceptance and mass confirmation of validated items.
