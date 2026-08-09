## Purpose

Define the data structures and mathematical behavior for handling purchase perceptions, exempt amounts, non-taxable amounts, other taxes, and Credit Note sign behavior on vouchers.

## ADDED Requirements

### Requirement: Shared Jurisdiction Catalog for Taxes
The system SHALL store valid tax jurisdictions in a shared relational catalog used by both sales retentions and purchase perceptions, limited in this feature to the jurisdictions detected in the current CSV files.

#### Scenario: Selecting a jurisdiction for a purchase perception
- **WHEN** a user adds an IIBB perception in the purchase voucher modal
- **THEN** the jurisdiction MUST be selected from the shared catalog instead of typed as free text

#### Scenario: Importing a tax line with jurisdiction-specific source columns
- **WHEN** the CSV import resolves a column such as `IIBB CABA` or `IIBB BUENOS AIRES`
- **THEN** the imported tax line MUST reference the matching jurisdiction catalog entry
- **AND** it MUST NOT persist an arbitrary free-text jurisdiction name

### Requirement: Purchase Voucher Total Calculation Support
The system SHALL support the calculation of a purchase voucher's total amount by including additional non-taxable and tax-related components, specifically where perceptions increase the total amount owed.

#### Scenario: Calculating total with perceptions and additional amounts
- **WHEN** a purchase voucher is created with a taxable subtotal, VAT, exempt amount, non-taxable amount, other taxes, and perceptions
- **THEN** the totalAmount MUST equal the sum of subtotal + vatAmount + exemptAmount + nonTaxableAmount + otherTaxesAmount + sum(perceptions)

### Requirement: Database structure for Purchase Perceptions
The system SHALL provide isolated tables (`PerceptionConcept` and `VoucherPerception`) to store purchase perception catalogs and instances independently of sales retentions, as perceptions sum to the total while retentions subtract from the net amount.

#### Scenario: Storing a perception on a purchase voucher
- **WHEN** a user records a purchase voucher with IIBB perception
- **THEN** a `VoucherPerception` record MUST be created pointing to the voucher, specifying the amount and optionally the jurisdiction catalog entry

### Requirement: Separation Between Sales Retentions and Purchase Perceptions
The system SHALL keep sales retentions and purchase perceptions as separate concepts across persistence, validation, domain logic, import, and analytics flows.

#### Scenario: Saving a sales voucher
- **WHEN** a sales voucher is created or updated
- **THEN** the system MUST use `VoucherRetention` entries only for deductions that reduce the liquid amount to collect
- **AND** it MUST NOT persist purchase `VoucherPerception` entries on that voucher

#### Scenario: Saving a purchase voucher
- **WHEN** a purchase voucher is created or updated
- **THEN** the system MUST use `VoucherPerception` entries only for amounts that increase the total amount owed
- **AND** it MUST NOT persist sales `VoucherRetention` entries on that voucher

### Requirement: Absolute Values for Credit Notes
The system SHALL store all monetary amounts for Credit Notes as absolute positive values in the database. The logical subtraction from balances, analytics, and reporting MUST be inferred dynamically from the `VoucherType` rather than relying on negative database values.

#### Scenario: Registering a Credit Note with negative source data
- **WHEN** the system imports or processes a Credit Note with negative amounts (for example `-$100`)
- **THEN** it MUST store the amounts as positive values (`100`) in the `Voucher` fields

#### Scenario: Aggregating analytics for Credit Notes
- **WHEN** analytics or reports include Credit Notes
- **THEN** the system MUST treat their persisted positive amounts as a negative business effect according to voucher type logic

### Requirement: CUIT Formatting for Third Parties
The system SHALL enforce a standard formatting for Client and Supplier CUITs, including the required hyphens (`XX-XXXXXXXX-X`), regardless of the format provided during data import or manual entry.

#### Scenario: Importing clients with raw CUIT strings
- **WHEN** a client is created or imported with a continuous CUIT string (`30500055053`)
- **THEN** the system MUST format and save it with hyphens (`30-50005505-3`)

#### Scenario: Importing suppliers with raw CUIT strings
- **WHEN** a supplier is created or imported with a continuous CUIT string (`30500055053`)
- **THEN** the system MUST format and save it with hyphens (`30-50005505-3`)

### Requirement: Resilient Data Import
The system's data import utilities SHALL handle incomplete or mathematically compressed legacy data gracefully.

#### Scenario: Importing records with missing mandatory fields
- **WHEN** a voucher is imported without a CUIT or an invoice number
- **THEN** the system MUST assign generic fallback values (for example `00-00000000-0` for CUIT) to force insertion rather than failing

#### Scenario: Reconstructing gross totals from net totals
- **WHEN** the imported data provides a `TOTAL` column that actually represents the `netAmount`
- **THEN** the import utility MUST reconstruct the true `totalAmount` by summing only the positive components that belong to the voucher total

#### Scenario: Handling unmapped legacy fields
- **WHEN** the imported data contains fields not supported by the system such as `Centro de Costos`
- **THEN** the import utility SHALL ignore them without failing

#### Scenario: Mapping jurisdiction-specific perception columns
- **WHEN** the imported purchase CSV contains jurisdiction-specific columns such as `IIBB CABA` or `IIBB PBA`
- **THEN** the import utility MUST map them into a generic `PerceptionConcept` plus the corresponding jurisdiction catalog entry on `VoucherPerception`

#### Scenario: Importing sample CSV files
- **WHEN** the system imports `2026 - Compras.csv` and `2026 - Teem - Facturacion y gastos 2026.csv`
- **THEN** the import utility MUST treat them as temporary source files used only to populate realistic sample data
- **AND** it MUST map their columns into the normalized database structure without coupling persistence to the CSV layout

### Requirement: Compact Voucher Tables
The system SHALL present separate compact tables for purchases and sales, inspired by the CSV structure while remaining adapted to the application.

#### Scenario: Rendering the purchases table
- **WHEN** the purchases table is shown
- **THEN** it MUST display separate columns for voucher letter and voucher number
- **AND** it MUST include the operational columns `concept`, `paymentMethod`, `status`, `paymentDate`, `paidAmount`, and `comments`
- **AND** it MUST show a compact aggregate total for perceptions rather than one visible column per jurisdiction

#### Scenario: Rendering the sales table
- **WHEN** the sales table is shown
- **THEN** it MUST display separate columns for voucher letter and voucher number
- **AND** it MUST include the operational columns `concept`, `paymentMethod`, `status`, `paymentDate`, `paidAmount`, and `comments`
- **AND** it MUST show a compact aggregate total for retentions rather than one visible column per jurisdiction

### Requirement: Voucher Detail Modal from Tables
The system SHALL allow users to open a voucher detail modal from the purchases and sales tables to inspect and prepare edits to the voucher tax breakdown and operational fields.

#### Scenario: Opening a sales voucher from the table
- **WHEN** a user clicks a sales voucher row or voucher identifier in the sales table
- **THEN** the system MUST open a modal showing the voucher data, including the retention breakdown by concept and jurisdiction

#### Scenario: Opening a purchase voucher from the table
- **WHEN** a user clicks a purchase voucher row or voucher identifier in the purchases table
- **THEN** the system MUST open a modal showing the voucher data, including the perception breakdown by concept and jurisdiction

#### Scenario: Editing voucher detail in this feature
- **WHEN** a user changes fields in the voucher detail modal
- **THEN** the UI MUST allow editing those values in local form state
- **AND** the feature MUST NOT persist those edits to the database yet
