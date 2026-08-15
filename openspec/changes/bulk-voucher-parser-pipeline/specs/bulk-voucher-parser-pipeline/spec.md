## Purpose

Define the temporary staging and asynchronous processing behavior required to parse voucher batches before any real voucher is created in the accounting dataset.

## ADDED Requirements

### Requirement: File-Count-Based Parser Orchestration
The system MUST choose the parser orchestration path according to the number of accepted files instead of the upload gesture.

#### Scenario: User uploads exactly one file
- **WHEN** a user submits exactly one accepted voucher file from the current sales or purchases context
- **THEN** the system MUST keep the parsing flow synchronous
- **AND** it MUST patch the current voucher form directly with the parsed result
- **AND** it MUST NOT create a temporary parsing batch for that request

#### Scenario: User uploads more than one file
- **WHEN** a user submits more than one accepted voucher file from the current sales or purchases context
- **THEN** the system MUST create a temporary parsing batch and route the request through the asynchronous batch pipeline

### Requirement: Batch Upload Staging
The system MUST allow the current sales or purchases route to create a parsing batch containing up to 20 source files only for multi-file ingestion and stage each file as a temporary batch item before real voucher validation.

#### Scenario: User uploads a valid batch
- **WHEN** a user uploads between 2 and 20 voucher files from the current sales or purchases context
- **THEN** the system MUST create a temporary parsing batch scoped to that context
- **AND** the system MUST create a temporary batch item for each accepted file

#### Scenario: User exceeds the batch file limit
- **WHEN** a user attempts to upload more than 20 files in the same parsing batch
- **THEN** the system MUST reject the batch request with a Spanish error indicating the batch limit was exceeded

### Requirement: File-Type Size Limits
The system MUST apply differentiated upload size limits by document type for parser ingestion.

#### Scenario: User uploads a PDF within the allowed size
- **WHEN** a user uploads a PDF file up to 2MB for parser ingestion
- **THEN** the system MUST allow that file to continue through parser intake

#### Scenario: User uploads an image within the allowed size
- **WHEN** a user uploads a PNG or JPEG file up to 4MB for parser ingestion
- **THEN** the system MUST allow that file to continue through parser intake

#### Scenario: User exceeds the size limit for the file type
- **WHEN** a user uploads a file that exceeds the configured parser size limit for its document type
- **THEN** the system MUST reject that file with a Spanish error explaining the limit

### Requirement: Temporary Source File Lifecycle
The system MUST store source files in temporary storage only while the corresponding batch items remain unresolved.

#### Scenario: Batch item remains pending review
- **WHEN** a batch item is still unresolved after upload and parsing
- **THEN** the source file MUST remain available through temporary storage for at most 24 hours

#### Scenario: Batch item is resolved
- **WHEN** a batch item is resolved through validation or discard
- **THEN** the system MUST remove the corresponding source file from temporary storage

### Requirement: Duplicate Prevention During Enqueueing
The system MUST prevent the same source file from being enqueued twice for parsing inside the same operational batch lifecycle.

#### Scenario: File is already part of the batch
- **WHEN** a user attempts to add a file that is already present in the same parsing batch
- **THEN** the system MUST ignore that duplicate file instead of creating another batch item

#### Scenario: File is already queued for parsing
- **WHEN** a user attempts to enqueue a file that is already queued for parsing in the same batch
- **THEN** the system MUST refuse to enqueue that file again

#### Scenario: Single-file parser request
- **WHEN** a user submits exactly one file through the synchronous parser flow
- **THEN** the system MUST NOT apply batch duplicate-enqueue semantics because no batch lifecycle exists for that request

### Requirement: Asynchronous Per-File Parsing
The system MUST process each staged file independently through asynchronous parsing jobs and expose only the current item state to the user interface.

#### Scenario: Batch contains multiple files
- **WHEN** a parsing batch contains multiple staged files
- **THEN** the system MUST process each file independently so one item failure does not block the rest of the batch

#### Scenario: Parsing finishes for a file
- **WHEN** an individual file parsing job completes
- **THEN** the system MUST update that batch item with the current parsing result state without creating a real voucher record

### Requirement: Hybrid PDF Routing
The system MUST classify PDFs before parsing so text-based PDFs can follow a text-first route while mixed or image-based PDFs continue through visual parsing.

#### Scenario: PDF is classified as text-based
- **WHEN** a staged PDF is classified as text-based
- **THEN** the system MUST extract Markdown from that PDF before asking Gemini to parse the voucher data

#### Scenario: PDF is classified as mixed or image-based
- **WHEN** a staged PDF is classified as mixed, scanned, or image-based
- **THEN** the system MUST send that document through Gemini visual parsing instead of Markdown-first parsing

#### Scenario: Text-based PDF extraction is insufficient
- **WHEN** a text-based PDF yields empty or insufficient Markdown for reliable parsing
- **THEN** the system MUST fall back to Gemini visual parsing for that document

### Requirement: Retry Support With Technical Traceability
The system MUST allow failed parsing items to be retried while preserving technical retry traceability in backend processing records.

#### Scenario: Failed item is retried
- **WHEN** a user requests a retry for a failed parsing item
- **THEN** the system MUST enqueue a new parsing attempt for that item
- **AND** the user-facing batch item state MUST reflect only the current attempt status

#### Scenario: Multiple retries occur
- **WHEN** the same batch item is retried more than once
- **THEN** the backend MUST preserve technical retry traceability for diagnostic purposes

### Requirement: Temporary Staging Only
The system MUST keep parsed batch results in temporary staging until a later validation workflow approves them for real voucher persistence.

#### Scenario: Parsing completes successfully
- **WHEN** an item finishes parsing successfully
- **THEN** the system MUST store the parsed result only in temporary staging
- **AND** it MUST NOT create a real voucher yet

#### Scenario: Temporary item expires unresolved
- **WHEN** a staged item remains unresolved beyond the temporary retention window
- **THEN** the system MUST remove the temporary staging record and its temporary source file
