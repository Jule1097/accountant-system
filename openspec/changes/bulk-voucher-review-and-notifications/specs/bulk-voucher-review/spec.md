## Purpose

Define the batch-based review workflow that lets users inspect staged parser results with document previews, validate them, retry failures, and hand off approved items for asynchronous persistence.

## ADDED Requirements

### Requirement: Batch Review Context
The system MUST present staged parser results through a dedicated `conciliations` experience scoped to the current parsing batch and current voucher type tab.

#### Scenario: User opens a completed parsing batch
- **WHEN** a user opens a parsing batch that has completed background parsing
- **THEN** the system MUST show the staged items for that batch only

#### Scenario: Batch route state is restored
- **WHEN** a user opens or refreshes a `conciliations` URL containing `batchId`, `tab`, and `page`
- **THEN** the system MUST restore that same batch review context from the URL

### Requirement: Batch Review Status Normalization
The system MUST keep staged item technical status identifiers in English while displaying Spanish labels in the UI.

#### Scenario: Review list renders a ready item
- **WHEN** a staged item has the technical status `ready`
- **THEN** the system MUST display the Spanish label `Listo` in the UI

#### Scenario: Review list renders an error item
- **WHEN** a staged item has the technical status `error` or `duplicate`
- **THEN** the system MUST keep the technical identifier unchanged in data contracts
- **AND** the system MUST display the corresponding Spanish label in the UI

### Requirement: Per-Item Contextual Review Actions
The system MUST expose the current action available for each staged item according to its latest parsing state.

#### Scenario: Item failed parsing
- **WHEN** a staged batch item is currently failed
- **THEN** the system MUST show a retry action for that item
- **AND** retrying the item MUST reprocess the same logical item within the same batch

#### Scenario: Item parsed successfully
- **WHEN** a staged batch item is currently ready for review
- **THEN** the system MUST show a review action for that item

#### Scenario: Item is a duplicate
- **WHEN** a staged batch item is currently duplicate
- **THEN** the system MUST show a discard action for that item only

### Requirement: Stable Per-Item Progress Feedback
The system MUST keep the current card visible while retry or persistence is in progress and update only the affected item state.

#### Scenario: User retries a failed item
- **WHEN** a user retries a failed staged item
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show progress only on the affected item card

#### Scenario: User confirms a validated item
- **WHEN** a user confirms a validated staged item
- **THEN** the system MUST keep the surrounding batch list visible
- **AND** it MUST show progress only on the affected item card

### Requirement: Modal-Based Validation With Source Preview
The system MUST let users review a staged item inside a modal that reuses the current voucher form flow and also displays the temporary source document preview.

#### Scenario: User reviews a staged sales item
- **WHEN** a user opens review for a staged sales item
- **THEN** the system MUST open the existing sales voucher modal flow populated with the staged parsed data
- **AND** it MUST display the temporary source document preview alongside that review form within the same modal container

#### Scenario: User reviews a staged purchases item
- **WHEN** a user opens review for a staged purchases item
- **THEN** the system MUST open the existing purchases voucher modal flow populated with the staged parsed data
- **AND** it MUST display the temporary source document preview alongside that review form within the same modal container

### Requirement: Review Acceptance Marks Items As Validated
Accepting the review MUST mark the staged item as validated and eligible for asynchronous real voucher persistence.

#### Scenario: User accepts a reviewed item
- **WHEN** a user finishes reviewing a staged item and accepts it
- **THEN** the system MUST treat that item as validated
- **AND** the item MUST become eligible for the persistence queue
- **AND** the item MUST disappear from the active `conciliations` list after queue handoff succeeds

#### Scenario: User edits staged fields before acceptance
- **WHEN** a user changes staged item fields during review and accepts the item
- **THEN** the system MUST validate the accepted staged values, not only the original parser result

### Requirement: Asynchronous Confirmation Of Validated Items
The system MUST persist approved staged items through asynchronous queue handoff for both individual and mass confirmation flows.

#### Scenario: User confirms one validated item
- **WHEN** a user confirms a single validated item
- **THEN** the system MUST enqueue that item for asynchronous real voucher persistence

#### Scenario: User confirms all validated items in the batch
- **WHEN** a user triggers mass confirmation for the batch
- **THEN** the system MUST enqueue all currently validated items of that batch for asynchronous real voucher persistence

#### Scenario: Batch contains no validated items
- **WHEN** the current batch contains no validated items
- **THEN** the system MUST hide or disable the mass confirmation CTA with explanatory UI text

### Requirement: Discard Removes Temporary Staging
Discarding a staged item MUST remove it from the temporary review dataset instead of preserving a historical discarded record.

#### Scenario: User discards a staged item
- **WHEN** a user discards a staged item during the review workflow
- **THEN** the system MUST remove that item from temporary staging
- **AND** it MUST remove the associated temporary source file

### Requirement: Contextual Empty States
The system MUST display contextual empty states for the current `conciliations` batch and tab instead of a generic message.

#### Scenario: Current tab has no items
- **WHEN** the current batch tab has no staged items to show
- **THEN** the system MUST display an empty state message specific to that tab and batch context
