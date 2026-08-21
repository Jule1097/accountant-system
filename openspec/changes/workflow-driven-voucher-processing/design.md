## Context

The current voucher processing runtime uses a single worker script with an infinite loop to dequeue parser and persistence jobs, recover pending items, and perform cleanup. See [proposal.md](proposal.md) for motivation. The parser pipeline, staged-item lifecycle, conciliations review flow, and notification behavior already exist and should be preserved. The project also needs to keep local development productive without depending on paid remote job execution.

## Goals / Non-Goals

**Goals:**
- Replace the infinite-loop worker with provider-agnostic on-demand execution.
- Keep parser and persistence processing as separate async execution flows.
- Support local asynchronous execution that behaves like production closely enough to exercise processing states, refresh flows, and completion side effects.
- Keep the web runtime dockerized while reusing the same image for HTTP runtime and on-demand job execution.
- Make provider selection configuration-driven so a future GCP replacement does not require controller or application-service rewrites.
- Preserve the current individual parser and direct individual persistence paths outside the new workflow scope.

**Non-Goals:**
- Redesign the parser payload format, staged-item schema, conciliations review flow, or notification UX.
- Introduce a new provider beyond local and GCP in this change.
- Keep the infinite-loop worker as a supported runtime after migration completes.

## Decisions

### 1. Introduce an async batch runner port
- **Decision:** Application services will depend on a single async batch execution port that supports parser and persistence triggers through explicit batch-oriented methods.
- **Rationale:** This keeps controller and service code provider-agnostic and aligns with the repository's clean architecture rules.
- **Alternatives:** Calling Render directly from routes was rejected because it couples framework code to provider APIs. Keeping provider selection inside business services was rejected because it spreads infrastructure concerns across application logic.

### 2. Keep local execution asynchronous inside the app runtime
- **Decision:** The local driver will trigger batch work asynchronously inside the local application runtime through a fire-and-forget mechanism rather than running it inline in the originating request.
- **Rationale:** This gives developers a closer approximation of production behavior, including visible `processing` states, page refresh recovery, and delayed completion side effects, without requiring remote workflow runs.
- **Alternatives:** Inline local execution was rejected because it hides async behavior and makes development diverge too much from production.

### 3. Split parser and persistence into separate Cloud Run Jobs
- **Decision:** Parser execution and persistence execution will use separate Cloud Run Job entrypoints and separate trigger methods.
- **Rationale:** The two flows have different inputs, failure modes, retry semantics, and future scaling needs. Keeping them separate makes it easier to add future async modules such as new parsers or exports.
- **Alternatives:** A single job with internal branching was rejected because it centralizes unrelated operational concerns and makes future growth harder.

### 3.1 Keep individual flows outside the workflow migration scope
- **Decision:** The new workflow model will apply to parser batches and batch persistence only. The current individual parser path and direct individual persistence path will remain outside this workflow migration.
- **Rationale:** The architectural problem to solve is long-lived background batch processing, not the direct single-item flows that already match their UX expectations.
- **Alternatives:** Forcing every voucher-related execution path through workflows was rejected because it expands scope, increases complexity, and changes behavior that is not currently problematic.

### 4. Extract reusable on-demand processors from the current worker
- **Decision:** The current worker loop responsibilities will be decomposed into reusable application services for parser-batch execution, parser-item execution, persistence-batch execution, and batch finalization.
- **Rationale:** The provider runner should only trigger execution. Business logic must remain reusable by local and by automated tests.
- **Alternatives:** Moving the existing loop body directly into workflow adapters was rejected because it would duplicate logic and entangle provider infrastructure with business rules.

### 5. Keep provider identifiers in configuration
- **Decision:** Provider-specific job identifiers, credentials, project metadata, and driver selection will be resolved through environment variables and a single composition root.
- **Rationale:** The project explicitly wants provider portability without controller or service rewrites.
- **Alternatives:** Hardcoding Cloud Run Job names, project identifiers, or regions was rejected because it would make future provider changes invasive.

### 5.1 Treat local GCP validation as a configuration concern, not a code fork
- **Decision:** The codebase will support local development primarily through the local async driver, while GCP-specific validation remains a development-only or staging infrastructure validation path that must not require business-logic edits. Production execution will use Cloud Run Jobs through configuration only.
- **Rationale:** The project wants confidence that GCP integration works without making daily development depend on cloud tooling.
- **Alternatives:** Making GCP job execution the only supported development path was rejected because it would slow day-to-day development and over-couple the implementation to provider tooling.

