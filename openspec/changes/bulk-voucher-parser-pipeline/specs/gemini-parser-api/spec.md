## Purpose

Define the external parser API behavior for synchronous single-file voucher ingestion, asynchronous multi-file voucher ingestion, batch status tracking, and staging-oriented parser responses where appropriate.

## ADDED Requirements

### Requirement: File-Count-Based Parser API Behavior
The parser API MUST branch by accepted file count, preserving synchronous behavior for true single-file uploads and using batch-oriented ingestion only for multi-file uploads.

#### Scenario: Single-file parser request
- **WHEN** a user submits exactly one accepted file from the sales or purchases route
- **THEN** the parser API MUST keep the request synchronous
- **AND** it MUST return the parsed payload directly for form patching
- **AND** it MUST NOT create a parsing batch for that request

#### Scenario: Multi-file parser request
- **WHEN** a user submits more than one accepted file from the sales or purchases route
- **THEN** the parser API MUST create a parsing batch and accept the eligible files for asynchronous processing

### Requirement: Batch-Oriented Parser Ingestion
The parser API MUST accept batch-oriented voucher ingestion requests from the current sales or purchases route only when more than one file is submitted.

#### Scenario: Sales batch ingestion request
- **WHEN** a user submits a valid multi-file parser batch request from the sales route
- **THEN** the parser API MUST create a sales-scoped parsing batch and accept the eligible files for asynchronous processing

#### Scenario: Purchases batch ingestion request
- **WHEN** a user submits a valid multi-file parser batch request from the purchases route
- **THEN** the parser API MUST create a purchases-scoped parsing batch and accept the eligible files for asynchronous processing

#### Scenario: Single-file parser request keeps route context
- **WHEN** a user submits a single-file parser request from the sales or purchases route
- **THEN** the parser API MUST receive and honor that explicit route context when deciding how to parse the voucher

### Requirement: Batch And Item Status Retrieval
The parser API MUST expose the current state of a parsing batch and its staged items so downstream review workflows can load operational progress.

#### Scenario: Client requests batch status
- **WHEN** an authorized client requests the current state of an existing parsing batch
- **THEN** the parser API MUST return the batch metadata and the current state of each staged item

#### Scenario: Client requests item state after parsing changes
- **WHEN** item parsing states change after the batch was created
- **THEN** the parser API MUST return the current item states instead of stale creation-time values

### Requirement: Parsed Results Remain In Staging
The parser API MUST return staged parsing outcomes without treating them as committed vouchers.

#### Scenario: Parsed item is ready for review
- **WHEN** a staged item has a successful parsing outcome
- **THEN** the parser API MUST expose the parsed result as a staged review payload
- **AND** it MUST NOT report that item as a persisted voucher

#### Scenario: Parsed item fails
- **WHEN** a staged item parsing attempt fails
- **THEN** the parser API MUST expose the failed current state so the review workflow can offer a retry action

#### Scenario: Single-file parsing completes successfully
- **WHEN** a synchronous single-file parsing request completes successfully
- **THEN** the parser API MUST return the parsed result directly to the caller
- **AND** it MUST NOT expose that result as a staged batch item

### Requirement: Input-Aware Prompt Selection
The parser API MUST choose the parsing prompt according to the document input strategy while preserving the explicit sales or purchases route context.

#### Scenario: Parser receives Markdown extracted from a text-based PDF
- **WHEN** the parser is operating on Markdown extracted from a text-based PDF
- **THEN** it MUST use a text-oriented prompt variant for voucher extraction
- **AND** it MUST still honor the explicit sales or purchases route context

#### Scenario: Parser receives a visual document input
- **WHEN** the parser is operating on a PDF or image through visual parsing
- **THEN** it MUST use a visual prompt variant for voucher extraction
- **AND** it MUST still honor the explicit sales or purchases route context

### Requirement: Duplicate-Aware Batch Acceptance
The parser API MUST ignore files that are already present in the same batch or already queued for parsing during the same batch lifecycle.

#### Scenario: Duplicate file is submitted again for the batch
- **WHEN** an ingestion request contains a file that is already attached to the same parsing batch
- **THEN** the parser API MUST exclude that duplicate file from acceptance

#### Scenario: File is already queued
- **WHEN** an ingestion request contains a file that is already queued in that parsing batch
- **THEN** the parser API MUST refuse to enqueue that file a second time
