## Purpose

Exposes REST API endpoints for catalogs, client/supplier contacts, and sales/purchase vouchers, enforcing transaction safety and calculations.

## ADDED Requirements

### Requirement: Catalog Retrieval
The system MUST expose a GET `/api/catalogs` route returning all available voucher letters, types, VAT rates, and retention concepts.

#### Scenario: Successful catalog fetch
- **WHEN** an authenticated user calls GET `/api/catalogs`
- **THEN** the system MUST return a JSON containing arrays for voucherTypes, voucherLetters, vatRates, and retentionConcepts

### Requirement: Contact Management with System-Wide CUIT Uniqueness
The system MUST support CRUD operations for clients (`/api/clients`) and suppliers (`/api/suppliers`). CUITs MUST be unique system-wide (globally unique across all companies for that contact type) to prevent duplicate entities.

#### Scenario: Registering client with unique CUIT
- **WHEN** creating a client with a CUIT that is not registered for any company in the database
- **THEN** the system MUST successfully save the client

#### Scenario: Registering client with duplicate CUIT
- **WHEN** creating a client with a CUIT that is already registered for any company in the database
- **THEN** the system MUST reject the creation and return a 400 Bad Request response with a Spanish message

### Requirement: Voucher Creation with Nesting and Inline Contacts
The system MUST support creating vouchers with nested VAT details and retentions in a single transaction. The voucher payload MUST allow referencing an existing contact ID (e.g. `clientId` or `supplierId`) or providing new contact details inline as a nested object (e.g. `client` or `supplier` object containing `name` and `cuit`). If provided inline, the system MUST create the contact automatically inside the transaction.

#### Scenario: Successful voucher creation with existing contact
- **WHEN** a valid voucher payload is sent with an existing contact ID (clientId or supplierId)
- **THEN** the system MUST persist the voucher, its VAT details, and retentions within a transaction

#### Scenario: Voucher creation with new inline contact
- **WHEN** a voucher payload is sent containing a nested client or supplier object with a new name and CUIT
- **THEN** the system MUST create the contact first, verify system-wide CUIT uniqueness, and link the new contact to the voucher within the transaction

### Requirement: Voucher Update with Nested Replacements
When updating a voucher (`PUT /api/vouchers/[id]`), the system MUST delete all existing nested `VoucherVatDetail` and `VoucherRetention` records associated with that voucher and insert the new ones supplied in the payload within a single transaction.

#### Scenario: Successful voucher update
- **WHEN** a PUT request is received for an existing voucher with updated details, VAT details, and retentions
- **THEN** the system MUST clear all old VAT details and retentions, insert the new ones, and commit the changes in a database transaction

### Requirement: Voucher Duplicate Prevention
The system MUST block the creation of vouchers matching the exact combination of company, type, client/supplier, voucher type, letter, posNumber, and number.

#### Scenario: Creating a duplicate voucher
- **WHEN** trying to create a voucher with the same parameters as an existing voucher
- **THEN** the system MUST abort the transaction and return a 400 Bad Request status with a Spanish duplicate warning

### Requirement: Voucher Calculations and Status Autoderivation
The system MUST enforce financial consistency: netAmount = totalAmount - Sum(retentions), subtotal = Sum(vatDetails.subtotal), and vatAmount = Sum(vatDetails.vatAmount). Status MUST be autoderived from paidAmount vs totalAmount.

#### Scenario: Full payment voucher creation
- **WHEN** paidAmount is equal to or greater than totalAmount
- **THEN** the system MUST save the voucher status as 'paid'

#### Scenario: Partial payment voucher creation
- **WHEN** paidAmount is greater than 0 but less than totalAmount
- **THEN** the system MUST save the voucher status as 'partial' and require a paymentDate
