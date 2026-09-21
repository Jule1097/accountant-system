## 1. Audit and contracts

- [x] 1.1 Audit existing analytics, dashboard, voucher summary, domain money, formatter, constants, hooks, mutation invalidation, API, and loading-state consumers and record reusable contracts.
- [x] 1.2 Define the shared serializable metric contracts for document totals, cash totals, pending values, annual trends, variations, tax totals, non-fiscal purchases, and currency-separated values.

## 2. Failing behavior tests

- [x] 2.1 Add failing unit tests for calendar-month and January-to-December period selection, payment-date assignment, accounting-period fallback, and future-payment exclusion.
- [x] 2.2 Add failing unit tests for cash formulas, document totals, credit notes, retentions, pending count and amount, non-fiscal purchases, tax aggregation, distributions, trends, and month-over-month comparisons.
- [x] 2.3 Add failing service and API tests for company isolation, filtered Sales and Purchases summaries, currency separation, missing payment dates, and mutation revalidation contracts.

## 3. Reusable analytics calculations

- [x] 3.1 Extract or adapt pure analytics calculation functions from the current service and chart hook without duplicating existing voucher and Money behavior.
- [x] 3.2 Implement signed credit-note handling, cash/document period assignment, cash KPIs, balance, margin, pending metrics, and currency-separated aggregation.
- [x] 3.3 Implement annual trend, month-over-month variations, purchase distribution, non-fiscal purchase, and tax-by-type calculations with the agreed zero and unavailable-value rules.

## 4. Backend data boundaries

- [x] 4.1 Update repository queries to retrieve company-scoped records required by accounting periods, payment dates, pending balances, and the current calendar year.
- [x] 4.2 Refactor AnalyticsService and related services to orchestrate repository access and pure calculations without owning business formulas.
- [x] 4.3 Update API and filtered summary contracts for Dashboard, Analytics, Sales, and Purchases while preserving existing authentication and company isolation.

## 5. Cache and hook integration

- [x] 5.1 Adapt analytics and voucher summary hooks to the new response contracts while preserving controlled SWR behavior and company-scoped keys.
- [x] 5.2 Implement narrow revalidation for affected Dashboard, Analytics, Sales, and Purchases datasets after successful voucher mutations.
- [x] 5.3 Reset currency and period UI preferences when the active company changes and keep data selectors separate from business calculations.

## 6. KPI cards and visualizations

- [x] 6.1 Update Dashboard cards for Cobros, Pagos, and Balance y margen with current-month labels, values, absolute and percentage variations, and favorable/unfavorable arrows.
- [x] 6.2 Update Sales and Purchases cards for filtered counts, split document and cash totals, top party metrics, and non-fiscal purchase amount.
- [x] 6.3 Update Analytics cards, annual twelve-month cobros/pagos chart, purchase distribution, client sales table, currency view, tooltips, and empty/error states.
- [x] 6.4 Add responsive chart sizing, client-table pagination, and concise assistive data summaries without redundant chart descriptions.

## 7. Loading-state audit

- [x] 7.1 Update Dashboard skeletons for three KPI cards and nested balance/margin information.
- [x] 7.2 Update Analytics skeletons for current controls, three annual-to-date summary cards, twelve trend months, purchase distribution, and client table rows.
- [x] 7.3 Replace generic Sales and Purchases KPI loading blocks with dedicated placeholders matching the final visible card structures while preserving table skeleton behavior.
- [x] 7.4 Verify loading, empty, error, and resolved states avoid unexpected layout shifts without adding render snapshot tests.

## 8. Validation and handoff

- [x] 8.1 Run focused analytics, dashboard, voucher summary, hook, API, and cache revalidation tests and resolve regressions.
- [x] 8.2 Run lint, typecheck, and affected build validation, then review user-facing Spanish labels, constants, logs, and company isolation.
- [x] 8.3 Update the change artifacts and mark completed tasks only after the implementation and required validations pass.

## 9. Metric responsibility refactor

- [x] 9.1 Add failing tests for the generic `/api/metrics` route, authenticated company scoping, unauthenticated rejection, and Metric service orchestration.
- [x] 9.2 Move shared metric contracts and pure calculations from Analytics responsibility to `src/types/metric` and `src/lib/helpers/metric` without changing formulas.
- [x] 9.3 Move effective-period voucher reads from `VoucherRepository` to `MetricRepository` and keep company isolation enforced at the repository boundary.
- [x] 9.4 Move Dashboard recent-activity queries and projection mapping from `VoucherRepository` to `DashboardRepository` and keep `DashboardService` focused on activity orchestration.
- [x] 9.5 Replace `/api/dashboard/metrics` and `useDashboardMetrics` with `/api/metrics` and `useMetrics`, update Dashboard consumers and mutation revalidation, and remove obsolete references.
- [x] 9.6 Run focused and full validation, then mark the refactor tasks complete after reviewing security, responsibilities, and route ownership.

## 10. Filtered summary scope refinement

- [x] 10.1 Update failing summary, API, and UI tests to remove pending count and amount from the Sales and Purchases summary contract.
- [x] 10.2 Remove the pending KPI cards, descriptions, response fields, and filtered-summary calculation while preserving voucher status behavior and Analytics pending metrics.
- [x] 10.3 Update the affected OpenSpec requirements and run focused validation.

## 11. Analytics annual-to-date client distribution

- [x] 11.1 Add failing calculation, service, hook, and component tests for annual-to-date cards, annual variations, dynamic currencies, purchase donut data, and sales grouped by client.
- [x] 11.2 Implement annual-to-date Analytics contracts and signed effectively collected sales-by-client aggregation without client CUIT data.
- [x] 11.3 Remove the monthly comparison component and exclusive business logic while preserving the annual trend calculations.
- [x] 11.4 Render the purchase distribution as a donut and add the paginated client sales table using the existing pagination component.
- [x] 11.5 Update Analytics loading states, validate focused tests, type checks, lint, and the affected build path.

## 12. Dashboard activity cards and navigation

- [x] 12.2 Update Dashboard activity cards to use the responsive equal-column layout and upper-right Next.js Link actions while preserving existing chart and purchase-list behavior.
- [x] 12.3 Update the Dashboard activity skeleton to mirror the responsive two-card structure and run focused Dashboard validation.
