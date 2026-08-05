## Purpose

Provides high-level metric cards on the dashboard to give users a quick overview of their financial status.

## ADDED Requirements

### Requirement: KPI Metric Cards
The system SHALL display summary metric cards on the dashboard screen, including at minimum: total income for the month, total expenses for the month, and the calculated balance.

#### Scenario: Dashboard loads monthly metrics
- **WHEN** user navigates to the dashboard
- **THEN** the system displays cards showing "Ingresos del mes", "Egresos del mes"

### Requirement: Dynamic Response to Filters
The system SHALL ensure the metric cards are structurally prepared to react to user-defined filters in the future (e.g., date ranges).

#### Scenario: Metric cards support filtering layout
- **WHEN** the dashboard is viewed
- **THEN** the cards are positioned alongside or below a filter area, ready to dynamically update their values when filters are applied
