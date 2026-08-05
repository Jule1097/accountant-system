# voucher-tables Specification

## Purpose
Provides dynamic and reusable data tables for displaying Sales and Purchases vouchers, including support for dynamically rendering tax and retention columns based on active configurations.
## Requirements
### Requirement: Voucher Tables Structure
The system SHALL display data tables on the Sales and Purchases screens. The tables MUST include standard columns for Date, Voucher Details (Type, Letter, POS, Number), Client/Supplier, Total Amount, and Status.

#### Scenario: Sales table renders standard columns
- **WHEN** the user views the Sales screen
- **THEN** the table displays columns for Fecha, Comprobante, Cliente, Importe Total, and Estado

#### Scenario: Purchases table renders standard columns
- **WHEN** the user views the Purchases screen
- **THEN** the table displays columns for Fecha, Comprobante, Proveedor, Importe Total, and Estado

### Requirement: Dynamic Retention and Perception Columns
The system SHALL dynamically render additional columns in the tables for each configured retention or perception. Sales tables MUST display retentions, and Purchases tables MUST display perceptions based on the system's active `RetentionConcept` configurations.

#### Scenario: Sales table displays dynamic retention columns
- **WHEN** the system has configured retentions (e.g., "Retencion IVA", "IIBB CABA")
- **THEN** the Sales table renders a column for each configured retention, displaying the retained amount for each voucher (or a default value if not applicable)

#### Scenario: Table handles horizontal overflow
- **WHEN** there are many dynamic tax columns
- **THEN** the table container provides horizontal scrolling to prevent breaking the page layout

### Requirement: Table Actions & Modals
The system SHALL provide action buttons above the tables to interact with the data and create new records.

#### Scenario: User clears table filters
- **WHEN** the user has active filters applied to the table
- **THEN** a "Borrar Filtros" button is available, which upon clicking clears all active filters and resets the table view

#### Scenario: User opens creation modal
- **WHEN** the user clicks the "Agregar" button in the Sales or Purchases screen
- **THEN** a modal opens containing a data entry form tailored to the specific entity (Sales uses Client schema, Purchases uses Supplier schema)

#### Scenario: Form includes AI parsing dropzone
- **WHEN** the modal form is displayed
- **THEN** it includes a drag-and-drop area (dropzone) to upload a PDF or JPG file of the voucher
- **AND** dropping a file immediately triggers a "Cargando" state while it is parsed by Gemini AI

#### Scenario: AI parsing completes and updates form
- **WHEN** the Gemini AI parsing completes successfully
- **THEN** the parsed data immediately overwrites any existing data in the form fields
- **AND** the user can manually validate and correct the auto-filled data
- **AND** any fields not detected by the AI remain blank for manual entry
- **AND** a reusable toast notification is shown to warn the user if any fields were left blank or if the process completed

#### Scenario: Purchases form supports dynamic taxes (Perceptions)
- **WHEN** the user is in the Purchases creation form
- **THEN** the form includes an "Agregar Impuesto" button to manually add perceptions
- **AND** if the user uses the AI dropzone and perceptions are detected, they are automatically added to this tax list

#### Scenario: System prevents duplicate vouchers
- **WHEN** the user attempts to save a voucher that already exists in the system (same type, letter, pos, number, and CUIT)
- **THEN** the form displays a clear error message indicating that the voucher is already registered in the system

