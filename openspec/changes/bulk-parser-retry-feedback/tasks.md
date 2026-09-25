## 1. Retry Domain Contracts and Tests

- [x] 1.1 Add failing unit tests for parser-origin-only retry eligibility, expiry, ID deduplication, company isolation, atomic bulk validation, and one dispatch per affected batch.
- [x] 1.2 Add failing API tests for the bulk retry payload limit, response counts, invalid selections, dispatch-recovery feedback, and company isolation.
- [x] 1.3 Add failing parser and conciliation tests for controlled user-facing parser failure reasons, insufficient extraction, preparation failures, and their rendering on error cards.
- [x] 1.4 Add failing persistence tests that restore validated items and preserve their payload after non-duplicate persistence failures.

## 2. Parser Retry Operations

- [x] 2.1 Add reusable parser retry request and response contracts, schema validation, constants, parser-failure origin, and controlled failure-reason mapping.
- [x] 2.2 Implement transactional bulk failed-item validation and requeueing while synchronizing affected batch statuses.
- [x] 2.3 Refactor individual retry to use the shared failed-item eligibility rules.
- [x] 2.4 Add the company-scoped bulk retry API endpoint and dispatch each affected batch exactly once after a successful requeue.
- [x] 2.5 Map parser preparation, provider, and insufficient extraction outcomes to actionable Spanish item messages without persisting raw provider exception text.
- [x] 2.6 Restore validated items after non-duplicate persistence failures and keep them outside parser regeneration eligibility.

## 3. Conciliations Bulk Retry Experience

- [x] 3.1 Extend the existing selection state with selected failed-item IDs and bulk retry action state.
- [x] 3.2 Add the `Regenerar (N)` control to the error section and prevent duplicate bulk submissions while it is pending.
- [x] 3.3 Connect the bulk retry action to the new API, refresh and clear the submitted selection on success, and display count-based success and actionable failure feedback.
- [x] 3.4 Preserve the individual regeneration control and render the persisted user-facing failure reason in every error card.

## 4. Verification

- [x] 4.1 Run the focused parser, API/security, conciliation hook, and conciliation component Jest suites.
- [x] 4.2 Run lint, type checks, and the relevant production build validation.
- [ ] 4.3 Verify same-batch and multi-batch retry dispatch behavior plus user-facing error messages in staging.
