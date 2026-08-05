## 1. Setup and Foundation

- [x] 1.1 Ensure Shadcn/ui is initialized and install necessary components (Sidebar, Button, Table, DropdownMenu, Form, Input, Card).
- [x] 1.2 Setup route groups `(auth)` and `(dashboard)` in `src/app/`.
- [x] 1.3 Add a theme provider (e.g., `next-themes`) for dark/light mode support.

## 2. Authentication UI

- [x] 2.1 Create the Login page layout in `src/app/(auth)/login/page.tsx`.
- [x] 2.2 Implement the Login form using `react-hook-form` and `zod` for validation.
- [x] 2.3 Style the form with Shadcn/ui and add "Ingresar" button.

## 3. Main Dashboard Layout

- [x] 3.1 Create `src/app/(dashboard)/layout.tsx` for the shared layout structure.
- [x] 3.2 Implement the collapsible Sidebar navigation component (Dashboard, Ventas, Compras, Analíticas).
- [x] 3.3 Add the Theme Toggle button to the layout.
- [x] 3.4 Implement the User Session dropdown at the bottom of the sidebar with "Cerrar sesión" action.

## 4. Dashboard View

- [x] 4.1 Create `src/app/(dashboard)/dashboard/page.tsx`.
- [x] 4.2 Build KPI Metric Cards component (Ingresos, Egresos) using Shadcn Card.
- [x] 4.3 Add placeholder sections/cards for future charts (Últimas compras, Últimas ventas).

## 5. Voucher Tables (Sales and Purchases)

- [x] 5.1 Create `src/app/(dashboard)/sales/page.tsx` and `src/app/(dashboard)/purchases/page.tsx`.
- [x] 5.2 Build a reusable `VoucherTable` component in `src/components/vouchers/voucher-table.tsx`.
- [x] 5.3 Configure Shadcn Table to display standard voucher columns (Date, Type, Client/Supplier, CUIT, Total).
- [x] 5.4 Implement search input (filtering by client/supplier or CUIT) using Shadcn Input.
- [x] 5.5 Add standard action buttons to the table using Shadcn Button and DropdownMenu (View, Delete, Download).
- [x] 5.6 Add buttons to clear filters and "Agregar" (Add) in the sales/purchases screens.
- [x] 5.7 Implement a modal with a form for adding a voucher (using Shadcn `Dialog` and `Form`), with fields based on each entity's schema.
- [x] 5.8 Implement Shadcn/ui `Dialog` for the "Agregar" modal.
- [x] 5.9 Add a drag-and-drop area in the modal to upload PDF/JPG files for Gemini AI processing.
- [x] 5.10 Implement a "Cargando" state for the AI processing that auto-fills fields, leaving undetected fields blank for manual entry, and includes a button for "Agregar Impuesto" in the Purchases form.
- [x] 5.11 Implement a reusable Shadcn/ui `Toast` to notify users about incomplete AI fields and general feedback.

## 6. Analytics View

- [x] 6.1 Create `src/app/(dashboard)/analytics/page.tsx` for the analytics route.
- [x] 6.2 Implement summary widgets (mock projections, comparisons against the previous period).
- [x] 6.3 Build chart placeholders (e.g., SVG/Tailwind-based mockup charts for monthly income/expenses trend).
