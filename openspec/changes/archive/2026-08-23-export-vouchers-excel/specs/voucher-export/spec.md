## Purpose

Provides a robust and structured export mechanism for Sales and Purchases vouchers into formatted Excel worksheets, supporting both filtered views and automated monthly tax declarations.

## ADDED Requirements

### Requirement: Export Button Dropdown Menu
The system SHALL display a dropdown menu on the "Exportar" button within both the Sales and Purchases voucher management tables. The dropdown MUST contain two options: "Exportar Vista Actual" and "Exportar para Declaración".

#### Scenario: User clicks Export and sees options
- **WHEN** the user clicks the "Exportar" button on the Sales or Purchases table
- **THEN** a dropdown menu appears showing the "Exportar Vista Actual" and "Exportar para Declaración" options

### Requirement: Export Current View
The system SHALL export the current filtered and searched table list when the user selects "Exportar Vista Actual". The exported file MUST match the search criteria, date range, page size, status filters, and sorting order currently active in the user interface.

#### Scenario: Exporting current view with filters
- **WHEN** the user filters vouchers by a specific supplier and date range, and clicks "Exportar Vista Actual"
- **THEN** the system downloads an Excel file containing only those vouchers matching the active filters

### Requirement: Export for Tax Declaration
The system SHALL automatically calculate the date range for the previous calendar month impositively (current month - 1) using the Argentina local timezone (`America/Argentina/Buenos_Aires`) when the user selects "Exportar para Declaración". The export MUST include all vouchers from that period for the active company, ignoring any UI search queries, payment status filters, pagination, or sorting order.

#### Scenario: Exporting for declaration of the previous month
- **WHEN** the current date is August 22, 2026, and the user selects "Exportar para Declaración" on the Sales screen
- **THEN** the system downloads an Excel file containing all sales vouchers from July 1, 2026, to July 31, 2026, regardless of any active filters in the UI

### Requirement: Multi-Currency and Credit Notes Conversion Rules
The system SHALL convert any voucher values stored in foreign currency (USD) to Argentine Pesos (ARS) by multiplying them by the voucher's recorded exchange rate (`exchangeRate`). The system SHALL negate all values (Subtotal, VAT, Totals) for Credit Notes (`Nota de Crédito`) so they are represented as negative numbers in the sheet and subtract from totals.

#### Scenario: Excel reflects converted USD and negative Credit Notes
- **WHEN** the system generates the Excel sheet for vouchers that include USD invoices and ARS Credit Notes
- **THEN** the USD invoices are exported in their pesified equivalent (amount * exchangeRate)
- **AND** the Credit Notes show negative values in the monetary columns

### Requirement: Excel Sheet Layout and Columns
The system SHALL export Excel workbooks with columns mapping to the specific layout of Libro IVA. The voucher details MUST be split into a "Tipo Comprobante" column and a "Letra" column. The monetary columns MUST include formulas at the bottom of the table to automatically calculate vertical sum totals.

#### Scenario: Verification of column splitting and sum totals
- **WHEN** the user opens the exported Excel workbook
- **THEN** the table contains separate columns for "Tipo Comprobante" and "Letra"
- **AND** the last row of the table displays sum totals using native Excel `=SUM(...)` formulas

### Requirement: Export Loading State
The system SHALL display a loading state on the "Exportar" button when an export operation is actively running. During this state, the button text MUST change to "Generando..." and show a spinner icon, and the button MUST be disabled to prevent concurrent export requests.

#### Scenario: Export triggers loading state
- **WHEN** the user selects an export option and the export request starts
- **THEN** the button text changes to "Generando..." and is disabled
- **AND** once the request completes or fails, the button reverts to its default "Exportar" state and is re-enabled

### Requirement: Export Empty State
The system SHALL return a valid Excel spreadsheet layout even when no vouchers match the query filters. The spreadsheet MUST contain the correct headers, and the totals row MUST show `$ 0,00` using the sum formulas.

#### Scenario: User exports an empty selection
- **WHEN** the user requests an export for a period or selection with 0 vouchers
- **THEN** the system downloads a valid Excel workbook containing the column headers
- **AND** the sum formulas in the totals row return 0

### Requirement: Error Toast Notification
The system SHALL display a toast notification displaying the error message if the export request fails.

#### Scenario: Export request fails
- **WHEN** the client-side export request fails or times out
- **THEN** the system displays an error toast containing the corresponding error message to the user

### Requirement: Standardized Filenames and CUIT Formats
The system SHALL output exported Excel files with standardized naming structures. All CUIT values in the spreadsheet MUST be formatted with dashes as `XX-XXXXXXXX-X`.

#### Scenario: Downloaded file properties verification
- **WHEN** the user downloads the Excel file
- **THEN** the file has the name `Ventas_[NombreEmpresa]_Filtrado_[FechaActual].xlsx` (for current view) or `IVA_[Ventas/Compras]_[NombreEmpresa]_[MM-AAAA].xlsx` (for declaration)
- **AND** all supplier or client CUIT cells show the format `30-71761812-9`

### Requirement: Fallback Tax Jurisdictions
The system SHALL map any retentions or perceptions with jurisdictions not matching the predefined columns into the general "Otros Impuestos" or "Otros" column.

#### Scenario: Voucher has an outlier jurisdiction
- **WHEN** the voucher contains a retention for a jurisdiction outside the standard list (e.g. Chubut)
- **THEN** the export handler maps this retention amount to the "Otros Impuestos" column instead of breaking the layout
