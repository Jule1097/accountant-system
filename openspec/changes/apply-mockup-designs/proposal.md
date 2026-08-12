## Why

Currently, the user interface for Ventas (Sales), Compras (Purchases), Analytics, and the Voucher entry form is either using old layout designs, missing modern pagination controls, or lacking clear data groupings and filter options. To align the application with the premium dark theme and ensure high usability, we need to implement the revised UI structures, actions, and groupings designed in `pencil-new.pen`.

## What Changes

- **Sidebar Active States**: Update active item backgrounds and colors to highlight Ventas, Compras, or Analíticas dynamically when navigating these routes.
- **Ventas & Compras Pages**:
  - Add 3 KPI Cards at the top (Comprobantes del Mes, Mayor Cliente/Proveedor, Total).
  - Integrate a search input and a Filter button on the left of the table controls row.
  - Group "Exportar" and "Agregar Venta/Compra" buttons contiguously on the right of the table header.
  - Add Pagination Row at the bottom of the tables: showing pagination info, page navigation controls, and a "Mostrar: 20" dropdown selector.
- **Analytics Page**:
  - Update top KPI Cards to show: Facturación del Mes, Egresos del Mes, Margen Neto Mensual, and Punto de Equilibrio.
  - Redesign the single trend chart into a double bar chart showing side-by-side Income (green) and Expenses (red) for a 6-month period.
  - Add Donut Chart for "Distribución de Egresos" (with inner radius 0.7 and legend list).
  - Add "Comparación Mensual" table and side-by-side lists for Client and Supplier concentration at the bottom.
- **Voucher Modal**:
  - Implement the **Agrupado** (Sectioned Grouping) distribution pattern for form inputs, wrapping fields into 3 distinct dark sections (Identificación, Numeración, Importes) with numbered titles and orange accents.

## Capabilities

### Modified Capabilities
- `frontend-layout`: Redesign the layout active states and layout of sidebar elements for Ventas, Compras, and Analíticas.
- `voucher-tables`: Update tables with pagination metrics, page size selectors, and horizontal controls (search, filter, export and add buttons).
- `dashboard-metrics`: Redesign Analytics page metrics, double bar trend chart, and concentration/distribution components.
- `auth-ui`: Redesign the login card and submit button styling to align with the brand accents.

## Impact

- Affected frontend page layouts and components:
  - `src/components/layout/app-sidebar.tsx`
  - `src/components/vouchers/voucher-table.tsx`
  - `src/components/analytics/analytics-view.tsx`
  - `src/components/vouchers/voucher-modal.tsx`
  - `src/components/auth/login-form.tsx`
  - `src/app/(dashboard)/sales/page.tsx`
  - `src/app/(dashboard)/purchases/page.tsx`
  - `src/app/(dashboard)/analytics/page.tsx`
