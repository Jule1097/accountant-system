## Context

The current parser flow is single-file and synchronous: the route receives one document, calls Gemini inside the request lifecycle, and returns the extracted payload directly to the voucher form. That fast path should remain intact for true single-file uploads. The new batch workflow is needed only for multi-file uploads, with asynchronous processing, temporary storage, staging records, queue-based execution, and eventual cleanup without creating real vouchers before user approval. See [proposal.md](proposal.md).

The repository already includes Redis-related dependencies, the application already relies on Supabase for auth and storage-adjacent concerns, and vouchers remain company-scoped. The design must keep staging purely temporary, preserve technical retry traces without user-facing audit history, respect the 24-hour retention window for unresolved files, and improve extraction quality by routing text-based PDFs differently from scanned or mixed documents.

## Goals / Non-Goals

**Goals:**
- Preserve the current synchronous parser UX when the user uploads exactly one file and patch the current form directly.
- Introduce temporary staging for parser batches and parser items without mixing them into real vouchers tables.
- Process each uploaded file independently through an asynchronous queue so one failure does not block the rest of the batch.
- Keep source documents in temporary storage only while their staged items remain unresolved.
- Preserve backend retry traceability while exposing only the current item state to the UI.
- Prevent duplicate enqueueing within the same batch lifecycle and re-check voucher duplicates later during real persistence.
- Route text-based PDFs through local Markdown extraction before Gemini while keeping mixed, scanned, image-based, and image uploads on the visual path.
- Apply the same parser strategy rules to single-file parsing and batch parsing.

**Non-Goals:**
- Build the user review UI or notification UX in this change.
- Persist real vouchers from parsed items.
- Keep historical records of discarded staged items after removal.
- Persist staging data beyond the operational 24-hour retention window.

## Decisions

### 1. Split temporary workflow state into batch and batch-item staging tables
- **Decision:** Use one temporary batch record plus one temporary item record per uploaded file.
- **Rationale:** The batch groups operational context such as route type and owning user/company, while items carry file-specific parsing state and parsed payloads. This supports independent retries and mixed batch outcomes cleanly.
- **Alternatives:** A single flat table was rejected because it makes batch-level lifecycle tracking and completion state harder to manage.

### 2. Branch parser orchestration by file count
- **Decision:** Parser orchestration will branch by accepted file count: exactly one file stays on the synchronous request-response path and patches the current voucher form directly, while more than one file creates a batch and enters the asynchronous queue pipeline.
- **Rationale:** Single-file uploads are the fast-path UX and do not benefit from batch review overhead. Multi-file uploads are where queueing, staging, and later review provide real operational value.
- **Alternatives:** Routing every upload through the queue was rejected because it degrades the simple one-file flow. Branching by UI gesture instead of file count was rejected because a drag-and-drop of one file should still behave like a single-file upload.

### 3. Use Supabase Storage only for unresolved source files
- **Decision:** Store uploaded voucher documents in temporary Supabase Storage objects referenced by staging items and delete them as soon as an item is resolved or expires.
- **Rationale:** Review requires a source preview, but the files do not need long-term retention. Storage paths can remain operational rather than archival.
- **Alternatives:** Storing files in the database was rejected for size and operational reasons. Keeping files permanently was rejected because the user explicitly does not want historical retention here.

### 4. Process parsing through a dedicated asynchronous queue
- **Decision:** Enqueue one parsing job per accepted staged item and process jobs independently in the worker layer, but only for multi-file uploads.
- **Rationale:** Independent jobs isolate failures, allow retries, and avoid long-running HTTP requests. This also fits the existing plan to use queue-based persistence later.
- **Alternatives:** A synchronous multi-file request was rejected because it increases timeout risk and couples batch size to request duration. A single job per batch was rejected because one bad file would complicate partial completion handling.

### 5. Classify PDFs before choosing the Gemini path
- **Decision:** Use `pdf-inspector` as a local preprocessing stage for PDFs. Text-based PDFs first extract Markdown and then go through a text-oriented Gemini prompt. Mixed, scanned, and image-based PDFs go directly through Gemini visual parsing.
- **Rationale:** This improves speed and structure for native-text PDFs while preserving the current visual strength for scanned or layout-heavy documents.
- **Alternatives:** Sending every PDF directly to Gemini was rejected because it wastes an opportunity to improve text-native invoices locally. Replacing Gemini entirely for PDFs was rejected because mixed and visual documents still need Gemini.

