## 1. Phase 1: Audit and Generic Hooks

- [x] 1.1 Inventory current hooks, management consumers, all routes, in-scope routes, duplicated helpers, and existing tests.
- [x] 1.2 Define responsibility boundaries and public contracts for URL state, pagination, sorting, filters, debounce, selection, detail overlays, and asynchronous mutation state.
- [x] 1.3 Add failing unit tests for declarative URL parsing, normalization, partial updates, defaults, custom parsing, and preservation of unrelated parameters.
- [x] 1.4 Add failing unit tests for debounced search, pagination reset, invalid pagination, sorting options, and out-of-range page correction.
- [x] 1.5 Add failing unit tests for ID selection across pages, configurable string/number keys, company changes, and reset behavior.
- [x] 1.6 Add failing unit tests for generic asynchronous mutation lifecycle and successful-only resource invalidation.
- [x] 1.7 Add failing unit tests proving detail mode uses the current record without a request, handles missing records without fetching, and edit mode loads an uncached ID once without stale refresh on cache reuse.
- [x] 1.8 Implement focused entity-agnostic hooks with stable state and callback references where memoization prevents unnecessary renders.
- [x] 1.9 Keep SWR fetching, cache keys, company scope, and resource mapping in data hooks and module-specific management adapters.
- [x] 1.10 Migrate voucher, client/supplier, and reconciliation management consumers while preserving current workflows and reconciliation selection.
- [x] 1.11 Add the reusable authenticated user and company context helper and migrate in-scope routes to validate context before services.
- [x] 1.12 Normalize linked route validation, service invocation, response handling, and duplicated error mapping without changing supported operations.
- [x] 1.13 Remove duplicate hooks, helpers, constants, and legacy files owned by Phase 1 after all consumers are migrated.
- [x] 1.14 Run focused Jest suites, lint, and typecheck for Phase 1 and verify no old management implementation remains in scope.

## 2. Phase 2: Voucher Domain and Mappers

- [x] 2.1 Audit current voucher properties, methods, invariants, Prisma records, DTOs, schemas, forms, parser outputs, export rows, and reconciliation consumers.
- [x] 2.2 Add failing unit tests for current voucher calculations, status, duplicate detection, signed values, exchange rates, analytics values, and recalculation.
- [x] 2.3 Add failing unit tests for sales and purchase invariants, typed domain errors, unknown types, incompatible currencies, and historical rehydration.
- [x] 2.4 Add failing unit tests for precise two-decimal `Money` arithmetic, half-up rounding, canonical currency codes, decimal-string serialization, and `es-AR` formatting.
- [x] 2.5 Add failing mapper tests for Prisma records, API DTOs, parser inputs, form values, export rows, and domain outputs.
- [x] 2.6 Define the system-owned money value object, extensible currency representation, and domain date representation independent of Prisma.
- [x] 2.7 Implement the common voucher contract, concrete `Sale` and `Purchase` classes, and typed domain errors based on the audit results.
- [x] 2.8 Implement strict creation/modification and tolerant historical rehydration through the voucher factory.
- [x] 2.9 Implement the shared persistence adapter and domain serializer, while keeping external boundary transformations single-purpose and free of business rules.
- [x] 2.10 Migrate repositories and services to map Prisma data before domain use and map domain results before transport or export.
- [x] 2.11 Migrate parser, export, reconciliation, forms, schemas, and voucher APIs to the new domain boundaries.
- [x] 2.12 Implement consistent typed-error-to-HTTP mapping for validation, authentication, authorization, not-found, duplicate, and unexpected errors with Spanish user messages and English safe diagnostics.
- [x] 2.13 Remove Prisma types, `Prisma.Decimal`, external DTO types, and parser/form concerns from the voucher domain.
- [x] 2.14 Remove duplicate voucher models, schemas, helpers, constants, and legacy adapters owned by Phase 2.
- [x] 2.15 Apply project-wide type-safety and polymorphism lint rules that reject domain-class `instanceof` branching and unsafe `unknown` casts while allowing technical runtime narrowing.
- [x] 2.15.1 Consolidate voucher helpers and hooks by reusing shared formatters, type mappers, JSON parsing, query state, and applicable generic resource, mutation, and detail hooks; remove confirmed dead voucher methods and types while preserving active boundary adapters.
- [x] 2.16 Run voucher-focused Jest suites, lint, and typecheck, including regression coverage for existing persisted data and API workflows.

## 3. Phase 3: Frontend Modularization

- [x] 3.0 Define the shared generic `DataTable<TData>` contract and reusable table building blocks for all modules, including typed columns, accessors, custom cell renderers, stable row IDs, empty/loading states, toolbar composition, filters, pagination, and server-side event callbacks.
- [x] 3.0.1 Add focused tests for generic column rendering, custom cells, row identity, empty states, loading states, and controlled toolbar/filter/pagination callbacks.
- [x] 3.0.2 Migrate voucher and client/supplier tables to the shared generic table while keeping module-specific columns, formatting, actions, and query state outside the shared component.
- [x] 3.1 Add focused tests for core screen orchestration, loading/error/empty transitions, modal modes, and preserved URL interactions where behavior changes.
- [x] 3.2 Define component responsibilities and extraction boundaries for voucher tables, voucher modals, analytics, reconciliations, and client/supplier screens.
- [x] 3.3 Extract voucher table filters, table structure, rows, pagination, and domain-neutral visual states.
- [x] 3.4 Extract voucher modal shell, shared fields, mode-specific sections, preview flow, and form integration without duplicated workflows or detail-mode requests.
- [x] 3.5 Decompose analytics and reconciliation views while preserving resource-scoped loading, review, mutation, and retry behavior.
- [x] 3.6 Decompose client/supplier screens and consolidate genuinely shared table and empty/error/loading patterns.
- [x] 3.7 Remove API calls, payload construction, business decisions, persistence orchestration, and duplicated navigation logic from presentational components.
- [x] 3.8 Audit references after the shared table and frontend migrations, then remove every unused or duplicate frontend component, visual state, helper, hook, constant, and legacy import owned by Phase 3.
- [x] 3.9 Run focused frontend Jest suites, lint, and typecheck and verify the audited workflows remain functional.

## 4. Final Validation

- [ ] 4.1 Verify all three PRs were applied sequentially and no out-of-scope module was migrated accidentally.
- [x] 4.2 Run the complete Jest suite, lint, typecheck, and production build.
- [x] 4.3 Verify API behavior, company isolation, persisted-data compatibility, cache invalidation, and frontend serialized money display.
- [x] 4.4 Review changed constants, logs, user-facing Spanish messages, and documentation updates required only for genuinely new architectural rules.
- [x] 4.5 Confirm no temporary files, secrets, duplicate legacy artifacts, or references to an alternative server-state library were introduced.
