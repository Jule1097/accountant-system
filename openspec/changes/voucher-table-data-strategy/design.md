## Context

The current interactive routes use route-local client hooks that fetch full datasets with `apiRequest`, memoize a single promise, and manage refresh behavior ad hoc. Voucher tables currently filter in memory after loading the full list, dashboard metrics use an isolated promise-based hook, and route URLs do not consistently own dataset state beyond `voucherId`. See [proposal.md](proposal.md).

This change must establish a single cross-route data pattern for vouchers, `conciliations`, dashboard, analytics, and future interactive screens, while respecting active company isolation and avoiding artificial cache-busting query params.

## Goals / Non-Goals

**Goals:**
- Standardize interactive route data on URL-backed query state plus in-memory cache.
- Use `SWR` as the shared client-side cache, deduplication, and invalidation layer.
- Move voucher list search, filtering, sorting, pagination, and KPI summaries to backend-driven contracts.
- Bring the `conciliations` route under the same URL-backed state, `SWR` cache, and invalidation conventions.
- Ensure all cache keys and invalidation rules are scoped by `companyId`.
- Refresh visible datasets immediately after mutations and revalidate non-mounted datasets lazily.

**Non-Goals:**
- Replace all client interactivity with Server Components or Server Actions.
- Persist cache across browser sessions.
- Redesign current vouchers or dashboard visuals beyond the behavior required by the new data strategy.
- Introduce bulk parser workflows in this change.

## Decisions

### 1. Use URL query state as the route contract
- **Decision:** Interactive routes will encode only dataset-shaping state in the URL, including pagination, page size, search, filters, explicit sorting, selected entity identifiers such as `voucherId`, and batch-scoped identifiers such as `batchId`.
- **Rationale:** This enables deep-linking, browser navigation, refresh recovery, and deterministic cache keys.
- **Alternatives:** Keeping query state only in component state was rejected because it breaks refresh consistency, shareable URLs, and cross-route predictability.

### 2. Adopt `SWR` as the shared client data layer
- **Decision:** `SWR` will back interactive route reads, including list datasets, summary datasets, detail fetches, and aggregated route metrics.
- **Rationale:** The project needs in-memory caching, request deduplication, stale-while-revalidate behavior, and targeted invalidation across multiple routes. Rebuilding those features with custom hooks would create fragmented behavior and higher maintenance cost.
- **Alternatives:** A bespoke cache layer was rejected because it would duplicate `SWR` primitives poorly. A full move to server-driven route refreshes was rejected because these routes require debounced filters, local interactivity, and selective client invalidation.

### 3. Scope cache keys by company and full query state
- **Decision:** Every cache key will include the active `companyId` and the canonical dataset query state.
- **Rationale:** The current app injects `x-company-id` from client storage, so cache keys that omit `companyId` risk cross-tenant leakage. Including the full query state also guarantees pagination, filters, and sorting do not collide.
- **Alternatives:** Clearing a single global cache on every company change was rejected because it is too coarse and does not guarantee key isolation.

### 4. Separate paginated voucher items from filtered summaries
- **Decision:** Voucher tables will use distinct backend reads for paginated items and KPI summaries derived from the full filtered dataset.
- **Rationale:** KPI cards must react to the full filtered dataset, not the current table page. A separate summary query keeps the paginated payload lean and makes the same summary pattern reusable in analytics and dashboard flows.
- **Alternatives:** Embedding summaries inside every paginated response was rejected because it couples table pagination with summary concerns and adds unnecessary payload to every page request.

### 5. Restrict voucher query controls explicitly
- **Decision:** Voucher table routes will support backend pagination with `page` and `pageSize`, server-side search against name/CUIT/composed voucher identifier, filters for `status`, `dateFrom`, and `dateTo`, and explicit sorting only by composed voucher identifier, status, or date.
- **Rationale:** The user defined the minimal contract required for a stable first version. Restricting sort and filter fields reduces backend ambiguity and keeps query normalization predictable.
- **Alternatives:** Allowing arbitrary sort fields or client-side filtering was rejected because it produces unstable API behavior and defeats the pagination strategy.

### 6. Reset pagination deterministically on dataset-shaping changes
- **Decision:** Search changes, filter clearing, and filter updates reset voucher datasets to page 1. Deleting the last item from a non-first page moves the dataset back to the previous page.
- **Rationale:** This prevents empty or misleading page states and matches the user-defined UX rules.
- **Alternatives:** Preserving the current page unconditionally was rejected because server-filtered datasets can shrink, producing invalid page selections.

### 7. Apply immediate versus lazy invalidation by mount state
- **Decision:** Mutations will immediately refresh mounted routes that depend on the changed data and mark non-mounted routes as stale for revalidation on next access.
- **Rationale:** This balances freshness with network efficiency. Visible screens must reflect mutations right away, while inactive screens should avoid unnecessary background traffic.
- **Alternatives:** Refreshing every affected route immediately was rejected because it causes redundant calls. Pure lazy invalidation was rejected because visible dashboards and vouchers would remain stale after mutation.

### 8. Treat company changes as a route state reset boundary
- **Decision:** Switching the active company resets route dataset state for company-scoped datasets, including vouchers query state and selection identifiers such as `voucherId`.
- **Rationale:** Dataset URLs and caches from one company must not bleed into another tenant context.
- **Alternatives:** Reusing previous query params across company switches was rejected because it can create invalid selections and misleading deep links.

### 9. Keep `conciliations` lightweight in the first phase
- **Decision:** The first `conciliations` integration will participate in shared URL state, cache, and invalidation using `batchId`, `tab`, and `page`, but it will not introduce route-level search or extra filters yet.
- **Rationale:** The route needs to align with the global strategy immediately, but the current product scope does not require search or filtering controls there.
- **Alternatives:** Leaving `conciliations` on a bespoke local-state pattern was rejected because it would reintroduce inconsistent route behavior right after defining the shared strategy.

## Risks / Trade-offs

- **[Risk] Dual queries per vouchers screen increase request count** -> Mitigation: use `SWR` deduplication, keep paginated items and summaries separate, and scope invalidation so only affected queries revalidate.
- **[Risk] Query-string growth can make URLs harder to read** -> Mitigation: limit URL state to dataset-shaping values only and normalize empty/default values out of the query string when possible.
- **[Risk] Company switch plus cached queries can surface stale flashes** -> Mitigation: scope every cache key by company and reset route state on company changes.
- **[Risk] Debounced search can feel delayed if configured poorly** -> Mitigation: keep debounce short and reset pagination immediately when the effective search term changes.
- **[Risk] Bringing analytics and dashboard into the same invalidation model expands the first implementation phase** -> Mitigation: share the infrastructure first, then adapt route consumers incrementally within the same change tasks instead of duplicating bespoke hooks.
- **[Risk] Adding `conciliations` early can blur the distinction between paginated tables and card-based review lists** -> Mitigation: reuse the same route-state and cache primitives while allowing route-specific presentation and omitting unused search/filter params.
