## Why

Dashboard, Analytics, Sales, and Purchases currently display partially implemented metrics based on inconsistent rolling periods and formulas. The change establishes a single, cash-oriented calculation model using calendar periods so that cards, charts, variations, and distributions show coherent values.

## What Changes

- Replace rolling 30-day, 180-day, and trailing-year analytics with the current calendar month and January-to-December calendar year.
- Calculate cash metrics from `paidAmount` and `paymentDate`, using `accountingPeriod` when no payment date exists and excluding future activity.
- Apply credit notes as negative values and keep filtered Sales and Purchases views focused on their core document and cash KPIs.
- Add separate non-fiscal purchase amount reporting and aggregate retentions and perceptions by type without province breakdown.
- Centralize analytics formulas in reusable pure calculation modules and keep services as orchestration boundaries.
- Introduce a transversal Metric application responsibility for shared metric queries, calculations, and serializable contracts used by Dashboard, Analytics, Sales, and Purchases.
- Keep Dashboard activity separate from Metric data and remove Dashboard-specific projections from VoucherRepository.
- Reuse and audit existing voucher, money, analytics, summary, hook, formatter, constant, and cache implementations before introducing new artifacts.
- Update Dashboard, Analytics, Sales, and Purchases KPI cards, annual trend charts, purchase distribution, annual-to-date currency handling, and variation indicators.
- Render Dashboard weekly sales and recent purchases as responsive equal-width cards with direct links to `/sales` and `/purchases`.
- Show Analytics summary cards and distributions accumulated from the beginning of the current calendar year through today, while keeping Dashboard cards scoped to the current month.
- Replace the redundant monthly comparison table with a purchase distribution donut and a paginated table of effectively collected sales grouped by client.
- Revalidate affected visible data after voucher mutations while preserving company-scoped caching.
- Audit and update existing loading states and skeletons to match the new cards, twelve-month chart, all-category distribution, tables, and responsive layouts.
- Preserve the current single `paidAmount` and `paymentDate` model; installment and multi-payment support are out of scope.

## Capabilities

### New Capabilities

- `analytics-metrics`: Defines calendar periods, cash-based formulas, credit-note handling, pending amounts, non-fiscal purchases, currency separation, trends, variations, distributions, and reusable calculation contracts.
- `analytics-ui`: Defines the updated KPI cards, charts, tables, controls, variation indicators, empty/error states, responsive behavior, accessibility summaries, cache revalidation, and loading skeleton audit across Dashboard, Analytics, Sales, and Purchases.

### Modified Capabilities

- `dashboard-metrics`: Updates Dashboard KPI content, calendar and cash semantics, balance and margin presentation, month-over-month variations, and the loading-state contract.

## Impact

- Affected backend areas include the Metric and Analytics services, Dashboard activity service/repository, voucher repository queries, shared metric calculation modules, API response contracts, and mutation invalidation paths.
- Affected frontend areas include analytics hooks and view models, Dashboard KPI cards, Analytics cards and visualizations, Sales and Purchases KPI cards, and their loading skeletons.
- Dashboard activity cards and their loading skeleton are also affected by the responsive layout and navigation actions.
- Existing `Money`, voucher domain behavior, company-scoped SWR keys, formatters, constants, and tests will be audited and reused where their contracts remain valid.
- No database migration, installment model, multi-payment ledger, manual analytics refresh, historical-year selector, client CUIT field, or charting dependency is introduced.
