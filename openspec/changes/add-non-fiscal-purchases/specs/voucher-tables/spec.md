## ADDED Requirements

### Requirement: Purchase forms adapt to supplier tax identification
The purchase form SHALL determine fiscal numbering requirements from the selected supplier. It MUST not display a separate manual fiscality selector.

#### Scenario: Supplier with CUIT is selected
- **WHEN** a user selects a supplier classified as `Con CUIT` in the purchase form
- **THEN** the form MUST display fiscal voucher fields and require letter, point of sale, and voucher number

#### Scenario: Supplier without CUIT is selected
- **WHEN** a user selects a supplier classified as `Sin CUIT` in the purchase form
- **THEN** the form MUST hide fiscal voucher fields and save the purchase without fiscal numbering

#### Scenario: Supplier changes during creation
- **WHEN** a user changes the selected supplier from `Con CUIT` to `Sin CUIT`
- **THEN** the form MUST clear fiscal voucher fields before submission

#### Scenario: Historical non-fiscal purchase is edited
- **WHEN** a user opens an existing non-fiscal purchase for editing
- **THEN** the form MUST keep fiscal voucher fields hidden and allow saving without fiscal numbering unless the user explicitly converts the purchase

### Requirement: Purchase views make absent fiscal data explicit
The Purchases table, voucher details, and deletion confirmation SHALL distinguish intentional non-fiscal data from unavailable data without displaying null-derived identifiers.

#### Scenario: Non-fiscal purchase appears in the table
- **WHEN** a user views a non-fiscal purchase in the Purchases table
- **THEN** the letter cell MUST show `—`, the voucher cell MUST show `Sin numeración fiscal`, and the CUIT cell MUST show `Sin CUIT`

#### Scenario: Non-fiscal purchase detail is displayed
- **WHEN** a user opens a non-fiscal purchase detail
- **THEN** the detail MUST identify it as `Sin numeración fiscal` and show letter, point of sale, and voucher number as `No aplica`

#### Scenario: Voucher deletion is confirmed
- **WHEN** a user requests deletion of any voucher
- **THEN** the confirmation dialog MUST display `Vas a eliminar este registro. ¿Deseás continuar?`

## MODIFIED Requirements

### Requirement: System prevents duplicate vouchers
The system SHALL reject fiscal vouchers that already exist under the fiscal duplicate identity criteria. The system SHALL instead require a confirmation workflow for possible non-fiscal purchase duplicates.

#### Scenario: Fiscal voucher duplicate is prevented
- **WHEN** the user attempts to save a fiscal voucher that already exists in the system under the fiscal duplicate criteria
- **THEN** the form MUST display a clear error message indicating that the voucher is already registered in the system

#### Scenario: Non-fiscal purchase duplicate is reviewed
- **WHEN** the user attempts to save a non-fiscal purchase matching an existing record by supplier, date, and total amount
- **THEN** the form MUST display the possible-duplicate confirmation before the purchase is saved
