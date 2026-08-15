## Why

The current route data flow relies on per-screen client hooks that fetch full datasets, keep query state outside the URL, and force ad hoc refreshes after mutations. That pattern does not scale to paginated voucher tables, reactive KPI summaries, or interactive routes such as `conciliations` that need stable deep-linking, cache reuse, and selective invalidation.

## What Changes

- Introduce a global query-driven data access strategy for interactive routes, centered on URL query state, in-memory cache, debounce-aware search, and selective invalidation scoped by company.
- Standardize paginated list contracts for routes that render server-filtered tables, including `items`, `page`, `pageSize`, `total`, and `totalPages`, with explicit sorting query params.
- Move voucher list filtering, searching, sorting, and pagination to the backend, keeping `voucherId` alongside list query params as the route source of truth.
- Add route-level summary fetching rules so vouchers KPI cards react to the full filtered dataset instead of the current page subset.
- Extend the same query/cache/invalidation strategy to the `conciliations` route, using `batchId`, `tab`, and `page` as URL-backed dataset state without adding route-local ad hoc caching.
- Define cross-route invalidation behavior so visible views refresh immediately after relevant mutations while non-mounted views revalidate lazily on next access.
- Remove cache-busting query hacks such as artificial refresh counters from route requests in favor of deterministic cache keys and invalidation rules.

## Capabilities

### New Capabilities
- `query-driven-data-access`: Defines the global route strategy for URL-backed query state, company-scoped in-memory cache, debounce-aware searching, and selective invalidation across interactive screens.
- `analytics-metrics`: Defines the observable behavior for analytics route datasets under the shared query/cache/invalidation strategy.

### Modified Capabilities
- `voucher-tables`: Changes voucher list behavior to require server-side pagination, server-side filtering/search/sorting, URL-backed table state, and filter-reactive KPI summaries.
- `dashboard-metrics`: Changes dashboard metric behavior to use the shared query/cache/invalidation strategy so future route state and upstream mutations can refresh visible metrics consistently.

## Impact

- Affects route state management for sales, purchases, `conciliations`, analytics, dashboard, and future interactive routes.
- Affects vouchers list and summary API contracts, including paginated responses, summary endpoints, and whitelist-based sorting/filtering.
- Introduces a shared client data access layer, cache key conventions, company-scoped invalidation rules, and debounce behavior for search-driven routes.
- Establishes the architectural foundation required before implementing batch parser review flows, notification-driven inbox routes, and other high-volume interactive screens.
