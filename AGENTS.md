## Scope & Core Philosophy

- This file is ALWAYS your entry point. Read it and re-read it periodically.
- Never modify this file unless the user explicitly asks for it. You can re-read it periodically to refresh your memory.
- Use Spanish labels in the UI when displaying enum values. Keep enum identifiers unchanged in code, API contracts, persistence, tests, and technical documentation.
- **Spec-Driven Development (SpecDD):** For any new feature, module, or structural change, you must strictly follow the SpecDD workflow using the **OpenSpec** framework. Minor bug fixes or small refactors can bypass this formal workflow.

## Next.js: ALWAYS read docs before coding
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

NEVER ADD COMMENTS ON CODE, its not neccessary. The name methods should explain by itself.

## Spec-Driven Development (SpecDD) Workflow (OpenSpec)
Whenever the user requests a new feature, module, or structural change, **never start coding immediately**. Follow the OpenSpec workflow:
1. **Change Creation:** Initialize a new change using `openspec new change <change-name>`.
2. **Spec & Design Drafting:** Edit the generated artifacts (e.g., `proposal.md`, `specs.md`, `design.md`, `tasks.md`) under `openspec/changes/<change-name>/` detailing the objective, data structures, Zod validations, and testing plan based on `requirements.md`.
   - **Interactive Review & Refinement:** Once the artifacts are drafted (and during any iteration), you **must reread them** to search for ambiguities, redundancies, unaddressed scenarios, or doubts (covering main/alternative flows, database constraints, Zod schemas, business logic, and UI/UX details).
   - Before assuming, deciding, or coding, you **must list the ambiguous items and potential solutions directly in the chat**, asking the user questions to clarify them. This interactive process continues until the specification is completely defined and clear.
3. **User Validation & Approval:** Present the proposal, specs, and design to the user and wait for explicit approval. Do not write code or apply tasks without approval.
4. **Execution & Testing (Apply Phase):** 
   - Retrieve apply instructions with `openspec instructions apply --change "<change-name>"`.
   - Implement the feature following the technical stack and ensuring all business rules (company data isolation, global unique CUITs, duplicate prevention, etc.) are met. Run Jest tests.
   - Mark tasks complete in the change's `tasks.md` file (updating `[ ]` to `[x]`).
5. **Archiving & Merging:** Once all tasks are completed, run `openspec archive <change-name>` to merge and update the main project specifications.

## Language Policy
- User-facing pages, HTML copy, labels, validation messages, error messages, and demo content must be written in Spanish.
- Source code, file names, identifiers, comments, commit messages, PR descriptions, and technical documentation must be written in English.
- API error payloads must use Spanish only when the message is intentionally displayed to an end user. Internal logs and developer-facing errors must be in English.

## Repository & Tech Stack Rules
- Use `pnpm` only.
- Do not add `package-lock.json`, `npm-shrinkwrap.json`, or `yarn.lock`.
- Keep changes scoped to the user request.
- **Stack Enforcement:** 
  - Framework: Next.js 16 (App Router).
  - Architecture: Pure REST API endpoints (`src/app/api/...`). **Server Actions are strictly prohibited** for this project phase.
  - ORM & DB: Prisma ORM with Supabase (PostgreSQL).
  - Validation: Zod schemas.
  - Forms: React Hook Form with Shadcn/ui components.
  - Testing: Jest.
  - AI Integration: Gemini API for parsing PDFs/images via temporary memory buffer (leaving blank fields for manual entry if AI detection fails).
- Do not rewrite unrelated code while implementing a feature or fix.
- Do not revert user changes unless the user explicitly asks for a revert.

## Code Style
- Use `camelCase` for variables, functions, hooks, methods, and object properties.
- Use `PascalCase` for React components, classes, DTOs, types, interfaces, enums.
- Use `kebab-case` for route paths, asset file names, and feature-based markdown files in `docs/specs/` and `docs/reports/`.
- Use descriptive names. Avoid abbreviations that are not already established in the codebase.
- Keep functions small and focused on one responsibility.
- Use early returns to reduce nesting.
- Do not leave dead code, commented-out code, debug logs, temporary TODOs, or unused exports.

## TypeScript Rules
- TypeScript errors block a PR or CI/CD build.
- Public functions, exported functions, controller methods, service methods, hooks, and component props must have explicit input and output types.
- Do not use `any`.
- Use `unknown` with narrowing when the runtime shape is not known.
- Avoid type assertions. A type assertion is allowed only after validation, narrowing, or when adapting a third-party API with an inaccurate type.
- Use discriminated unions for workflow states, async states, and approval states when they make invalid states impossible to represent.
- Whenever creating types or interfaces, they MUST be modularized into a folder named `types` inside `src` (e.g., `src/types/`). Do not define them inline within models, services, or controllers.


