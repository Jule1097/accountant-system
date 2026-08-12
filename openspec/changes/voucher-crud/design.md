## Context

The current vouchers UI already renders sales and purchases tables, opens a shared modal for create and detail flows, and exposes `GET /api/vouchers`, `GET /api/vouchers/[id]`, `PUT /api/vouchers/[id]`, and `DELETE /api/vouchers/[id]` routes. The remaining gap is behavioral: create is still disabled in the UI, edit is populated from the row object instead of a URL-driven id lookup, and delete is exposed as a placeholder action instead of a confirmed physical deletion flow. The Gemini parser already returns extra voucher tax fields and enriched tax concept lookups, but its prompt and formal API spec still lag behind the current voucher data model. See [proposal.md](proposal.md) for the motivation.

## Goals / Non-Goals

**Goals:**
- Promote the existing vouchers UI from list-plus-read to full persistent CRUD for sales and purchases.
- Make `voucherId` in the query string the single source of truth for the detail modal state.
- Keep route handlers thin while reusing the current service and repository layers for create, update, and delete.
- Align the UX after mutations by refreshing table data, surfacing toast feedback, and clearing invalid or deleted `voucherId` values.
- Align Gemini extraction rules, response shape, and catalog enrichment with the current taxes/perceptions implementation.
- Move parser business rules and enrichment orchestration into a model-layer abstraction under `src/models`.

**Non-Goals:**
- Redesign the voucher form fields or introduce new voucher business rules unrelated to CRUD completion.
- Add soft delete, audit recovery, or bulk voucher operations.
- Encode the create modal state in the URL unless that becomes a separate requirement later.
- Replace Gemini with a different provider or redesign the parser UI workflow outside the current voucher modal.

## Decisions

### 1. Use `voucherId` query state only for detail and edit
- **Decision:** Model voucher detail selection through a `voucherId` query parameter on `/sales` and `/purchases`, while keeping the create modal driven by local component state.
- **Rationale:** This gives the edit flow a stable source of truth across refreshes and shared links without overloading the URL with transient create-only state.
- **Alternative:** Managing both create and edit only with local state would keep the current refresh inconsistency; encoding create in the URL would add complexity without a product need.

### 2. Hydrate edit forms from `GET /api/vouchers/[id]`
- **Decision:** When `voucherId` is present, load the voucher detail from the detail endpoint and populate the edit modal from that response instead of using the table row payload.
- **Rationale:** The table list is optimized for grid display, while editing needs the persisted record as the backend source of truth.
- **Alternative:** Reusing the row object risks stale or incomplete edit state after refreshes and external changes.

### 2.5 Render a loading state inside the detail modal
- **Decision:** Open the detail modal immediately when `voucherId` is present, but render a spinner or loader inside the modal until `GET /api/vouchers/[id]` resolves.
- **Rationale:** This makes the selection state visible right away, avoids abrupt modal popping after fetch latency, and gives the user clear feedback that the voucher detail is being loaded.
- **Alternative:** Waiting to open the modal until the request finishes would make the UI feel unresponsive and hide the fact that a detail flow is in progress.

### 3. Keep one shared modal component with mode-based submission
- **Decision:** Reuse the existing voucher modal and form hook for create and edit, branching submission behavior by presence of `initialVoucher` or resolved `voucherId`.
- **Rationale:** The current form already maps most voucher fields and nested arrays for both sales and purchases, so one shared flow keeps behavior consistent and limits duplication.
- **Alternative:** Splitting create and edit into separate modal trees would increase maintenance cost and drift risk.

### 4. Replace dropdown actions with an explicit delete icon and confirmation dialog
- **Decision:** Remove the current actions dropdown from voucher rows and render a dedicated trash icon action that opens a confirmation modal before issuing `DELETE`.
- **Rationale:** The user wants a single visible destructive action and the detail flow will already be entered through the voucher row click.
- **Alternative:** Keeping the dropdown would duplicate interaction surfaces and conflict with the simplified row behavior.

