## Context

See proposal.md for motivation and scope. The current analytics implementation loads vouchers from a rolling date boundary, calculates business rules inside `AnalyticsService`, and performs additional formula work in `useAnalyticsChart`. Dashboard, Analytics, Sales, and Purchases therefore do not share one reliable metric contract. Existing SWR company scoping, voucher domain models, `Money`, formatters, skeletons, and mutation hooks are available for reuse.

## Goals / Non-Goals

**Goals:**

- Establish one reusable calculation boundary for document totals, cash activity, pending balances, trends, annual variations, purchase distributions, and sales-by-client aggregation.
- Keep services focused on orchestration and repository access.
- Preserve precise monetary operations and separate ARS/USD results.
- Support the current single paid amount and payment date model.
- Keep UI components presentational and keep SWR behavior in hooks.
- Align loading placeholders with the final page structures without adding render snapshot tests.
- Present Analytics summary cards and distributions for the current calendar year accumulated through today, with the selected currency applied consistently.
- Replace the redundant monthly comparison table with a purchase distribution donut and a paginated sales-by-client table.
- Present Dashboard weekly sales and recent purchases as equal-width responsive cards with direct navigation actions.

**Non-Goals:**

- Adding installments, payment movements, or a payment ledger.
- Adding historical-year selection or a manual analytics refresh action.
- Converting ARS and USD into a consolidated currency.
- Adding separate IVA cards or province-level tax breakdowns.
- Replacing SWR or introducing a charting dependency.

## Decisions

### Transversal Metric responsibility

Shared metric behavior belongs to the `Metric` application responsibility rather than to Dashboard, Analytics, or Voucher. The responsibility includes the `Metric` service, `MetricRepository`, metric calculation helpers, shared metric contracts, and the `/api/metrics` route consumed by the Dashboard.

`AnalyticsService` remains responsible for the Analytics-specific annual response and uses the shared Metric calculation and repository boundaries. `DashboardService` remains responsible only for Dashboard activity data. Dashboard KPI data is requested through the Metric hook and endpoint, so the Dashboard does not own a parallel metric implementation.

### Pure metric calculation boundary

Business formulas will be implemented as pure, reusable functions in the metric responsibility. They will consume rehydrated voucher/domain data and explicit period inputs, and return serializable metric structures. This keeps formulas independent from HTTP, Prisma, React, and presentation formatting.

The existing voucher methods and `Money` value object will be reused where their semantics match the new contract. Existing analytics methods will be moved, split, or adapted only after consumer and formula audits. No duplicate calculator will be created for Dashboard, Sales, Purchases, or Analytics.

`Metric` and `AnalyticsService` will orchestrate repository reads, call pure calculations, and return their respective API contracts. They will not own duplicated business formulas or UI view-model decisions. A stateful `Analytics` or `Metric` entity is not required because these are derived projections without independent identity.

Alternative considered: keeping all formulas in Dashboard or Analytics services was rejected because it prevents reuse and creates responsibility overlap. A stateful analytics or metric entity was rejected because it would mix derived data, mutable state, and presentation concerns.

### Repository boundaries

`MetricRepository` owns company-scoped voucher reads required by metric periods, including accounting-period and effective payment-date coverage. `DashboardRepository` owns Dashboard activity reads and returns data needed by the Dashboard activity service. `VoucherRepository` remains focused on voucher persistence, voucher-list queries, and voucher-specific operations; it does not construct Dashboard DTOs or expose consumer-specific Analytics queries.

The `/api/metrics` route uses the same `executeRequestWithContext` boundary as the rest of the API. The active company is resolved from the authenticated request context, is passed to `Metric`, and is enforced by `MetricRepository`. The route does not accept a company identifier from query parameters or request bodies.

### Query data for document and cash periods

Repository access will provide the data needed by both document-period and cash-period calculations. Document totals and pending balances use `accountingPeriod`. Cash totals and trends use `paymentDate`, falling back to `accountingPeriod` when no payment date exists. Future payment activity is excluded.

The repository query must therefore cover vouchers relevant to the accounting-period scope and vouchers whose effective payment date falls inside the requested calendar year. Company isolation remains enforced by the existing request context and repository predicates.

Alternative considered: filtering only by the current `voucher.date` was rejected because it misses the agreed accounting-period and payment-date semantics.

### Shared response contracts

The backend will expose explicit, currency-separated values for current-month summaries, annual-to-date summaries and distributions, annual monthly trends, annual variations, Analytics pending metrics, non-fiscal purchases, purchase distribution, and sales grouped by client. Filtered Sales and Purchases summaries will expose only the KPIs currently displayed by those screens. The contract will distinguish document values from cash values so a card showing facturado/comprado cannot be confused with one showing cobrado/pagado.

