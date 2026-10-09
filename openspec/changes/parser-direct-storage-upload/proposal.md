## Why

The parser currently receives multipart files through Next.js, where the framework transport limit can truncate requests before the parser route validates the configured 20-file and 24 MB limits. The request path also buffers uploaded files in the application before storing them, so production uploads depend on an experimental Next.js setting and consume unnecessary application memory.

## What Changes

- Add a signed, short-lived upload plan so the browser uploads parser files directly to the existing private Supabase Storage bucket.
- **BREAKING** Replace the parser multipart upload contract with a metadata initialization request followed by a JSON confirmation request.
- Validate file count, individual size, aggregate size, and MIME type before issuing signed upload URLs, then validate upload-plan ownership and actual stored content during confirmation.
- Preserve synchronous parsing for one confirmed file and the existing asynchronous batch creation and parser queue for multiple confirmed files.
- Reuse the existing parser storage, batch repository, parser service, notification, review, validation, and persistence flows after upload confirmation.
- Remove the experimental Next.js proxy body-size configuration because parser binaries no longer pass through Next.js.
- Preserve the existing Spanish backend error contract and toast behavior for file-count, size, type, content, duplicate, malformed-request, and unexpected-error cases.
- Delete invalid or failed-confirmation objects without creating parser batches, and use provider-managed Storage retention for uploads abandoned before confirmation when supported.
- Do not add application cleanup jobs, parser workers, upload-session tables, or a second asynchronous execution path.

## Capabilities

### New Capabilities

- `parser-direct-storage-upload`: Defines direct parser uploads through signed Supabase Storage operations and continuation of the existing parser workflow.

### Modified Capabilities

- `api-error-responses`: Extends parser limit and validation error behavior to the direct-upload initialization and confirmation boundaries while preserving the existing toast contract.

## Impact

- Affected routes: parser upload initialization and parser confirmation endpoints.
- Affected application areas: parser upload hook, parser Zod schemas, `VoucherParserService`, `ParserStorageService`, parser repositories, API error tests, and upload-flow tests.
- Affected configuration: removal of `experimental.proxyClientMaxBodySize` and its transport-only input limit.
- External system: existing private Supabase Storage bucket, its signed-upload capabilities, and configured retention policy; no database migration or new application job is required.
- The parser output, batch statuses, review workflow, validation flow, persistence flow, and existing error payload contract remain unchanged after confirmation.
