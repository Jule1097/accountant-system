## Purpose

Define the user notification behavior that announces when a parsing batch has completed background processing and is ready for review.

## ADDED Requirements

### Requirement: Review-Ready Batch Notification
The system MUST notify the user once when a parsing batch has completed processing and its invoices are ready to review.

#### Scenario: Batch becomes ready for review
- **WHEN** a parsing batch finishes background processing and is ready for user review
- **THEN** the system MUST create a user notification indicating that the batch is ready to review
- **AND** the notification payload MUST contain the target `batchId` needed to open `conciliations`
- **AND** the user-facing message MUST use a general completed-processing message rather than technical batch wording

#### Scenario: Batch finishes with mixed outcomes
- **WHEN** a parsing batch finishes and its invoices end in a mix of ready, duplicate, and error outcomes
- **THEN** the system MUST still create the completion notification for that batch

#### Scenario: Batch finishes with no ready invoices
- **WHEN** a parsing batch finishes and all of its invoices end as duplicate or error outcomes
- **THEN** the system MUST still create the completion notification for that batch

#### Scenario: User is connected when notification is created
- **WHEN** the user is actively connected when the batch becomes ready
- **THEN** the system MUST surface the review-ready notification without requiring the user to refresh the page

#### Scenario: Two completed batches finish at different times
- **WHEN** two different parsing batches complete independently for the same company
- **THEN** the system MUST create one completion notification per completed batch
- **AND** it MUST NOT merge them into a single notification event

### Requirement: Notification Removal On Read
The system MUST remove a persisted review-ready notification after the user reads it.

#### Scenario: User reads a review-ready notification
- **WHEN** the user opens or acknowledges a review-ready batch notification
- **THEN** the system MUST route the user to the corresponding `conciliations` batch URL

#### Scenario: Batch opens successfully from a notification
- **WHEN** the target `conciliations` batch view loads successfully after a notification-driven navigation
- **THEN** the system MUST delete that notification from the notification dataset

#### Scenario: Notification target batch is already resolved
- **WHEN** the notification target `batchId` no longer contains operational staged items at navigation time
- **THEN** the system MUST route the user to the same conciliations tab without the stale `batchId`
- **AND** it MUST show a short user-facing message explaining that the uploaded invoices no longer require review
- **AND** it MUST delete that notification from the notification dataset after the redirect succeeds

### Requirement: No Duplicate Completion Notifications
The system MUST prevent duplicate review-ready notifications for the same completed parsing batch.

#### Scenario: Polling observes the same completed batch again
- **WHEN** backend polling, revalidation, or concurrent users observe a batch that already emitted its completion notification
- **THEN** the system MUST NOT create a second completion notification for that same batch
