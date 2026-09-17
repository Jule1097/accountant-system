## ADDED Requirements

### Requirement: Dependent voucher-form options remain current

The system SHALL make a successfully created client or supplier available to newly opened voucher creation and editing forms of its corresponding role without requiring a browser refresh. This behavior MUST preserve company-scoped data isolation and role separation.

#### Scenario: Client creation refreshes sales voucher options
- **WHEN** a user creates a client from the clients management route and later opens a sales voucher creation or editing form
- **THEN** the client is available in the form's client select

#### Scenario: Supplier creation refreshes purchases voucher options
- **WHEN** a user creates a supplier from the suppliers management route and later opens a purchases voucher creation or editing form
- **THEN** the supplier is available in the form's supplier select

#### Scenario: Inline creation revalidates the current voucher form
- **WHEN** a user creates a client or supplier from an open voucher creation or editing form
- **THEN** the matching option source is revalidated without closing the form
- **AND** the newly created record is available and selected in the current role-specific select
