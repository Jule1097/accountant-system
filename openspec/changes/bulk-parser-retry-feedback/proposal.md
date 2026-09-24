## Why

Failed parser items can only be regenerated one at a time, which launches a parser workload for every click even when items belong to the same batch. Users also receive a generic error message that does not explain why the parser failed or what action to take.

## What Changes

- Add bulk regeneration for selected items that failed during parser processing.
- Requeue all selected eligible items in one company-scoped request.
- Group the selected items by their existing parser batch and launch one parser workload per affected batch, rather than one workload per item.
- Keep individual regeneration available and align it with the same eligibility and user-facing error-message rules.
- Preserve a safe, specific, and actionable parsing failure reason on each parser-failed item so conciliations can explain the failure and recommend regeneration when applicable.
- Keep a persistence failure in the validated workflow so it can be saved again without reparsing.
- Reject bulk requests containing items outside the active company, expired items, or items that are not parser failures, without partially requeueing the selection.

## Capabilities

### New Capabilities

- `parser-retry-operations`: Defines company-scoped bulk retries, batch-grouped workload dispatch, retry eligibility, and user-facing parser failure feedback.

### Modified Capabilities

- None.

## Impact

- Affects parser retry API routes, Zod request validation, parser service and repository operations, batch-runner dispatch, parser failure mapping, and the conciliations selection/action UI.
- Adds unit and API coverage for batch grouping, atomic validation, company isolation, eligible retry status, and failure-reason presentation.
- Does not change the parser provider, upload limits, or the existing batch-worker execution contract.
