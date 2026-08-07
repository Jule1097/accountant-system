## 1. Authentication & Routing Protection

- [x] 1.1 Initialize client-side Supabase Browser Client in `src/lib/supabase-client.ts`
- [x] 1.2 Implement `useAuth` custom hook in `src/hooks/use-auth.ts` to support login and signout
- [x] 1.3 Update `LoginForm` component in `src/components/auth/login-form.tsx` to consume `useAuth`
- [x] 1.4 Update Next.js middleware in `src/proxy.ts` to protect all private App Router routes (redirecting pages to `/login` and returning 401 for APIs). Exempt `/api/companies` and `/api/auth` from `x-company-id` verification.

## 2. Multi-Company Selection & Context

- [x] 2.1 Implement `CompanyProvider` and `useCompany` hook in `src/contexts/company-context.tsx` to manage active company, fetching data from `/api/companies`
- [x] 2.2 Create a blocking modal selector component to prompt users with multiple companies to pick one
- [x] 2.3 Embed the company selector modal in the dashboard layout to intercept unselected company states on startup
- [x] 2.4 Update Sidebar user session dropdown in `src/components/layout/app-sidebar.tsx` to display the active company and allow company switching
- [x] 2.5 Create GET `/api/companies` route in `src/app/api/companies/route.ts` returning companies the user belongs to

## 3. Client-Side API Fetcher & Hooks

- [x] 3.1 Implement a unified `apiRequest` client fetcher in `src/lib/api-client.ts` that appends `x-company-id` header
- [x] 3.2 Implement `useVouchers` hook in `src/hooks/use-vouchers.ts` mapping JSON to `Voucher` class and resolving promises via Suspense (GET list and detail only)
- [x] 3.3 Implement `useAnalytics` hook in `src/hooks/use-analytics.ts` to load chart and KPI values

## 4. Backend Analytics Aggregation Endpoint

- [x] 4.1 Implement backend route handler `/api/analytics/route.ts` returning monthly, semiannual, and annual rolling period analytics (by physical date, currency separated, credit notes isolated, VAT balances, withholdings, and top clients/suppliers)
- [x] 4.2 Add unit and integration tests to verify the `/api/analytics` endpoint and database aggregations

## 5. Views Sourcing, Suspense Boundaries & Verification

- [x] 5.1 Update `SalesView` and `PurchasesView` to fetch data via `useVouchers` and mount lists inside React `<Suspense>` boundaries
- [x] 5.2 Update `VoucherModal` to fetch catalogs and clients/suppliers dynamically, support AI parsing, disable save button when inputs are empty, and show a toast warning that saving is disabled in this stage when clicked
- [x] 5.3 Connect `AnalyticsView` to `useAnalytics` and feed custom SVG trend/donut charts with aggregated data (supporting currency toggle in UI)
- [x] 5.4 Run verification checks including Jest tests and Next.js build checks to ensure code correctness
- [x] 5.5 Update `VoucherTable` to disable the "Eliminar" option and show a toast saying deletion is disabled in this stage

## 6. Suspense Skeleton Loading States

- [x] 6.1 Create `VoucherSkeleton` component in `src/components/vouchers/voucher-skeleton.tsx` that mirrors the table layout using `Skeleton` from `src/components/ui/skeleton.tsx`
- [x] 6.2 Create `AnalyticsSkeleton` component in `src/components/analytics/analytics-skeleton.tsx` that mirrors the cards and chart layout using `Skeleton`
- [x] 6.3 Update `SalesView` Suspense fallback to render `<VoucherSkeleton />`
- [x] 6.4 Update `PurchasesView` Suspense fallback to render `<VoucherSkeleton />`
- [x] 6.5 Update `AnalyticsView` Suspense fallback to render `<AnalyticsSkeleton />`
- [x] 6.6 Create `KpiCardsSkeleton` and `RecentActivitySkeleton` in `src/components/dashboard/`
- [x] 6.7 Connect `KpiCards` to fetch analytics dynamically from the database and resolve metrics utilizing React `use`
- [x] 6.8 Connect `RecentActivity` to fetch recent vouchers dynamically from the database, group sales by week, list recent purchases, and resolve utilizing React `use`
- [x] 6.9 Update `DashboardPage` in `src/app/(dashboard)/dashboard/page.tsx` to become a Client Component, load promises using hooks, and wrap dashboard components in Suspense with skeletons

