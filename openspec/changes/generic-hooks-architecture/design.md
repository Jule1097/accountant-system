## Context

See proposal.md for motivation and scope. The current codebase already uses SWR for company-scoped server state and has established layering rules for routes, services, repositories, models, helpers, and frontend components. Existing voucher code currently mixes domain behavior with Prisma hydration, DTO/form conversion, parser adaptation, and monetary representation.

## Goals / Non-Goals

**Goals:**

- Deliver one architecture program through three ordered, independently reviewable phases.
- Make generic client state reusable without coupling it to entities, endpoints, SWR, or presentation messages.
- Make the voucher domain independent from Prisma, Zod, forms, and transport DTOs.
- Preserve current voucher calculations, company isolation, user workflows, and existing persisted data compatibility.
- Centralize authorization context, typed errors, monetary representation, URL state normalization, and shared visual states where reuse is real.

**Non-Goals:**

- Migrating from SWR to another server-state library.
- Splitting the Prisma Voucher table or changing the database model.
- Adding new business rules or permissions.
- Implementing global selection of unseen records across all filtered results.
- Redesigning the visual language or changing the audited screens' user workflows.
- Requiring tests for incidental layout details.

## Decisions

### Phase boundaries

Phase 1 covers generic hooks, SWR integration boundaries, management-hook migration, reusable company/user context validation, and linked route cleanup. Phase 2 covers the voucher domain, `Money`, concrete voucher types, factory, errors, persistence adaptation, and external boundary transformations. Phase 3 covers component decomposition, shared visual states, and final frontend migration cleanup.

Before Phase 2 validation, voucher-specific modules consolidate existing shared helpers and generic resource, mutation, and detail hooks where their contracts apply. Confirmed dead voucher methods, types, and duplicate adapters are removed only after consumer analysis; active form, parser, export, persistence, and API boundary transformations remain in their owning layers.

Each phase is a separate PR, must leave its scope functional, and must run focused tests before the next phase begins. The full build is reserved for final validation.

### Generic client state

Generic hooks use declarative configuration for URL parameters, including type, default, normalization, and optional parser/serializer functions. URL-driven table updates use Next.js App Router `useRouter` with replacement semantics and `scroll: false`; the current URL is read through `useSearchParams`, which remains the source of truth for browser back/forward navigation. The hook resets only parameters it owns and keeps unrelated module parameters intact. Native `window.history` events and custom URL synchronization events are not part of the architecture.

Debounced search commits only the stabilized value, uses one shared configured delay, and resets owned pagination. Pagination normalizes invalid values and clamps out-of-range pages when resource metadata makes the valid range known. Sorting accepts only declared options.

Selection stores configurable `string | number` keys, accumulates selections across visited pages, clears on company changes, and initially operates on explicitly selected records. The contract can later support all-matching selection without implementing that API behavior now.

### SWR and asynchronous operations

SWR remains the server-state boundary. Existing data hooks continue to own SWR keys, fetchers, cache behavior, and resource mapping. Generic hooks do not import or know SWR. Management hooks compose generic state, data hooks, module-specific mutations, user-facing messages, and narrow invalidation.

Detail and edit flows use different data policies. A detail modal receives the current record from the view and remains request-free. If that record is unavailable, the modal shows an unavailable state rather than fetching by ID. An edit modal enables the ID-specific SWR query only when edit mode is active and no cached result exists. Cached edit data is reused without automatic stale refresh on modal open. This keeps detail rendering immediate while retaining complete data loading for edits.

Mutation invalidation runs only after success and targets affected resources. Existing no-focus/no-reconnect behavior remains the default. Cache and revalidation values are constants or resource-specific configuration when justified.

### Voucher domain and mappers

The domain uses a common voucher contract with concrete `Sale` and `Purchase` voucher types. A factory selects the concrete type from validated input. Shared behavior is implemented in the common contract; type-specific behavior is abstract or concrete only after the audit confirms the distinction.

Creation and rehydration are separate operations. Creation enforces current invariants. Persistence rehydration preserves compatible historical records and does not discard legacy values. Prisma mappers translate persistence records before domain construction.

Zod validates external boundaries and provides inferred DTO/input types. Domain types remain independent. Prisma records and domain objects are connected by one shared persistence adapter and serializer, while forms, parser responses, API DTOs, and export rows retain only the boundary-specific transformations they genuinely require.

