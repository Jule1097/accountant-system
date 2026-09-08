## Purpose

Provide reusable, entity-agnostic client state behavior for URL-driven tables and asynchronous operations while preserving predictable caching, pagination, selection, and company isolation.

## ADDED Requirements

### Requirement: URL state is declarative and normalized
The system SHALL allow a screen to declare its URL parameters with names, types, defaults, normalization, and optional custom parsing and serialization rules.

#### Scenario: URL parameters are read into typed values
- **WHEN** a screen initializes from a URL
- **THEN** declared parameters are returned in their normalized types and defaults are applied when values are absent or invalid

#### Scenario: Partial URL updates preserve unrelated parameters
- **WHEN** a declared parameter changes
- **THEN** only parameters owned by the screen are updated and unrelated URL parameters remain intact

### Requirement: Table query changes update the URL without unnecessary navigation
The system SHALL update URL-driven pagination, filtering, search, and sorting without a full page reload, and SHALL reset pagination to the first page when query criteria change.

#### Scenario: Search is committed after debounce
- **WHEN** the user changes a search field
- **THEN** the effective URL search value is updated only after the configured debounce interval and the page becomes `1`

#### Scenario: Filter or sort changes reset pagination
- **WHEN** a filter or sort criterion changes
- **THEN** the URL preserves unrelated parameters, updates the changed criterion, and sets the owned page parameter to `1`

### Requirement: Generic pagination and sorting are reusable
The system SHALL expose entity-agnostic pagination and sorting behavior with configurable defaults, allowed values, and invalid-value normalization.

#### Scenario: Invalid pagination values are normalized
- **WHEN** the URL contains a non-positive or non-numeric page value
- **THEN** the system uses the configured default page

#### Scenario: Unsupported sort values are normalized
- **WHEN** the URL contains a sort value outside the declared options
- **THEN** the system uses the configured default sort

### Requirement: Selection accumulates visible IDs across pages
The system SHALL support reusable selection of visible records using configurable `string` or `number` keys, retaining selected IDs while the user changes pages.

#### Scenario: Selection accumulates across pages
- **WHEN** a user selects records on one page and then selects records on another page
- **THEN** the selected ID set contains records from both pages

#### Scenario: Selection is cleared when company context changes
- **WHEN** the active company changes
- **THEN** the selection is cleared before records from the new company are used

### Requirement: Generic asynchronous state is independent of domain presentation
The system SHALL provide reusable asynchronous operation state without owning endpoints, domain messages, toasts, or entity-specific cache keys.

#### Scenario: A mutation reports lifecycle state
- **WHEN** an asynchronous operation starts, succeeds, or fails
- **THEN** consumers receive the corresponding loading, success, error, and reset states

### Requirement: Detail and edit data loading are conditional
The system SHALL render a detail modal from the already available record without requesting the record by ID, and SHALL request ID-specific data only when an edit flow requires it and the data is not already cached.

#### Scenario: Detail modal opens with an available record
- **WHEN** a user opens a modal in detail mode for a record already present in the current view
- **THEN** the modal renders that record immediately and no detail request is dispatched

#### Scenario: Edit modal opens for the first time
- **WHEN** a user opens a modal in edit mode and the ID-specific record is not cached
- **THEN** the system requests the record by ID and exposes its loading state to the edit flow

#### Scenario: Edit modal reopens for a cached record
- **WHEN** a user opens edit mode for a record whose ID-specific data is cached
- **THEN** the system reuses the cached data without dispatching an automatic duplicate or stale-refresh request

#### Scenario: Detail modal lacks the current record
- **WHEN** a detail modal is requested without a complete current record
- **THEN** the modal does not request data by ID and the screen displays a not-found or unavailable state

### Requirement: SWR remains the server-state boundary
The system SHALL keep SWR-specific fetching, caching, and invalidation in data or management hooks, while generic state hooks remain independent of SWR.

#### Scenario: Successful mutation invalidates affected resources
- **WHEN** a module-specific mutation succeeds
- **THEN** only the related SWR resources are revalidated

#### Scenario: Failed mutation does not invalidate unrelated resources
- **WHEN** a module-specific mutation fails
- **THEN** unrelated cached resources are not revalidated and the consumer receives the typed failure state

### Requirement: Management consumers preserve core behavior during migration
The system SHALL migrate the audited voucher, client/supplier, and reconciliation management consumers to focused reusable behavior without changing their core user workflows.

#### Scenario: Conciliation selection remains available after pagination
- **WHEN** a user selects records across multiple reconciliation pages
- **THEN** the management flow can submit all selected IDs to the existing bulk operation

#### Scenario: Bulk operation reports rejected IDs
- **WHEN** a bulk operation receives selected IDs and some no longer exist or are not valid
- **THEN** valid IDs are processed and rejected IDs are reported to the user without silently discarding them
