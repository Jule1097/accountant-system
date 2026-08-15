## Purpose

Define the user notification behavior that announces when a parsing batch has completed background processing and is ready for review.

## ADDED Requirements

### Requirement: Review-Ready Batch Notification
The system MUST notify the user when a parsing batch has completed processing and is ready to review.

#### Scenario: Batch becomes ready for review
- **WHEN** a parsing batch finishes background processing and is ready for user review
- **THEN** the system MUST create a user notification indicating that the batch is ready to review
- **AND** the notification payload MUST contain the target `batchId` needed to open `conciliations`

#### Scenario: User is connected when notification is created
- **WHEN** the user is actively connected when the batch becomes ready
- **THEN** the system MUST surface the review-ready notification without requiring the user to refresh the page

### Requirement: Notification Removal On Read
The system MUST remove a persisted review-ready notification after the user reads it.

#### Scenario: User reads a review-ready notification
- **WHEN** the user opens or acknowledges a review-ready batch notification
- **THEN** the system MUST route the user to the corresponding `conciliations` batch URL

#### Scenario: Batch opens successfully from a notification
- **WHEN** the target `conciliations` batch view loads successfully after a notification-driven navigation
- **THEN** the system MUST delete that notification from the notification dataset
