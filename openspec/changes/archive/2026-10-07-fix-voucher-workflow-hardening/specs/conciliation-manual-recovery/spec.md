# Spec Delta

## Purpose

Allows users to recover failed parser items by manually entering and directly persisting the voucher with its original source document available for review.

## ADDED Requirements

### Requirement: Failed parser items can be manually recovered
The system SHALL offer a manual-entry action for conciliation items in Error status. The action SHALL open the voucher form for the item's voucher type and display the original source document preview.

#### Scenario: User opens manual recovery for a failed item
- **WHEN** a user selects the manual-entry action for a failed voucher parser item
- **THEN** the system opens the voucher form with the item's source preview
- **AND** the user can enter the voucher without requiring a parsed payload

### Requirement: Manual recovery persists directly and cleans up parser state
The system SHALL validate and create a manually recovered voucher directly through the backend. After successful creation, it SHALL delete the source file from temporary storage and remove the corresponding item from the parser batch.

#### Scenario: Manual recovery succeeds
- **WHEN** a user submits valid manual data for a failed parser item
- **THEN** the voucher is persisted
- **AND** the source file and failed parser item are removed
- **AND** the item no longer appears in conciliations

#### Scenario: Manual recovery validation fails
- **WHEN** a user submits invalid manual data for a failed parser item
- **THEN** the system displays an actionable Spanish validation error
- **AND** the source file and failed parser item remain available for correction or retry

### Requirement: Cleanup failures remain actionable after direct persistence
The system SHALL preserve a successfully created voucher if temporary-file or batch-item cleanup fails after manual recovery. It SHALL display the parser item as cleanup pending with a clear Spanish message and allow only an explicit deletion action that retries cleanup.

#### Scenario: Source cleanup fails after voucher creation
- **WHEN** a manually recovered voucher is created but its source file or parser item cannot be removed
- **THEN** the voucher remains persisted
- **AND** conciliations displays the item as cleanup pending with a message that the voucher was saved and requires deletion
- **AND** the item does not offer retry, manual recovery, or persistence actions

#### Scenario: User deletes a cleanup-pending item
- **WHEN** a user deletes a cleanup-pending conciliation item
- **THEN** the system retries removal of the source file and parser item
- **AND** removes the item from conciliations when cleanup succeeds
