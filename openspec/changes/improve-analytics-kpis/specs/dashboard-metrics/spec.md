## MODIFIED Requirements

### Requirement: KPI Metric Cards

The system SHALL display summary metric cards on the dashboard screen, including Cobros del mes, Pagos del mes, and a combined Balance y margen card. Values SHALL use the current calendar month, effective paid amounts, and separate ARS and USD values.

#### Scenario: Dashboard loads monthly metrics

- **WHEN** a user navigates to the dashboard
- **THEN** the system displays cards showing “Cobros del mes”, “Pagos del mes”, and “Balance y margen”
- **AND** the cards identify the current calendar month
- **AND** balance equals cobros minus pagos
- **AND** margin equals `(cobros - pagos) / cobros * 100` when cobros is greater than zero

#### Scenario: Dashboard metrics have no income

- **WHEN** the current month has no cobros
- **THEN** the margin subinformation displays “Sin ingresos”

#### Scenario: Dashboard metrics are still loading

- **WHEN** the dashboard route has not yet resolved the metric data
- **THEN** the system MUST show a dashboard loading placeholder compatible with the current layout
- **AND** the placeholder MUST represent all three KPI cards and the balance and margin subinformation
- **AND** the implementation MUST preserve the current reusable skeleton approach during this performance initiative

#### Scenario: Dashboard route initializes

- **WHEN** the user navigates to the dashboard route
- **THEN** the route MUST request only the dashboard data required by its initial visible state
- **AND** it MUST not trigger requests for unrelated modules that are not displayed on the dashboard

### Requirement: Shared metric endpoint

The system SHALL expose Dashboard KPI data through `/api/metrics` and the shared `Metric` application responsibility. The endpoint SHALL use the authenticated request context and SHALL scope all repository reads to the active company.

#### Scenario: Metrics request uses the authenticated company

- **WHEN** an authenticated user requests `/api/metrics`
- **THEN** the route passes the company from the request context to `Metric`
- **AND** the response contains only metrics for that company

#### Scenario: Metrics request is unauthenticated

- **WHEN** an unauthenticated request is sent to `/api/metrics`
- **THEN** the request is rejected by the existing request-context security boundary
- **AND** `Metric` is not invoked

## ADDED Requirements

### Requirement: Dashboard Activity Cards

The Dashboard SHALL present weekly sales activity and recent purchases activity as separate cards within one responsive activity section.

#### Scenario: Dashboard activity is resolved on medium and larger screens

- **WHEN** the Dashboard has loaded weekly sales and recent purchases data
- **THEN** the activity section displays the weekly sales card and recent purchases card in two equal-width columns
- **AND** the weekly sales card appears before the recent purchases card

#### Scenario: Dashboard activity is viewed on a small screen

- **WHEN** the Dashboard is rendered below the medium responsive breakpoint
- **THEN** the weekly sales card and recent purchases card are displayed in a single vertical column

#### Scenario: User navigates to sales from the activity card

- **WHEN** the user selects the `Ver ventas` action in the weekly sales card
- **THEN** the application navigates to `/sales`
- **AND** the action is positioned in the upper-right area of that card

#### Scenario: User navigates to purchases from the activity card

- **WHEN** the user selects the `Ver compras` action in the recent purchases card
- **THEN** the application navigates to `/purchases`
- **AND** the action is positioned in the upper-right area of that card

#### Scenario: Dashboard activity data is empty

- **WHEN** the Dashboard has no weekly sales or recent purchase entries
- **THEN** both cards remain visible
- **AND** the existing empty-state behavior remains available inside the relevant card

### Requirement: Dashboard Activity Loading Layout

The Dashboard activity loading placeholder MUST preserve the same two-card responsive structure as the resolved activity section.

#### Scenario: Dashboard activity is loading

- **WHEN** the Dashboard activity data has not finished loading
- **THEN** the loading placeholder displays one placeholder for each activity card
- **AND** the placeholders use the same responsive column behavior as the resolved cards
