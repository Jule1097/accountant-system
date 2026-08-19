## MODIFIED Requirements

### Requirement: KPI Metric Cards
The system SHALL display summary metric cards on the dashboard screen, including at minimum: total income for the month, total expenses for the month, and the calculated balance.

#### Scenario: Dashboard loads monthly metrics
- **WHEN** user navigates to the dashboard
- **THEN** the system displays cards showing "Ingresos del mes", "Egresos del mes"
- **AND** the dashboard metrics MUST use the shared query-driven cache and invalidation strategy for the active company

#### Scenario: Upstream mutation affects visible dashboard metrics
- **WHEN** a user completes a data mutation that changes a metric currently visible on the dashboard
- **THEN** the visible dashboard metrics MUST refresh without requiring a full-page reload

### Requirement: Dynamic Response to Filters
The system SHALL ensure the metric cards are structurally prepared to react to user-defined filters in the future (e.g., date ranges).

#### Scenario: Metric cards support filtering layout
- **WHEN** the dashboard is viewed
- **THEN** the cards are positioned alongside or below a filter area, ready to dynamically update their values when filters are applied

#### Scenario: Upstream mutation affects non-mounted dashboard metrics
- **WHEN** a user completes a data mutation that changes dashboard metrics while the dashboard route is not mounted
- **THEN** the cached dashboard metrics MUST be marked stale so they revalidate on next access
