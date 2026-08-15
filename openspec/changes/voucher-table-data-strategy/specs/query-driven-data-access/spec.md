## Purpose

Define the shared route data behavior for interactive screens so query state, cache reuse, invalidation, and company isolation remain consistent across the application.

## ADDED Requirements

### Requirement: URL-Backed Query State
The system MUST use URL query parameters as the source of truth for interactive route datasets whenever the route exposes pagination, filtering, searching, sorting, selection, or comparable dataset-shaping state.

#### Scenario: User refreshes a filtered interactive route
- **WHEN** a user refreshes or directly opens an interactive route URL containing dataset query parameters
- **THEN** the system MUST restore the same dataset state from the URL without requiring local in-memory recovery

#### Scenario: Route changes dataset state
- **WHEN** a user changes pagination, search, filters, sorting, or item selection on an interactive route
- **THEN** the system MUST update the corresponding URL query parameters to reflect the new dataset state

#### Scenario: User opens a batch-scoped interactive route
- **WHEN** a user opens an interactive route whose dataset is scoped by a batch identifier
- **THEN** the system MUST treat that batch identifier as part of the route query contract

### Requirement: Company-Scoped In-Memory Cache
The system MUST cache interactive route data in memory for the current session using cache keys that are scoped by company identifier and the full dataset query state.

#### Scenario: User revisits the same dataset state
- **WHEN** a user navigates back to an interactive route using the same company and the same dataset query state during the same session
- **THEN** the system MUST reuse the cached data before deciding whether revalidation is needed

#### Scenario: User switches active company
- **WHEN** the active company changes
- **THEN** the system MUST treat all cached datasets from the previous company as isolated from the new company context

### Requirement: Selective Invalidation
The system MUST invalidate cached datasets selectively after mutations so visible views refresh immediately while non-mounted views revalidate lazily on next access.

#### Scenario: Mutation affects a mounted route
- **WHEN** a user completes a mutation that changes data shown in a currently visible interactive route
- **THEN** the system MUST refresh the affected visible dataset without requiring a full-page reload

#### Scenario: Mutation affects a non-mounted route
- **WHEN** a user completes a mutation that changes data used by an interactive route that is not currently mounted
- **THEN** the system MUST mark the affected cached dataset as stale so it revalidates on next access

### Requirement: Debounced Search Execution
The system MUST debounce free-text search before issuing dataset fetches driven by user typing.

#### Scenario: User types a search term
- **WHEN** a user is entering free-text search input on an interactive route
- **THEN** the system MUST wait for typing to stabilize before issuing the corresponding dataset request

#### Scenario: Search term changes after pagination
- **WHEN** a user changes the effective search term on an interactive route with pagination
- **THEN** the system MUST reset the dataset to the first page before requesting the updated results

### Requirement: Route-Specific Query Parameters
The system MUST place only dataset-shaping state in the URL and MUST keep purely visual or ephemeral UI state out of the dataset query contract.

#### Scenario: Route contains dataset filters and sort state
- **WHEN** a route exposes dataset filters, search, sorting, pagination, or selected entity identifiers
- **THEN** the system MUST encode only those dataset-shaping values in the URL query string

#### Scenario: Route contains view-only state
- **WHEN** a route has purely visual UI state that does not change the dataset
- **THEN** the system MUST NOT require that state to participate in the shared dataset query contract

### Requirement: Batch-Scoped Interactive Routes
The system MUST allow interactive routes that are not tables to participate in the shared query/cache/invalidation strategy when their datasets are still shaped by URL state.

#### Scenario: User opens the `conciliations` route
- **WHEN** a user opens `conciliations` with `batchId`, `tab`, and `page`
- **THEN** the system MUST treat those parameters as the dataset source of truth for that route

#### Scenario: `conciliations` route changes page or tab
- **WHEN** a user changes the current `conciliations` tab or page
- **THEN** the system MUST update the corresponding URL query parameters and cached dataset key without requiring a full-page reload
