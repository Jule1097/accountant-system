## Context

The current system displays sales and purchases vouchers in a paginated list on the frontend. The "Exportar" button is static. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Implement a server-side route handler `GET /api/vouchers/export` to generate dynamic Excel workbooks using `exceljs`.
- Split the voucher details in Excel into separate "Tipo Comprobante" and "Letra" columns.
- Convert USD vouchers to ARS dynamically using the recorded `exchangeRate`.
- Format Credit Notes (`Nota de Crédito`) with negative amounts.
- Add dynamic columns matching the tax jurisdictions for retentions (Ventas) and perceptions (Compras).
- Implement vertical sum formulas at the bottom of monetary columns.
- Connect the frontend "Exportar" button to a dropdown menu offering current view export vs tax declaration export.

**Non-Goals:**
- Modifying the existing paginated table display itself.
- Storing generated files permanently (all workbook generation is transient, returned directly as a binary response stream).
- Exporting to other formats like PDF or CSV from the export route handler (only `.xlsx` is supported).

## Decisions

### Decision 1: Use `exceljs` library on the server side
- **Rationale:** ExcelJS provides excellent support for cell formatting (currencies, dates), cell borders (thick/thin/double for totals), filling colors matching branding guidelines, and autofitting column widths.
- **Alternatives considered:**
  - *SheetJS (xlsx)*: Rejected due to the lack of formatting/styling in the free community edition.
  - *Client-side excel generation*: Rejected because it requires downloading large libraries to the client and carrying out heavy processing on the frontend.

### Decision 2: API Route Query Parameter (`mode`)
- **Rationale:** We will use a query parameter `mode` on `GET /api/vouchers/export`.
  - `mode=filters`: The route handler will read search, status, and custom dates query parameters to query matching records using the repository's `findAll` method.
  - `mode=declaration`: The route handler will calculate the calendar start and end dates for the previous month in the Argentina timezone (`America/Argentina/Buenos_Aires`) and query all records in that month, ignoring search/status filters.
- **Alternatives considered:**
  - *Separate endpoints (e.g. `/api/vouchers/export` and `/api/vouchers/export-declaration`)*: Rejected because the Excel mapping logic is identical, so a single route with a parameter is cleaner and avoids duplication.

### Decision 3: Dynamically map retentions and perceptions to columns
- **Rationale:** For sales retentions and purchases perceptions, we will load the list of available `TaxJurisdiction` names from the database or helper, create columns for each, and map each voucher's retentions/perceptions to its corresponding column by matching the jurisdiction name (e.g. "CABA" $\rightarrow$ "Ret IIBB CABA", "Buenos Aires" $\rightarrow$ "Ret IIBB PBA", etc.).
- **Alternatives considered:**
  - *Hardcoding columns*: Rejected because if a new jurisdiction is added to the database, the Excel file would not reflect it without code changes. Dynamic mapping handles future database additions.

### Decision 4: Fetch API for Download to Manage Loading State
- **Rationale:** To show a spinner and a "Generando..." text on the button, we must track the loading state in React. We will trigger the export by fetching the Excel file via `fetch` as a binary `Blob`, then programmatically creating an object URL (`window.URL.createObjectURL(blob)`) and triggering a click on a hidden anchor element. This allows us to set a local `isExporting` state to `true` when starting and reset it to `false` in a `try...finally` block.
- **Alternatives considered:**
  - *Direct window.location / anchor href navigation*: Rejected because we cannot capture when the download starts/completes/fails from Javascript, making it impossible to hide the loading state or spinner.

### Decision 5: File Naming, CUIT Formatting, and Empty State handling
- **Filename generation:** Filenames will be generated dynamically on the server:
  - Current view: `${type === 'sales' ? 'Ventas' : 'Compras'}_${companyName}_Filtrado_${todayString}.xlsx`
  - Declaration: `IVA_${type === 'sales' ? 'Ventas' : 'Compras'}_${companyName}_${periodString}.xlsx` (e.g. `IVA_Ventas_TEEM_07-2026.xlsx`).
- **CUIT formatting:** All CUITs exported will be normalized to include hyphens using a helper function (e.g., converting `30717618129` to `30-71761812-9`).
- **Empty state sum calculations:** If the query returns 0 rows, the workbook will still write the headers, and the totals row will write the Excel `=SUM(...)` formula referencing the empty range (e.g. `=SUM(F5:F5)`), resulting in 0, to preserve the sheet's structure for zero-activity tax filing.
- **Tax jurisdiction fallback mappings:** In Sales and Purchases sheets, if a retention or perception has a jurisdiction that does not map to one of the standard province columns, its amount will be summed into the "Otros Impuestos" or "Otros" column to avoid layout distortion.

## Risks / Trade-offs

- **[Risk]** Memory limit on serverless environment if dataset is huge.
  - **Mitigation**: The system's dataset is small to moderate (a few hundred to thousands of rows per month per company). Memory footprint for creating Excel files under 10k rows is negligible. If memory becomes an issue in the future, we can stream using ExcelJS streaming writer, but `writeBuffer` is sufficient and cleaner for now.
- **[Risk]** Incorrect timezone alignment on month calculation.
  - **Mitigation**: We will use a robust date utility or libraries like `moment-timezone` or native JS date timezone formatting with time offsets to compute the start/end of the previous month strictly in Argentina time.
