## Why

The voucher screens currently stop at list and read flows even though the product already needs end-to-end CRUD for sales and purchases. The current modal behavior also keeps detail state in local UI memory, which breaks direct linking, refresh consistency, and reliable editing by voucher id.

## What Changes

- Enable persistent voucher creation from the existing "Agregar" modal for both sales and purchases.
- Enable persistent voucher editing from the voucher detail modal, loading the full record by `voucherId` from the URL query string instead of relying on the table row payload.
- Show a loading state inside the voucher detail modal while the selected voucher is fetched from the backend before rendering the editable form.
- Replace the current row actions dropdown with a visible delete icon per voucher row that opens a confirmation modal before physically deleting the voucher.
- Refresh the vouchers table after successful create, update, or delete operations, show success or error toasts, and clear `voucherId` when the selected voucher no longer exists.
- Remove the current "not available in this stage" behavior for voucher save and delete flows.
- Align the Gemini parser contract, prompt, and enriched response with the current voucher model, including taxes, perceptions, retentions, jurisdiction resolution, and conservative null-based extraction fallback.
- Separate Gemini parser business logic into a dedicated model layer under `src/models` so route and adapter responsibilities stay modular.

## Capabilities

### New Capabilities
- `voucher-crud-api`: Defines the persistent create, detail-by-id, update, and physical delete behavior for sales and purchase vouchers.

### Modified Capabilities
- `voucher-tables`: Changes voucher table and modal behavior to support persistent CRUD, URL-driven detail state, row-based opening, and delete confirmation.
- `gemini-parser-api`: Updates the parser contract to match the current voucher tax/perception structure and enriched third-party resolution behavior.

## Impact

- Affects voucher REST route behavior under `src/app/api/vouchers` and related service/repository flows.
- Affects the sales and purchases UI containers, voucher table interactions, modal state management, and toast/error handling.
- Affects the Gemini adapter, parser endpoint response contract, catalog enrichment flow, and parser-related domain logic in `src/models`.
- Requires Jest coverage updates for create, edit, delete, URL-driven selection, missing-voucher handling, and parser extraction/enrichment behavior.
