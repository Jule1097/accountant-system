## MODIFIED Requirements

### Requirement: Parser limits reach the client without generic errors
The parser upload endpoint and its direct-upload initialization and confirmation boundaries SHALL return the specific configured Spanish validation message in the top-level `error` field when the upload exceeds the maximum file count, an individual file size limit, the aggregate size limit, or the supported file-type or content boundary. They SHALL reject the request before issuing upload authorizations or creating a parser batch as applicable.

#### Scenario: Upload exceeds the file-count limit
- **WHEN** the request contains more files than the configured parser batch limit
- **THEN** it returns an HTTP 400 response with the file-count limit message in `error`
- **AND** it does not create a parser batch

#### Scenario: Upload exceeds a file or aggregate size limit
- **WHEN** an individual file or the combined upload exceeds its configured size limit
- **THEN** it returns the corresponding Spanish size-limit message in `error`
- **AND** it does not create a parser batch

#### Scenario: Parser multipart payload reaches the route handler intact
- **WHEN** a parser multipart request is received after the direct-upload transport replacement
- **THEN** the parser contract does not process document binaries through the Next.js route
- **AND** the client uses JSON initialization and confirmation requests instead

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
