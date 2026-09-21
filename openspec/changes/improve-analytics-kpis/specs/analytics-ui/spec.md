## Purpose

Defines the user-facing KPI cards, annual analytics visualizations, loading states, responsive behavior, accessibility summaries, and cache refresh behavior for Dashboard, Analytics, Sales, and Purchases.

## ADDED Requirements

### Requirement: Dashboard KPI cards

The Dashboard SHALL display cards for Cobros del mes, Pagos del mes, and Balance y margen. Each card SHALL show the applicable current calendar month, currency-specific values, and month-over-month percentage and absolute variations.

#### Scenario: Dashboard displays current-month KPIs

- **WHEN** Dashboard data is available
- **THEN** the user sees Cobros del mes, Pagos del mes, and Balance y margen
- **AND** the displayed period identifies the current calendar month

#### Scenario: Dashboard displays balance and margin

- **WHEN** Dashboard data is available
- **THEN** Balance y margen displays balance as the primary amount
- **AND** margin is displayed as secondary percentage information

#### Scenario: Favorable KPI increases

- **WHEN** a KPI increases and the increase is favorable
- **THEN** the UI displays a green upward arrow and the percentage and absolute variation

#### Scenario: Unfavorable KPI decreases

- **WHEN** a KPI decreases and the decrease is unfavorable
- **THEN** the UI displays a red downward arrow and the percentage and absolute variation

#### Scenario: Payment variation is evaluated

- **WHEN** payments increase compared with the previous month
- **THEN** the variation is displayed as unfavorable with a red upward arrow
- **AND** when payments decrease, the variation is displayed as favorable with a green downward arrow

### Requirement: Sales and Purchases KPI cards

The Sales and Purchases screens SHALL calculate KPI cards from the active table filters. Sales SHALL display all voucher count, mayor cliente by net cobro, facturado, and cobrado. Purchases SHALL display all voucher count, mayor proveedor by paid amount, total comprado, total pagado, and the non-fiscal purchase amount.

Sales and Purchases SHALL expose a currency filter with ARS as the initial value. The active currency filter SHALL scope the table result and all KPI cards, and the contract SHALL remain currency-keyed dynamically.

#### Scenario: Sales KPIs follow filters

- **WHEN** a user changes a Sales table filter
- **THEN** all Sales KPI values reflect the complete filtered result
- **AND** the result is not limited to the visible table page

#### Scenario: Purchases KPIs follow filters

- **WHEN** a user changes a Purchases table filter
- **THEN** all Purchases KPI values reflect the complete filtered result
- **AND** the result is not limited to the visible table page

#### Scenario: Voucher count includes credit notes

- **WHEN** the filtered result contains invoices and credit notes
- **THEN** every voucher is included in the voucher count
- **AND** credit-note amounts reduce the applicable totals

### Requirement: Analytics annual visualization

The Analytics screen SHALL display annual-to-date summary cards and annual January-to-December visualizations using the selected currency view. The screen SHALL not offer the obsolete six-month period or a historical-year selector in this change.

The currency selector SHALL default to ARS and SHALL display only the selected currency. Currency selection SHALL be driven by dynamic currency keys so adding a currency does not require duplicating metric fields or presentation logic.

#### Scenario: Analytics summary and annual data coexist

- **WHEN** Analytics data is available
- **THEN** summary cards show the current calendar year accumulated through today
- **AND** the trend shows the complete current calendar year

#### Scenario: User changes currency

- **WHEN** the user selects ARS or USD
- **THEN** cards, trend, distribution, and client sales values use the selected currency
- **AND** values from the other currency are not combined

#### Scenario: Annual trend is rendered

- **WHEN** the Analytics trend has data
- **THEN** the UI renders twelve grouped monthly bars for cobros and pagos
- **AND** it displays a legend for both series
- **AND** future months remain visible with zero values

#### Scenario: Trend tooltip is opened

- **WHEN** the user hovers or focuses a monthly trend entry
- **THEN** the tooltip shows month, cobros, pagos, balance, and month-over-month variation

