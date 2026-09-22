## MODIFIED Requirements

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

#### Scenario: Unresolved parsed third party can be created inline
- **WHEN** a voucher form has no selected client or supplier, including when AI parsing returns no usable name or CUIT
- **THEN** the form displays the applicable "Agregar cliente" or "Agregar proveedor" action
- **AND** selecting the action opens the inline creation form with parsed identity values when available, otherwise with empty values for manual entry

#### Scenario: Inline creation refreshes the active selector
- **WHEN** a user creates a client or supplier from an open voucher modal
- **THEN** the matching selector revalidates its options without closing the modal
- **AND** the newly created third party is available and selected

#### Scenario: Parsed standard invoice selects letter A
- **WHEN** AI parsing returns a standard invoice with letter `A`
- **THEN** the voucher letter select resolves and displays the catalog option for letter `A`

#### Scenario: Parsed taxes respect the active voucher workflow
- **WHEN** AI parsing returns retention and perception values for a sales or purchases voucher
- **THEN** a sales response contains no perceptions and a purchases response contains no retentions

#### Scenario: Applicable parsed tax is not in the catalog
- **WHEN** AI parsing returns a retention or perception for the active voucher workflow that does not match a catalog concept
- **THEN** the technical parsed response retains the unmatched item without a catalog ID
- **AND** the voucher form does not add it automatically and warns the user to review it manually

#### Scenario: AI identifies Other Taxes in a purchase
- **WHEN** AI parsing identifies a purchase tax item as `Otros Impuestos`
- **THEN** the parsed response classifies it as a perception using that canonical concept
- **AND** it does not duplicate that item in the general other-tax amount

#### Scenario: AI returns only a generic other-tax total
- **WHEN** AI parsing returns a generic other-tax total without identifying the `Otros Impuestos` concept
- **THEN** the parsed response retains it only in the general other-tax amount
- **AND** it does not add a perception automatically

#### Scenario: Purchases form supports dynamic taxes (Perceptions)
- **WHEN** the user is in the Purchases creation form
- **THEN** the form includes an "Agregar Impuesto" button to manually add perceptions
- **AND** if the user uses the AI dropzone and perceptions are detected, they are automatically added to this tax list

#### Scenario: System prevents duplicate vouchers
- **WHEN** the user attempts to save a voucher that already exists in the system (same type, letter, pos, number, and CUIT)
- **THEN** the form displays a clear error message indicating that the voucher is already registered in the system

## ADDED Requirements

### Requirement: Tax concept catalogs remain role-specific and canonical

The system SHALL maintain retention and perception concepts in separate catalogs. Sales voucher forms MUST expose only the retention concepts `Retención de IIBB`, `Retención de IVA`, `Retención OSSEG/ANSAL`, and `Retención de Ganancias`. Purchase voucher forms MUST expose only the perception concepts `Percepción de IIBB`, `Percepción de IVA`, `Percepción de Ganancias`, and `Otros Impuestos`. Catalog labels MUST use these short names without the suffix `Sufrida`.

#### Scenario: Sales form exposes the canonical retention options
- **WHEN** a user adds a retention in a sales voucher form
- **THEN** the retention selector contains exactly the four canonical retention concepts

#### Scenario: Purchases form exposes the canonical perception options
- **WHEN** a user adds a perception in a purchases voucher form
- **THEN** the perception selector contains exactly the four canonical perception concepts
