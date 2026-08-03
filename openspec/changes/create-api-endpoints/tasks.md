## 1. Setup & Environment

- [x] 1.1 Install `@upstash/redis` dependency
- [x] 1.2 Add Upstash Redis credentials to environment variables (`.env`)
- [x] 1.3 Add Gemini AI credentials to environment variables (`.env`)

## 2. Infrastructure & Singletons

- [x] 2.1 Create the database Prisma client singleton under `src/lib/prisma.ts` utilizing `@prisma/adapter-pg`
- [x] 2.2 Create the Upstash Redis client singleton wrapper under `src/lib/redis.ts`

## 3. Middleware & Access Control

- [x] 3.1 Implement same-origin CORS checks inside `src/middleware.ts`
- [x] 3.2 Implement Redis rate limiting logic (100 req/min) in `src/middleware.ts`
- [x] 3.3 Implement Supabase authentication cookie session validation and auto-refresh in `src/middleware.ts`
- [x] 3.4 Implement multi-tenant company isolation validation (via `x-company-id` header check) in `src/middleware.ts`

## 4. API Catalogs & Contacts (Layered Implementation)

- [x] 4.1 Implement Repositories and Services for Catalogs, Clients, and Suppliers (`src/repositories` and `src/services`)
- [x] 4.2 Implement route handlers invoking services for `GET /api/catalogs`
- [x] 4.3 Implement route handlers invoking services for Clients CRUD (`/api/clients`)
- [x] 4.4 Implement route handlers invoking services for Suppliers CRUD (`/api/suppliers`)

## 5. API Vouchers (Layered Implementation)

- [x] 5.1 Extend Zod validation schema in `src/lib/schemas/voucher.ts` to support nested arrays (`vatDetails`, `retentions`)
- [x] 5.2 Implement Rich Domain Model for Vouchers (`src/models/Voucher.ts`) encapsulating methods for `calculateNetAmount()`, `deriveStatus()`, and duplicate validation rules.
- [x] 5.3 Implement `VoucherRepository` to encapsulate database operations (queries, updates, deletions) mapping Prisma objects to `Voucher` models.
- [x] 5.4 Implement `VoucherService` to orchestrate creation, updating, and deleting of vouchers (managing Prisma transactions by interacting with the Repository and Domain Model)
- [x] 5.5 Implement route handlers (`/api/vouchers`) that delegate all business logic to `VoucherService`

## 6. AI Document Parsing

- [x] 6.1 Implement in-memory Gemini AI invoice extractor wrapper under `src/lib/gemini.ts`
- [x] 6.2 Implement parsing upload endpoint `POST /api/vouchers/parse` enforcing 2MB file size limits and supporting fallback for missing fields

## 7. Verification & Testing

- [x] 7.1 Implement Jest tests verifying success cases, company data isolation, and validation constraints for the API routes
- [x] 7.2 Run lint, test, and build scripts to verify project compiles successfully