### Requirement: Purchase distribution and client sales

The Analytics screen SHALL display a donut chart and legend for the two annual-to-date purchase categories, fiscal and non-fiscal, with their amount and percentage. It SHALL display a separate annual-to-date table of effectively collected sales grouped by client for the selected currency. The table SHALL show client and collected total, exclude CUIT, order totals descending, and paginate the results using the existing reusable pagination controls.

#### Scenario: Distribution has categories

- **WHEN** purchase distribution data exists
- **THEN** the UI displays all categories ordered by amount descending
- **AND** each category displays amount and percentage

#### Scenario: Distribution has no categories

- **WHEN** no purchase distribution data exists
- **THEN** the UI displays “No existen comprobantes”

#### Scenario: Client sales table is rendered

- **WHEN** annual analytics data is available
- **THEN** the table displays clients ordered by effectively collected total
- **AND** the table displays at most ten clients per page
- **AND** pagination controls allow access to the remaining clients

### Requirement: Analytics loading and data states

The system SHALL audit and update existing loading states and skeletons so that each loading placeholder matches the final structure of its page and avoids layout shifts. The change SHALL not introduce render snapshot tests.

#### Scenario: Dashboard data is loading

- **WHEN** Dashboard data is unresolved
- **THEN** the page displays a skeleton for three KPI cards
- **AND** the balance and margin subinformation has a corresponding placeholder

#### Scenario: Analytics data is loading

- **WHEN** Analytics data is unresolved
- **THEN** the page displays skeletons for annual-to-date cards, twelve trend months, purchase distribution space, client table rows, and active controls

#### Scenario: Sales or Purchases summary is loading

- **WHEN** a filtered Sales or Purchases summary is unresolved
- **THEN** the KPI area displays dedicated placeholders for every visible metric
- **AND** the table loading state remains consistent with the page layout

#### Scenario: Loading state completes

- **WHEN** the corresponding data resolves
- **THEN** placeholders are replaced by the final values without changing the surrounding page geometry unexpectedly

### Requirement: Empty, error, responsive, and accessible states

The system SHALL distinguish empty data from loading and error states, remain responsive without horizontal scrolling for charts, use horizontal scrolling only where necessary for dense tables, and expose concise data summaries to assistive technologies without redundant chart labels.

#### Scenario: Currency has no activity

- **WHEN** the selected currency has no activity
- **THEN** its amount values display `$ 0,00`

#### Scenario: Analytics request fails

- **WHEN** analytics data cannot be loaded
- **THEN** the UI displays an error state distinct from “No existen comprobantes”

#### Scenario: Mobile layout is used

- **WHEN** the screen width is small
- **THEN** cards and charts adapt to the available width
- **AND** the chart keeps all twelve months without requiring horizontal scrolling
- **AND** the client table remains usable without requiring a separate comparison table

#### Scenario: Data summary is accessed assistively

- **WHEN** a user accesses a chart with assistive technology
- **THEN** the user can read a concise monthly data summary such as “Enero: cobros $100.000, pagos $70.000”
- **AND** the summary does not redundantly announce that the element is a chart

#### Scenario: Variation is interpreted without color

- **WHEN** a variation is displayed
- **THEN** its arrow direction and text communicate the change independently of color

### Requirement: Company-scoped revalidation

The system SHALL revalidate visible Dashboard, Analytics, Sales, and Purchases metrics after a successful voucher mutation affecting their data, while preserving company-scoped cache isolation and the existing controlled revalidation defaults.

#### Scenario: Visible metrics are affected by a mutation

- **WHEN** a voucher is created, updated, or deleted successfully
- **THEN** affected visible metrics are revalidated without a full-page reload

#### Scenario: Unrelated metrics are not affected

- **WHEN** a mutation does not affect a mounted dataset
- **THEN** unrelated data is not revalidated

#### Scenario: Company changes

- **WHEN** the active company changes
- **THEN** analytics values and cache scope change to the new company
- **AND** currency and period UI preferences reset to their defaults
