## 1. Contracts and failing tests

- [x] 1.1 Audit the existing parser upload hook, API client, parser schemas, storage service, parser service, batch repository, and Supabase browser/server integrations before adding artifacts.
- [x] 1.2 Add failing schema and helper tests for upload metadata, signed-plan payloads, expiration, file-count limits, individual-size limits, aggregate-size limits, supported MIME types, and company scope.
- [x] 1.3 Add failing storage-service tests for signed upload authorization, stored-object metadata lookup, scoped paths, download, deletion, and provider-error isolation.
- [x] 1.4 Add failing API tests for direct-upload initialization, confirmation, malformed JSON, ownership failures, expired plans, specific parser-limit responses, and generic unexpected 500 responses.
- [x] 1.5 Add failing service tests for valid single-file confirmation, valid multi-file batch confirmation, duplicate hashes, content signatures, incomplete uploads, and no batch creation on validation failure.

## 2. Direct Storage upload plan

- [x] 2.1 Add reusable parser upload types, Zod schemas, constants, and plan-signing helpers in the existing parser domains without duplicating input-limit contracts.
- [x] 2.2 Extend the existing parser storage boundary with short-lived signed upload authorization and actual stored-object metadata operations while keeping the bucket private and the service role server-only.
- [x] 2.3 Implement upload-plan creation in the existing parser application service with generated company-scoped paths, expected file descriptors, expiration, and validation before issuing authorizations.
- [x] 2.4 Implement plan verification with authenticated user/company scope, expiration, expected-file identity, and deterministic repeated-confirmation handling without adding a database migration.

## 3. Confirmation and parser workflow

- [x] 3.1 Generalize existing parser file validation so stored objects can be validated sequentially for size, MIME, content signature, aggregate size, and duplicate hash without requiring multipart request entries.
- [x] 3.2 Add stored-file confirmation orchestration that removes invalid temporary objects when possible and creates no parser work after a validation failure.
- [x] 3.3 Refactor the existing parser service to process one confirmed stored file synchronously through the current response path.
- [x] 3.4 Refactor the existing parser service to create multi-file batches from confirmed stored paths and dispatch the current asynchronous parser runner without changing batch or item response contracts.
- [x] 3.5 Verify the existing review, retry, notification, manual recovery, validation, persistence, and cleanup flows consume directly uploaded parser items without transport-specific branches.

## 4. API transport replacement

- [x] 4.1 Implement the direct-upload initialization route as a thin authenticated JSON route delegating validation and plan creation to the parser service.
- [x] 4.2 Replace the parser multipart request handling with JSON confirmation handling while preserving the existing top-level Spanish error contract and single-file/batch success responses.
- [x] 4.3 Add API regression coverage proving count, individual-size, aggregate-size, MIME, content, duplicate, ownership, expiration, and malformed-request errors reach the frontend without generic replacement.

## 5. Frontend upload flow

- [x] 5.1 Add failing hook tests for initialization, direct browser uploads, confirmation, single-file parsing, multi-file batch processing, loading state, cancellation/failure, and server-provided toast messages.
- [x] 5.2 Reuse the existing browser Supabase integration or add the smallest parser-scoped adapter required to upload files using the returned signed authorizations without exposing privileged credentials.
- [x] 5.3 Update the existing voucher parser hook to initialize, upload, confirm, and consume the existing parser response contracts while preserving preview, reset, loading, and toast behavior.
- [x] 5.4 Add frontend handling for partial upload failures that reports the backend error and does not present a parser batch as created; leave pre-confirmation abandonment to Storage retention.

## 6. Cleanup and configuration removal

- [x] 6.1 Add failing cleanup tests for invalid confirmation objects, failed batch creation, and cleanup-provider failures with contextual logging and safe public responses.
- [x] 6.2 Document and verify provider-managed Storage retention for abandoned pre-confirmation objects when supported; document that plan expiration prevents processing even when current-object deletion is unavailable, and do not add an application cleanup job.
- [x] 6.3 Remove the transport-only parser body-size constant and verify that `experimental.proxyClientMaxBodySize` is absent from Next.js configuration after the multipart path is removed.
- [x] 6.4 Update configuration, API, parser, hook, and regression tests to prove no production parser request depends on the experimental Next.js body-size setting.

## 7. Verification and documentation

- [x] 7.1 Run the targeted direct-upload, parser, API error, storage, hook, and toast resolution Jest suites and confirm the new tests pass after failing-first implementation.
- [x] 7.2 Run type checks, touched-area lint, OpenSpec validation, and the full regression suite.
- [x] 7.3 Update architecture and operational documentation for direct Storage uploads, signed-plan expiration, cleanup behavior, and the removed Next.js configuration.
