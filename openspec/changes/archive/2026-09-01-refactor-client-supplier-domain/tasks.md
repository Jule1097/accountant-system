## 1. Domain Model Foundation

- [x] 1.1 Audit existing models, types, helpers, services, repositories, hooks, components, tests, imports, and exports before creating replacements.
- [x] 1.2 Add failing unit tests for shared third-party identity, intrinsic invariants, name normalization, CUIT comparison, controlled state changes, role preservation, and mapping boundaries.
- [x] 1.3 Add `src/models/third-party/` and implement the persistence-independent abstract third-party model.
- [x] 1.4 Implement concrete client and supplier models with role-specific construction and explicit persistence/API mapping.
- [x] 1.5 Add unit tests ensuring domain models do not depend on Prisma, repositories, API clients, React, or toast infrastructure.

## 2. Service and Repository Modularization

- [x] 2.1 Add failing service tests for shared create, update, duplicate validation, not-found, deletion constraint orchestration, and dependency injection.
- [x] 2.2 Define reusable repository contracts in the appropriate shared or domain-specific types folder and migrate Prisma adapters without merging separate persistence models.
- [x] 2.3 Extract only identical service orchestration while preserving `ClientService` and `SupplierService` public methods, return types, and role-specific messages.
- [x] 2.4 Update parser third-party lookup composition to consume the focused shared boundary and preserve the existing response contract.
- [x] 2.5 Run client-supplier service and repository tests and verify company isolation and duplicate behavior remain unchanged.

## 3. Client-Side Contract and Hook Decomposition

- [x] 3.1 Add failing hook tests for generic query-state updates, list/detail loading, mutation loading, pagination adjustment, optional operations, and scoped resource changes.
- [x] 3.2 Move generic hook interfaces and reusable result contracts into `src/types/shared/`, leaving only domain-specific adapter contracts in domain folders.
- [x] 3.3 Define generic resource adapter contracts with optional list, detail, and mutation operations and explicit response mapping.
- [x] 3.4 Extract query-string and debounce behavior into a generic resource query-state hook or equivalent reusable boundary with optional URL ownership.
- [x] 3.5 Extract generic list and detail loading behavior while preserving scoped cache keys, disabled automatic revalidation, and detail-fetch conditions.
- [x] 3.6 Extract generic resource mutation operations so request execution and loading state are independent from modal transitions, pagination, refresh, and feedback.
- [x] 3.7 Keep domain management hooks as thin adapters that compose generic hooks and preserve each existing view contract.

## 4. Form and Feedback Separation

- [x] 4.1 Add failing tests for form submission, duplicate resolution, successful save, failed save, and modal state preservation.
- [x] 4.2 Separate reusable resource request operations from React Hook Form lifecycle code where shared use exists, while keeping duplicate resolution domain-specific.
- [x] 4.3 Extend the existing client-supplier UI helper with pure reusable feedback payload builders for save, duplicate resolution, deletion, and errors.
- [x] 4.4 Remove inline toast title and description decisions from hooks while preserving Spanish user-facing messages and existing toast behavior.
- [x] 4.5 Verify components remain presentation-only and do not perform API requests or business-rule orchestration.

## 5. Compatibility Verification

- [x] 5.1 Update affected client-supplier, voucher inline third-party, parser, and route tests for the new domain and responsibility boundaries.
- [x] 5.2 Migrate all affected voucher, parser, API, UI, and test consumers to the new boundaries without redesigning unrelated modules.
- [x] 5.3 Verify DTO mapping preserves REST endpoint paths, payloads, response shapes, status codes, company isolation, and Prisma schema.
- [x] 5.4 Run focused Jest suites for models, mappers, services, repositories, generic hooks, adapters, UI helpers, parser lookup, and voucher inline third-party flows.
- [x] 5.5 Search for obsolete imports, exports, symbols, duplicated logic, dead files, and unused types or interfaces and remove them after migration.
- [x] 5.6 Verify generic hooks and domain models have no forbidden imports or dependency direction violations.
- [x] 5.7 Verify SOLID, DRY, KISS, YAGNI, separation-of-concerns, and dependency-direction decisions were applied only where justified and document rejected abstractions.
- [x] 5.7a Audit production code for magic strings and magic numbers, reuse existing constants, and add only responsibility-scoped constants under `src/lib/constants/`.
- [x] 5.8 Review `AGENTS.md`, `ARCHITECTURE.md`, `requirements.md`, `DESIGN.md`, and related documentation against the implemented architecture and update only the documentation that no longer describes current behavior.
- [x] 5.9 Run lint, type check, and build validation and confirm no unrelated files, comments, debug logs, secrets, or temporary artifacts were introduced.
