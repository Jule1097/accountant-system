## Context

The existing parser route receives multipart files through Next.js, converts them into memory buffers, uploads them through the application, and then creates either a single-file parser response or an asynchronous batch. The parser already has a private temporary Storage bucket, a storage service, a batch repository, a parser service, and an asynchronous runner that can continue processing stored objects.

## Goals / Non-Goals

**Goals:**

- Move binary upload transport from Next.js to the existing private Supabase Storage bucket.
- Preserve the current parser business workflow and public response contracts after confirmation.
- Enforce limits and company isolation before issuing upload authorizations and again before parsing.
- Avoid a database migration by using a short-lived signed upload plan.
- Remove the experimental Next.js proxy body-size configuration.
- Keep the implementation inside the existing parser service, storage service, batch repository, and asynchronous runner boundaries.

**Non-Goals:**

- Replace the existing parser provider, parser queue, review workflow, or persistence workflow.
- Add resumable upload sessions backed by a new database table.
- Add application cleanup jobs, new parser workers, or a second asynchronous execution path.
- Change parser-supported file types, individual limits, aggregate limits, or file-count limits.
- Remove all internal processing buffers required by the current Gemini and PDF integrations.

## Decisions

### Signed stateless upload plan

`VoucherParserService` will create a short-lived, signed plan containing the authenticated user and company scope, voucher context, expected file descriptors, generated storage paths, and expiration. The browser will receive upload authorizations bound to those generated paths. The plan will not trust client-provided storage paths, company identifiers, or post-upload metadata.

A persisted upload-session table was rejected because the current limit and workflow do not require resumable uploads, and avoiding a migration is an explicit constraint. Multi-file confirmation will use plan-generated batch and item identifiers so repeated confirmation can resolve to the existing batch where applicable; single-file confirmation remains protected by the plan expiration and path scope.

### Two JSON application boundaries

The frontend will call a new initialization route with JSON metadata, upload each binary directly to Storage using the returned authorization, and call the existing parser route with a JSON confirmation payload. The existing multipart parser contract will be removed rather than maintained in parallel, allowing the experimental proxy body-size configuration to be deleted.

The route handlers will only parse requests, invoke the existing parser application service, and translate the established application errors into HTTP responses. They will not contain storage, limit, ownership, hash, or batch orchestration logic.

### Existing service and repository reuse

`ParserStorageService` will own signed upload, stored-object metadata, download, and deletion operations. `VoucherParserService` will orchestrate upload-plan creation, confirmation, stored-file validation, single-file parsing, and stored-file batch creation. `ParserBatchRepository` and the existing asynchronous runner will remain the persistence and dispatch boundaries. No new service or runner is required.

The initialization boundary will validate file count, individual size, aggregate size, and MIME type before issuing any signed upload authorization. The current file validation helpers will be generalized so confirmation can validate stored-file metadata and content without requiring the multipart `File` object. Single-file confirmation will download the confirmed object and reuse the existing parser preparation and response path. Batch confirmation will validate stored objects sequentially, retain only the descriptors needed for batch persistence, and let the existing asynchronous runner download each object when processing it.

### Validation and error compatibility

Initialization will reject declared count, individual-size, aggregate-size, and MIME violations before issuing upload authorizations. Confirmation will revalidate the actual stored objects, including content signature and duplicate hash checks, before creating or dispatching work. All known failures will use the existing top-level Spanish `error` response contract so the existing API client and toast require no endpoint-specific error parsing.

### Temporary-object cleanup

Generated paths will remain inside the existing company-scoped temporary bucket namespace and include plan and item identity. Invalid or failed confirmations will remove their temporary objects immediately when possible. An upload plan that expires without confirmation cannot create parser work. Provider-managed Storage retention may remove abandoned objects when supported; this change will not add an application cleanup job. Cleanup failures will use the established contextual English logging and generic public-error boundary.

### Configuration removal

Once the frontend and routes use direct upload, the transport-only parser body-size constant will be removed. Functional parser limits remain centralized in `src/lib/constants/input-limits.ts` and continue to be enforced by the application service. The current `next.config.ts` must remain free of the experimental proxy body-size setting.

## Risks / Trade-offs

- [A client abandons uploaded objects before confirmation] → Expire the upload plan, prevent confirmation after expiration, use provider-managed Storage retention when available, and do not add an application cleanup job.
- [The Storage provider does not expire current objects through lifecycle rules] → Keep the application guarantee limited to non-processability after plan expiration and immediate cleanup on invalid or failed confirmation.
- [Client metadata differs from the actual stored object] → Re-read storage metadata and validate content signature and hash during confirmation.
- [Signed authorization is replayed] → Bind it to the generated path and short expiration, and make multi-file confirmation idempotent through deterministic batch and item identifiers without introducing a consumed-plan store.
- [Direct upload changes the frontend error timing] → Return the same Spanish top-level `error` contract during initialization and confirmation and keep the existing toast resolver unchanged.
- [Current parser integrations still need memory buffers] → Keep buffers inside single-file processing and worker execution, while removing them from the initial Next.js upload transport.
- [Storage provider upload behavior changes] → Keep provider-specific calls inside `ParserStorageService` and cover them with mocked service tests.

## Migration Plan

1. Add failing API, service, storage, hook, and configuration tests for initialization, direct upload confirmation, preserved parser responses, immediate failed-confirmation cleanup, and removal of the experimental transport setting.
2. Implement signed plan creation and direct Storage upload support without changing the existing parser output or batch status contracts.
3. Switch the frontend parser hook to initialize, upload, and confirm directly, preserving existing loading and toast behavior.
4. Remove the multipart parser path and transport-only body-size constant; verify that `experimental.proxyClientMaxBodySize` is absent from the current configuration.
5. Run targeted tests, type checks, lint, and the full regression suite.
6. Roll back by restoring the previous multipart route and frontend upload call if deployment verification exposes a provider or browser compatibility issue; no database rollback is required.
