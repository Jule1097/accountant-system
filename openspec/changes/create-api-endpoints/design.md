## Context

The system utilizes Next.js 16 App Router, Prisma ORM with Supabase PostgreSQL, and Supabase Auth. See [proposal.md](proposal.md) for core motivation. We need to design the private HTTP backend routing under `/api/`, Next.js middleware hooks, and transactional database services.

## Goals / Non-Goals

**Goals:**
- Design a modular, RESTful API architecture under `/api/`.
- Build a secure Next.js middleware layer protecting all `/api/` routes.
- Enforce strict company-level multi-tenant isolation via custom HTTP header validation.
- Implement transactional business logic (financial calculations, inline contact generation, duplicate prevention).
- Configure global rate limiting using `@upstash/redis`.

**Non-Goals:**
- Build frontend UI components or forms (to be addressed in subsequent UI changes).
- Store invoice files locally or in S3 (all invoice parsing is done in-memory).

## Decisions

### 1. Database Connection & Client Singleton
- **Decision:** Implement `src/lib/prisma.ts` as a singleton client wrapper. It will instantiate `pg.Pool` and `PrismaClient` using `@prisma/adapter-pg` only once, caching it on `globalThis` in development.
- **Rationale:** Prevents instantiating multiple database pools during hot reloading, avoiding connection limit exhaustion on Supabase.
- **Alternative:** Instantiating a new Prisma client in every route (creates massive connection leaks).

### 2. Rate Limiting Client via @upstash/redis
- **Decision:** Install `@upstash/redis` and write a helper in `src/lib/redis.ts` using the REST HTTP/REST client.
- **Rationale:** Connects via stateless HTTP requests, ensuring zero TCP connection footprint in Next.js Serverless environment.
- **Alternative:** Using `ioredis` (TCP-based), which risks exhausting the database connection limits under serverless environments.

### 3. Next.js Middleware Routing
- **Decision:** Implement a single `src/middleware.ts` that intercepts `/api/*` requests. It will orchestrate:
  1. CORS validations
  2. Rate limiting check (using `@upstash/redis`)
  3. Supabase authentication cookie validation and token refresh (`@supabase/ssr`)
  4. Company association checks (`x-company-id` header validation)
- **Rationale:** Consolidates cross-cutting concerns at the network edge before routes run, avoiding boilerplate code duplication in handlers.
- **Alternative:** Delegating validations to individual route handlers (leads to security bugs and redundant code).

### 3.5 Clean Architecture & Layering
- **Decision:** Separate concerns into distinct layers, employing a Rich Domain Model: 
  - **Route Handlers (`src/app/api/...`)**: Extract HTTP payloads and respond with HTTP statuses.
  - **Services (`src/services/...`)**: Application orchestration and transaction scopes.
  - **Domain Models (`src/models/...`)**: Rich entity classes encapsulating business rules, calculations, and state mutations as methods within the object.
  - **Repositories (`src/repositories/...`)**: Encapsulate Prisma DB queries and map Prisma results to Domain Models.
- **Rationale:** Decouples business logic from Next.js and Prisma, making the code testable and maintainable according to Clean Architecture principles. Rich Domain Models avoid the anti-pattern of anemic data structures.
- **Alternative:** Writing all logic in `route.ts` or using anemic domain models where services do all the work.

### 4. Transactions for Nested Voucher Creation
- **Decision:** Use Prisma's interactive transaction API (`prisma.$transaction`) in the vouchers endpoint.
- **Rationale:** Saves inline client/supplier creation, calculates net totals, and checks duplicate keys inside a single database unit of work. If any check fails, the database rolls back to prevent orphan records.
- **Alternative:** Individual sequential queries (leads to inconsistent states if errors occur mid-execution).

### 5. Voucher Payload and Inline Contact CUIT Uniqueness
- **Decision:** The voucher POST/PUT payload accepts a `clientId`/`supplierId` UUID OR a nested `client`/`supplier` object `{ name, cuit }` for inline creation. In both manual CRUD and inline creation, the system checks system-wide uniqueness of the CUIT across the database for that third-party type.
- **Rationale:** Aligns with standard REST structure (Option A) and guarantees that CUITs are globally unique in the database.

### 6. Voucher Nested Updates
- **Decision:** During voucher updates (`PUT /api/vouchers/[id]`), delete all existing nested `VoucherVatDetail` and `VoucherRetention` records associated with the voucher, then insert the new ones supplied in the request body within the database transaction.
- **Rationale:** Simplifies relational update logic (Option A) and prevents relational state drift or orphan details.

### 7. User Synchronization
- **Decision:** Do not auto-provision users during API requests (Option B). Ensure the backend validates that the authenticated Supabase user exists in the local PostgreSQL `users` table, returning an error otherwise.

### 8. Company Inference in Route Handlers
- **Decision:** Route handlers will calculate and infer the active company independently if the `x-company-id` header is missing (Option B), rather than relying on middleware mutating headers.

### 9. Read-Only Catalogs
- **Decision:** Implement catalog routes (`/api/catalogs`) as read-only queries returning initial seeded items. Administrative catalog editing is deferred to future scopes.

### 10. Document Parser DB Contact Lookup
- **Decision:** The document parser `/api/vouchers/parse` endpoint will run a query lookup on the active company's contacts matching the extracted CUIT, returning the contact's UUID if a match is found.

## Risks / Trade-offs

- **[Risk] Floating-point math errors in JS total calculations**
  - *Mitigation:* Ensure Zod schemas parse numbers properly and run math logic using rounded precision (e.g. to 2 decimal places), keeping money values aligned with Prisma's Decimal type.
- **[Risk] User session token expiration during API requests**
  - *Mitigation:* Middleware must actively write updated session cookies back to the response headers using `@supabase/ssr` methods when token refresh occurs, ensuring the client's browser cookies stay in sync.
- **[Risk] Missing CUIT or point-of-sale fields from Gemini parsing results**
  - *Mitigation:* The parsing endpoint will not fail if fields are missing; instead, it returns an object with null values for those fields, letting the user complete them manually on the form.