### 5. Refresh list data after every successful mutation
- **Decision:** After create, update, or delete, force the vouchers list to refetch and synchronize the selected voucher state with the persisted backend response.
- **Rationale:** This avoids UI drift between the table and the modal and ensures toasts reflect completed persistence, not local optimistic state.
- **Alternative:** Mutating local table state manually would be more fragile because vouchers include nested calculated fields and two table variants.

### 6. Normalize missing-voucher handling around toast plus URL cleanup
- **Decision:** When detail fetch, update, or delete encounters a missing voucher, show a Spanish toast for the user-facing failure and clear `voucherId` from the URL.
- **Rationale:** This prevents the page from remaining trapped in an invalid modal state after stale links or concurrent deletion.
- **Alternative:** Leaving the invalid query param in place would repeatedly reopen a broken state on refresh.

### 7. Make Gemini extraction conservative and explicit about the current voucher model
- **Decision:** Update the Gemini prompt and response contract so extraction explicitly covers `vatDetails`, `nonTaxableAmount`, `exemptAmount`, `otherTaxesAmount`, retentions vs perceptions, and third-party identity fields, while instructing Gemini to return `null` or empty arrays when data is not visible instead of guessing.
- **Rationale:** The current prompt is too generic for the evolved voucher model and the current required-schema setup pushes the model toward fabricated values when fields are uncertain.
- **Alternative:** Keeping the generic prompt and hard-required response fields would preserve the current mismatch between parser behavior, spec expectations, and manual-edit UX.

### 8. Unify parser naming around third-party semantics
- **Decision:** Replace parser-facing field naming that assumes purchases, such as `supplierName`, with shared third-party naming such as `thirdPartyName`, and keep a single resolved third-party identifier in the parser response contract.
- **Rationale:** The parser is shared by sales and purchases, so the response contract should describe the other party on the voucher instead of one business role.
- **Alternative:** Preserving purchase-specific naming would keep the parser contract semantically incorrect for sales flows.

### 9. Move parser enrichment rules into a model-layer abstraction
- **Decision:** Introduce a parser-focused domain model under `src/models` to encapsulate normalization, null-fallback handling, active-company CUIT exclusion, catalog matching, and tax jurisdiction resolution before the route returns the response.
- **Rationale:** This follows the repository's architecture rules by keeping route handlers thin and separating business logic from the Gemini adapter and transport layer.
- **Alternative:** Leaving all enrichment logic in the route would continue to accumulate business decisions in framework code.

## Risks / Trade-offs

- **[Risk] List refresh after mutation could briefly reset modal context** → Mitigation: update the selected voucher state from the mutation response before or together with the refetch so the modal remains consistent.
- **[Risk] Query-param driven modal state can create loading flashes on direct navigation** → Mitigation: render a deterministic loading state inside the detail modal until `GET /api/vouchers/[id]` resolves.
- **[Risk] Physical delete is irreversible** → Mitigation: require explicit confirmation and keep user-facing copy unambiguous about deletion.
- **[Risk] Existing tests encode the temporary disabled behavior** → Mitigation: replace those tests with CRUD-success, missing-voucher, and confirmation-flow coverage rather than layering new tests on top of outdated expectations.
- **[Risk] Tight Gemini response requirements can force hallucinated fields** → Mitigation: relax required extraction fields and explicitly instruct the model to return `null` or `[]` for missing data.
- **[Risk] Parser response contract changes can break the form mapping** → Mitigation: update the parser spec, route response, and form mapping together, with tests covering both sales and purchases parser flows.

## Migration Plan

1. Update the voucher API contract artifacts and UI capability artifacts in OpenSpec.
2. Implement persistent create, update, and delete flows in the existing voucher modal, table, and view containers.
3. Introduce query-param based voucher detail selection and fetch-by-id hydration.
4. Replace the dropdown action with a delete icon and confirmation modal.
5. Align the Gemini parser contract, prompt, and enrichment model with the current voucher tax structure.
6. Run Jest coverage for voucher service, schema, UI flows, and parser behavior.
