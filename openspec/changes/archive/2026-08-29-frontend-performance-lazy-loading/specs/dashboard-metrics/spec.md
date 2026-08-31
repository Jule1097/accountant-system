## MODIFIED Requirements

### Requirement: KPI Metric Cards
The system SHALL display summary metric cards on the dashboard screen, including at minimum: total income for the month, total expenses for the month, and the calculated balance.

#### Scenario: Dashboard loads monthly metrics
- **WHEN** user navigates to the dashboard
- **THEN** the system displays cards showing "Ingresos del mes", "Egresos del mes"

#### Scenario: Dashboard metrics are still loading
- **WHEN** the dashboard route has not yet resolved the metric data
- **THEN** the system MUST show a dashboard loading placeholder compatible with the current layout
- **AND** the implementation MUST preserve the current reusable skeleton approach during this performance initiative

#### Scenario: Dashboard route initializes
- **WHEN** the user navigates to the dashboard route
- **THEN** the route MUST request only the dashboard data required by its initial visible state
- **AND** it MUST not trigger requests for unrelated modules that are not displayed on the dashboard

### Requirement: Dynamic Response to Filters
The system SHALL ensure the metric cards are structurally prepared to react to user-defined filters in the future (e.g., date ranges).

#### Scenario: Metric cards support filtering layout
- **WHEN** the dashboard is viewed
- **THEN** the cards are positioned alongside or below a filter area, ready to dynamically update their values when filters are applied
