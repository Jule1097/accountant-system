## MODIFIED Requirements

### Requirement: Voucher Tables Structure
The system SHALL display data tables on the Sales and Purchases screens. The tables MUST include standard columns for Date, Voucher Details (Type, Letter, POS, Number), Client/Supplier, Total Amount, and Status.

#### Scenario: Sales table renders standard columns
- **WHEN** the user views the Sales screen
- **THEN** the table displays columns for Fecha, Comprobante, Cliente, Importe Total, and Estado
- **AND** the data is loaded from the `/api/vouchers?type=sale` REST API endpoint.

#### Scenario: Purchases table renders standard columns
- **WHEN** the user views the Purchases screen
- **THEN** the table displays columns for Fecha, Comprobante, Proveedor, Importe Total, and Estado
- **AND** the data is loaded from the `/api/vouchers?type=purchase` REST API endpoint.

### Requirement: Table Actions & Modals
The system SHALL provide action buttons above the tables to interact with the data and create new records.

#### Scenario: User clears table filters
- **WHEN** the user has active filters applied to the table
- **THEN** a "Borrar Filtros" button is available, which upon clicking clears all active filters and resets the table view

#### Scenario: User opens creation modal
- **WHEN** the user clicks the "Agregar" button in the Sales or Purchases screen
- **THEN** a modal opens containing a data entry form tailored to the specific entity (Sales uses Client schema, Purchases uses Supplier schema)
- **AND** the catalog selections (Voucher Types, Letters, VAT Rates, Retention Concepts) are fetched dynamically from the `/api/catalogs` endpoint.
- **AND** the "Guardar Comprobante" button is disabled if all input fields are empty, and only becomes enabled once all required inputs are completed.
- **AND** when the enabled button is clicked, it shows a toast notification stating that voucher saving/creation is disabled in this stage.

#### Scenario: Form includes AI parsing dropzone
- **WHEN** the modal form is displayed
- **THEN** it includes a drag-and-drop area (dropzone) to upload a PDF or JPG file of the voucher
- **AND** dropping a file immediately triggers a "Cargando" state while it is parsed by Gemini AI via `/api/vouchers/parse`

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

#### Scenario: System duplicate checks and saving are deferred
- **WHEN** the user attempts to save a completed voucher form
- **THEN** the action displays a toast notification indicating saving is disabled, and no POST request is sent to `/api/vouchers`.
- **AND** backend duplicate checks are deferred to a later stage.

#### Scenario: User attempts to delete a voucher
- **WHEN** the user clicks the "Eliminar" option in the voucher table actions dropdown
- **THEN** the action shows a toast notification indicating that deletion is not available in this stage.
