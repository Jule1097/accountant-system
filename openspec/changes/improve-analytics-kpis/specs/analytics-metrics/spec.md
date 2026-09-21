## Purpose

Defines consistent calendar, cash-flow, accounting, currency, and aggregation rules for financial KPIs, trends, variations, pending balances, and purchase distributions across the application.

## ADDED Requirements

### Requirement: Calendar and cash activity periods

The system SHALL use the current calendar year from January through December for annual trends and SHALL use the period from January 1 through today for annual-to-date Analytics cards, distributions, and client sales. Dashboard and other monthly KPI values SHALL use the current calendar month. Document-based metrics SHALL be assigned by `accountingPeriod`. Cash-based metrics SHALL be assigned by `paymentDate` and SHALL fall back to `accountingPeriod` when `paymentDate` is absent.

Filtered Sales and Purchases table results SHALL preserve the existing `voucher.date` date-range semantics. Future effective cash dates SHALL be excluded, including future `accountingPeriod` fallback dates.

#### Scenario: Current calendar year is requested

- **WHEN** analytics data is requested for the current year
- **THEN** the response contains one entry for each month from January through December
- **AND** months after the current month contain zero values

#### Scenario: Cash activity has a payment date

- **WHEN** a voucher has a `paymentDate` within the current calendar year
- **THEN** its paid amount is assigned to the calendar month of that payment date

#### Scenario: Cash activity has no payment date

- **WHEN** a voucher has no `paymentDate`
- **THEN** its cash-based fallback value is assigned to the month represented by its `accountingPeriod`

#### Scenario: Future cash activity is present

- **WHEN** a voucher has a future `paymentDate`
- **THEN** that payment is excluded from current cash metrics and current-year cash trends

### Requirement: Cash-based financial metrics

The system SHALL calculate cash-based KPIs from the effective paid amount while preserving ARS and USD as separate currencies. Cobros SHALL use the signed paid amount of sales, pagos SHALL use the signed paid amount of purchases, balance SHALL equal cobros minus pagos, and margen SHALL equal `(cobros - pagos) / cobros * 100` when cobros is greater than zero.

Currency contracts SHALL use dynamic currency keys rather than fixed currency properties, while the initial available currencies remain ARS and USD.

#### Scenario: Sales and purchases have paid amounts

- **WHEN** a period contains paid sales and paid purchases
- **THEN** cobros equal signed sales paid amounts
- **AND** pagos equal signed purchase paid amounts
- **AND** balance equals cobros minus pagos

#### Scenario: Margin has positive cobros

- **WHEN** cobros are greater than zero
- **THEN** margen is calculated as `(cobros - pagos) / cobros * 100`
- **AND** the value may be negative

#### Scenario: Margin has no cobros

- **WHEN** cobros are zero
- **THEN** the metric is represented as “Sin ingresos”

#### Scenario: Currencies are mixed

- **WHEN** a period contains ARS and USD activity
- **THEN** each currency is aggregated independently
- **AND** no currency conversion is performed

### Requirement: Document totals and credit notes

The system SHALL calculate document totals from the accounting period independently from cash totals. Sales facturación SHALL use the net document amount after retentions, purchase totals SHALL use the persisted purchase total, and credit notes SHALL always reduce their corresponding totals.

#### Scenario: Sale has retentions

- **WHEN** a sale contains retentions
- **THEN** its facturación value is net of those retentions
- **AND** its effective cobro is not reduced by the retentions a second time

#### Scenario: Credit note is included

- **WHEN** a credit note is included in a document or cash period
- **THEN** its signed value reduces the corresponding sales, purchase, cobro, or pago aggregate

#### Scenario: Credit note is counted

- **WHEN** a filtered Sales or Purchases result contains a credit note
- **THEN** the credit note counts as a voucher
- **AND** its amount contributes as a negative value

### Requirement: Pending voucher metrics

The system SHALL expose pending voucher count and pending amount for filtered Sales and Purchases results. Pending metrics SHALL include vouchers with `pending` and `partial` status, SHALL aggregate the individual outstanding balance, SHALL preserve currency separation, and SHALL apply credit-note signs.

