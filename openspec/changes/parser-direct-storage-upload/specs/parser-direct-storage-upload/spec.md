## Purpose

Defines a production-safe parser upload workflow that transfers document binaries directly to private storage while preserving the existing validation, parsing, review, and persistence behavior.

## ADDED Requirements

### Requirement: Parser upload initialization creates a bounded upload plan
The parser upload initialization flow SHALL accept only the voucher context and file metadata, validate the configured file-count, individual-size, aggregate-size, supported-type, and company-scope constraints, and return short-lived upload authorizations only for valid files.

#### Scenario: Valid upload plan is created
- **WHEN** an authenticated user initializes a parser upload with valid voucher context and files within all configured limits
- **THEN** the system returns one unique, company-scoped upload target and short-lived upload authorization per file
- **AND** it does not create a parser batch before upload confirmation

#### Scenario: Upload plan exceeds a configured limit
- **WHEN** initialization receives more files than allowed, an individual file over its limit, or an aggregate size over the configured limit
- **THEN** the system rejects the request with the corresponding Spanish validation error
- **AND** it does not issue upload authorizations
- **AND** it does not upload objects or create a parser batch

#### Scenario: Upload plan contains an unsupported file
- **WHEN** initialization receives a file type that is not supported by the parser
- **THEN** the system rejects the request with the configured Spanish file-type error
- **AND** it does not issue an upload authorization for that file

### Requirement: Parser upload confirmation validates stored files before parsing
The parser confirmation flow SHALL accept only the upload plan reference and uploaded file references, verify plan expiration, user and company scope, expected file identity, storage existence, actual metadata, content signature, size, aggregate limits, and duplicate hashes before creating or dispatching parser work.

#### Scenario: Confirmation is unauthorized or expired
- **WHEN** confirmation uses an invalid, expired, or company-mismatched upload plan
- **THEN** the system returns an HTTP 400 or 403 response with an actionable Spanish error
- **AND** it does not parse files or create a parser batch

#### Scenario: A stored file fails backend validation
- **WHEN** confirmation finds a missing, altered, oversized, unsupported, corrupt, or duplicated stored file
- **THEN** the system returns the corresponding Spanish validation error
- **AND** it does not create or dispatch a parser batch
- **AND** invalid temporary objects are deleted when possible

#### Scenario: Confirmation receives an incomplete upload set
- **WHEN** confirmation omits one or more files included in the upload plan
- **THEN** the system rejects the confirmation with an actionable Spanish error
- **AND** it does not create or dispatch a parser batch

### Requirement: Confirmed uploads preserve the existing parser workflow
After successful confirmation, the system SHALL preserve the current single-file response, multi-file batch response, asynchronous parser queue, review states, validation flow, and persistence flow.

#### Scenario: One confirmed file is parsed
- **WHEN** confirmation succeeds for exactly one supported file
- **THEN** the system processes the stored file synchronously
- **AND** it returns the existing single-file parser response contract

#### Scenario: Multiple confirmed files create a parser batch
- **WHEN** confirmation succeeds for multiple supported files
- **THEN** the system creates the parser batch and items with the existing metadata contract
- **AND** it dispatches the existing asynchronous parser workflow
- **AND** it returns the existing accepted batch response contract

#### Scenario: Parser review and persistence continue after direct upload
- **WHEN** a directly uploaded file reaches a parsed, failed, validated, or persisted state
- **THEN** the existing review, retry, validation, persistence, notification, and cleanup behavior remains available without a transport-specific branch

### Requirement: Parser binaries bypass the Next.js request transport
The direct parser upload flow SHALL transfer document binaries directly to the private storage provider and SHALL use JSON requests only for initialization and confirmation.

#### Scenario: Direct upload does not depend on the Next.js body limit
- **WHEN** a valid upload plan is used to transfer parser files
- **THEN** the document binaries do not pass through the Next.js parser route
- **AND** the parser workflow does not require the experimental Next.js proxy body-size configuration

### Requirement: Abandoned direct uploads cannot create parser work
The system SHALL expire upload plans, prevent expired plans from creating parser work, and delete invalid or failed-confirmation objects when possible. Objects abandoned before confirmation SHALL remain outside the parser workflow. Provider-managed Storage retention MAY remove them when supported; the application SHALL NOT add a new cleanup job for this flow.

#### Scenario: Upload plan expires without confirmation
- **WHEN** an upload plan expires without successful confirmation
- **THEN** its uploaded objects cannot be confirmed or used for parser processing
- **AND** any eventual removal is governed by provider-managed Storage retention when available

#### Scenario: Confirmation fails after objects were uploaded
- **WHEN** confirmation detects an invalid, incomplete, or inconsistent uploaded set
- **THEN** the system returns the corresponding validation error
- **AND** it does not create or dispatch a parser batch
- **AND** it attempts to delete the uploaded temporary objects
