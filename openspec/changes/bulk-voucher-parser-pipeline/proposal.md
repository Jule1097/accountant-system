## Why

The current Gemini parser only supports one voucher file at a time and completes everything inside the request-response flow, which does not scale to operational batch uploads. The product still needs to preserve that fast synchronous experience for true single-file uploads, while introducing a dedicated asynchronous pipeline only for multi-file ingestion so users can process several documents safely in the background and stage parsed results for later human validation without creating real vouchers prematurely.

## What Changes

- Keep true single-file uploads on the synchronous parser flow so the extracted data patches the current voucher form directly.
- Add batch-based voucher parsing only when the user submits more than one file, allowing sales and purchases routes to upload up to 20 files per batch.
- Add hybrid PDF routing so text-based PDFs are preprocessed locally through `pdf-inspector`, while mixed or image-based documents continue through Gemini visual parsing.
- Introduce temporary staging records for parser batches and batch items, storing only operational state needed until each item is resolved.
- Store uploaded source files in temporary Supabase Storage objects linked to the staging items while they remain pending review.
- Add an asynchronous parsing queue that processes each file independently for multi-file uploads, preserves technical retry traces, and keeps only the current item state visible in the UI.
- Enforce duplicate prevention during batch enqueueing so files already present in the same batch or already queued are not added again.
- Apply the same parser routing rules to the synchronous single-file parser flow and the asynchronous batch pipeline.
- Keep PDF uploads limited to 2MB and increase image uploads to 4MB.
- Add expiration rules so unresolved temporary files and staging items are cleaned up after 24 hours.
- Re-check voucher duplicate rules again when validated items later move to real voucher persistence.

## Capabilities

### New Capabilities
- `bulk-voucher-parser-pipeline`: Defines asynchronous multi-file voucher parsing, temporary staging, duplicate controls, retry behavior, and temporary file lifecycle rules.
- `gemini-parser-api`: Defines the batch-oriented parser ingestion and status contract for asynchronous voucher parsing.

### Modified Capabilities

## Impact

- Affects voucher parsing APIs, synchronous single-file form patching, background processing infrastructure, temporary storage usage, and parser domain models.
- Adds a local PDF classification and Markdown extraction stage before Gemini for eligible PDFs.
- Introduces staging tables for parser batches and parser batch items only for multi-file ingestion, plus cleanup behavior for unresolved temporary records.
- Requires queue infrastructure for asynchronous parsing jobs and retry handling.
- Requires parser modularization so route context, prompt selection, and extraction strategy are handled in dedicated parser classes instead of a single inline flow.
- Establishes the backend foundation required by the later review-and-validation workflow without creating real vouchers before user approval.
