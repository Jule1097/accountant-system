## 1. Temporary Staging Foundation

- [x] 1.1 Preserve the synchronous single-file parser path and define the branching rule by accepted file count
- [x] 1.2 Define temporary batch and batch-item data structures for company-scoped parser staging used only by multi-file uploads
- [x] 1.3 Add the temporary storage reference model and 24-hour expiration rules for unresolved staged items
- [x] 1.4 Add duplicate-detection rules for files already present in the same batch lifecycle

## 2. Parser Strategy And Modularization

- [x] 2.1 Add `pdf-inspector` as the local PDF classification and Markdown extraction dependency for parser flows
- [x] 2.2 Modularize parser strategy selection, prompt building, and Gemini invocation into dedicated parser classes or models
- [x] 2.3 Add separate text-oriented and visual Gemini prompt variants while keeping shared accounting rules aligned
- [x] 2.4 Apply the hybrid parser routing rules to both the single-file parser flow and the batch parser flow
- [x] 2.5 Keep PDFs limited to 2MB and raise image ingestion to 4MB for parser intake

## 3. Parser APIs

- [x] 3.1 Keep single-file parser ingestion synchronous for sales and purchases contexts and patch the current form directly
- [x] 3.2 Add multi-file parser ingestion that creates a batch only when more than one file is submitted, enforcing the 20-file limit
- [x] 3.3 Add parser batch and item status retrieval endpoints backed by temporary staging
- [x] 3.4 Ensure batch parser API responses expose staged results only and never create real vouchers during parsing
- [x] 3.5 Ensure parser APIs always receive the explicit sales or purchases route context and use it in the chosen parsing strategy

## 4. Queue Processing

- [x] 4.1 Implement per-file asynchronous parsing jobs so multi-file batch items process independently
- [x] 4.2 Add failed-item retry support that preserves backend retry traceability while updating only the current UI state
- [x] 4.3 Add Markdown-insufficiency fallback from the text-based PDF path to the visual Gemini path
- [x] 4.4 Add scheduled or worker-driven cleanup for expired unresolved staged items and temporary source files

## 5. Validation

- [x] 5.1 Add or update Jest coverage for batch limits, duplicate enqueue prevention, staged status transitions, and retry behavior
- [x] 5.2 Add or update Jest coverage for PDF classification routing, Markdown fallback behavior, and differentiated size limits
- [ ] 5.3 Add or update Jest coverage for temporary file cleanup and 24-hour expiration handling
- [ ] 5.4 Run the relevant Jest suites for parser APIs, staging models, and queue processing before handoff
