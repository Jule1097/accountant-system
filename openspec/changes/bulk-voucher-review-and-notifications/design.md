## Context

After the parser pipeline stages batch items asynchronously, users need a way to inspect each parsed result, compare it with the source document, validate the final payload, and enqueue approved vouchers for real persistence. The current application already has voucher modals for sales and purchases, and the new review flow should reuse them instead of creating a second independent form system. The dedicated entrypoint for this workflow is the `conciliations` route. See [proposal.md](proposal.md).

The review workflow depends on temporary staging from the parser pipeline, temporary storage previews, asynchronous persistence queues, and a lightweight notification model that only announces when a batch is ready for review. Notifications are persisted until the user reaches the corresponding batch successfully, then removed.

## Goals / Non-Goals

**Goals:**
- Provide a review workflow scoped to a specific parsing batch through the `conciliations` route.
- Reuse the existing voucher modal to validate staged data, extending it with a side-by-side source document preview.
- Queue both individual and mass confirmation of validated items for asynchronous real voucher persistence.
- Remove discarded items from temporary staging entirely instead of retaining discard history.
- Notify the user when a parsing batch becomes ready for review and delete that notification when opened.
- Keep staged item technical statuses in English while displaying Spanish labels in the UI.

**Non-Goals:**
- Redesign the existing voucher modal into a separate review-specific form system.
- Add a global cross-batch inbox in the first version.
- Persist notification history after the user opens a notification.
- Keep discarded staged items or discarded files for later audit review.

## Decisions

### 1. Keep the review UX scoped to a single batch
- **Decision:** The first review experience will open and operate within a single parsing batch rather than a global pending-items inbox.
- **Rationale:** Batch scope preserves the upload context, matches the notification event, and keeps the first workflow operationally simpler.
- **Alternatives:** A global inbox was rejected for the first version because it would add cross-batch filtering, sorting, and navigation complexity before the core validation flow is proven.

### 2. Use a dedicated route with batch-scoped URL state
- **Decision:** The review workflow will live in `/conciliations` and use `batchId`, `tab`, and `page` as its dataset-shaping URL state.
- **Rationale:** The batch notification needs a deterministic deep link, and the review screen needs refresh recovery and cache-friendly route state.
- **Alternatives:** Inferring the active batch without `batchId` was rejected because it creates ambiguity when more than one batch exists.

### 3. Reuse the existing voucher modal as the validation surface
- **Decision:** Use the current sales and purchases voucher modal as the review form, augmenting it with staged data loading and a side-by-side temporary document preview.
- **Rationale:** The modal already models the voucher fields and validation rules the user needs to confirm before real persistence. Reuse reduces duplication and keeps manual edit behavior aligned with regular voucher workflows.
- **Alternatives:** A separate review-only form was rejected because it would duplicate voucher field mapping and drift from the main voucher experience.

### 4. Treat review acceptance as validation readiness
- **Decision:** When the user accepts a reviewed item, the item becomes validated and eligible for persistence queue handoff.
- **Rationale:** This keeps the workflow binary and predictable: parsed items are either still pending review, validated for persistence, failed, or removed.
- **Alternatives:** Introducing a separate post-review approval state was rejected because it would add another stage without a user need.

### 5. Queue both individual and mass persistence
- **Decision:** Individual confirmation and mass confirmation both enqueue asynchronous real voucher persistence jobs.
- **Rationale:** One persistence path avoids divergent logic, reduces timeout risk, and matches the queue-driven architecture already chosen for parsing.
- **Alternatives:** Processing individual confirmation synchronously was rejected because it would create two persistence paths with different failure semantics.

### 6. Keep per-item actions stateful and stable
- **Decision:** Regeneration and persistence progress will be expressed at the item level inside the existing card instead of through global loading placeholders, and retry will operate on the same logical item within the same batch.
- **Rationale:** Per-item progress avoids flashes, preserves context, and keeps the batch list stable while background work completes.
- **Alternatives:** Replacing the whole view with a route-level loader was rejected because it hides surrounding context and makes progress harder to follow.

### 7. Remove discarded items entirely from temporary staging
- **Decision:** Discard deletes the staged item and its temporary source file, and the item no longer appears in the operational review list.
- **Rationale:** The user does not want discard history. The review table remains purely operational.
- **Alternatives:** Persisting discarded items with a status flag was rejected because it adds historical residue without product value.

### 8. Keep notifications lightweight and self-cleaning
- **Decision:** Create a persisted notification when a batch becomes ready for review, surface it live when the user is connected, and delete it only after the target batch loads successfully in `conciliations`.
- **Rationale:** This preserves important events across refreshes without building a long-lived notification history system and avoids losing context before the user actually reaches the batch.
- **Alternatives:** Realtime-only notifications were rejected because the user could miss them when disconnected. Long-lived notification history was rejected because it is unnecessary for this workflow.

### 9. Keep cards and empty states specific to the current batch context
- **Decision:** The `conciliations` route will keep the card-based layout already defined in the UI and expose contextual empty states plus a mass confirmation CTA only when validated items exist.
- **Rationale:** Cards fit the review-oriented nature of the screen better than tables, and contextual empty states make it clearer why a list is empty for the current tab or batch.
- **Alternatives:** Replacing cards with a table or always showing the mass action was rejected because it reduces clarity in this workflow.

## Risks / Trade-offs

- **[Risk] Reusing the voucher modal can overload an already complex component** -> Mitigation: keep review-specific concerns additive, such as staged payload loading and preview panel injection, instead of branching the full modal flow.
- **[Risk] Mass confirmation can enqueue items that became invalid since review** -> Mitigation: validate staged payloads again at persistence handoff and keep duplicate checks in the persistence layer.
- **[Risk] Notification deletion on open can remove context too early** -> Mitigation: delete the notification only after the target batch is loaded successfully.
- **[Risk] Removing discarded items immediately can make accidental discard irreversible** -> Mitigation: keep discard as an explicit destructive action in the review flow and confirm it in the UI.

## Migration Plan

1. Add batch review endpoints or loaders on top of staged parser data.
2. Add the `conciliations` route state contract based on `batchId`, `tab`, and `page`.
3. Extend the current voucher modal to load staged payloads and temporary source previews side by side.
4. Add per-item actions for retry, review, discard, and validation acceptance with item-level progress.
5. Add asynchronous persistence queue handoff for individual and mass confirmation.
6. Add persisted review-ready notifications plus realtime delivery and deletion-after-successful-open behavior.
7. Add contextual empty states and the conditional mass confirmation CTA.
8. Validate review, discard, and notification flows with automated tests before enabling the full user workflow.
