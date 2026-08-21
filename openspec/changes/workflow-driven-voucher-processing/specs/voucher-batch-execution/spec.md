## Purpose

Define the on-demand execution model for voucher parser and persistence batches without coupling application behavior to a specific workflow provider.

## ADDED Requirements

### Requirement: Voucher Batch Processing Must Run On Demand
The system MUST execute voucher parser batches and batch persistence on demand instead of relying on a resident infinite-loop worker.

#### Scenario: Parser batch is created
- **WHEN** a company-scoped voucher parser batch is created successfully
- **THEN** the system MUST trigger parser execution for that batch without requiring a permanently running worker process

#### Scenario: A second parser batch is created while another batch is already running
- **WHEN** a new company-scoped voucher parser batch is created while a different parser batch is already in progress
- **THEN** the system MUST allow the new batch to be triggered independently
- **AND** it MUST NOT block that second batch only because another unrelated batch is running

#### Scenario: Batch persistence handoff is requested
- **WHEN** a user action or application flow requests persistence for multiple staged validated invoices
- **THEN** the system MUST trigger persistence execution on demand for the corresponding batch

#### Scenario: A second persistence workload is requested while another persistence batch is already running
- **WHEN** a user or application flow requests persistence for a different validated batch while another persistence workload is already in progress
- **THEN** the system MUST allow that second workload to be triggered independently
- **AND** it MUST NOT serialize all persistence execution behind one global worker-wide lock

#### Scenario: Individual parser flow is triggered
- **WHEN** a user runs the existing individual parser flow outside a batch upload
- **THEN** the system MUST keep that individual parser behavior on its current non-workflow path

#### Scenario: Individual persistence is triggered
- **WHEN** a user confirms a single validated staged invoice for immediate persistence
- **THEN** the system MUST keep that individual persistence behavior on its current direct execution path

### Requirement: Async Execution Must Be Provider-Agnostic
The system MUST select the async execution provider through configuration so voucher application flows do not depend on provider-specific runtime logic.

#### Scenario: Local execution driver is configured
- **WHEN** the configured async execution driver is `local`
- **THEN** the system MUST execute voucher batch work through the local driver without requiring a remote workflow provider

#### Scenario: GCP execution driver is configured
- **WHEN** the configured async execution driver is `gcp`
- **THEN** the system MUST route voucher batch execution through the GCP Cloud Run Job integration without changing controller or application-service behavior

#### Scenario: Execution provider changes between environments
- **WHEN** different environments use different async execution drivers
- **THEN** the voucher parsing, staging, review, notification, and persistence workflow MUST remain behaviorally consistent

### Requirement: Local Workflow Development Must Remain Supported
The system MUST support local development and automated validation of voucher batch execution without requiring paid remote workflow runs.

#### Scenario: Developer creates a parser batch locally
- **WHEN** a developer runs the application locally with the local execution driver enabled
- **THEN** parser execution MUST run asynchronously within the local application runtime using a fire-and-forget execution model
- **AND** the originating request MUST not wait for the whole batch to finish before responding

#### Scenario: Developer validates persistence flow locally
- **WHEN** a developer triggers persistence execution locally with the local execution driver enabled
- **THEN** the local runtime MUST execute the persistence workflow asynchronously in a way that preserves observable processing states and completion side effects

#### Scenario: Developer validates GCP job integration
- **WHEN** a developer chooses to validate the GCP job integration in development or pre-production
- **THEN** the application MUST support that validation without requiring business-logic code changes
- **AND** moving from local validation to GCP production execution MUST require configuration changes only

### Requirement: Parser And Persistence Execution Must Be Separated
The system MUST expose parser and persistence processing as independent async execution flows so each one can evolve, scale, and fail independently.

#### Scenario: Parser execution is triggered
- **WHEN** parser execution is requested for a batch
- **THEN** the system MUST invoke the parser workflow only
- **AND** it MUST NOT invoke persistence execution unless a persistence handoff is requested separately

#### Scenario: Persistence execution is triggered
- **WHEN** persistence execution is requested for a batch of validated staged invoices
- **THEN** the system MUST invoke the persistence workflow only
- **AND** it MUST use the validated staged payloads already stored for that batch context

#### Scenario: Job receives batch context
- **WHEN** parser batch execution or batch persistence execution is invoked through the GCP driver
- **THEN** the target job MUST receive the `batchId` through execution arguments for that specific run

