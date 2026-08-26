## Context

The repository already exposes thin REST endpoints for `clients` and `suppliers`, but those routes currently return simple arrays and reuse voucher-oriented validation files. The UI has a mature pattern for server-driven tables, modal CRUD, query-string state, and toast feedback in vouchers and conciliations, yet clients and suppliers do not have a dedicated module. The voucher modal also depends on preloaded third-party options, so AI parsing can fill `thirdPartyCuit` without yielding a valid `thirdPartyId`, which prevents persistence until the missing record is created manually elsewhere. The current parser-to-form mapping for voucher type and voucher letter is also too strict because it expects exact catalog-equality, which can fail when AI returns combined labels such as `Factura A`, `Nota de Crédito A`, or MiPyME naming variants.

## Goals / Non-Goals

**Goals:**
- Introduce a dedicated management module for clients and suppliers while preserving them as separate domain entities.
- Keep the module visually unified for users but route-addressable through `/clients` and `/suppliers`.
- Reuse the table and modal interaction patterns already established in vouchers, with server-side pagination, ordering, totals, and extensible filters.
- Enforce duplicate prevention per active company and per entity type using normalized CUIT and normalized name.
- Allow voucher users to create a missing client or supplier inline without losing parsed data or closing the voucher modal.
- Make parsed voucher type and voucher letter resolution tolerant enough to map AI-returned human-readable labels to the correct select option ids.
- Keep all user-facing copy in Spanish and all technical artifacts in English.

**Non-Goals:**
- Replace `Client` and `Supplier` with a single global third-party entity.
- Introduce cross-company global uniqueness or shared ownership for clients and suppliers.
- Support inline editing of an existing client or supplier from inside the voucher modal.
- Add extra third-party fields beyond the current scope unless required later by another change.
- Redesign the voucher type and voucher letter catalog model.

## Decisions

### 1. Use two routes with one visual module
- **Decision:** Expose the module through `/clients` and `/suppliers`, while keeping the UI framed as one "Clientes y Proveedores" area with tabs that navigate between routes.
- **Rationale:** This keeps URLs explicit, future-proofs route ownership per entity, and still presents one coherent experience to the user.
- **Alternative:** A single generic route would add abstraction without product value and would make future per-entity growth harder to isolate.

### 2. Keep `Client` and `Supplier` as separate company-scoped entities
- **Decision:** Preserve the current domain split and allow the same CUIT to exist once as a client and once as a supplier inside the same company.
- **Rationale:** A business can interact with the same legal entity in different roles, and the current domain model already matches that expectation.
- **Alternative:** A unified global third-party registry would be a structural redesign outside this feature scope.

### 3. Align list contracts with vouchers
- **Decision:** Change client and supplier list endpoints from "return all rows" to a server-side list contract with `items`, `page`, `pageSize`, `total`, `totalPages`, sortable fields, and an extensible filter input.
- **Rationale:** The new tables need the same scalability and interaction quality as vouchers, and the contract must be open to future filters without redesigning the handler shape.
- **Alternative:** Returning full arrays and filtering on the client would diverge from the rest of the application and would not scale.

### 4. Normalize duplicate checks by company and entity type
- **Decision:** Duplicate validation must be scoped to the active company and the current entity type, using normalized CUIT and normalized name with trim plus case-insensitive comparison.
- **Rationale:** This matches the intended ownership model while preventing near-duplicate records caused by formatting or casing differences.
- **Alternative:** Global duplicate checks would conflict with the tenant-scoped model and current schema direction.

### 5. Use modal CRUD for module management
- **Decision:** Create, edit, and read flows for clients and suppliers will use dedicated modals similar to vouchers, with `name` and `cuit` always required in create and edit modes.
- **Rationale:** This matches the existing UX language of the product and keeps the tables focused on list management.
- **Alternative:** Inline row editing would complicate validation and clash with the current modal-first interaction style.

### 6. Block deletion when vouchers exist
- **Decision:** A client or supplier referenced by at least one persisted voucher cannot be deleted. The UI will confirm deletion attempts through a modal and reinforce blocked or successful outcomes with toasts.
- **Rationale:** Voucher integrity must remain stable, and physical deletion of referenced master data would create invalid accounting history.
- **Alternative:** Soft delete is out of scope, and allowing orphaned vouchers would be unsafe.

### 7. Keep voucher inline creation focused on create-only
- **Decision:** The shared voucher modal will expose only "create missing client/supplier" inline actions, not edit actions for already selected records, and that behavior will apply both to direct individual voucher creation and to single-item conciliation review flows that reuse the same modal.
- **Rationale:** Inline creation solves the broken save path without turning the voucher flow into a full master-data editor.
- **Alternative:** Inline edit would increase complexity and blur ownership between the module and the voucher form.

### 8. Refresh and auto-select after inline create or duplicate resolution
- **Decision:** After inline creation, the voucher form must refresh the option list, auto-select the created record, preserve the voucher modal state, and keep parsed values intact. If creation fails due to an existing duplicate, the system must try to resolve the existing record and auto-select it before surfacing failure.
- **Rationale:** The user intent is to continue saving the voucher, not to manually re-enter the third-party selection flow.
- **Alternative:** Forcing the user to close the voucher modal or re-search manually would undermine the purpose of inline creation.

### 9. Resolve parsed voucher type and letter with tolerant normalization
- **Decision:** Parsed voucher type and voucher letter must be resolved through a tolerant normalization strategy that can split combined labels, handle MiPyME naming variants, preserve the catalog-backed ids, and still prefer exact matches when available.
- **Rationale:** AI extraction returns human-readable accounting labels, not guaranteed catalog-exact values, so exact string equality is too fragile for the shared voucher modal selects.
- **Alternative:** Requiring Gemini to always return an exact catalog label would still be brittle because real documents and OCR output vary too much.

## Risks / Trade-offs

- **[Risk] Server-side list contracts increase API work compared with the current simple arrays** -> Mitigation: reuse the vouchers pagination/query strategy and keep filters extensible from the first version.
- **[Risk] Name normalization could treat distinct legal names as duplicates in edge cases** -> Mitigation: keep normalization limited to trim plus case-insensitive matching and do not add accent folding unless a future requirement demands it.
- **[Risk] Inline duplicate resolution can mask data issues if two records were already created inconsistently** -> Mitigation: only auto-select when the backend resolves a single unambiguous match for the current entity type and company.
- **[Risk] Two routes plus tabs can drift** -> Mitigation: derive the active tab from the route and reuse one shared container to avoid duplicated UI logic.
- **[Risk] Deletion blocking requires dependency checks on vouchers** -> Mitigation: centralize the check in the service layer so route handlers and UI consume one consistent rule.
- **[Risk] Tolerant voucher type matching could map the wrong catalog value if fallback logic is too permissive** -> Mitigation: keep exact-match precedence, add deterministic normalization rules, and cover invoice, credit note, and MiPyME variants with tests.

## Migration Plan

1. Add the OpenSpec capability artifacts for the new management module and voucher inline creation change.
2. Introduce server-side query schemas and response types for clients and suppliers.
3. Implement the shared management view, route-specific tabs, and modal CRUD flows.
4. Add service-level duplicate detection by normalized name and CUIT, scoped to company and entity type.
5. Add voucher inline create actions with option refresh and auto-selection behavior.
6. Fix parser-to-form resolution for voucher type and voucher letter select values.
7. Add Jest coverage for list queries, duplicate enforcement, deletion blocking, route tabs, inline voucher creation paths, and voucher type/letter parsing variants.
