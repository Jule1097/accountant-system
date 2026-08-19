## Context

After the parser pipeline stages batch items asynchronously, users need a way to inspect each parsed result, compare it with the source document, validate the final payload, and persist approved vouchers without forcing the same handoff strategy for single-item and batch actions. The current application already has voucher modals for sales and purchases, and the new review flow should reuse them instead of creating a second independent form system. The dedicated entrypoint for this workflow is the `conciliations` route, which already uses a card-based layout and company-scoped tabs for `Ventas` and `Compras`. See [proposal.md](proposal.md).

The review workflow depends on temporary staging from the parser pipeline, temporary storage previews, asynchronous persistence queues, and a lightweight notification model that only announces when a batch has fully completed processing. Notifications are persisted until the user reaches the corresponding batch successfully, then removed.

## Goals / Non-Goals

**Goals:**
- Provide a review workflow scoped to a specific parsing batch through the `conciliations` route.
- Reconstruct company-scoped processing and review state from backend data after refresh, navigation, or reconnect.
- Reuse the existing voucher modal to validate staged data, extending it with a side-by-side source document preview.
- Persist individually confirmed validated items immediately while keeping mass confirmation of validated items asynchronous.
- Remove discarded items from temporary staging entirely instead of retaining discard history.
- Allow both individual and multi-select discard of operational staged items from conciliations.
- Notify the user once when a parsing batch finishes processing and delete that notification when opened.
- Keep staged item technical statuses in English while displaying Spanish labels in the UI.
- Keep the visible UI language centered on `facturas de venta` and `facturas de compra`, never technical batch wording.
- Keep the main conciliations list layout width stable so pagination stays fixed across page changes.
- Keep conciliations visually operational: no analytical summary cards, compact item cards, and icon-based per-item actions with tooltips.
- Keep progress feedback explicit during validation acceptance and direct individual persistence so users never wait without visible in-card loading state.

**Non-Goals:**
- Redesign the existing voucher modal into a separate review-specific form system.
- Add a global cross-batch inbox in the first version.
- Persist notification history after the user opens a notification.
- Keep discarded staged items or discarded files for later audit review.
- Introduce a separate processing dashboard outside of `conciliations`.
- Turn conciliations into an analytics dashboard with KPI cards or summary tiles.

## Decisions

### 1. Keep the review UX scoped to a single batch
- **Decision:** The first review experience will open and operate within a single parsing batch rather than a global pending-items inbox.
- **Rationale:** Batch scope preserves the upload context, matches the notification event, and keeps the first workflow operationally simpler.
- **Alternatives:** A global inbox was rejected for the first version because it would add cross-batch filtering, sorting, and navigation complexity before the core validation flow is proven.

### 2. Use a dedicated route with batch-scoped URL state
- **Decision:** The review workflow will live in `/conciliations` and use `batchId`, `tab`, and `page` as its dataset-shaping URL state.
- **Rationale:** The batch notification needs a deterministic deep link, and the review screen needs refresh recovery and cache-friendly route state.
- **Alternatives:** Inferring the active batch without `batchId` was rejected because it creates ambiguity when more than one batch exists.

### 2.1 Reconstruct non-batch review state at company scope
- **Decision:** When `conciliations` is opened without `batchId`, the screen will reconstruct its visible processing and review sections from backend data for the active company and current tab.
- **Rationale:** Users can navigate away, reload, or return later, so the workflow cannot depend on local UI state or a transient toast.
- **Alternatives:** Keeping review state only in client memory was rejected because it breaks refresh recovery and cross-user company visibility.

### 3. Reuse the existing voucher modal as the validation surface
- **Decision:** Use the current sales and purchases voucher modal as the review form, augmenting it with staged data loading and a side-by-side temporary document preview.
- **Rationale:** The modal already models the voucher fields and validation rules the user needs to confirm before real persistence. Reuse reduces duplication and keeps manual edit behavior aligned with regular voucher workflows.
- **Alternatives:** A separate review-only form was rejected because it would duplicate voucher field mapping and drift from the main voucher experience.

### 4. Treat review acceptance as validation readiness
- **Decision:** When the user accepts a reviewed item, the item becomes validated and eligible for persistence queue handoff.
- **Rationale:** This keeps the workflow predictable: parsed items are either still pending review, validated for persistence, failed, or removed, and the UI can clearly distinguish `Lista` from `Validada`.
- **Alternatives:** Introducing a separate post-review approval state was rejected because it would add another stage without a user need.

### 5. Split individual and mass persistence strategies
- **Decision:** Individual confirmation will persist the validated item immediately in the request lifecycle, while mass confirmation will enqueue asynchronous real voucher persistence jobs for all validated items in the current batch.
- **Rationale:** Single-item confirmation is an explicit user action with immediate feedback expectations, while mass confirmation benefits from queue-based execution to avoid long-running batch requests.
- **Alternatives:** Using the queue for both flows was rejected because it adds an unnecessary second confirmation step for users working one invoice at a time. Making both flows synchronous was rejected because batch persistence has higher timeout and partial-failure risk.