## Security Baseline & Business Constraints
- Treat all client input as untrusted.
- Validate and sanitize user-controlled input before persistence, rendering, export, or AI calls using Zod.
- **Session Protection & Refresh:** Implement a Next.js middleware using `@supabase/ssr` to verify session cookies and return 401 for unauthenticated API requests. The middleware must automatically refresh near-expired tokens and update cookies in the response headers.
- **Data Isolation:** Enforce company-level data isolation in backend endpoints. Ensure the client sends `x-company-id` header, which must be validated against `UserCompany` associations (returning 403 on mismatch). If the header is missing, infer it if the user has only one company, otherwise return 400.
- **Global Unique CUIT:** Enforce system-wide uniqueness for client and supplier CUITs.
- **Strict Duplicate Prevention:** Reject duplicate vouchers matching the exact combination of company, type, third-party, voucher type, letter, point of sale (`posNumber`), and number.
- **Rate Limiting:** Implement a global Redis-based middleware rate limiter restricting requests to 100 per minute per IP/User to prevent endpoint abuse (especially for the Gemini AI parsing endpoint).
- **CORS Configuration:** Restrict CORS requests to same-origin by default. Configure specific allowed domains only through environment variables in staging/production.
- Backend endpoints are private by default and require an authenticated application session.
- Do not expose `.env` values, credentials, API keys, storage provider keys, or AI credentials in logs, client bundles, HTTP responses, or generated files.
- Error responses must be useful but generic. Do not return stack traces, internal provider details, or SQL errors.

## Observability
- Logs must be in English.
- Logs must include enough context to diagnose failures: request path, operation name, workflow state, entity ID, and external provider name when relevant.
- Logs must not contain secrets, auth tokens or personal data.
- User-facing errors must be short, actionable, and written in Spanish.

## Documentation Policy
- Markdown files must be concise, scannable in raw diffs, and written in English unless they are user-facing product copy.
- Update documentation in the same PR when behavior, setup, commands, environment variables, or architecture changes.
- Architecture documentation must describe current behavior, not aspirational features.

## Git Workflow & CI/CD
- **Branch Creation:** Before starting any new feature, bug fix, or task, a new branch must always be created.
  - The base branch must always be `main` (ensuring a clean production code starting point).
  - The branch name must be lowercase and strictly use the format `<prefix>/<feature-name-in-kebab-case>` (e.g., `feature/create-purchase-voucher`, `fix/resolve-voucher-bug`).
  - Allowed prefixes: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, or `codex/`.
- **Integration Workflow:**
  - The created work branch must be integrated via Pull Request (PR) to the `staging` branch.
  - Merging from `staging` to `main` is performed manually via PR later.
- Keep PRs small and reviewable.
- GitHub Actions CI/CD workflows will automatically execute builds, lints, type checks, and Jest tests on PRs and merges. Any failure blocks the pipeline.
- Commit messages must follow the **Conventional Commits** standard (without scopes) in English and in an imperative, present-tense form.
  - Format: `<type>: <description>` (e.g., `feat: add voucher schema`, `docs: add spec for create-purchase-voucher`).
  - Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.
  - Use incremental commits corresponding to OpenSpec phases (e.g., `docs: add proposal/specs/design/tasks for <change-name>` during Spec/Design drafting, `feat: ...` / `test: ...` during execution/testing, and `chore: archive change <change-name>` / `docs: update main specs` upon completion).

## Architecture & Code Design
- **Architecture Style:** Implement clean code principles and modular layering inspired by Clean Architecture / Hexagonal Architecture. 
  - **Framework Layer (`src/app/api/...`)**: Route handlers must only parse requests, invoke services, and return HTTP responses. Do NOT place business logic, complex validations, or database queries in Next.js `route.ts` files.
  - **Application Layer (`src/services/`)**: Use case orchestration, transaction boundaries, and business rules execution.
  - **Domain Layer (`src/models/`)**: Rich domain models. Entities must encapsulate their own business rules and state mutations as methods (e.g., `voucher.calculateTotal()`) rather than acting as anemic data structures.
  - **Infrastructure Layer (`src/repositories/`)**: All Prisma queries must be abstracted behind repositories or data-access services to decouple the application from the ORM.
- **Frontend Modularization**: `page.tsx` files must only be used to mount the corresponding UI components. Do not place complex logic or methods directly in page files. Modularize all logic and methods into their respective entity folders/files to strictly separate responsibilities. Avoid grouping logic methods with rendering unless absolutely necessary.
- Keep domain logic decoupled from framework-specific routing or database drivers.

## Testing Standards
- Every new feature or backend endpoint must include automated tests using Jest.
- Minimum test requirements per feature:
  - Unit tests for validation schemas (Zod) and core business logic.
  - Integration/API tests verifying success cases, company data isolation, and constraint enforcement (e.g., duplicate voucher blocking). These tests must mock the database and Prisma/Supabase services to run efficiently without requiring a live database instance.
- Test coverage must target critical business paths.

## Review Standard & Validation Before Handoff
- Run the relevant build/lint/test commands for touched areas.
- Verify no secrets, `.env` values, debug logs, or temporary files were introduced.
- Verify user-facing text is Spanish and technical text is English.
- Ensure all business rules from `requirements.md` are strictly respected.