## 7. Active Company CUIT Exclusion & Extended AI Parsing

- [x] 7.1 Add `findById(id: string)` method to `CompanyRepository` in `src/repositories/company.repository.ts`
- [x] 7.2 Update `parseInvoiceImage` in `src/lib/gemini.ts` to accept `activeCompanyCuit?: string`, inject it into the extraction prompt to exclude it from `thirdPartyCuit`, and extend `responseSchema` with `vatDetails` array (`{ vatRateName, subtotal, vatAmount }`) and `retentions` array (`{ conceptName, amount, province? }`)
- [x] 7.3 Update `/api/vouchers/parse` route handler to query active company CUIT via `CompanyRepository`, pass it to `parseInvoiceImage`, nullify contact fields when CUIT matches the active company, and resolve `vatRateId` and `retentionConceptId` by matching extracted names against the database catalogs
- [x] 7.4 Update `parse.test.ts` to add assertions for `vatDetails` and `retentions` resolution in the API response
- [x] 7.5 Update `VoucherModal` in `src/components/vouchers/voucher-modal.tsx` to load `retentionConcepts` from the database catalog, add support for purchase retention inputs, render a jurisdiction-aware "Retenciones y Percepciones" form section, and update inputs when parsed from Gemini


## 8. Frontend Logic Modularization

- [x] 8.1 Extract all form initialization, Zod schema, file upload handler, catalog load effect, and field-padding helpers from `VoucherModal` into a new custom hook `src/hooks/use-voucher-form.ts`
- [x] 8.2 Update `VoucherModal` in `src/components/vouchers/voucher-modal.tsx` to consume `useVoucherForm` and render-only UI without inline business logic
- [x] 8.3 Extract SVG coordinate calculations (`getX`, `getY`, `buildPath`), chart path generation, category summation, and comparison computation from `AnalyticsContainer` in `analytics-view.tsx` into a new hook `src/hooks/use-analytics-chart.ts`
- [x] 8.4 Update `AnalyticsContainer` in `src/components/analytics/analytics-view.tsx` to consume `useAnalyticsChart` and delegate all derived data computation to it
- [x] 8.5 Fix Voucher Modal UI. Avoid deeply nested components and long components. Update AGENTS.md with this new rule to apply to newer components. 
- [x] 8.6 Fix on Voucher Modal. The retentions and perceptions fields should only be rendered when the voucher type is "Purchase". 

## 9. Rule Violation Fixes

- [x] 9.1 **Fix `any` types** — define proper interfaces (`AnalyticsData`, `PerceptionEntry`, `TrendEntry`, `ComparisonEntry`) in `src/types/analytics.ts` and replace all `any` usages in `use-analytics.ts`, `use-vouchers.ts`, `analytics-view.tsx`, and `analytics.service.ts`. Update AGENTS.md with this new rule to apply to newer components. 
- [x] 9.2 **Fix `setState` inside `useEffect`** — refactor `use-analytics.ts` and `use-vouchers.ts` to use `useMemo` to derive the promise from `activeCompanyId` during render instead of calling `setState` synchronously inside `useEffect`, eliminating cascading render violations flagged by the linter. Update AGENTS.md with this new rule to apply to newer components.
- [x] 9.3 **Fix** - refactor routes to never implement business logic, this should be done in the service layer and if neccessary, create new Models on `src/models` to implement new methods when needed, using the current Model classes as a base. Update AGENTS.md to include this rule.
- [ ] 9.4 **Fix** - Refactor AnalyticsContainer function on `src/components/analytics/analytics-view.tsx`. This function is too long and should be refactored into smaller components. Update AGENTS.md with this new rule to apply to newer components. 

