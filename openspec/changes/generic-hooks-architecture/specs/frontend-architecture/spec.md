## Purpose

Provide modular, predictable frontend screens in the audited modules by separating presentation from business orchestration and reusing consistent loading, error, empty, and interaction states.

## ADDED Requirements

### Requirement: Audited screens separate presentation from orchestration
The voucher, client/supplier, reconciliation, and analytics screens SHALL keep rendering and user event wiring in components while data access, transformations, business decisions, and side effects are handled outside presentational components.

#### Scenario: Component renders a management state
- **WHEN** a screen renders
- **THEN** the component consumes prepared state and callbacks without directly constructing API requests or domain payloads

#### Scenario: User action triggers a business operation
- **WHEN** a user submits, deletes, reviews, or persists data
- **THEN** the component invokes a prepared callback and does not implement the business operation itself

### Requirement: Large audited components are decomposed by responsibility
The audited screens SHALL decompose large tables, modals, views, pages, and layouts into focused components whose responsibilities remain understandable and independently testable.

#### Scenario: Voucher table is rendered
- **WHEN** the voucher table is displayed
- **THEN** filtering controls, table structure, rows, and pagination are composed from focused responsibilities

#### Scenario: Voucher modal is rendered
- **WHEN** the voucher modal is opened for create, edit, or preview
- **THEN** shared shell and field sections are reused without duplicating the complete modal workflow for each mode

#### Scenario: Detail mode uses current view data
- **WHEN** a detail modal opens for a record already available in the current view
- **THEN** it renders the current record immediately without a request or loading state for the record detail

#### Scenario: Detail mode has no current record
- **WHEN** detail mode is requested without a complete current record
- **THEN** the screen shows a not-found or unavailable state without requesting the record from the modal

#### Scenario: Edit mode loads the record once
- **WHEN** an edit modal opens for a record whose detailed data is not cached
- **THEN** it loads the record by ID once and reuses the cached result on later openings

#### Scenario: Edit mode shows scoped loading
- **WHEN** edit mode requests an uncached record by ID
- **THEN** only the edit detail region shows the existing loading state while the request is pending

### Requirement: Shared visual states are consistent
The audited screens SHALL reuse common loading, error, and empty states while allowing domain-specific content and recovery actions.

#### Scenario: Data is loading
- **WHEN** a screen is waiting for its resource
- **THEN** it displays the shared loading state appropriate to that resource scope

#### Scenario: Data fails
- **WHEN** a resource request fails
- **THEN** the screen displays a shared error state with a supported recovery action and a Spanish user-facing message

### Requirement: URL-driven screen state remains stable during interaction
The audited screens SHALL use the normalized URL state as the source of truth for pagination, filtering, search, and sorting and SHALL avoid unnecessary route reloads or unrelated rerenders.

#### Scenario: Query state changes
- **WHEN** the user changes a table criterion
- **THEN** the URL and the corresponding resource query stay synchronized without resetting unrelated UI state

### Requirement: Linked routes follow application boundaries
The routes linked to the audited workflows SHALL validate request data and authenticated company context before invoking services, SHALL not contain direct persistence access or duplicated business rules, and SHALL preserve their existing paths, HTTP methods, and external contracts.

#### Scenario: Request lacks company context
- **WHEN** a linked route receives a request without valid authenticated company context
- **THEN** it rejects the request before invoking a domain service

#### Scenario: Valid request reaches the application layer
- **WHEN** a linked route receives valid input and context
- **THEN** it invokes the appropriate service and translates the result or typed error into the HTTP response

#### Scenario: Route implementation is refactored
- **WHEN** a linked route is migrated to the application boundaries
- **THEN** its path, HTTP method, query parameters, request contract, and response contract remain unchanged
