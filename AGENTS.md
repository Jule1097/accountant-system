## Scope & Core Philosophy

- This file is ALWAYS your entry point. Read it and re-read it periodically.
- Never modify this file unless the user explicitly asks for it. You can re-read it periodically to refresh your memory.
- Use Spanish labels in the UI when displaying enum values. Keep enum identifiers unchanged in code, API contracts, persistence, tests, and technical documentation.
- NEVER ADD COMMENTS ON CODE, its not neccessary. The name methods should explain by itself.

- **Spec-Driven Development (SpecDD):** For any new feature, module, or structural change, you must strictly follow the SpecDD workflow using the **OpenSpec** framework. Minor bug fixes or small refactors can bypass this formal workflow.

## Skill Integration Policy
- **Always check installed skills first:** Before implementing any new code, feature, or tool integration, you must scan and verify the installed skills/extensions to leverage the appropriate ones when applicable.

## Next.js: ALWAYS read docs before coding
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## Spec-Driven Development (SpecDD) Workflow (OpenSpec)
Whenever the user requests a new feature, module, or structural change, **never start coding immediately**. Follow the OpenSpec workflow:
1. **Change Creation:** Initialize a new change using `openspec new change <change-name>`.
2. **Spec & Design Drafting:** Edit the generated artifacts (e.g., `proposal.md`, `specs.md`, `design.md`, `tasks.md`) under `openspec/changes/<change-name>/` detailing the objective, data structures, Zod validations, and testing plan based on `requirements.md`.
   - **Interactive Review & Refinement:** Once the artifacts are drafted (and during any iteration), you **must reread them** to search for ambiguities, redundancies, unaddressed scenarios, or doubts (covering main/alternative flows, database constraints, Zod schemas, business logic, and UI/UX details).
   - Before assuming, deciding, or coding, you **must list the ambiguous items and potential solutions directly in the chat**, asking the user questions to clarify them. This interactive process continues until the specification is completely defined and clear.
3. **User Validation & Approval:** Present the proposal, specs, and design to the user and wait for explicit approval. Do not write code or apply tasks without approval.
4. **Execution & Testing (Apply Phase):** 
   - Retrieve apply instructions with `openspec instructions apply --change "<change-name>"`.
   - Implement the feature following the technical stack and ensuring all business rules are met. Run Jest tests.
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
- Do not rewrite unrelated code while implementing a feature or fix.
- Do not revert user changes unless the user explicitly asks for a revert.

## Observability
- Logs must be in English.
- Logs must include enough context to diagnose failures: request path, operation name, workflow state, entity ID, and external provider name when relevant.
- Logs must not contain secrets, auth tokens or personal data.
- User-facing errors must be short, actionable, and written in Spanish.

## Documentation Policy
- Markdown files must be concise, scannable in raw diffs, and written in English unless they are user-facing product copy.
- Update documentation in the same PR when behavior, setup, commands, environment variables, or architecture changes.
- Architecture documentation must describe current behavior, not aspirational features. See `ARCHITECTURE.md` for technical design patterns, clean code principles, and structural layer definitions.

## Git Workflow & CI/CD
- **Branch Creation:** Before starting any new feature, bug fix, or task, a new branch must always be created.
  - After creating the new branch, always pull the latest changes from `staging` before starting implementation.
  - The branch name must be lowercase and strictly use the format `<prefix>/<feature-name-in-kebab-case>` (e.g., `feature/create-purchase-voucher`, `fix/resolve-voucher-bug`).
  - Allowed prefixes: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`.
- **Integration Workflow:**
  - The created work branch must be integrated via Pull Request (PR) to the `staging` branch.
  - Merging from `staging` to `main` is performed manually via PR later.
- Keep PRs small and reviewable.
- GitHub Actions CI/CD workflows will automatically execute builds, lints, type checks, and Jest tests on PRs and merges. Any failure blocks the pipeline.
- Commit messages must follow the **Conventional Commits** standard (without scopes) in English and in an imperative, present-tense form.
  - Format: `<type>: <description>` (e.g., `feat: add voucher schema`, `docs: add spec for create-purchase-voucher`).
  - Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.
  - Use incremental commits corresponding to OpenSpec phases.

## Testing Standards
- Every new feature or backend endpoint must include automated tests using Jest.
- Minimum test requirements per feature:
  - Unit tests for validation schemas (Zod) and core business logic.
  - Integration/API tests verifying success cases, company data isolation, and constraint enforcement. These tests must mock the database and Prisma/Supabase services.
- Test coverage must target critical business paths.

## Review Standard & Validation Before Handoff
- Run the relevant build/lint/test commands for touched areas.
- Verify no secrets, `.env` values, debug logs, or temporary files were introduced.
- Verify user-facing text is Spanish and technical text is English.
- Ensure all business rules from `requirements.md` are strictly respected.

See `architecture.md` for technical design patterns, clean code principles, and structural layer definitions that must be strictly followed.
