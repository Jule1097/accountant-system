## Purpose

Define reliable bulk retry operations for failed parser items and clear, actionable failure feedback in conciliations.

## ADDED Requirements

### Requirement: Bulk retry action for failed parser items

The system MUST let a user select one or more visible conciliations items that failed during parser processing and initiate their regeneration through one bulk action. The action MUST display the number of selected parser-failed items and MUST NOT be available for selected items in any other visible state.

#### Scenario: User selects failed items

- **WHEN** a user selects one or more items displayed in the `Error` section
- **THEN** the system MUST show a `Regenerar (N)` action for that selection
- **AND** it MUST keep the existing individual regeneration action available on each failed item

#### Scenario: User selects mixed operational states

- **WHEN** a user selects items from `Error` and one or more other visible states
- **THEN** the bulk regeneration action MUST count and target only the selected items currently in `Error`

### Requirement: Atomic, company-scoped bulk retry request

The system MUST accept a company-scoped bulk retry request containing between one and the established bulk-operation limit of parser item identifiers. Repeated identifiers MUST be processed once. Before changing any item, it MUST verify that every requested item belongs to the active company, has not expired, and currently has a parser failure. If any item is missing, belongs to another company, is expired, or is not a parser failure, the request MUST fail without requeueing any requested item.

#### Scenario: Valid failed-item selection is retried

- **WHEN** a bulk retry request contains only failed items from the active company
- **THEN** the system MUST requeue every requested item
- **AND** it MUST return the number of items requeued and the number of affected batches

#### Scenario: Selection contains an item from another company

- **WHEN** a bulk retry request includes an item that does not belong to the active company
- **THEN** the system MUST reject the request as unavailable
- **AND** it MUST NOT requeue any item from the request

#### Scenario: Selection contains an item that is not eligible for parser retry

- **WHEN** a bulk retry request includes an item whose current state is not a parser failure or whose staging lifetime has expired
- **THEN** the system MUST reject the request as unavailable for regeneration
- **AND** it MUST NOT requeue any item from the request

#### Scenario: Request repeats selected item identifiers

- **WHEN** a bulk retry request contains the same eligible item identifier more than once
- **THEN** the system MUST requeue that item only once
- **AND** it MUST count that item only once in the response

### Requirement: Batch-grouped retry workload dispatch

After a successful bulk retry request, the system MUST trigger exactly one parser workload for each distinct affected batch. It MUST NOT trigger one parser workload per retried item. Parser workloads for different affected batches MUST remain independently dispatchable.

#### Scenario: All selected items belong to one batch

- **WHEN** a successful bulk retry request requeues multiple items from the same batch
- **THEN** the system MUST trigger exactly one parser workload for that batch

#### Scenario: Selected items belong to multiple batches

- **WHEN** a successful bulk retry request requeues items from multiple batches
- **THEN** the system MUST trigger exactly one parser workload for each affected batch
- **AND** it MUST NOT combine their execution into a single cross-batch workload

#### Scenario: Workload dispatch cannot start immediately

- **WHEN** items have been requeued but one or more affected batch workloads cannot be dispatched immediately
- **THEN** the system MUST retain the items in the queued parser state for recovery
- **AND** it MUST report that the invoices were requeued and that processing will start when dispatch is recovered

### Requirement: Actionable parser failure feedback

The system MUST persist and display a concise, user-facing reason when parsing fails. The reason MUST identify the actionable failure category and tell the user when regeneration is an appropriate next step. The system MUST use controlled Spanish messages and MUST NOT expose raw provider exception text in the interface.

#### Scenario: A temporary parser or provider failure occurs

- **WHEN** parsing fails because the processing service is temporarily unavailable or times out
- **THEN** the item MUST display a message explaining that the service could not complete processing and that the user can regenerate the invoice

#### Scenario: The file cannot be processed

- **WHEN** parsing fails because the stored file cannot be read or its content cannot be processed
- **THEN** the item MUST display a message explaining that the file could not be processed and that the user can regenerate the invoice or review the source file

#### Scenario: Parser preparation fails before provider processing

- **WHEN** the temporary file cannot be downloaded, read, or prepared for parser processing
- **THEN** the item MUST be recorded as a parser failure
- **AND** it MUST display an actionable Spanish reason that permits regeneration

#### Scenario: Extraction produces insufficient information

- **WHEN** parsing completes without enough usable invoice information
- **THEN** the item MUST be recorded as a parser failure rather than a successful parsed result
- **AND** it MUST display a message explaining that sufficient information could not be extracted and that the user can regenerate the invoice

#### Scenario: A failed item is displayed in conciliations

- **WHEN** an item is displayed in the `Error` section
- **THEN** the interface MUST show its current user-facing failure reason instead of a generic parsing-failure message

### Requirement: Individual retry uses the same eligibility rules

The system MUST allow individual regeneration only for a failed item in the active company. Individual retry MUST preserve the same user-facing failure-feedback behavior as bulk retry.

#### Scenario: User retries an eligible failed item

- **WHEN** a user regenerates one failed item belonging to the active company
- **THEN** the system MUST requeue that item and trigger one parser workload for its batch

#### Scenario: User retries an ineligible item through the API

- **WHEN** an individual retry request targets an item that is missing, belongs to another company, has expired, or is not a parser failure
- **THEN** the system MUST reject the request without changing the item

### Requirement: Persistence failures preserve validated work

The system MUST distinguish parser failures from persistence failures. A persistence failure after an item was sent to save MUST preserve its validated payload, return the item to the `Validada` workflow state, and allow saving to be retried. It MUST NOT make the item eligible for parser regeneration.

#### Scenario: A technical persistence failure occurs

- **WHEN** a validated item cannot be persisted because of a technical persistence failure
- **THEN** the item MUST return to `Validada` with its validated data preserved
- **AND** the interface MUST allow the user to retry saving it
- **AND** the interface MUST NOT offer `Regenerar` for that failure
