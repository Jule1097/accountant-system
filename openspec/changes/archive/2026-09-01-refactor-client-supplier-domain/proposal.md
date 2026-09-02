## Why

The client and supplier domains currently duplicate entity behavior across Prisma-shaped records, services, repositories, hooks, and UI feedback. This makes changes expensive and increases the risk that client and supplier flows diverge as more third-party roles are added.

The change establishes a reusable domain foundation and separates React screen coordination from API mutations, modal state, pagination, and notifications while preserving the current functional behavior and public API contracts.

## What Changes

- Add a `src/models/third-party/` domain folder containing an abstract `ThirdParty` model and concrete `Client` and `Supplier` models.
- Move shared third-party identity, normalization, comparison, and controlled state-change behavior into the abstract model.
- Keep client- and supplier-specific rules in their concrete models or existing service layer when they depend on persistence.
- Refactor client and supplier services to reuse shared orchestration while preserving `ClientService` and `SupplierService` entry points.
- Refactor client and supplier repositories to reuse shared query and persistence contracts without coupling the domain models to Prisma.
- Split resource hooks by responsibility for query state, list/detail loading, mutations, and screen coordination, with adapters for concrete resources.
- Keep generic hook interfaces and reusable resource contracts in `src/types/shared/`; keep only domain-specific adapter contracts in their domain folder.
- Extract reusable client-supplier feedback definitions from hook bodies, reusing the existing UI helper module where possible.
- Keep modal opening, closing, pagination transitions, API requests, refresh behavior, and toast construction as separate responsibilities.
- Audit existing artifacts before creating replacements, reuse adaptable implementations, and remove obsolete files, methods, types, interfaces, imports, and exports after migration.
- Apply SOLID, DRY, KISS, YAGNI, and separation-of-concerns principles only where they produce a clear maintainability or extensibility benefit; do not introduce abstractions for their own sake.
- Centralize production magic strings and magic numbers in responsibility-scoped constants under `src/lib/constants/`.
- Preserve existing REST routes, payloads, Prisma tables, company isolation, duplicate rules, inline voucher creation, and Spanish user-facing behavior.
- Migrate all affected consumers, including voucher models/forms, parser composition, API boundaries, UI consumers, tests, and mocks, without redesigning unrelated modules.

## Capabilities

### New Capabilities

- `client-supplier-domain`: Defines the shared third-party domain model, client and supplier specializations, and separation of domain, persistence, application, and presentation responsibilities.

### Modified Capabilities

No user-facing or API-level requirements change in this refactor.

## Impact

- Affects `src/models/third-party/`, `src/services/third-party/`, `src/repositories/third-party/`, shared resource hooks and types, concrete resource adapters, domain helpers, and affected consumers.
- Requires updates to parser response composition and voucher inline third-party consumers if repository or model contracts change internally.
- Requires Jest coverage for domain model behavior, shared service orchestration, repository adapters, hook responsibility boundaries, deletion flow outcomes, and preserved API behavior.
- Does not require a database migration or external dependency.
