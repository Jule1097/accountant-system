## 1. Sidebar Layout & Navigation Highlighting

- [x] 1.1 Update `src/components/layout/app-sidebar.tsx` active path detection to style items with white text, orange icons (`#FF5C00`), and secondary accent background (`#1A1A1D`) with `cornerRadius: 8`

## 2. Dashboard Page & Typography Redesign

- [x] 2.1 Update `src/app/layout.tsx` to include `Inter` (as sans) and `DM Mono` (as mono) Google Fonts to match the design.
- [x] 2.2 Update `src/app/(dashboard)/dashboard/page.tsx` typography and header layout (`font-mono` for titles, text styles).
- [x] 2.3 Refactor `src/components/dashboard/kpi-cards.tsx` to match the 2 Metric Cards design (Ingresos and Egresos) with custom card styling (`rounded-xl`, `font-mono text-3xl` for values, green percentage).
- [x] 2.4 Update `src/components/dashboard/recent-activity.tsx` to match the "Stacked List" design (Avatars, Inter typography, Badge colors for amounts).

## 3. Ventas & Compras Pages Redesign

- [x] 3.1 Refactor `src/app/(dashboard)/sales/page.tsx` to display top 3 KPI Cards (Comprobantes, Mayor Cliente, Total Facturado) styled with monospace `font-mono` / `DM Mono` numerical values
- [x] 3.2 Refactor `src/app/(dashboard)/purchases/page.tsx` to display top 3 KPI Cards (Comprobantes, Mayor Proveedor, Total Comprado) styled with monospace `font-mono` / `DM Mono` numerical values

## 4. Table Pagination & Header Actions Relocation

- [x] 4.1 Update `src/components/vouchers/voucher-table.tsx` to add Search and Filter buttons on the left above the listing table
- [x] 4.2 Relocate the "Exportar" button to be side-by-side with the "Agregar" button in the table header actions container (styled in brand orange `#FF5C00` for CTA)
- [x] 4.3 Add pagination info text `Mostrando 1-20 de 240 (Pág. 1 de 12)` at the bottom of the table
- [x] 4.4 Add page navigation controls (active page button in `#FF5C00`, inactive buttons, next icon) at the bottom center of the table
- [x] 4.5 Add a page size selector dropdown showing `Mostrar: 20` on the right side of the pagination footer

## 5. Analytics View & SVG Charts

- [x] 5.1 Update `src/components/analytics/analytics-view.tsx` to render 3 metric cards exactly matching the Pen file: Facturación, Egresos, and Margen Neto (removed Punto de Equilibrio as per feedback).
- [x] 5.2 Redesign the trend chart to a double bar layout comparing Income (`#10B981` green) and Expenses (`#EF4444` red) using responsive grid columns instead of SVG paths.
- [x] 5.3 Implement the Donut Chart for "Distribución de Egresos" utilizing SVG `<circle>` strokes, center overlay, and category legend.
- [x] 5.4 Implement "Comparación Mensual" grid table directly beside the Donut Chart and removed the unused top client/supplier lists as per the Pen file.

## 6. Voucher Modal Form Agrupado

- [x] 6.1 Refactor the `VoucherModal` (and related form input structures) to follow the **Agrupado** card sectioning distribution
- [x] 6.2 Wrap form fields inside 3 section card wrappers (background `bg-muted/40`, border `border-border`, cornerRadius `lg`) with numbered headers styled in `#FF5C00`:
  - 1. *Identificación y Fechas* (Cliente / Proveedor, Fecha)
  - 2. *Numeración y Clasificación* (Punto de Venta, Número, Tipo)
  - 3. *Importes y Totales* (Monto Total, Monto Pagado)
- [x] 6.3 Style the Save / Submit button with the primary brand orange `#FF5C00` at the bottom of the modal

## 7. Login Form Brand Accent Styling

- [x] 7.1 Update `src/components/auth/login-form.tsx` submit button to use brand orange background (`bg-[#FF5C00] hover:bg-[#FF5C00]/90`) and white text (`text-white`)

## 8. Verification and Automated Tests

- [x] 8.1 Run Jest tests and update any test files to ensure the layout/styling changes don't break validations or workflows
- [x] 8.2 Execute local server build check via `pnpm build` to verify no TypeScript compilation errors
