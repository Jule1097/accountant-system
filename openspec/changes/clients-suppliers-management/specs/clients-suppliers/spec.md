## ADDED Requirements

### Requirement: Clients and Suppliers Management Routes
The system MUST expose a dedicated "Clientes y Proveedores" management experience through two dashboard routes, `/clients` and `/suppliers`, rendered as one shared module with route-driven tabs.

#### Scenario: User opens the clients route
- **WHEN** the user navigates to `/clients`
- **THEN** the system MUST render the shared management module with the `Clientes` tab active

#### Scenario: User opens the suppliers route
- **WHEN** the user navigates to `/suppliers`
- **THEN** the system MUST render the shared management module with the `Proveedores` tab active

#### Scenario: User changes tabs in the module
- **WHEN** the user clicks the inactive tab in the shared module
- **THEN** the system MUST navigate to the corresponding route
- **AND** the active tab MUST be derived from the current route

### Requirement: Server-Driven Management Tables
The system MUST render clients and suppliers through reusable server-driven tables that support pagination, search, ordering, totals, and extensible filters.

#### Scenario: User opens a management table
- **WHEN** the user opens `/clients` or `/suppliers`
- **THEN** the system MUST request paginated data from the corresponding API
- **AND** the response MUST include `items`, `page`, `pageSize`, `total`, and `totalPages`

#### Scenario: User searches by name or CUIT
- **WHEN** the user enters a search term in the management table
- **THEN** the system MUST send that search input to the backend
- **AND** the backend MUST filter by the relevant entity fields for the active route

#### Scenario: Future filters are added
- **WHEN** the active route sends additional filter keys supported by the backend contract
- **THEN** the table flow MUST accept them without requiring a redesign of the list contract shape

#### Scenario: User changes sorting or page size
- **WHEN** the user changes sort order or page size in the table
- **THEN** the system MUST request the corresponding server-side page

### Requirement: Clients and Suppliers CRUD Modals
The system MUST allow users to create, view, edit, and attempt deletion of clients and suppliers from the shared module through modal-driven flows.

#### Scenario: User creates a client or supplier
- **WHEN** the user submits a new client or supplier with valid `name` and `cuit`
- **THEN** the system MUST persist the record in the active company and current entity route
- **AND** it MUST refresh the visible table
- **AND** it MUST show a success toast

#### Scenario: User edits a client or supplier
- **WHEN** the user submits a valid edit for an existing client or supplier
- **THEN** the system MUST persist the update
- **AND** it MUST refresh the visible table
- **AND** it MUST show a success toast

#### Scenario: User views a client or supplier
- **WHEN** the user opens the detail action for a client or supplier
- **THEN** the system MUST display the persisted values in a read-only modal view

### Requirement: Duplicate Prevention Per Company and Entity Type
The system MUST prevent duplicate clients and duplicate suppliers inside the active company by normalized name and normalized CUIT, while treating clients and suppliers as separate roles.

#### Scenario: User creates or edits a duplicate name
- **WHEN** the user submits a client or supplier whose normalized name already exists in the same entity route and active company
- **THEN** the system MUST reject the operation
- **AND** it MUST show a Spanish error stating that the client or supplier already exists

#### Scenario: User creates or edits a duplicate CUIT
- **WHEN** the user submits a client or supplier whose normalized CUIT already exists in the same entity route and active company
- **THEN** the system MUST reject the operation
- **AND** it MUST show the Spanish error `El CUIT ya existe`

#### Scenario: Same CUIT exists in the other role
- **WHEN** a CUIT already exists as a client and the user creates a supplier with the same CUIT in the same company, or vice versa
- **THEN** the system MUST allow the operation because the role is different

### Requirement: Deletion Blocking For Referenced Records
The system MUST block deletion of a client or supplier when at least one persisted voucher references that record.

#### Scenario: User tries to delete an unreferenced record
- **WHEN** the user confirms deletion for a client or supplier that has no persisted vouchers
- **THEN** the system MUST physically delete the record
- **AND** it MUST refresh the visible table
- **AND** it MUST show a success toast

#### Scenario: User tries to delete a referenced record
- **WHEN** the user confirms deletion for a client or supplier that is referenced by at least one persisted voucher
- **THEN** the system MUST reject the deletion
- **AND** it MUST keep the record unchanged
- **AND** it MUST show a clear Spanish message through the modal flow and a reinforcing toast
