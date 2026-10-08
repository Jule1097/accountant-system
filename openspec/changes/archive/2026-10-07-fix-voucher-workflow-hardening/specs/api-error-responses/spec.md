# api-error-responses Specification

## Purpose
Defines the backend error contract used by application-owned API routes so known client failures reach the existing toast feedback with an actionable Spanish message.

## Requirements
### Requirement: Known client errors use the public error contract
Application-owned API endpoints SHALL return known validation, request-shape, business-rule, and resource-limit failures with an HTTP 4xx status and a top-level `error` field containing a short actionable Spanish message. The response MAY include structured diagnostic details for non-UI consumers, but the top-level `error` field SHALL remain sufficient for the client feedback flow.

#### Scenario: Voucher validation fails before persistence
- **WHEN** a voucher create or update request fails Zod or domain validation
- **THEN** the endpoint returns a client error response with the corresponding Spanish validation message in `error`
- **AND** it does not invoke repository persistence

#### Scenario: Conciliation action validation fails
- **WHEN** a validate, persist, discard, retry, or manual-recovery request contains invalid body data or identifiers
- **THEN** the endpoint returns an actionable Spanish client error in `error`
- **AND** it does not execute the requested state transition

### Requirement: Invalid request bodies do not become internal errors
Endpoints that receive JSON or multipart form data SHALL translate malformed request bodies and unreadable form data into controlled HTTP 400 responses with short Spanish messages. They SHALL not expose parser exceptions, stack traces, provider details, SQL errors, or other internal diagnostics.

#### Scenario: JSON body cannot be parsed
- **WHEN** an endpoint receives malformed JSON
- **THEN** it returns an HTTP 400 response with a Spanish request-format error in `error`
- **AND** it does not execute application or persistence logic

#### Scenario: Multipart body cannot be parsed
- **WHEN** an upload endpoint receives an invalid multipart body
- **THEN** it returns an HTTP 400 response with a Spanish upload-format error in `error`
- **AND** it does not create a parser batch

### Requirement: Parser limits reach the client without generic errors
The parser upload endpoint SHALL return the specific configured Spanish validation message in `error` when the upload exceeds the maximum file count, an individual file size limit, the aggregate size limit, or the supported file-type boundary. It SHALL reject the request before creating a parser batch.

#### Scenario: Upload exceeds the file-count limit
- **WHEN** the request contains more files than the configured parser batch limit
- **THEN** the endpoint returns an HTTP 400 response with the file-count limit message in `error`
- **AND** it does not create a parser batch

#### Scenario: Upload exceeds a file or aggregate size limit
- **WHEN** an individual file or the combined upload exceeds its configured size limit
- **THEN** the endpoint returns the corresponding Spanish size-limit message in `error`
- **AND** it does not create a parser batch

#### Scenario: Parser multipart payload reaches the route handler intact
- **WHEN** a parser multipart request is within the configured aggregate file limit plus multipart transport overhead
- **THEN** the framework transport limit allows the complete body to reach the parser route
- **AND** the route can return the specific file-count or aggregate-size validation message instead of a generic internal error

#### Scenario: Direct upload initialization preserves parser limit responses
- **WHEN** the direct-upload initialization request exceeds the configured file-count or aggregate-size limit
- **THEN** the endpoint returns HTTP 400 with the same configured Spanish message currently exposed by the parser contract
- **AND** it does not issue signed upload URLs or create a parser batch
- **AND** the existing toast displays the backend-provided message

#### Scenario: Direct upload confirmation preserves parser limit responses
- **WHEN** confirmation detects that uploaded files exceed count, individual-size, aggregate-size, type, or content limits
- **THEN** the endpoint returns the corresponding Spanish validation message in the top-level `error` field
- **AND** it does not create or dispatch a parser batch
- **AND** the existing toast displays that same message

#### Scenario: Valid direct upload preserves the parser workflow
- **WHEN** all uploaded files pass backend validation
- **THEN** the system creates the parser batch or processes the individual file using the existing response contract
- **AND** the existing parser queue, review, validation, and persistence flow remains unchanged

### Requirement: Unexpected failures retain the internal-error boundary
Unexpected server failures SHALL continue to return the generic Spanish internal-error response with HTTP 500. The backend SHALL log the internal diagnostic with sufficient request and operation context without exposing it in the public response.

#### Scenario: Unhandled application failure occurs
- **WHEN** an endpoint encounters an error that is not a known client or application error
- **THEN** it returns HTTP 500 with the generic internal-error message in `error`
- **AND** the response does not include stack traces, provider details, SQL errors, or personal data

### Requirement: Error responses are consumable by the existing feedback flow
The public API error contract SHALL remain compatible with the existing API client and toast resolution flow. The frontend SHALL be able to display the server-provided top-level `error` message without endpoint-specific parsing or replacement logic.

#### Scenario: Server returns a known validation error
- **WHEN** the API client receives a non-success response with a top-level `error` field
- **THEN** the existing error resolver returns that message to the calling hook
- **AND** the toast displays the server-provided Spanish message