### 6. Keep per-item actions stateful and stable
- **Decision:** Regeneration and persistence progress will be expressed at the item level inside the existing card instead of through global loading placeholders, and retry will operate on the same logical item within the same batch.
- **Rationale:** Per-item progress avoids flashes, preserves context, and keeps the batch list stable while background work completes.
- **Alternatives:** Replacing the whole view with a route-level loader was rejected because it hides surrounding context and makes progress harder to follow.

### 6.2 Keep validation and direct-persist waiting states visible
- **Decision:** When the user validates a reviewed invoice or confirms a single validated invoice for immediate persistence, the affected card must show a visible loading state until the operation resolves.
- **Rationale:** Without explicit progress feedback, the user cannot tell whether the click was accepted or whether they should keep waiting.
- **Alternatives:** Showing feedback only after the item disappears or changes state was rejected because it creates dead-air moments and encourages repeated clicks.

### 6.1 Visually collapse `queued` and `processing` into one processing state
- **Decision:** Internal `queued` and `processing` technical states will both be shown as `Procesando` in the UI.
- **Rationale:** The distinction is operationally useful in backend traces but too technical for end users.
- **Alternatives:** Showing `En cola` separately was rejected because it adds complexity without user action value.

### 7. Remove discarded items entirely from temporary staging
- **Decision:** Discard deletes the staged item and its temporary source file, and the item no longer appears in the operational review list.
- **Rationale:** The user does not want discard history. The review table remains purely operational.
- **Alternatives:** Persisting discarded items with a status flag was rejected because it adds historical residue without product value.

### 7.1 Allow discard for operational staged states, individually and in bulk
- **Decision:** Discard will be available for `Lista`, `Validada`, `Error`, and `Duplicada` staged items, and conciliations will support selecting multiple staged items to remove them in a single destructive action.
- **Rationale:** Users need to clean the operational queue without being forced to do one discard at a time or wait for a duplicate-only state.
- **Alternatives:** Restricting discard to duplicates only was rejected because it blocks operational cleanup. Adding bulk review confirmation by manual selection was rejected for now because the requested batch-level confirmation already covers the mass persistence workflow.

### 8. Keep notifications lightweight and self-cleaning
- **Decision:** Create exactly one persisted notification when a batch fully finishes processing, surface it live when the user is connected, and delete it only after the target batch loads successfully in `conciliations`.
- **Rationale:** This preserves important events across refreshes without building a long-lived notification history system, avoids technical wording, and avoids duplicate notifications during polling or revalidation.
- **Alternatives:** Realtime-only notifications were rejected because the user could miss them when disconnected. Long-lived notification history was rejected because it is unnecessary for this workflow. One notification per invoice was rejected because it would generate noisy bell activity.

### 8.1 Recover gracefully when a notification target batch is already resolved
- **Decision:** If a notification deep link points to a `batchId` that no longer contains operational staged items, conciliations will redirect to the tab-level view for the same voucher type, show a short toast, and clear the notification.
- **Rationale:** The user should not land on an empty or inconsistent batch-scoped screen after the underlying workload has already been cleared.
- **Alternatives:** Leaving the user on an empty batch view was rejected because it feels broken. Preserving resolved batch history only for navigation was rejected because it adds non-operational complexity.

### 9. Keep cards and empty states specific to the current batch context
- **Decision:** The `conciliations` route will keep the card-based layout already defined in the UI, show a top processing section for active invoices, and expose contextual empty states plus a mass confirmation CTA only when validated items exist.
- **Rationale:** Cards fit the review-oriented nature of the screen better than tables, the processing section makes in-flight work visible when the user navigates in early, and contextual empty states make it clearer why a list is empty for the current tab or batch.
- **Alternatives:** Replacing cards with a table or always showing the mass action was rejected because it reduces clarity in this workflow. A separate processing screen was rejected because it fragments the current conciliations entrypoint.

### 9.1 Split the operational review queue into visible state sections
- **Decision:** The screen will group items into dedicated sections for `Procesando`, `Lista`, `Validada`, `Duplicada`, and `Error` rather than rendering one mixed list.
- **Rationale:** Validated invoices should remain visible in their own actionable section instead of appearing to fall to the bottom of the queue, and exception states should be visually separated from the main review flow.
- **Alternatives:** Keeping one mixed list was rejected because it hides workflow progression. Tabs or filters per state were rejected because they reduce the user's global operational context.

### 9.2 Keep the page operational instead of analytical
- **Decision:** Conciliations will not include KPI or analytical summary cards; the header will remain lightweight and focused on current context, tabs, batch filter state, and operational actions.
- **Rationale:** The page exists to review and act on invoices, not to summarize historical performance.
- **Alternatives:** Adding summary tiles was rejected because it adds noise without helping the user process staged invoices.