### 6. Remove the infinite-loop worker from the supported runtime model
- **Decision:** The target architecture will no longer support the infinite-loop worker as an operational path once migration is complete.
- **Rationale:** Keeping both execution models permanently would increase complexity and create ambiguity about the authoritative processing path.
- **Alternatives:** Long-term dual support was rejected because it would leave the application carrying two orchestration models indefinitely.

### 7. Reuse one Docker image for the web service and both jobs
- **Decision:** The web runtime will remain Docker-based, and the same Docker image will also be used by the parser and persistence Cloud Run Jobs with different startup commands.
- **Rationale:** This keeps the build pipeline simple, avoids drift between runtime environments, and still preserves clean operational separation between HTTP serving and on-demand batch execution.
- **Alternatives:** Separate images for web and jobs were rejected because they increase maintenance overhead. Embedding job execution into the live web service process was rejected because it reintroduces runtime coupling and weakens operational separation.

### 7.0 Standardize runtime entry commands
- **Decision:** The shared image will expose three explicit runtime commands: `start:web` for the HTTP runtime, `start:parser-job` for parser-batch execution, and `start:persistence-job` for persistence-batch execution.
- **Rationale:** Naming the entry commands in the design removes ambiguity for Dockerfile, package scripts, Cloud Run service configuration, and Cloud Run Job definitions.
- **Alternatives:** Leaving command names unspecified until implementation was rejected because it creates avoidable drift across Docker, documentation, and infrastructure setup.

### 7.1 Pass `batchId` through job execution arguments
- **Decision:** Batch-targeted Cloud Run Job executions will receive `batchId` through execution arguments rather than fixed environment variables.
- **Rationale:** This makes each execution explicit, avoids mutable shared config per batch, and fits the on-demand execution model cleanly.
- **Alternatives:** Encoding batch context only in environment variables was rejected because it is less explicit for per-execution invocation.

### 7.2 Treat different batches as independent concurrent workloads
- **Decision:** Different parser batches and different persistence batches will be treated as independent workloads that may execute concurrently, while locks and idempotency will apply at the logical workload level of each batch or targeted staged-item set.
- **Rationale:** A new batch must not wait behind an unrelated in-flight batch, otherwise the new architecture would keep the single-worker bottleneck in another form.
- **Alternatives:** Serializing all batch work behind a single global workflow lane was rejected because it increases latency unnecessarily and couples unrelated company operations.

## Risks / Trade-offs

- **[Risk] Local async execution may still differ from provider-managed runs** -> Mitigation: keep provider adapters thin, move business logic into shared services, and validate the final wiring in staging with the GCP driver.
- **[Risk] Duplicate triggers could still happen under concurrent requests** -> Mitigation: persist and enforce execution locks or idempotency markers at the batch or staged-item workload level before invoking provider runs.
- **[Risk] A second valid batch could be blocked accidentally by over-broad locking** -> Mitigation: scope locks and execution markers to the specific batch workload instead of using global worker-wide exclusivity.
- **[Risk] Removing the loop eliminates automatic passive recovery behavior** -> Mitigation: make retries and explicit re-trigger flows part of the processor services and batch status transitions.
- **[Risk] Individual paths could be accidentally migrated into workflows by scope creep** -> Mitigation: keep the specs and trigger contracts explicit that only parser batches and batch persistence move to the on-demand workflow model.
- **[Risk] Separate parser and persistence entrypoints increase configuration surface** -> Mitigation: centralize provider configuration and validate startup configuration early.
- **[Risk] Redis queue behavior may leak into the new model and create dual orchestration paths** -> Mitigation: remove Redis as the primary queueing mechanism for voucher batch execution and limit any Redis use to explicit locking only if still needed.
- **[Risk] Manual retrigger could be mistaken for a promise of a new operational console** -> Mitigation: scope this change to backend/application hooks and only minimal UI exposure if strictly needed.
- **[Risk] GCP job invocation adds cloud-auth complexity to the web runtime** -> Mitigation: isolate invocation logic inside the GCP adapter and document required service-account permissions clearly.
- **[Risk] Deployment scripts and developer expectations may still assume a worker container exists** -> Mitigation: update Docker, compose, scripts, and documentation in the same change so the new runtime model is explicit.

## Migration Plan

1. Extract reusable parser and persistence batch processors from the current worker loop implementation.
2. Introduce the async batch runner port plus local and GCP implementations.
3. Update parser-batch creation and persistence-handoff flows so they trigger the runner instead of relying on queue polling.
4. Update local development wiring, scripts, and documentation to use the local async driver by default.
5. Update deployment configuration so Docker produces one image consumed by the Cloud Run service and both Cloud Run Jobs, using `start:web`, `start:parser-job`, and `start:persistence-job` as the runtime commands.
6. Remove Redis-backed queue polling and the infinite-loop worker from the supported runtime path after end-to-end verification passes.
