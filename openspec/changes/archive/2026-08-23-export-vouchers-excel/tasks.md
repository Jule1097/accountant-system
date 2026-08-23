## 1. Preparation & Setup

- [x] 1.1 Create a new Git branch `feature/export-vouchers-excel` and pull latest staging updates
- [x] 1.2 Install `exceljs` library using `pnpm`
- [x] 1.3 Verify project builds and mock tests run successfully

## 2. Server-side Export API Handler

- [x] 2.1 Create backend Route Handler file `src/app/api/vouchers/export/route.ts` with base imports and authorization check
- [x] 2.2 Implement timezone utility to compute start/end dates of the previous month using `America/Argentina/Buenos_Aires` timezone
- [x] 2.3 Add query parser validation for filters (`mode`, `search`, `status`, `dateFrom`, `dateTo`, etc.) using Zod
- [x] 2.4 Integrate DB queries utilizing `VoucherService.getAllVouchers()` based on the selected mode (`declaration` vs `filters`)
- [x] 2.5 Implement ExcelJS workbook builder for Sales (Ventas), mapping columns dynamically to include tax jurisdictions, splitting type/letter, formatting currencies/dates, converting USD to ARS, negating Credit Notes, and appending the sum formulas row
- [x] 2.6 Implement ExcelJS workbook builder for Purchases (Compras), mapping columns dynamically for VAT rates and perceptions, splitting type/letter, formatting, and appending sum formulas row
- [x] 2.7 Verify workbook formatting, borders, and column autofitting, returning the spreadsheet as a binary stream response

## 3. Frontend Dropdown and UI Integration

- [x] 3.1 Update the "Exportar" button in `src/components/vouchers/voucher-table.tsx` to utilize a DropdownMenu component (Shadcn UI dropdown)
- [x] 3.2 Add menu options for "Exportar Vista Actual" and "Exportar para Declaración" in both Sales and Purchases tables
- [x] 3.3 Implement click handlers to trigger a file download from the `/api/vouchers/export` endpoint with appropriate search query parameters (`mode=filters` with current query state or `mode=declaration`)
- [x] 3.4 Implement local state management (`isExporting`) and spinner/text UI updates on the "Exportar" button during download

## 4. Verification & Testing

- [x] 4.1 Write integration tests in `src/__tests__/api/vouchers/export.test.ts` for the route handler (checking both modes, isolation, currency conversion, Credit Notes negation)
- [x] 4.2 Run all Jest tests and verify that the test suite passes successfully
- [x] 4.3 Verify the export functionality manually in the browser, checking the formatting and calculation formulas of the downloaded `.xlsx` files
