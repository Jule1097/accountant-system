## Purpose

Define the data structures and mathematical behavior for handling purchase perceptions, exempt amounts, non-taxable amounts, and other taxes on vouchers.

## ADDED Requirements

### Requirement: Voucher Total Calculation Support
The system SHALL support the calculation of a voucher's total amount by including additional non-taxable and tax-related components, specifically for purchase invoices where perceptions increase the total amount owed.

#### Scenario: Calculating total with perceptions and additional amounts
- **WHEN** a voucher is created with a taxable subtotal, VAT, exempt amount, non-taxable amount, other taxes, and perceptions
- **THEN** the totalAmount MUST equal the sum of subtotal + vatAmount + exemptAmount + nonTaxableAmount + otherTaxesAmount + sum(perceptions)

### Requirement: Database structure for Perceptions
The system SHALL provide isolated tables (`PerceptionConcept` and `VoucherPerception`) to store perception catalogs and instances independently of retentions, as perceptions sum to the total while retentions subtract from the net amount.

#### Scenario: Storing a perception on a purchase voucher
- **WHEN** a user records a purchase voucher with IIBB perception
- **THEN** a `VoucherPerception` record MUST be created pointing to the voucher, specifying the amount and optionally the jurisdiction (province).

### Requirement: Absolute Values for Credit Notes
The system SHALL store all monetary amounts for Credit Notes as absolute (positive) values in the database. The logical subtraction from the client's balance MUST be inferred dynamically from the `VoucherType` (Credit Note) rather than relying on negative database values.

#### Scenario: Registering a Credit Note with negative source data
- **WHEN** the system imports or processes a Credit Note with negative amounts (e.g., `-$100`)
- **THEN** it MUST store the amounts as positive values (`100`) in the `Voucher` fields

### Requirement: Client CUIT Formatting
The system SHALL enforce a standard formatting for Client CUITs, including the required hyphens (e.g., `XX-XXXXXXXX-X`), regardless of the format provided during data import or manual entry.

#### Scenario: Importing clients with raw CUIT strings
- **WHEN** a client is created or imported with a continuous CUIT string (`30500055053`)
- **THEN** the system MUST format and save it with hyphens (`30-50005505-3`)

### Requirement: Resilient Data Import
The system's data import utilities SHALL handle incomplete or mathematically compressed legacy data gracefully.

#### Scenario: Importing records with missing mandatory fields
- **WHEN** a voucher is imported without a CUIT or an invoice number
- **THEN** the system MUST assign generic fallback values (e.g., `00-00000000-0` for CUIT) to force insertion rather than failing.

#### Scenario: Reconstructing gross totals from net totals
- **WHEN** the imported data provides a "TOTAL" column that actually represents the `netAmount` (after retentions are subtracted)
- **THEN** the import utility MUST reconstruct the true `totalAmount` by summing only the positive components (subtotal, VAT, perceptions).

#### Scenario: Handling unmapped legacy fields
- **WHEN** the imported data contains fields not supported by the system (e.g., "Centro de Costos")
- **THEN** the import utility SHALL ignore them without failing.

