## ADDED Requirements

### Requirement: Localized spreadsheet dates

The system SHALL export voucher and payment dates as Excel date values with the Argentina-local display format `dd/mm/yyyy` for both sales and purchases. Date-only values MUST preserve their original calendar day independently of server timezone. Empty payment dates MUST remain empty.

#### Scenario: Voucher dates are readable in local format
- **WHEN** a user opens an exported sales or purchases workbook containing voucher and payment dates
- **THEN** each populated date cell displays in `dd/mm/yyyy` format and remains usable as an Excel date value

## MODIFIED Requirements

### Requirement: Multi-Currency and Credit Notes Conversion Rules

The system SHALL convert any voucher values stored in foreign currency (USD) to Argentine Pesos (ARS) by multiplying them by the voucher's recorded exchange rate (`exchangeRate`). Credit Notes (`Nota de Crédito`) SHALL export their monetary values as negative so they subtract from totals. Sales retentions SHALL export as negative subtractive amounts. Other standard invoice amounts, including MiPyME electronic credit invoices and non-retention taxes, MUST export as non-negative values.

#### Scenario: Excel reflects converted USD and negative Credit Notes
- **WHEN** the system generates the Excel sheet for vouchers that include USD invoices, ARS Credit Notes, and ARS MiPyME electronic credit invoices
- **THEN** the USD invoices are exported in their pesified equivalent (amount * exchangeRate)
- **AND** Credit Notes and sales retentions show negative values in their corresponding monetary columns
- **AND** the MiPyME electronic credit invoices and non-retention standard amounts show non-negative values

### Requirement: Excel Sheet Layout and Columns

The system SHALL export Excel workbooks with columns mapping to the specific layout of Libro IVA. The voucher details MUST be split into a "Tipo Comprobante" column and a "Letra" column. The monetary columns MUST include formulas at the bottom of the table to automatically calculate vertical sum totals. Purchase workbooks MUST not include an `Exento` column; their `Subtotal` value MUST include the voucher subtotal plus the authoritative exempt amount exclusively in the exported workbook, including letter C vouchers. An `Exento` VAT detail takes precedence over the general exempt amount; the general amount is used only when no such detail exists. Purchase workbooks MUST not include OSSEG perception columns, while sales exports retain their applicable OSSEG retention columns.

#### Scenario: Verification of column splitting and sum totals
- **WHEN** the user opens the exported Excel workbook
- **THEN** the table contains separate columns for "Tipo Comprobante" and "Letra"
- **AND** the last row of the table displays sum totals using native Excel `=SUM(...)` formulas

#### Scenario: Purchase subtotal contains exempt values without OSSEG
- **WHEN** a user exports purchases containing subtotal, exempt values, and an OSSEG perception
- **THEN** the workbook has no `Exento` or OSSEG perception column
- **AND** the exported `Subtotal` equals the exported subtotal plus the authoritative exempt value
