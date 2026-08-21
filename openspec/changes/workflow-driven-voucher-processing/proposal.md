## Why

The current voucher background processing model depends on an always-on worker with an infinite polling loop, which adds avoidable runtime cost and couples async execution to a long-lived process. We need to move voucher parsing and persistence handoff to an on-demand job model on GCP that preserves the current business flow while keeping the application portable across execution providers.

## What Changes

- Replace the infinite-loop voucher worker as the primary execution model with on-demand batch execution for parser batches and batch persistence flows.
- Introduce a provider-agnostic async batch runner abstraction so controllers and application services do not depend directly on GCP.
- Split async execution into two independent Cloud Run Job entrypoints: one for parser processing and one for persistence processing.
- Add a local asynchronous workflow driver that behaves like production through fire-and-forget batch execution without requiring a remote workflow provider during everyday development.
- Keep the web application dockerized and reuse the same Docker image for both the HTTP web service and the two on-demand Cloud Run Jobs.
- Standardize three runtime commands over the shared image: `start:web`, `start:parser-job`, and `start:persistence-job`.
- Add provider configuration through environment variables so batch execution can switch between local development validation and GCP production execution without code changes.
- Keep individual parser execution and direct individual persistence on their current non-workflow path while moving batch-oriented async execution to the new workflow model.
- Replace worker recovery and polling responsibilities with explicit on-demand execution, idempotent triggering, deterministic retry orchestration, and manual re-trigger support exposed through application/backend flows without requiring a new dedicated operational UI.
- Pass `batchId` to on-demand jobs through execution arguments instead of hardcoded environment-specific logic.
- Allow multiple company-scoped batches to be triggered independently so a newly created batch can start processing even if another batch is already in progress.

## Capabilities

### New Capabilities
- `voucher-batch-execution`: Defines provider-agnostic on-demand execution for parser and persistence batches, including local development behavior, provider selection, and execution guarantees.

### Modified Capabilities
- None.

## Impact

- Affects voucher parser batch execution, batch persistence execution, provider configuration, local development workflow behavior, deployment topology, Cloud Run Job triggering, and runtime ownership between Docker and on-demand job execution.
- Reuses current batch records, staged-item lifecycle, parser logic, persistence logic, and notification flow.
- Requires replacing the current worker entrypoint strategy with on-demand triggers from application services and routes, plus GCP infrastructure for Artifact Registry and Cloud Run.
- Requires updating Docker, startup scripts, and deployment configuration so the shared image can be executed as a Cloud Run service or as either Cloud Run Job role.
