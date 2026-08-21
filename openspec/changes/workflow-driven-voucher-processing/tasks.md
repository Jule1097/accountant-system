## 1. Async Execution Contract

- [x] 1.1 Define the provider-agnostic async batch runner contract for parser and persistence execution
- [x] 1.2 Add environment-driven runner resolution so controllers and application services do not branch on provider-specific logic
- [x] 1.3 Add startup validation for workflow-driver configuration and provider-specific identifiers
- [x] 1.4 Keep the current individual parser and direct individual persistence paths outside the new workflow runner contract
- [x] 1.5 Define development-only local validation configuration and production GCP job configuration so moving environments does not require code changes

## 2. Shared Batch Processing Services

- [x] 2.1 Extract reusable parser batch-processing services from the current infinite-loop worker flow
- [x] 2.2 Extract reusable persistence batch-processing services from the current infinite-loop worker flow
- [x] 2.3 Add idempotency and execution-lock handling for parser and persistence trigger paths
- [x] 2.3.1 Scope execution locks and idempotency markers per logical batch workload so different batches can progress concurrently without interfering with each other
- [x] 2.4 Replace passive loop-based recovery assumptions with explicit retry and retrigger handling in shared services
- [x] 2.5 Remove Redis queue orchestration from the voucher batch-processing path or reduce it to explicit locking support only if still required

## 3. Local And GCP Drivers

- [x] 3.1 Implement the local asynchronous runner so parser and persistence batches execute off-request inside the local app runtime
- [x] 3.2 Implement the GCP Cloud Run Job runner for parser execution using provider-specific configuration only in the infrastructure layer
- [x] 3.3 Implement the GCP Cloud Run Job runner for persistence execution using provider-specific configuration only in the infrastructure layer
- [x] 3.4 Add job entrypoints that call the shared batch-processing services without duplicating business logic
- [x] 3.4.1 Standardize the parser job runtime behind the `start:parser-job` startup command
- [x] 3.4.2 Standardize the persistence job runtime behind the `start:persistence-job` startup command
- [x] 3.5 Pass `batchId` to parser and persistence jobs through execution arguments and validate that contract at the adapter boundary

## 4. Application Flow Integration

- [x] 4.1 Update parser-batch creation flow to trigger on-demand parser execution through the async batch runner
- [x] 4.2 Update persistence handoff flow to trigger on-demand persistence execution through the async batch runner
- [x] 4.3 Remove the infinite-loop worker from the supported runtime path and stop relying on a worker container as the primary execution model
- [x] 4.4 Add backend or minimal UI hooks for manual retrigger of recoverable batch workloads without introducing a new workflow-management screen

## 5. Runtime And Developer Tooling

- [x] 5.1 Update Docker and runtime scripts so one image supports the web service and both job runtimes through the `start:web`, `start:parser-job`, and `start:persistence-job` startup commands
- [x] 5.2 Document local async-driver testing flow and pre-production GCP validation flow without requiring code changes between environments
- [x] 5.3 Document Artifact Registry, Cloud Run Service, and Cloud Run Job production configuration for separate parser and persistence job execution, including which runtime command each service or job must use

## 6. Validation

- [x] 6.1 Add or update Jest coverage for async batch runner resolution, local async execution, and idempotent trigger behavior
- [x] 6.2 Add or update Jest coverage for extracted parser and persistence batch-processing services
- [x] 6.3 Add or update integration-style tests for parser-batch creation and persistence handoff using the local async driver
- [x] 6.4 Run the relevant Jest suites for parser execution, persistence execution, and async-runner integration before handoff