### Requirement: Triggering Must Be Idempotent
The system MUST prevent duplicate async execution of the same logical voucher workload when repeated triggers occur.

#### Scenario: Same parser batch is triggered twice
- **WHEN** two trigger attempts target the same parser batch while it is already being executed
- **THEN** the system MUST avoid starting a second conflicting execution for that same logical workload

#### Scenario: Two different parser batches are triggered close together
- **WHEN** trigger attempts target two different parser batches in overlapping time windows
- **THEN** the system MUST treat them as independent workloads
- **AND** idempotency or execution-lock protections for one batch MUST NOT block the other batch

#### Scenario: Same persistence workload is triggered twice
- **WHEN** two trigger attempts target the same persistence workload while it is already being executed
- **THEN** the system MUST avoid duplicating voucher creation work for the same validated staged items

#### Scenario: Two different persistence workloads are triggered close together
- **WHEN** trigger attempts target two different persistence workloads in overlapping time windows
- **THEN** the system MUST treat them as independent workloads
- **AND** idempotency or execution-lock protections for one workload MUST NOT block the other workload

#### Scenario: Same individually confirmed invoice is triggered twice
- **WHEN** repeated direct-persistence attempts target the same validated staged invoice while it is already being persisted
- **THEN** the system MUST avoid duplicating real voucher creation for that single staged invoice

### Requirement: Execution Failure Must Leave Recoverable State
The system MUST keep voucher batches recoverable when async execution fails or is interrupted.

#### Scenario: Parser execution fails mid-batch
- **WHEN** parser execution stops before all staged items finish
- **THEN** the system MUST preserve enough persisted state for the affected batch and items to be retried without recreating the batch

#### Scenario: Persistence execution fails mid-batch
- **WHEN** persistence execution stops before all targeted validated items finish
- **THEN** the system MUST preserve enough persisted state for the remaining items to be retried without losing their review context

#### Scenario: Failed batch execution needs manual retry
- **WHEN** parser batch execution or batch persistence execution ends in a recoverable failure state
- **THEN** the system MUST allow that logical workload to be triggered again without recreating the original batch
- **AND** the retry capability MAY be exposed through existing backend or minimal UI hooks without requiring a new dedicated workflow-management screen

### Requirement: Redis Queueing Must No Longer Be The Primary Voucher Execution Path
The system MUST stop relying on Redis-backed queue polling as the primary execution mechanism for voucher batch processing.

#### Scenario: Voucher batch execution is configured in the target architecture
- **WHEN** voucher parser batch execution or batch persistence execution is triggered in the target architecture
- **THEN** the system MUST use the configured on-demand workflow driver as the primary execution path
- **AND** it MUST NOT require Redis queue polling to make that workload progress

#### Scenario: Redis remains available after migration
- **WHEN** Redis is still configured in an environment after workflow migration
- **THEN** the system MAY use Redis only for explicit locking or idempotency support
- **AND** it MUST NOT treat Redis as the authoritative async queue for voucher batch execution

### Requirement: Web Runtime And Async Runtime Must Be Independently Deployable
The system MUST allow the web runtime and the async job runtime to be deployed independently while sharing the same business behavior.

#### Scenario: Web runtime is deployed in Docker
- **WHEN** the web application is deployed through its Docker-based runtime
- **THEN** voucher batch execution MUST still work without embedding the on-demand job execution inside the live HTTP process

#### Scenario: Shared image is deployed for service and jobs
- **WHEN** the same Docker image is deployed to the HTTP web service and to the parser and persistence jobs
- **THEN** the application MUST support different startup commands for each runtime role without requiring separate business-logic builds

#### Scenario: Runtime commands are configured for the shared image
- **WHEN** the shared Docker image is prepared for local or GCP execution
- **THEN** it MUST expose `start:web` for the HTTP runtime
- **AND** it MUST expose `start:parser-job` for parser-batch execution
- **AND** it MUST expose `start:persistence-job` for persistence-batch execution

#### Scenario: Cloud Run runtime roles are provisioned
- **WHEN** production infrastructure is configured on GCP
- **THEN** `Cloud Run Service` MUST execute the shared image with `start:web`
- **AND** the parser `Cloud Run Job` MUST execute the shared image with `start:parser-job`
- **AND** the persistence `Cloud Run Job` MUST execute the shared image with `start:persistence-job`
