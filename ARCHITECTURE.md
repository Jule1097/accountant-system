# Technical Architecture & Design Guidelines

This file defines the technical foundation. All implementations must adhere to the workflows defined in `AGENTS.md`.

## Tech Stack Enforcement
- **Framework:** Next.js 16 (App Router).
- **Architecture Style:** Pure REST API endpoints (`src/app/api/...`). **Server Actions are strictly prohibited** for this project phase.
- **ORM & DB:** Prisma ORM with Supabase (PostgreSQL).
- **Validation:** Zod schemas.
- **Forms:** React Hook Form with Shadcn/ui components.
- **Testing:** Jest.
- **AI Integration:** Gemini API for parsing PDFs/images via temporary memory buffer.

## Architectural Layering (Clean / Hexagonal Inspiration)
- **Framework Layer (`src/app/api/...`)**: Route handlers must only parse requests, invoke services, and return HTTP responses. Do NOT place business logic, complex validations, or database queries in Next.js `route.ts` files.
- **Application Layer (`src/services/`)**: Use case orchestration, transaction boundaries, and business rules execution.
- **Domain Layer (`src/models/`)**: Rich domain models. Entities must encapsulate their own business rules and state mutations as methods rather than acting as anemic data structures.
- **Infrastructure Layer (`src/repositories/`)**: All Prisma queries must be abstracted behind repositories or data-access services to decouple the application from the ORM. **Important**: When using `@prisma/adapter-pg`, avoid using `Promise.all` for multiple concurrent Prisma queries (e.g. `findMany`), as it can trigger `pg` driver deprecation warnings (concurrent queries on a single client). Use sequential `await`s` instead.
- **Helpers & Utilities (`src/lib/helpers/*`)**: Helper functions must be placed in `src/lib/helpers/`.
- **Types & Schemas (`src/types/*`) and (`src/lib/schemas/*`)**: Type definitions must be in `src/types/` and Zod schemas in `src/lib/schemas/`.
- **Constants (`src/lib/constants/*`)**: Constants must be placed in `src/lib/constants/`. Production code must not embed magic strings or magic numbers for domain values, configuration, protocols, statuses, operation errors, or user-facing messages; reuse or add a responsibility-scoped constant instead.

## Domain-Based File Organization (Source of Truth)

To ensure clarity, scalability, and maintainability, the codebase enforces **Domain-Based File Organization**.

- **Organization by Domain**: The contents of `hooks`, `services`, `repositories`, `types`, `helpers`, `schemas`, and modules within `lib` **must** be organized into subfolders by domain or responsibility (e.g., `voucher/`, `third-party/`, `parser/`, `auth/`).
- **Subfolders Allowed**: Subfolders are allowed and encouraged when they improve architectural clarity. Do not create ambiguous generic folders if the file belongs to an existing clear domain.
- **Choosing the Right Folder**:
  - `shared/`: For elements reused across completely unrelated domains (e.g., `use-mobile.ts`, `utils.ts`).
  - `platform/`: For core infrastructure utilities (e.g., `date-timezone.ts`, `promise-cache.ts`).
  - `integrations/`: For external service configurations (e.g., `gemini.ts`, `supabase-client.ts`).
  - Domain Folders (e.g. `voucher/`): For logic tied strictly to a specific business domain.
- **Future Movements Rule**: Before creating a new file, it must be located within the corresponding existing domain subfolder. Do not create loose files in the root of `hooks`, `services`, `repositories`, `types`, or `lib` unless they are truly transversal modules.

## Frontend Modularization & Component Rules
- **Page Mount Constraint (`page.tsx`)**: `page.tsx` files must only be used to mount the corresponding UI components. Do not place complex logic or methods directly in page files. 
- **Pure HTML Presentation & Strict Separation:** UI components must **only** contain HTML elements and calls to external methods or hooks. They must **never** contain inline business logic implementation. Always separate logic and methods into their respective dedicated folders.
- **No Network Orchestration In UI Components:** Presentation components must not call `apiRequest`, trigger toasts, decide REST endpoints, or orchestrate persistence side effects. Those responsibilities belong in dedicated hooks, services, or helper layers, and components must receive already-prepared callbacks and view data through props.
- **Route Data Ownership:** Each route may request only the data required by its current visible UI state. A screen must not preload, refetch, or keep mounted requests for unrelated modules just because a shared provider, layout, or high-level hook exists in the tree.
- **Lazy Loading For Non-Critical Client UI:** Heavy client-only subtrees such as modals, dialogs, previews, and interaction-only panels must be deferred with `next/dynamic` when they are not needed for the initial visible route content.
- **Closed Optional UI Must Not Mount:** Inactive tabs, closed modals, hidden drawers, unopened detail panes, and route-local optional sections must not mount their UI subtree, hooks, or fetch logic until the user activates them.
- **Detail Fetches Must Follow UI State:** Record-detail and review-detail requests must only activate when the exact identifier exists and the corresponding detail UI is actually open. Query params or dormant local state alone are not enough reason to fetch.
- **Scoped Loading States:** Suspense and loading fallbacks must be placed so that loading one optional subtree does not replace or remount already-visible route content. Deferred overlays must keep page-level tables and primary content stable while their own bundle loads.
- **Skeleton Reuse Rule:** Loading placeholders must reuse the existing skeleton system and established loading patterns by default. Do not introduce a new skeleton strategy, library, or visual loading pattern unless the user explicitly approves that architectural change.
- **Shared Session Data Scope:** Session-scoped identity data such as authenticated user info and company membership must be loaded once and reused across internal navigation. These shared sources must not refetch on ordinary page changes.
- **Company-Scoped Business Data:** Business modules such as vouchers, analytics, clients, suppliers, conciliations, and notifications must derive their requests from `activeCompanyId` and remain isolated per company cache scope.
- **Controlled Revalidation Only:** SWR or equivalent client caches must disable automatic focus/reconnect revalidation by default unless the resource explicitly requires it. Polling is opt-in and must be justified by the business behavior of that resource.
- **Mutation Invalidation Must Be Narrow:** After create, update, delete, validate, persist, or discard actions, only the smallest safe cache scope may be invalidated. Never refresh unrelated route data or hidden sections when a narrower key-level refresh is sufficient.
- **URL State Must Not Trigger Route Reloads:** Route-local query state for tables, tabs, search, sorting, filtering, pagination, and local detail selection should update through the smallest safe navigation mechanism so the route does not remount or re-request unrelated data.
- **Reuse Existing Interaction Patterns:** When a screen introduces tabs, tags, toolbars, tables, dialogs, empty states, or loading states that already exist elsewhere in the product, the implementation must reuse the established visual and interaction pattern instead of inventing a parallel variant unless the user explicitly asks for a redesign.
- **Mandatory Reuse-First Audit:** Before adding any new component, hook, helper, service, schema, type, constant, test, loader, modal, skeleton, filter, or table behavior, you must search the existing codebase for reusable or adaptable implementations. New artifacts are allowed only when no suitable option exists, and they must be authored with reusable boundaries so future screens can adopt them without feature-specific coupling.
- **Component Props Typing Rule:** Component prop interfaces and reusable view-model types must live in `src/types/`. Do not define exported or feature-level prop interfaces inside component files.
- **Component & File Length Limit:** All components, pages, and architectural files must strictly range between **150 to 200 lines maximum**. Break down complex UIs into smaller, single-responsibility sub-components.
- **Promise Derivation in Hooks:** Custom React hooks representing queries or async fetches should derive the promise during render using `useMemo` based on dependencies (e.g. `activeCompanyId`), instead of invoking `setState` from inside a `useEffect` loop.
- **Single-Purpose Shared Hooks:** Shared hooks must be separated by stable responsibility, such as resource loading, mutations, pagination, filtering, searching, sorting, URL state, selection, or feedback state. A shared hook must not combine unrelated state machines.
- **Entity-Agnostic Shared Hooks:** Shared hooks must not import or encode a concrete business entity, domain message, form schema, modal implementation, API route, or repository. Entity-specific behavior must be supplied through typed adapters, configuration, or injected functions.
- **Management Hook Boundary:** Domain management hooks must remain thin composition adapters. They may coordinate shared hooks and domain adapters, but must not reimplement generic pagination, filtering, searching, sorting, data loading, mutation, or feedback mechanics.
- **Independent UI and Async Responsibilities:** Data loading, request execution, URL/query state, UI transitions, pagination adjustments, and feedback side effects must remain independently replaceable and testable. Generic hooks may expose outcomes and transitions but must not own domain-specific presentation messages.

## Code Style & Clean Architecture Rules
- Use `camelCase` for variables, functions, hooks, methods, and object properties.
- Use `PascalCase` for React components, classes, DTOs, types, interfaces, enums.
- Use `kebab-case` for route paths, asset file names, and feature-based markdown files in `docs/specs/` and `docs/reports/`.
- Use descriptive names. Avoid abbreviations that are not already established in the codebase.
- Keep functions small and focused on one responsibility.
- Use early returns to reduce nesting.
- **Zero Nested IFs:** Nested `if` statements (`if` inside an `if`) are strictly prohibited across all codebase layers (frontend and backend). Whenever conditional depth is required, you **must** extract the logic into a modular helper function located in `src/lib/helpers/`.
- **Reuse First Policy:** Before implementing any new utility, validation, or helper method, you **must** review existing codebase modules to reuse available methods. Only generate a new one if no suitable reusable method exists.
- **Reuse Includes Tests And Contracts:** The reuse-first rule also applies to test helpers, fixtures, mocks, schemas, DTOs, query-state models, and UI state contracts. Avoid cloning similar artifacts with slight variations when they can be generalized safely.
- **Selective Design Principles:** Apply SOLID, DRY, KISS, YAGNI, composition over inheritance, and dependency inversion only when they reduce coupling, duplication, responsibility overlap, or the cost of extending the system. Do not introduce abstractions solely to satisfy a named principle.
- Do not leave dead code, commented-out code, debug logs, temporary TODOs, or unused exports.

## TypeScript Rules
- TypeScript errors block a PR or CI/CD build.
- Public functions, exported functions, controller methods, service methods, hooks, and component props must have explicit input and output types.
- Do not use `any`.
- Use `unknown` with narrowing when the runtime shape is not known.
- Avoid type assertions. A type assertion is allowed only after validation, narrowing, or when adapting a third-party API with an inaccurate type.
- Use discriminated unions for workflow states, async states, and approval states.
- **Strict File Organization:**
  - Whenever creating types or interfaces, they MUST be modularized into a folder named `types` inside `src` (e.g., `src/types/`). Do not define them inline within models, services, or controllers.
  - Whenever creating Zod schemas, they must be placed in a file named `<prefix>schemas.ts` inside `src/lib/schemas/` (e.g., `src/lib/schemas/voucher/voucher-schemas.ts`).
  - **Both must be placed inside their corresponding domain subfolders** following the Domain-Based File Organization rules.

## Testing Rules
- **Domain-Based Testing:** Tests must be organized by type (`unit` or `integration`) and then by domain. All tests must reside in `src/__tests__/<type>/<domain>/...`.
- **Unit vs Integration:** 
  - Unit tests use `jest.mock` for dependencies (e.g., Repositories, external APIs) or test pure functions without I/O side effects. 
  - Integration tests verify the interaction with real databases (Prisma) or external services without mocks.

## Security Baseline & Business Constraints
- Treat all client input as untrusted.
- Validate and sanitize user-controlled input before persistence, rendering, export, or AI calls using Zod.
- **Session Protection & Refresh:** Implement a Next.js middleware using `@supabase/ssr` to verify session cookies and return 401 for unauthenticated API requests. The middleware must automatically refresh near-expired tokens and update cookies in the response headers.
- **Data Isolation:** Enforce company-level data isolation in backend endpoints. Ensure the client sends `x-company-id` header, which must be validated against `UserCompany` associations (returning 403 on mismatch). If the header is missing, infer it if the user has only one company, otherwise return 400.
- **Global Unique CUIT:** Enforce system-wide uniqueness for client and supplier CUITs.
- **Strict Duplicate Prevention:** Reject duplicate records matching exact business constraints.
- **Rate Limiting:** Implement a global Redis-based middleware rate limiter restricting requests to 100 per minute per IP/User.
- **CORS Configuration:** Restrict CORS requests to same-origin by default. Configure specific allowed domains only through environment variables in staging/production.
- Backend endpoints are private by default and require an authenticated application session.
- Do not expose `.env` values, credentials, API keys, storage provider keys, or AI credentials in logs, client bundles, HTTP responses, or generated files.
- Error responses must be useful but generic. Do not return stack traces, internal provider details, or SQL errors.
