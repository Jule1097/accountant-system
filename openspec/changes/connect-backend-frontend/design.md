## Context

See `proposal.md` for motivation. Currently, the Next.js frontend uses mock data, and routing is completely public. We have REST endpoints at `/api/...` which are secured using a Next.js middleware in `src/proxy.ts` checking Supabase sessions and verifying company access via the custom header `x-company-id`. The local database contains seeded catalogs and companies.

## Goals / Non-Goals

**Goals:**
- Centralize frontend-backend communication using custom React hooks.
- Secure all App Router pages by enforcing unauthenticated user redirects to `/login`.
- Manage user company profiles dynamically (persisting choice in `localStorage`, handling multi-tenant isolation, presenting a blocking selection dialog on first load).
- Stream async data fetching using React Suspense (`use` API) in client components.
- Aggregate analytics data on the server via a custom `/api/analytics` route.

**Non-Goals:**
- Self-registration / sign-up screens (users are seeded directly in DB).
- Direct client-to-database fetching bypassing the REST API.
- Offline support/caching via local databases (e.g. IndexedDB).
- Saving, modifying, or deleting vouchers/clients/suppliers via POST, PUT, or DELETE API endpoints (except for the Gemini parsing POST endpoint).

## Decisions

### 1. Unified Fetch API Client
- **Decision**: Create a helper `src/lib/api-client.ts` implementing an `apiRequest` wrapper. It will automatically read `active_company_id` from `localStorage` and inject it in the `x-company-id` header.
- **Alternatives Considered**: 
  - *Direct Axios setup*: Unnecessary bundle size overhead. Custom fetch wrapper is lightweight.
  - *Prop-drilling companyId*: High code maintenance, prone to forgetting headers on sub-requests.

### 2. Client-Side Authentication (`useAuth` Hook)
- **Decision**: Initialize a Supabase browser client in `src/lib/supabase-client.ts` using `@supabase/ssr` (`createBrowserClient`). The `useAuth` hook will delegate sign-in/out calls to this client. Since Supabase manages cookies, the middleware in `src/proxy.ts` will automatically capture session tokens.
- **Alternatives Considered**: 
  - *Custom login API endpoint*: Overhead of proxying tokens. Supabase browser client handles session tokens and cookie updates natively.

### 3. Route Protection Redirect
- **Decision**: Extend `src/proxy.ts` (Next.js middleware) to block access to all routes (pages and APIs) except `/login` and static assets. If the user is unauthenticated: redirect page routes (e.g. `/dashboard`) to `/login`, and return `401 Unauthorized` JSON responses for API routes (under `/api/...`).
- **Alternatives Considered**: 
  - *Layout-level check*: Causes flickering (renders half of the page before redirecting). Middleware redirects are faster and safer.

### 4. Company Session Selector
- **Decision**: Build a `CompanyProvider` (`src/contexts/company-context.tsx`) that fetches company links from the new `/api/companies` REST endpoint. If the user has multiple companies and none is selected, trigger a blocking modal dialog asking to pick one. Save selection to `localStorage`.
- **Alternatives Considered**:
  - *Default to first company*: Leads to errors if the user expects another company's data. Explicit choice guarantees correctness.

### 5. Analytics Server-Side Aggregation
- **Decision**: Create `/api/analytics/route.ts` that groups vouchers using Prisma by physical `date`. It will calculate and return three rolling periods (monthly, semiannual, and annual).
- **Separation of Currency & credit notes**: The endpoint returns financial totals (Net Sales, Net Purchases, Credit Notes, VAT balances) structured by currency (`ARS` and `USD`) to avoid conversion inaccuracy.
- **Aggregations computed**:
  - `netSales`: Sales subtotal minus the sum of retentions.
  - `netPurchases`: Purchases subtotal minus the sum of perceptions/retentions.
  - `salesCreditNotes` / `purchasesCreditNotes`: Acumulado de notas de crédito por separado.
  - `vatDebit` / `vatCredit` / `vatNetBalance`: IVA balances by currency.
  - `retentions` / `perceptions`: Summarized by concept and province.
  - `topClients` / `topSuppliers`: Top 5 client and supplier concentration arrays.
- **Alternatives Considered**:
  - *Client-side calculation*: Slow and bandwidth-heavy for companies with high voucher count.

### 6. User Company List Endpoint (`/api/companies`)
- **Decision**: Implement a GET `/api/companies` endpoint to allow the frontend to fetch the user's associated companies on startup. Update the Next.js middleware in `src/proxy.ts` to exempt `/api/companies` from the `x-company-id` header validation, since this endpoint is used precisely to discover/select a company.
- **Alternatives Considered**:
  - *Client-side direct query to Supabase DB*: Bypasses the REST API gateway, which violates our clean architecture layering and security model.

## Risks / Trade-offs

- **[Risk]**: App Router static pre-rendering fails when accessing headers or cookie data.
- **[Mitigation]**: Wrap components that fetch company-dependent data in `<Suspense>` boundaries as guided by the Next.js docs.

- **[Risk]**: Session cookies become out-of-sync with browser storage.
- **[Mitigation]**: The Next.js middleware (`src/proxy.ts`) refreshes tokens automatically and writes them to the response cookies.
