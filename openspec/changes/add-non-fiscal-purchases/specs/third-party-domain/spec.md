## MODIFIED Requirements

### Requirement: Shared third-party identity behavior

The client and supplier domain entities MUST expose consistent company ownership, name normalization, and comparison behavior. Clients MUST require a valid CUIT. Suppliers MUST expose an explicit tax-identification mode: suppliers identified with a CUIT MUST require and normalize a valid CUIT, while suppliers identified without a CUIT MUST persist no CUIT. Both roles MUST reject invalid intrinsic state and apply existing name normalization rules consistently.

#### Scenario: Equivalent names are compared consistently

- **WHEN** a client or supplier is compared with another record using names that differ only by surrounding whitespace or letter casing
- **THEN** the comparison MUST treat the names as equivalent under the existing normalization rules

#### Scenario: Equivalent CUIT formats are compared consistently

- **WHEN** a client or a supplier identified with a CUIT is compared with a CUIT represented with or without formatting separators
- **THEN** the comparison MUST use the existing CUIT normalization behavior

#### Scenario: Supplier is created without a CUIT

- **WHEN** a user selects `Sin CUIT` while creating a supplier
- **THEN** the system MUST allow the supplier to be saved with a null CUIT and classify it as without CUIT

#### Scenario: CUIT is required for an identified supplier

- **WHEN** a user creates or updates a supplier classified as `Con CUIT` without a valid CUIT
- **THEN** the system MUST reject the operation with `El CUIT es obligatorio.`

#### Scenario: Supplier without CUIT receives one later

- **WHEN** a supplier classified without a CUIT is updated to `Con CUIT` with a valid CUIT
- **THEN** the system MUST save the CUIT and classify future purchases for that supplier as fiscal

#### Scenario: Invalid intrinsic state is rejected

- **WHEN** a domain entity is constructed or asked to change to an empty name, or a client or CUIT-identified supplier has an invalid CUIT
- **THEN** the operation MUST fail before persistence and MUST not leave the entity in an invalid state

### Requirement: Existing client-supplier contracts remain compatible

The refactoring MUST preserve existing REST endpoint paths, company-scoped behavior, inline voucher creation flow, and user-facing Spanish messages. Client contracts MUST remain unchanged. Supplier request and response contracts MUST expose tax-identification mode and support a nullable CUIT, while existing suppliers remain represented as CUIT-identified records.

#### Scenario: Existing client CRUD continues to work

- **WHEN** an authenticated consumer performs the current client list, create, read, update, or delete operation
- **THEN** the operation MUST retain its current result shape, status behavior, and company isolation

#### Scenario: Existing supplier with CUIT remains valid

- **WHEN** an authenticated consumer reads, creates, or updates a supplier with a valid CUIT
- **THEN** the operation MUST retain company isolation and classify the supplier as `Con CUIT`

#### Scenario: Existing supplier CRUD continues to work

- **WHEN** an authenticated consumer performs the current supplier list, create, read, update, or delete operation for a CUIT-identified supplier
- **THEN** the operation MUST retain its current status behavior and company isolation while exposing the supplier tax-identification mode

#### Scenario: Supplier without CUIT is identified by name

- **WHEN** an authenticated consumer creates a supplier without a CUIT whose normalized name already exists in the same company
- **THEN** the system MUST reject the duplicate supplier

#### Scenario: Supplier cannot lose CUIT after purchases exist

- **WHEN** an authenticated consumer attempts to change a CUIT-identified supplier with one or more purchases to `Sin CUIT`
- **THEN** the system MUST reject the update and preserve the existing supplier data