Domain behavior SHALL use polymorphic dispatch for concrete voucher classes and SHALL not branch with `instanceof` to distinguish domain types. Technical runtime narrowing such as `instanceof Error`, `instanceof Date`, or Decimal runtime checks remains allowed when it is not replacing domain polymorphism. Unsafe casts through `unknown` are not allowed when the target contract is known; `unknown` remains valid for genuinely external or untyped boundaries that narrow before entering the application layer.

`Money` is a system-owned value object containing a precise amount and extensible currency code. It always stores and returns two decimal places, rounds every monetary result using half-up rounding, and rejects incompatible currency operations where applicable. Prisma decimal conversion is limited to persistence mappers. DTO serialization exposes two-decimal strings and canonical currency codes to the frontend. A shared pure formatter uses the `es-AR` locale for display; formatting is never used as a substitute for domain calculation.

Typed errors are translated at the application boundary into consistent HTTP statuses and Spanish user-facing messages. Missing authentication returns `401`, unauthorized company access returns `403`, and a missing active company without a unique inferred company returns `400`. Internal diagnostics remain in English and contain safe operational context.

### Route boundaries

All routes are audited. Routes linked to the in-scope workflows follow validate/context -> service -> response. A reusable context helper obtains the authenticated user and active company, validates them before service execution, and remains extensible for future authorization conditions. Routes do not trust company identifiers from request bodies, query parameters, or unrelated client input. Route paths, methods, query parameters, and external request/response contracts remain unchanged; only internal implementation boundaries are refactored.

### Frontend decomposition

The audited voucher, client/supplier, reconciliation, and analytics screens are decomposed by responsibility. Components render prepared state and invoke callbacks. Hooks and services handle data access, transformations, business decisions, navigation, cache invalidation, and side effects.

Shared loading, error, empty, pagination, and other visual patterns are extracted only where the behavior is genuinely common. Module-specific components remain module-specific when their visual rules differ. Modified files target the existing approximate 150-200 line guideline, with justified infrastructure exceptions.

### Alternatives considered

- A single generic management hook was rejected because it would couple unrelated concerns and recreate the current oversized hooks.
- Using the native History API with `popstate` listeners was rejected because it duplicates Next.js navigation state, requires custom synchronization events, and creates a second URL state mechanism. `useRouter`, `usePathname`, and `useSearchParams` provide the supported App Router boundary for URL-driven interactions.
- Replacing SWR was rejected because the repository already has SWR infrastructure and tests; a library migration is a separate concern.
- Using Prisma types as domain types was rejected because persistence nullability and technical types would leak into business rules.
- Using Zod schemas as the sole domain model was rejected because runtime validation does not express domain behavior and invariants by itself.
- Keeping one conditional `Voucher` class was rejected as the target architecture because the product requires concrete `Sale` and `Purchase` types; the amount of shared inheritance remains audit-driven.
- Returning `number` for domain money was rejected because binary floating-point can produce inaccurate decimal calculations.

## Risks / Trade-offs

- [Risk] Historical records may violate stricter creation invariants. -> Separate tolerant rehydration from strict creation and add regression tests for legacy-compatible records.
- [Risk] Generic URL configuration may become over-abstracted. -> Support common types first and keep custom parsing/serialization explicit and scoped.
- [Risk] Selection IDs may refer to records no longer available after data changes. -> Validate selected IDs in the service before bulk operations and report rejected records consistently.
- [Risk] Narrow SWR invalidation may leave a dependent view stale. -> Define affected resources per successful mutation and test cache invalidation paths.
- [Risk] Moving requests from components may change effect timing. -> Preserve existing query enablement, company guards, modal guards, and race-safe behavior with focused hook tests.
- [Risk] Detail and edit modes may accidentally share a request trigger. -> Keep mode conditions explicit and test that detail never dispatches a request while edit loads only when required.
- [Risk] Cached edit data may be outdated. -> Prefer the defined no-automatic-refresh behavior on open and expose explicit refresh through the owning management flow when required.
- [Risk] Separate DTO, persistence, form, parser, and domain types add mapping code. -> Keep the persistence adapter and serializer shared, retain only boundary-specific transformations, and test conversions at each external boundary.

## Migration Plan

1. Implement and test Phase 1, migrate current management consumers, and remove owned duplicate hook/helper/route logic.
2. Implement and test Phase 2, migrate voucher persistence and external adapters, and verify calculation and API compatibility.
3. Implement and test Phase 3, decompose audited screens, consolidate visual states, and remove remaining owned frontend duplication.
4. Run the complete test suite, typecheck, lint, and build after all three PRs are integrated.

Rollback is performed per PR by reverting the phase while preserving database records. No database migration or table split is planned.
