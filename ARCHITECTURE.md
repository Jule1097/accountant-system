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
- **Infrastructure Layer (`src/repositories/`)**: All Prisma queries must be abstracted behind repositories or data-access services to decouple the application from the ORM.
- **Helpers & Utilities (`src/lib/helpers/*`)**: All helper functions and utility methods must be placed in `src/lib/helpers/`. Do not create new folders for helpers, always create them in the nearest parent folder.
- **Types & Schemas (`src/lib/types/*`) and (`src/lib/schemas/*`)**: All type definitions and Zod schemas must be placed in `src/lib/types/` and `src/lib/schemas/` respectively. Do not create new folders for types or schemas.
- **Constants (`src/lib/constants/*`)**: All constants must be placed in `src/lib/constants/`. Do not create new folders for constants, always create them in the nearest parent folder.

## Frontend Modularization & Component Rules
- **Page Mount Constraint (`page.tsx`)**: `page.tsx` files must only be used to mount the corresponding UI components. Do not place complex logic or methods directly in page files. 
- **Pure HTML Presentation & Strict Separation:** UI components must **only** contain HTML elements and calls to external methods or hooks. They must **never** contain inline business logic implementation. Always separate logic and methods into their respective dedicated folders.
- **Component & File Length Limit:** All components, pages, and architectural files must strictly range between **150 to 200 lines maximum**. Break down complex UIs into smaller, single-responsibility sub-components.
- **Promise Derivation in Hooks:** Custom React hooks representing queries or async fetches should derive the promise during render using `useMemo` based on dependencies (e.g. `activeCompanyId`), instead of invoking `setState` from inside a `useEffect` loop.

## Code Style & Clean Architecture Rules
- Use `camelCase` for variables, functions, hooks, methods, and object properties.
- Use `PascalCase` for React components, classes, DTOs, types, interfaces, enums.
- Use `kebab-case` for route paths, asset file names, and feature-based markdown files in `docs/specs/` and `docs/reports/`.
- Use descriptive names. Avoid abbreviations that are not already established in the codebase.
- Keep functions small and focused on one responsibility.
- Use early returns to reduce nesting.
- **Zero Nested IFs:** Nested `if` statements (`if` inside an `if`) are strictly prohibited across all codebase layers (frontend and backend). Whenever conditional depth is required, you **must** extract the logic into a modular helper function located in `src/lib/helpers/`.
- **Reuse First Policy:** Before implementing any new utility, validation, or helper method, you **must** review existing codebase modules to reuse available methods. Only generate a new one if no suitable reusable method exists.
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
  - Whenever creating Zod schemas, they must be placed in a file named `<prefix>schemas.ts` inside `src/lib/schemas/` (e.g., `src/lib/schemas/voucher-schemas.ts`).

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