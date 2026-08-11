## Purpose

Define the persistent CRUD contract for sales and purchase vouchers so the application can create, retrieve, update, and physically delete vouchers through private REST endpoints.

## ADDED Requirements

### Requirement: Voucher Creation Persistence
The system MUST persist vouchers created from the sales and purchases forms through the private vouchers API, including the nested tax and operational fields already supported by the voucher payload.

#### Scenario: Successful sales voucher creation
- **WHEN** an authenticated user submits a valid sales voucher payload for the active company
- **THEN** the system MUST create the voucher and return the persisted record

#### Scenario: Successful purchase voucher creation
- **WHEN** an authenticated user submits a valid purchase voucher payload for the active company
- **THEN** the system MUST create the voucher and return the persisted record

#### Scenario: Voucher creation fails validation
- **WHEN** the submitted voucher payload is invalid
- **THEN** the system MUST reject the request with a 400 response and a Spanish validation error payload suitable for the UI

### Requirement: Voucher Detail Retrieval By Identifier
The system MUST expose voucher detail retrieval by identifier so the UI can open the detail modal from a `voucherId` query string and hydrate the full editable form state from the backend record.

#### Scenario: Existing voucher is requested by id
- **WHEN** an authenticated user requests a voucher id that belongs to the active company
- **THEN** the system MUST return the full voucher detail record needed to populate the edit form

#### Scenario: Missing voucher is requested by id
- **WHEN** an authenticated user requests a voucher id that does not exist for the active company
- **THEN** the system MUST return a 404 response with a Spanish message indicating that the voucher does not exist

### Requirement: Voucher Update Persistence
The system MUST persist edits to an existing sales or purchase voucher through the private vouchers API, replacing the editable voucher state currently kept only in local UI memory.

#### Scenario: Successful voucher update
- **WHEN** an authenticated user submits a valid update for an existing voucher in the active company
- **THEN** the system MUST persist the updated voucher and return the updated record

#### Scenario: Update targets a missing voucher
- **WHEN** an authenticated user submits an update for a voucher id that does not exist for the active company
- **THEN** the system MUST return a 404 response with a Spanish message indicating that the voucher does not exist

### Requirement: Voucher Physical Deletion
The system MUST physically delete vouchers through the private vouchers API when the user confirms deletion from the table action.

#### Scenario: Successful voucher deletion
- **WHEN** an authenticated user confirms deletion for an existing voucher in the active company
- **THEN** the system MUST physically remove the voucher and respond with success

#### Scenario: Deletion targets a missing voucher
- **WHEN** an authenticated user confirms deletion for a voucher id that does not exist for the active company
- **THEN** the system MUST return a 404 response with a Spanish message indicating that the voucher does not exist
