## Why

Currently, the Accountant System lacks backend API endpoints to interact with the database, enforce business validation rules (like duplicate voucher prevention, net amount calculations, and global CUIT uniqueness per company), and isolate data at the company level. This change establishes the complete REST API backend foundation, securing the application and preparing it for frontend integration.

## What Changes

- **REST API Endpoints**: Implement standard REST routes under `/api/` for Catalogs, Contacts (Clients & Suppliers), Vouchers, and Document Parsing.
- **Supabase Auth & Session Refresh Middleware**: Ensure all `/api/` requests are authenticated, refreshing tokens in cookie headers seamlessly.
- **Company-level Data Isolation Middleware**: Restrict data access to the active company (supplied in `x-company-id` header or inferred).
- **Redis Rate-Limiter Middleware**: Implement sliding-window rate limits (100 req/min) using `@upstash/redis` via HTTP/REST.
- **CORS Protection**: Enforce same-origin by default, allowing custom domain list via environment variables.

## Capabilities

### New Capabilities
- `api-security-middleware`: Handles JWT authentication verification, session auto-refresh, CORS validation, multi-tenant company isolation, and Redis-based rate limiting.
- `accounting-api`: Exposes REST endpoints for CRUD operations on catalogs, clients, suppliers, and vouchers (handling inline contact generation and financial transaction safety).
- `gemini-parser-api`: Exposes an API endpoint to parse uploaded invoice PDFs/images in memory using the Gemini API.

### Modified Capabilities
<!-- None -->

## Impact

- Adds new private API route folders under `src/app/api/`.
- Introduces `middleware.ts` in Next.js to intercept incoming `/api/` requests.
- Integrates Upstash Redis connection client and Gemini API client.
- Modifies `package.json` to install `@upstash/redis`.
