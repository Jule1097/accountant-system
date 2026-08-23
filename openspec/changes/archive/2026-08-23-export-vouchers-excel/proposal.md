## Why

Provides the capability to export sales and purchases vouchers in Excel format (.xlsx) to support business reporting and automated monthly tax declarations.

## What Changes

- Add a dropdown menu to the "Exportar" button in both Sales and Purchases tables.
- Add "Exportar Vista Actual" option to export data respecting active UI filters.
- Add "Exportar para Declaración" option to export data for the previous calendar month impositively (ignoring payment status/search filters, and enforcing the Argentina timezone for calculation).
- Add server-side Route Handler `GET /api/vouchers/export` to generate Excel workbooks with `exceljs` in memory.
- Split voucher columns in Excel to separate "Tipo Comprobante" and "Letra".
- Enforce pesification (USD to ARS conversion using the exchange rate) in exported amounts.
- Set negative sign on Credit Notes (Nota de Crédito) in columns so they subtract correctly from sum totals.
- Implement formulas at the bottom of the Excel sheets for automatic sum calculations.

## Capabilities

### New Capabilities
- `voucher-export`: Capability to export vouchers to Excel formats under different modes (current view filters or tax declaration mode for the previous month).

### Modified Capabilities

## Impact

- Adds a server-side route handler `GET /api/vouchers/export`.
- Installs `exceljs` dependency.
- Adds dropdown menu options to the client-side voucher tables.
