## Why

The application currently mixes reusable UI state, server-state access, business orchestration, persistence adaptation, and presentation logic across hooks, models, routes, and components. This creates duplicated behavior, inconsistent boundaries, and makes changes in one module harder to reuse safely in another.

This change establishes one architecture improvement program with three sequential phases and separate pull requests, preserving functional behavior while making the boundaries explicit and extensible.

## What Changes

- Audit and refactor shared frontend hooks for URL query state, pagination, filtering, search, sorting, selection, detail overlays, and mutation state.
- Keep SWR as the server-state and cache layer, with entity-specific data hooks and thin management hooks composed from focused generic hooks.
- Ensure detail modals render immediately from the already available record and never fetch by ID; edit modals fetch the ID-specific record only when first needed and reuse the SWR cache afterward.
- Preserve selection across paginated views by accumulating configurable `string | number` IDs, currently for conciliations and reusable by future modules.
- Audit all API routes and enforce the route-to-service-to-repository boundary internally for routes in scope, including reusable user and company context validation, without changing route contracts.
- Audit the voucher domain and introduce independent domain types, a `Money` value object with two-decimal rounding, a voucher factory, concrete `Sale` and `Purchase` classes, typed domain errors, and explicit mappers.
- Keep Prisma types limited to persistence and use Zod for external boundary validation and inferred DTO/input types without coupling them to the domain.
- Adapt services, repositories, parser, export, reconciliation, forms, APIs, and frontend consumers to the new boundaries while preserving current business results and existing data compatibility.
- Modularize the voucher, client/supplier, reconciliation, and analytics screens, extracting reusable visual states and reducing business logic in components.
- Remove duplicated legacy files and duplicated logic as part of the phase that owns each responsibility.
- Apply focused core tests for successful and failure paths; do not add tests for incidental visual placement or other non-core details.

## Capabilities

### New Capabilities

- `generic-hooks-architecture`: Reusable, entity-agnostic client state hooks and thin management composition.
- `voucher-domain-model`: Independent voucher domain model, monetary value object, concrete voucher types, factories, errors, and mappers.
- `frontend-architecture`: Modular screens, reusable UI states, and route/component layering for the audited frontend modules.

### Modified Capabilities

- None. Existing observable behavior is preserved; this change primarily establishes internal architecture and reusable implementation contracts.

## Impact

- Frontend hooks, SWR data hooks, management hooks, components, pages, modals, layouts, and shared UI states.
- Modal mode behavior, including instant detail rendering and conditional edit loading.
- Voucher models, types, schemas, services, repositories, parser, export, reconciliation, and API routes.
- All related `route.ts` files, plus reusable authentication and company-context helpers.
- Prisma integration remains in persistence adapters; no database table split is planned.
- API routes and operations remain stable, while internal payload adaptation may change where required by the new architecture.
- The three phases are implemented in order, each in a separate PR. Tests run per phase; the complete build is reserved for final validation.
