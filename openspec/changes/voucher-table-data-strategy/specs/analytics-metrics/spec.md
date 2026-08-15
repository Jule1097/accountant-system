## Purpose

Define the analytics route behavior so aggregated metrics follow the shared query-driven cache and invalidation strategy without adopting table pagination semantics.

## ADDED Requirements

### Requirement: Analytics Route Uses Shared Data Strategy
The system MUST load analytics datasets through the shared query-driven cache and invalidation strategy for the active company.

#### Scenario: User opens analytics route
- **WHEN** a user navigates to the analytics route
- **THEN** the analytics datasets MUST resolve through the shared company-scoped in-memory cache strategy

#### Scenario: User revisits analytics route in the same session
- **WHEN** a user returns to the analytics route with the same active company during the same browser session
- **THEN** the system MUST reuse the cached analytics datasets before deciding whether revalidation is needed

### Requirement: Analytics Route Exposes Only Dataset-Shaping Query State
The system MUST use URL query parameters only for analytics controls that change the dataset and MUST NOT require pagination state for analytics metrics.

#### Scenario: Analytics route has no paginated table dataset
- **WHEN** the analytics route displays aggregated metrics without paginated records
- **THEN** the route MUST NOT require `page` or `pageSize` query parameters for those metrics

#### Scenario: Analytics route introduces dataset filters
- **WHEN** analytics controls shape the returned dataset
- **THEN** the route MUST encode only those dataset-shaping controls in the query string

### Requirement: Analytics Route Revalidates After Relevant Mutations
The system MUST refresh visible analytics datasets immediately after relevant mutations and MUST lazily revalidate non-mounted analytics datasets on next access.

#### Scenario: Relevant mutation occurs while analytics is visible
- **WHEN** a user completes a mutation that changes data shown on the mounted analytics route
- **THEN** the visible analytics datasets MUST refresh without requiring a full-page reload

#### Scenario: Relevant mutation occurs while analytics is not mounted
- **WHEN** a user completes a mutation that changes analytics datasets while the analytics route is not mounted
- **THEN** the analytics datasets MUST be marked stale so they revalidate on next access