### 9.3 Use compact cards with icon-only actions
- **Decision:** Conciliation cards will be visually denser and expose per-item actions through icon buttons with tooltips instead of text buttons.
- **Rationale:** This reduces visual weight, keeps more invoices visible, and makes state sections easier to scan.
- **Alternatives:** Keeping full text buttons was rejected because it makes each card too tall and repetitive.

### 10. Keep review visibility isolated by company tab but not by uploader
- **Decision:** `Ventas` and `Compras` remain separate views, but the underlying review queue is shared by company rather than by uploader.
- **Rationale:** Conciliations is an operational company-wide queue, and same-company users should see the same review workload inside the relevant tab.
- **Alternatives:** Restricting cards to only the uploader was rejected because it fragments operational visibility. Mixing sales and purchases in one section was rejected because it introduces cross-tab noise.

### 11. Order visible cards by operational priority
- **Decision:** The visible card order in conciliations will be `Procesando`, `Lista`, `Validada`, `Duplicada`, `Error`.
- **Rationale:** This keeps active processing visible first, then surfaces invoices pending review before already validated invoices and lower-priority duplicate or error residue.
- **Alternatives:** Putting errors first was rejected for this workflow because the user prioritized current processing visibility and direct reviewability ahead of cleanup work.

### 12. Keep the conciliations content width stable across pages
- **Decision:** The main conciliations list container will use a stable width independent of the card content on the current page, so pagination and surrounding controls keep a fixed position during page changes.
- **Rationale:** Variable card content width creates visible pagination jumps that feel broken even when the underlying paging logic is correct.
- **Alternatives:** Letting each page size itself to its card content was rejected because it causes layout shifts between pages.

## Risks / Trade-offs

- **[Risk] Reusing the voucher modal can overload an already complex component** -> Mitigation: keep review-specific concerns additive, such as staged payload loading and preview panel injection, instead of branching the full modal flow.
- **[Risk] Mass confirmation can enqueue items that became invalid since review** -> Mitigation: validate staged payloads again at persistence handoff and keep duplicate checks in the persistence layer.
- **[Risk] Immediate individual persistence can fail after review acceptance** -> Mitigation: keep validation acceptance and individual persistence failure states explicit in the UI, and return the item to an actionable staged state when real voucher creation does not complete.
- **[Risk] Users may repeat actions while validation or persistence is still running** -> Mitigation: disable the affected actions and show an in-card loading indicator until the request resolves.
- **[Risk] Notification deletion on open can remove context too early** -> Mitigation: delete the notification only after the target batch is loaded successfully.
- **[Risk] Redirecting resolved batch links can confuse the user about what happened to the notification target** -> Mitigation: show a contextual toast and keep the destination tab aligned with the original notification type.
- **[Risk] Removing discarded items immediately can make accidental discard irreversible** -> Mitigation: keep discard as an explicit destructive action in the review flow and confirm it in the UI.
- **[Risk] Bulk discard can remove more staged items than intended** -> Mitigation: require explicit selection state and a destructive confirmation summarizing the number of invoices to remove.
- **[Risk] Company-scoped queues can surprise users who only expect to see their own uploads** -> Mitigation: keep tab context explicit and preserve processing/review grouping so users understand what they are seeing.
- **[Risk] Duplicate notification emission for the same completed batch** -> Mitigation: track notification creation idempotently per batch completion and refuse to emit a second completion event.
- **[Risk] Expired items can leave ghost cards after cleanup** -> Mitigation: treat expiration as removal from the operational conciliations dataset and rebuild visible state from backend queries.
- **[Risk] Card-content width differences can still shift controls on edge cases** -> Mitigation: constrain the list shell width and make card internals wrap within the fixed available space.
- **[Risk] Compact cards can hide action meaning** -> Mitigation: require clear state icons, accessible labels, and tooltips for every icon action.

## Migration Plan

1. Add company-scoped batch review endpoints or loaders on top of staged parser data.
2. Add the `conciliations` route state contract based on `batchId`, `tab`, and `page`, including backend reconstruction when `batchId` is absent.
3. Add the processing section and visible status normalization for active invoices in the current tab.
4. Extend the current voucher modal to load staged payloads and temporary source previews side by side.
5. Add per-item actions for retry, review, discard, and validation acceptance with item-level progress plus multi-select discard support.
6. Add immediate persistence for individual confirmation and asynchronous persistence queue handoff for mass confirmation.
7. Add persisted completion notifications plus realtime delivery, batch-target routing, and deletion-after-successful-open behavior without duplicates.
8. Split conciliations into operational state sections with compact cards and icon-based actions while keeping the layout width stable.
9. Add notification-target recovery so resolved `batchId` links redirect cleanly to the tab-level conciliations view.
10. Validate review, discard, expiration, individual persistence, batch persistence, and notification flows with automated tests before enabling the full user workflow.