Credit notes will use signed values in all applicable aggregates. Retentions and perceptions will be aggregated by type without province. Purchase distribution will use total purchase components, while cash KPIs will use paid amounts.

Alternative considered: deriving all values on the client from a generic voucher payload was rejected because it duplicates business formulas and transfers accounting data that the screen does not need.

Currency amounts will use dynamic keyed maps with ARS as the initial UI selection. Analytics and filtered voucher screens will render the selected currency only. Sales and Purchases currency filters will default to ARS and will be sent with the existing table filters so their cards and table share one result scope.

Purchase distribution will expose fiscal and non-fiscal categories separately. Fiscal purchases will aggregate subtotal, non-taxable, exempt, VAT, perceptions, and other taxes from fiscal vouchers. Non-fiscal purchases will aggregate the same components from non-fiscal vouchers, including credit-note signs.

### Frontend data and view-model boundaries

`useAnalytics` will remain responsible for the company-scoped SWR request, loading/error state, and mutation access. Formula work will not remain in `useAnalyticsChart`; the hook will be reduced to selecting or adapting already calculated data for visual components, or replaced by a focused presentation view model when the audit confirms the existing hook cannot be adapted.

Sales and Purchases will continue to use their filtered summary flow, extended with the shared metric contract instead of calling the full Analytics dataset. Dashboard will request `/api/metrics` for its visible KPI data and `/api/dashboard/recent-activity` for recent activity. Components will receive prepared props and will not query repositories or calculate accounting formulas.

### Dashboard activity cards and navigation

`RecentActivity` will keep the existing weekly sales chart and recent purchases list data boundaries while presenting each activity area inside the shared Card primitives. The parent activity section will use a single-column layout on small screens and two equal columns from the medium breakpoint so the weekly sales card remains first and the purchases card occupies the second half of the section.

Each card header will expose an upper-right `Link` action using the existing button variant classes. The weekly sales action will display `Ver ventas` and navigate to `/sales`; the recent purchases action will display `Ver compras` and navigate to `/purchases`. The actions will remain semantic links and will use Next.js client-side navigation. No new button or navigation abstraction will be introduced.

### Loading-state audit

Existing Dashboard, Analytics, Sales, and Purchases loading paths will be audited before UI changes are finalized. Dashboard skeletons will represent three KPI cards and nested balance/margin information, and the activity skeleton will mirror the two-card responsive layout. Analytics skeletons will represent the current controls, three annual-to-date summary cards, twelve trend entries, the purchase donut, and the paginated client table. Sales and Purchases will use dedicated KPI placeholders matching their visible split totals and party metrics, while existing table skeletons remain aligned with their surrounding layout.

The audit will preserve the existing reusable skeleton approach and avoid introducing a new loading library or render snapshot test suite.

### Cache invalidation

Successful voucher mutations will revalidate only affected company-scoped resources. Visible Dashboard, Analytics, Sales, and Purchases data will update without a full-page reload when their datasets are affected. Currency and period preferences are local UI state and reset when the active company changes.

## Risks / Trade-offs

- [Risk] The current model stores one `paidAmount` and one `paymentDate`, so multiple payments over time cannot be represented. -> Preserve this limitation explicitly and do not imply installment-level accuracy.
- [Risk] A union of accounting-period and payment-date query conditions can load more records than a single date filter. -> Keep the query company-scoped, request only the calendar scope required by the visible dataset, and measure the resulting payload before further optimization.
- [Risk] Existing persisted totals and domain methods may encode legacy semantics. -> Reuse them only where audited, keep rehydration compatibility, and cover credit notes, retentions, perceptions, currencies, and missing payment dates with unit tests.
- [Risk] Purchase distribution intentionally uses document totals while cash cards use paid totals. -> Keep the response fields and UI labels explicit so users can distinguish total purchased from total paid.
- [Risk] Twelve-month charts and all-category legends can be dense on small screens. -> Use responsive chart sizing, concise labels, tooltips, and table-only horizontal scrolling.

## Migration Plan

1. Audit current consumers, formulas, repository queries, contracts, hooks, mutation invalidation, and loading skeletons.
2. Add failing unit and API tests for the agreed metric behavior before changing production logic; do not add render snapshot tests.
3. Extract and implement pure analytics calculations, then adapt service and repository boundaries.
4. Update API contracts and filtered Sales/Purchases summaries while preserving company isolation and currency separation.
5. Update hooks, cards, charts, annual variations, empty/error states, responsive behavior, client pagination, and skeletons.
6. Revalidate focused tests, type checks, lint, and the affected build paths before handoff.

Rollback is performed by reverting the change branch. No database migration is required.
