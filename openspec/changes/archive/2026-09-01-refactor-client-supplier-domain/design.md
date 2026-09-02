## Context

The current client and supplier implementation uses separate Prisma-shaped records, services, repositories, and shared helpers. The services and repositories repeat the same orchestration, while `useClientsSuppliersManagement` combines URL state, data loading, modal transitions, deletion, refreshes, and feedback. See [proposal.md](proposal.md) and [third-party-domain](specs/third-party-domain/spec.md).

## Goals / Non-Goals

**Goals:**

- Establish a domain model hierarchy under `src/models/third-party/`.
- Keep domain models independent from Prisma, HTTP, React, and toast infrastructure.
- Reuse common service and repository behavior without hiding role-specific differences.
- Keep `ClientService` and `SupplierService` as stable application entry points.
- Split generic resource data loading, query state, mutations, pagination transitions, and async feedback state into independently testable units, with domain-specific adapters kept at the boundary.
- Reuse existing client-supplier UI message helpers and existing API request infrastructure.

**Non-Goals:**

- Do not merge the Prisma `Client` and `Supplier` tables.
- Do not introduce a generic third-party database table or inheritance mapping in Prisma.
- Do not move persistence rules into domain models.
- Do not change REST paths, payload shapes, status codes, or user-facing behavior.
- Do not create a frontend business-use-case layer solely to apply object-oriented terminology.

## Decisions

### 1. Use a domain hierarchy without ORM inheritance

Create `ThirdParty` as an abstract base model in `src/models/third-party/ThirdParty.ts`, with `Client` and `Supplier` in sibling PascalCase files. The base model owns shared identity state and pure behavior such as normalized name access, CUIT comparison, identity matching, and controlled name/CUIT changes. Concrete models retain role identity and may expose role-specific behavior only when it is genuinely different.

The models will not own repository references, voucher lookups, HTTP calls, React state, or toast behavior. Explicit role-specific mappers will convert persistence records into domain models and domain models into persistence or API DTOs where needed. Constructors and state-changing methods will enforce intrinsic invariants; Zod remains responsible for untrusted transport input.

An ORM inheritance hierarchy was rejected because Prisma already exposes two separate tables and introducing a shared table would require a data migration and alter current role semantics.

### 2. Share application orchestration through contracts, not role erasure

Define small reusable repository contracts for operations common to both roles, while keeping `ClientRepository` and `SupplierRepository` as Prisma adapters. Common service orchestration will use composition, and `ClientService` and `SupplierService` will remain role-specific façades. Services and repositories will receive dependencies through constructors or equivalent injection boundaries instead of constructing concrete dependencies internally.

Role-specific error messages, repository delegates, voucher foreign-key checks, and return types will remain at the concrete boundary. A generic abstraction will not combine Prisma `Client` and `Supplier` inputs into an unsafe intersection type.

The parser response service will consume a focused third-party lookup contract instead of coordinating two repositories directly where the shared behavior can be reused without changing its result.

### 3. Keep domain validation distinct from persistence constraints

The domain model will validate and normalize values that can be decided from the entity itself. Company-scoped duplicate checks, voucher dependency checks, and race-condition handling remain in services and repositories. Database constraints remain the final persistence safeguard.

This preserves the current separation while making the model rich enough to avoid anemic records.

### 4. Split client-side state by responsibility

The current management hook will be decomposed into generic resource hooks whose public interfaces live in `src/types/shared/`. The intended boundaries are optional query-string state, list/detail loading, mutations, and resource-level composition. Concrete domains will provide adapters and domain-specific types at their own boundaries. Generic hooks will use injected functions and will not own modal state, forms, domain rules, toast rendering, or domain messages.

The deletion mutation will execute the request and expose its loading/result state. It will not open or close dialogs, alter pagination, refresh unrelated data, or create toasts. The screen coordinator will compose those outcomes with dedicated state-transition functions.

The form hook will retain React Hook Form integration and field lifecycle. Request execution may be isolated behind reusable resource operations, while duplicate resolution remains a domain-specific adapter concern and is not part of the generic resource hook contract. A universal resource form hook is not part of this change.

### 5. Centralize feedback as pure reusable data

The existing domain UI helper already owns concrete labels and message resolution. It will be extended or composed with pure feedback builders for success, duplicate resolution, validation, and deletion outcomes. Generic hooks will accept feedback descriptors or callbacks and will not contain concrete domain messages.

A global toast hook or domain model dependency will not be introduced. Toast rendering remains a UI concern.

