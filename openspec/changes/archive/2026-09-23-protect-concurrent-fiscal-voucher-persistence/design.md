## Context

Current voucher creation checks for duplicates before inserting. Parser persistence uses per-item conditional claims, which prevents the same staged item from being persisted twice, but parser batch locks are independent and do not serialize separate staged items or manual persistence. The voucher database schema has no fiscal-document unique constraint. See [proposal.md](proposal.md) and [fiscal voucher persistence integrity](specs/fiscal-voucher-persistence-integrity/spec.md).

## Goals / Non-Goals

**Goals:**

- Make fiscal duplicate prevention authoritative under concurrent requests.
- Remove staged items that lose a fiscal persistence race while retaining validated work after technical persistence failures.
- Preserve non-fiscal purchase confirmation semantics.
- Make schema deployment safe in the presence of historical data.

**Non-Goals:**

- Merge, delete, or otherwise repair historical duplicate vouchers automatically.
- Replace per-item persistence claims or batch locks.
- Change fiscal document identity rules beyond mirroring the existing duplicate criteria.
- Make non-fiscal purchases globally unique.

## Decisions

### 1. Enforce fiscal identity in the database

The database will enforce uniqueness for fiscal vouchers using the current duplicate identity: company, workflow type, voucher type, letter, point of sale, number, and the relevant client or supplier. The implementation must cover nullable party values with the same equality semantics as the existing duplicate query, rather than allowing database null semantics to bypass the constraint.

Application-only locking was rejected because independent Cloud Run jobs and immediate requests can run concurrently. A unique constraint is the only final authority after two operations have both passed an earlier read.

### 2. Remove staged losers after a fiscal uniqueness conflict

The service will retain the pre-insert duplicate lookup for its normal user experience, while treating the database uniqueness violation as an expected race outcome. The winning operation persists the real voucher. A staged item that loses the race is discarded from the operational dataset and its temporary source file is deleted, so conciliations only reflects work that still requires action.

Removing the pre-insert lookup was rejected because it would turn ordinary duplicate attempts into database-error control flow and regress current feedback before persistence. Keeping losing staged items visible as duplicates was rejected because the persisted winner has already resolved the user's work.

### 2.1 Restore validated work after non-duplicate persistence failures

An item sent to persistence remains logically validated. If persistence has a non-duplicate technical failure, the validated payload is retained and the item returns to `validated` so the user can save it again. It is not a parser failure and therefore cannot be regenerated.

### 3. Scope the constraint to fiscal vouchers only

The uniqueness predicate will exclude non-fiscal purchases. This retains the product rule that a possible non-fiscal duplicate can be confirmed by a user and avoids imposing a document identity where one is not authoritative.

Applying one universal index was rejected because it would make explicitly permitted non-fiscal confirmations fail.

### 4. Block the migration on historical duplicates

Migration preparation will query existing fiscal identities before adding the database guarantee. Any duplicate group stops the deployment without changing records. The output must identify enough non-sensitive operational context for manual reconciliation without exposing document content in application logs.

Automatic cleanup was rejected because it would make an irreversible accounting decision without user authorization. Ignoring historical duplicates was rejected because the index could not be safely introduced.

## Risks / Trade-offs

- [Fiscal identity fields contain null values] → Use constraint semantics that make null party values match the current duplicate rule, and test that path explicitly.
- [Existing production duplicates block deployment] → Run the preflight before the release window and reconcile records manually before retrying the migration.
- [Persistence encounters an unexpected database constraint] → Classify only the named fiscal-identity constraint as a duplicate; preserve all other errors as failures.
- [Concurrent operations produce different response timing] → Keep the database as the source of truth, remove losing staged work, and refresh the UI from persisted data.

## Migration Plan

1. Add tests that reproduce concurrent fiscal persistence from independent staged items and mixed individual/batch paths.
2. Add the named fiscal identity constraint and the application mapping for its violation.
3. Run the historical-data preflight in staging and production before applying the schema migration.
4. Apply the migration only after the preflight is clean; if it is blocked, reconcile records manually and rerun it.
5. Roll back application handling independently if needed; do not remove the data-integrity constraint after it has protected live data without a reviewed migration plan.
