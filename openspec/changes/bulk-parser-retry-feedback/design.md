## Context

The parser currently requeues a single item and immediately dispatches its batch workload. Conciliations keeps a shared selection of discardable items, but only exposes bulk discard and bulk persistence actions. Failed-item processing catches the parser exception and replaces it with one generic user-facing message. See [proposal.md](proposal.md) and [parser retry operations](specs/parser-retry-operations/spec.md).

## Goals / Non-Goals

**Goals:**

- Add a single bulk retry request and UI action for selected failed items.
- Preserve the batch as the worker execution and locking boundary.
- Make parser failures understandable and actionable in the existing error cards.
- Keep persistence failures in the validated workflow rather than reparsing successful results.
- Apply the same server-side retry eligibility to individual and bulk operations.

**Non-Goals:**

- Introduce a global parser worker that receives items from unrelated batches.
- Change upload, parser-provider, batch-expiration, or batch-size behavior.
- Display provider exception strings or require users to inspect technical logs.
- Add automatic retries or a retry-attempt limit.

## Decisions

### 1. Use one client request and batch-grouped workload dispatch

The UI will submit the selected failed item IDs to a bulk retry endpoint. The service will validate and requeue the complete selection atomically, derive distinct batch IDs, and dispatch each batch once. This gives the user one immediate action while retaining parallel execution, existing per-batch locks, and bounded worker durations.

Dispatching a single cross-batch job was rejected because the worker contract, locks, retries, and observability are batch-scoped. Extending it would serialize unrelated work or add a new orchestration layer without improving parser throughput.

### 2. Validate the full selection before mutation

The bulk service will deduplicate IDs for processing, load their current records, and require every requested item to be failed and company-owned before any requeue mutation begins. The requeue updates will run in one transaction and synchronize each affected batch status before workloads are dispatched.

Best-effort retries were rejected because a partial UI success is difficult to explain and could silently omit failed invoices. The response will report requeued-item and affected-batch counts only after a successful validation and mutation.

### 3. Treat parser failure as the only retry eligibility boundary

Both the existing individual route and the new bulk route will rely on a shared retry operation that accepts only active, unexpired items whose failure originated during parser processing. Frontend controls will constrain selection for convenience, but backend enforcement is authoritative and protects against stale UI state and direct API calls. Repeated request IDs will be deduplicated before validation and mutation.

Allowing any nonterminal item to be retried was rejected because it could interrupt active processing or reset an item that is already ready for review. Treating persistence failures as parser failures was rejected because it discards validated work and makes the user repeat an unrelated operation.

### 4. Store a controlled failure reason with the item

Parser failures will map download, preparation, provider, and invalid extraction outcomes to a stable set of Spanish, end-user messages. The mapping will distinguish unavailable or timed-out processing, unreadable or unprocessable source files, and insufficient extracted invoice data. Insufficient output becomes a parser failure instead of a successful parsed item. Every parser-failure message will state whether regeneration is the next action.

Persisting raw provider messages was rejected because their wording is unstable and may be overly technical. Keeping only a generic fallback was rejected because it does not help the user decide whether regenerating is worthwhile. A final generic-but-actionable fallback will handle unclassified failures.

### 5. Extend the existing selection boundary

Conciliation selection state will derive selected failed item IDs alongside selected discardable and validated IDs. The `Error` section will render the bulk regeneration control only when that derived collection is non-empty. During submission, the UI will prevent duplicate actions, refresh the data, clear the successfully submitted selection, and confirm the requeued count.

Creating a separate selection system for failed cards was rejected because the existing accumulated selection already spans sections and is scoped by company.

### 6. Restore validated items after technical persistence failures

An item claimed for persistence remains logically validated. If a non-duplicate persistence failure occurs, its validated payload is retained and the item returns to `validated`, where the existing individual and bulk save actions can retry it. The parser retry controls derive eligibility from failure origin and therefore do not target this path.

Marking the item as a generic parser error was rejected because it conflates independent workflow stages and loses the user's reviewed data.

## Risks / Trade-offs

- [A selected item changes state between rendering and submission] → The backend rejects the atomic request, refreshes the UI, and returns an actionable unavailable-for-regeneration message.
- [Dispatch fails after items are requeued] → Requeued records remain recoverable by the existing pending-item recovery flow; the response states that processing is queued and awaiting dispatch recovery.
- [A batch contains other queued items] → Its single dispatched worker processes all currently eligible queued items, which is the established batch-worker behavior and avoids item-level job fan-out.
- [Provider errors cannot be classified] → Store a controlled generic message that recommends regeneration instead of exposing untrusted technical text.

## Migration Plan

1. Release the server-side failure-reason mapping and shared retry operation before exposing the bulk UI action.
2. Deploy the bulk endpoint and its validation, then the conciliations selection control and feedback.
3. Verify batch-level dispatch counts and user-facing error cards in staging with same-batch and multi-batch selections.
4. Roll back by disabling the bulk UI action and endpoint usage; existing individual retry and persisted item states remain compatible.