### 6. Preserve compatibility through adapters and incremental replacement

Repositories will continue returning the shapes expected by current services until each consumer is migrated. Domain construction will happen at the application boundary where behavior is needed, avoiding a broad rewrite of parser, voucher, and UI consumers. Existing tests will be updated first for model behavior and responsibility boundaries, then implementation will be migrated in small steps.

### 7. Apply design principles selectively

SOLID, DRY, KISS, YAGNI, separation of concerns, and dependency direction will guide decisions rather than act as blanket requirements. Each abstraction must have a stable shared responsibility, clear consumers, and a measurable reduction in duplication or coupling. A concrete implementation is preferred when it is simpler and the behavior is not yet stable enough to generalize.

The generic resource hooks will use adapters and small interfaces because the same list, detail, mutation, async-state, and feedback mechanics are expected across multiple resources. Domain models will use inheritance only where the domain relationship is genuine. Services and repositories will use contracts or composition only for operations with identical semantics.

### 8. Perform a reuse and cleanup audit

Before adding any artifact, inspect existing consumers and tests. After migration, search for old imports, exports, symbols, duplicated logic, dead files, and unreachable code. Types and interfaces will be moved out of hooks, components, services, and repositories into the appropriate `src/types/shared/` or domain-specific types folder. The audit must cover the complete affected dependency graph, not only the files changed first.

### 9. Centralize magic values

Production code will not embed magic strings or magic numbers for domain roles, configuration, protocol values, operation errors, statuses, or user-facing messages. Existing constants in `src/lib/constants/` must be reused first; new constants must be responsibility-scoped and placed there. Test data may use literals when the literal is the behavior being asserted.

### 9. Migrate affected consumers without broad redesign

The implementation will trace and migrate direct consumers in voucher models/forms, parser response composition, API routes, UI hooks/components, and tests. Existing public API behavior and persistence relations remain stable. `Voucher` will keep separate client and supplier relations; only the affected mapping or domain boundaries will be updated. Parser and voucher flows will be adapted where required, not redesigned wholesale.

### 10. Use SWR only in the shared data-loading boundary

The generic list and detail hooks may use the existing SWR infrastructure for company-scoped cache keys, deduplication, and narrow invalidation. The resource adapter owns key construction and response mapping. Query-state hooks remain usable without SWR for local or non-network resources.

### 11. Keep API compatibility through DTO mapping

Repositories may use Prisma internally, but application and API boundaries expose stable DTOs. Existing JSON contracts will be covered by regression tests. Full API envelope standardization is outside this change unless a directly affected endpoint already requires it.

## Risks / Trade-offs

- **[Risk] A generic repository, service, or hook abstraction becomes harder to understand than the duplication.** → Apply SOLID only when the shared behavior is stable and measurable; keep concrete implementations when abstraction would add indirection without reuse.
- **[Risk] Mapping Prisma records to models may add conversion code.** → Centralize mapping in the client-supplier domain boundary and cover it with unit tests.
- **[Risk] Moving logic between hooks can change timing around SWR refreshes or modal state.** → Preserve existing tests and add outcome-focused tests for success, failure, cancellation, and company changes.
- **[Risk] Feedback helpers may become another message indirection layer.** → Keep them limited to pure Spanish presentation data and reuse the existing UI helper module.
- **[Risk] Domain models may accidentally absorb persistence-dependent rules.** → Enforce a dependency rule in review and tests: models import domain types/helpers only, never Prisma, repositories, API clients, or React.

## Migration Plan

1. Inventory all affected consumers, existing reusable artifacts, contracts, imports, exports, and tests.
2. Add failing unit tests for model invariants, role preservation, mapping, and dependency boundaries.
3. Add the abstract and concrete domain models under `src/models/third-party/` with explicit mapping coverage.
4. Add failing service and repository contract tests, introduce dependency injection, and migrate concrete adapters incrementally.
5. Migrate affected parser, voucher, API, and UI consumers without changing public contracts.
6. Add failing tests for generic resource hooks, isolated mutations, state transitions, and generic feedback descriptors.
7. Split hooks, centralize concrete feedback, and remove obsolete domain-specific duplication.
8. Run compatibility, cleanup, architectural dependency, Jest, type, lint, and build validation.
9. Reconcile `AGENTS.md`, `ARCHITECTURE.md`, `requirements.md`, `DESIGN.md`, and related documentation with the implemented behavior before archiving.

Rollback is file-level through the work branch: if a migration step fails, revert that step while keeping the existing concrete services, repositories, and hooks available until their consumers are migrated.
