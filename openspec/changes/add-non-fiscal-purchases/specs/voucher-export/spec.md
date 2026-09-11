## MODIFIED Requirements

### Requirement: Excel Sheet Layout and Columns
The system SHALL export Excel workbooks with columns mapping to the specific layout of Libro IVA. Voucher details MUST be split into a `Tipo Comprobante` column and a `Letra` column. Purchase exports MUST add an `Identificación` column that identifies fiscal and non-fiscal purchases. The monetary columns MUST include formulas at the bottom of the table to automatically calculate vertical sum totals.

#### Scenario: Verification of column splitting and sum totals
- **WHEN** the user opens the exported Excel workbook
- **THEN** the table contains separate columns for `Tipo Comprobante` and `Letra`
- **AND** Purchase exports contain the `Identificación` column
- **AND** the last row of the table displays sum totals using native Excel `=SUM(...)` formulas

#### Scenario: Non-fiscal purchase is exported
- **WHEN** a purchase without fiscal numbering is exported
- **THEN** its CUIT, letter, point of sale, and voucher number cells MUST be empty and its `Identificación` cell MUST contain `Sin numeración fiscal`

### Requirement: Standardized Filenames and CUIT Formats
The system SHALL output exported Excel files with standardized naming structures. All present CUIT values in the spreadsheet MUST be formatted with dashes as `XX-XXXXXXXX-X`. Exports MUST preserve absent supplier CUIT values as empty cells.

#### Scenario: Downloaded file properties verification
- **WHEN** the user downloads the Excel file
- **THEN** the file has the name `Ventas_[NombreEmpresa]_Filtrado_[FechaActual].xlsx` (for current view) or `IVA_[Ventas/Compras]_[NombreEmpresa]_[MM-AAAA].xlsx` (for declaration)
- **AND** all present supplier or client CUIT cells show the format `30-71761812-9`

#### Scenario: Supplier without CUIT is exported
- **WHEN** an exported purchase belongs to a supplier without a CUIT
- **THEN** its CUIT cell MUST be empty and MUST NOT contain a synthetic identifier