### 6. Fallback from Markdown-first parsing to visual parsing
- **Decision:** If text-based PDF extraction yields empty or insufficient Markdown, the parser falls back to Gemini visual parsing for that document.
- **Rationale:** Text-based classification alone is not enough; extraction quality must still be usable for voucher parsing.
- **Alternatives:** Failing immediately on poor Markdown was rejected because it would unnecessarily block valid documents that the visual path could still parse.

### 7. Treat staging as temporary operational state, not audit state
- **Decision:** Keep staged parser data only until the item is validated, discarded, or expires. Discard removes the item entirely; retries leave only technical traceability in processing records.
- **Rationale:** The user wants temporary behavior without historical discard records. Technical retry traces still matter for diagnostics, but they do not need to become business history.
- **Alternatives:** Keeping discarded rows or long-lived staging history was rejected because it would add operational residue without product value.

### 8. Enforce duplicate controls only where batch lifecycle exists
- **Decision:** Prevent duplicate source files from entering the same multi-file batch lifecycle, and separately re-check voucher-level duplicate rules when validated items later move to real persistence.
- **Rationale:** File-level duplication matters when a batch can accumulate multiple items. Voucher-level duplication remains a separate integrity concern even outside the parser queue.
- **Alternatives:** Checking duplicates only at final persistence was rejected because it wastes parsing work. Applying file-level batch duplicate semantics to the single synchronous path was rejected because there is no batch lifecycle to compare against there.

### 9. Keep route context explicit and modularize parser strategy
- **Decision:** The parser will treat the sales or purchases route context as an explicit input and will modularize strategy selection, prompt building, and Gemini invocation into dedicated parser classes or models instead of a single inline route flow.
- **Rationale:** The route already defines the intended voucher workflow, so the parser should not infer that context from the document. Separating routing, prompt selection, and normalization keeps the parser maintainable as single-file and batch flows converge.
- **Alternatives:** Inferring sales versus purchases from document content was rejected because the route context is already authoritative. Keeping all strategy logic in one utility was rejected because the parser now needs multiple input strategies and prompt variants.

### 10. Expire unresolved staging after 24 hours
- **Decision:** Unresolved staged items and their storage objects expire after 24 hours.
- **Rationale:** This keeps temporary infrastructure bounded and aligns with the user's explicit retention limit.
- **Alternatives:** Longer retention windows were rejected because they increase storage residue. Immediate cleanup after parsing was rejected because review still needs the source file.

## Risks / Trade-offs

- **[Risk] Temporary cleanup can race with late user activity** -> Mitigation: use explicit expiration checks, surface Spanish user-facing errors for expired batches, and block review actions on expired items.
- **[Risk] Two duplicate-control layers can diverge** -> Mitigation: define separate duplicate semantics clearly in code and tests: one for file enqueueing, one for real voucher persistence.
- **[Risk] Keeping both synchronous and asynchronous paths can create drift** -> Mitigation: share the same parser strategy, prompt-building, and normalization modules, and vary only the orchestration layer.
- **[Risk] Queue backlog can delay review readiness** -> Mitigation: keep one job per file, expose current item state through staging, and tune worker concurrency independently of HTTP traffic.
- **[Risk] Temporary storage objects can accumulate if cleanup fails** -> Mitigation: tie storage cleanup to both resolution events and scheduled expiration cleanup.
- **[Risk] Markdown extraction can misclassify or under-extract a document** -> Mitigation: classify first, evaluate extraction sufficiency, and fall back to the visual Gemini path when needed.
- **[Risk] Two prompt variants can drift over time** -> Mitigation: keep shared accounting rules centralized and only vary the input-specific instructions between textual and visual prompts.

## Migration Plan

1. Preserve the synchronous single-file parser path and define the branching rule based on accepted file count.
2. Add temporary staging tables and indexes for parser batches and batch items used only by multi-file ingestion.
3. Add temporary storage path conventions and upload flow for staged files.
4. Introduce PDF classification and Markdown extraction for eligible PDFs plus a fallback visual path.
5. Modularize parser strategy, prompt building, and Gemini invocation so single-file and batch flows can share them.
6. Implement batch ingestion and status APIs backed by staging.
7. Introduce queue workers for per-item parsing plus retry handling.
8. Add expiration cleanup for unresolved staging and temporary storage.
9. Validate duplicate handling, routing behavior, and expiry behavior with automated tests before enabling the UI workflow.