#### Scenario: Filtered result contains pending vouchers

- **WHEN** a Sales or Purchases result contains `pending` or `partial` vouchers
- **THEN** the response includes their count
- **AND** the response includes the sum of each voucher’s outstanding balance

#### Scenario: Individual outstanding balance is calculated

- **WHEN** a voucher is included in pending metrics
- **THEN** its outstanding balance equals `netAmount - paidAmount`

#### Scenario: No pending vouchers exist

- **WHEN** a filtered result contains no `pending` or `partial` vouchers
- **THEN** pending count equals zero
- **AND** pending amount equals zero for each currency

### Requirement: Purchase distribution and tax aggregation

The system SHALL calculate purchase distribution from total purchases rather than paid purchases. The distribution SHALL include net purchases, IVA, perceptions, other taxes, and non-fiscal purchases; credit notes SHALL reduce each affected category before percentages are calculated. Tax totals SHALL aggregate by tax type without province breakdown.

The purchase distribution SHALL expose exactly two purchase categories: fiscal purchases and non-fiscal purchases. Each category SHALL include its subtotal, non-taxable, exempt, IVA, perceptions, and other-tax components, with credit notes reducing the corresponding category. Non-fiscal purchases SHALL remain separate from fiscal purchases and SHALL not be counted as fiscal purchases.

#### Scenario: Purchase distribution contains multiple components

- **WHEN** purchases contain net amount, IVA, perceptions, other taxes, or non-fiscal amounts
- **THEN** each applicable component is represented in the distribution
- **AND** each percentage is calculated over the resulting net distribution total

#### Scenario: Purchase credit note reduces components

- **WHEN** a purchase and its credit note contain component values
- **THEN** the credit note reduces the corresponding net purchase, IVA, perception, other-tax, or non-fiscal category

#### Scenario: Tax types repeat across jurisdictions

- **WHEN** the same retention or perception type exists in multiple jurisdictions
- **THEN** its total is aggregated by type
- **AND** province is not used as a separate grouping dimension

### Requirement: Annual trends and annual-to-date variations

The system SHALL expose annual monthly cobros and pagos for both currencies and SHALL calculate month-over-month variations for each applicable trend entry. Analytics summary cards SHALL calculate annual-to-date variations against the equivalent period from the previous calendar year. January SHALL compare against December of the previous year when that comparison data exists.

When the previous comparable value is zero, the serializable variation contract SHALL use an unavailable value rendered as `N/D`. Margin SHALL use the unavailable `Sin ingresos` state when cobros are zero or negative.

#### Scenario: Annual trend is displayed

- **WHEN** annual analytics are requested
- **THEN** the trend contains twelve monthly entries
- **AND** each entry contains cobros and pagos

#### Scenario: Monthly variation is calculated

- **WHEN** a current month and previous month have comparable values
- **THEN** the response includes the percentage and absolute variation against the previous month

#### Scenario: Previous comparison value is zero

- **WHEN** the previous month has no comparable value
- **THEN** the variation is represented as `N/D` or “Sin datos” according to the metric contract

### Requirement: Sales by client cash aggregation

The system SHALL expose all sales grouped by client for the annual-to-date period, preserving dynamic currency keys. The aggregation SHALL use the effective cash date, fall back to `accountingPeriod` when no payment date exists, and sum signed `paidAmount` values so credit notes reduce the client total. Results SHALL be sorted by effectively collected total in descending order and SHALL not include client CUIT data.

#### Scenario: Client sales are aggregated

- **WHEN** annual-to-date Analytics data contains sales for multiple clients
- **THEN** each client has one total per currency
- **AND** each total represents the amount effectively collected
- **AND** clients are ordered from highest to lowest total

#### Scenario: Client credit note is included

- **WHEN** a client has sales and a related credit note in the selected period
- **THEN** the credit note reduces that client's effectively collected total

#### Scenario: Client has no activity in selected currency

- **WHEN** a client has no effective sales in the selected currency
- **THEN** that client is not included in the selected currency result
