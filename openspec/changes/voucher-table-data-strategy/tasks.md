## 1. Shared Data Foundation

- [x] 1.1 Add `SWR` as the shared client-side data dependency and define the common fetcher, cache key, and invalidation conventions scoped by `companyId`
- [x] 1.2 Implement shared query-state helpers to read, normalize, and update dataset-shaping URL params across interactive routes
- [x] 1.3 Add shared debounce utilities and route-state reset rules for search, filter clearing, and company changes

## 2. Voucher APIs

- [x] 2.1 Extend the vouchers list API contract to support server-side pagination with `items`, `page`, `pageSize`, `total`, and `totalPages`
- [x] 2.2 Add server-side voucher query handling for `search`, `status`, `dateFrom`, `dateTo`, `sortBy`, and `sortOrder`, restricting sorting to composed voucher identifier, status, and date
- [x] 2.3 Add a dedicated vouchers summary endpoint that returns KPI aggregates for the full filtered dataset independent of the current page

## 3. Voucher Screens

- [x] 3.1 Refactor sales and purchases route data flows to use the shared `SWR` strategy, URL-backed table state, and company-scoped cache keys
- [x] 3.2 Update voucher table controls and pagination behavior for page sizes 10, 20, and 50, first-page resets on effective search/filter changes, and previous-page fallback after deleting the last row on a page
- [x] 3.3 Connect sales and purchases KPI cards to the filtered summary endpoint so they react to the full filtered dataset instead of the visible page subset
- [x] 3.4 Refactor the `conciliations` route to use the shared `SWR` strategy and URL-backed `batchId`, `tab`, and `page` state without route-local caching hacks

## 4. Dashboard And Analytics

- [x] 4.1 Refactor dashboard metrics to use the shared `SWR` strategy and company-scoped invalidation behavior
- [x] 4.2 Refactor analytics route datasets to use the shared query/cache/invalidation strategy without introducing pagination state
- [x] 4.3 Ensure mounted dashboard and analytics views refresh immediately after relevant mutations while non-mounted views revalidate lazily on next access

## 5. Validation

- [x] 5.1 Add or update Jest coverage for voucher query normalization, server-side list filtering/sorting/pagination, and summary endpoint behavior
- [x] 5.2 Add or update Jest coverage for route query-state handling, company-scoped cache invalidation, voucher table pagination edge cases, and `conciliations` batch URL restoration
- [x] 5.3 Run the relevant Jest suites for vouchers, dashboard metrics, analytics data flows, and shared route-data utilities before handoff
