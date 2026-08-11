# Frontend Design Guidelines

This document outlines the visual aesthetics, theme color palette, spacing tokens, table layouts, and form modal structures established for the application.

---

## Color Palette & Theme Tokens

The application is built on a dark premium theme utilizing the following color references:

### Brand & Primary Accents
- **Brand Accent**: `#FF5C00` (Core primary interactive elements, highlights, active states, active pagination, primary buttons like "Agregar Venta/Compra").
- **Secondary Accent**: `#1A1A1D` (Inactive button backgrounds, active sidebar item backgrounds, secondary selectors).

### Backgrounds
- **App Canvas**: `#0A0A0B` (Main viewport background).
- **Cards & Containers**: `#141417` (Metrics cards, table wraps, details panels).
- **Form Sections / Alternates**: `#111113` (Form group panels, nested table cards).

### Text & Typography
- **Primary Text**: `#FFFFFF` (Headings, active values, button labels).
- **Muted Text**: `#ADADB0` (Descriptions, values in inputs, labels).
- **Secondary/Disabled Text**: `#8B8B90` (Inactive menu items, placeholder elements).
- **Helper/Border Text**: `#6B6B70` (Table column headers, secondary descriptions, pagination info).

### Borders & Dividers
- **Standard Borders**: `#2A2A2E` (Inputs outline, default card outlines).
- **Subtle Dividers**: `#1F1F23` (Table rows line separators, section dividers).

### Status & Semantic Indicators
- **Positive (Success)**: `#10B981` / `#22C55E` (Income values, "Pagado" badge, positive metrics).
  - Badge Background: `#22C55E18` (10% opacity)
- **Warning (Notice)**: `#EAB308` ("Parcial" badge status).
  - Badge Background: `#EAB30818` (10% opacity)
- **Negative (Danger)**: `#EF4444` (Expenses values, "Pendiente" badge, top supplier amounts).
  - Badge Background: `#EF444418` (10% opacity)

---

## Layout, Margins & Spacing

To keep the interface clean and spacious, follow these padding and margin rules:

- **Page Padding**: `32px` (`p-8` / `padding: 32`) on primary view containers.
- **Card Inner Padding**: `20px` (`p-5` / `padding: 20`) for metrics cards and charts.
- **Form Modal Padding**: `32px` on root modal dialog wrapper; `12px` inside section cards.
- **Section Spacing**: `20px` to `24px` vertical gap between components.
- **Grid Gaps**:
  - `16px` (`gap-4`) for primary grid structures (KPI grids, bottom cards rows).
  - `12px` to `14px` (`gap-3` / `gap-3.5`) for smaller nested forms/rows.

---

## Typography Guidelines

- **Primary Font**: `Inter` (Sans-serif) for body text, button labels, and default UI copy.
- **Data & Numbers Font**: `DM Mono` (or monospace font styling) for currency displays, counts, percentages, and table values to guarantee horizontal alignment.
- **Page Titles**: `text-3xl font-bold tracking-tight` (or `fontSize: 30`, `fontWeight: "bold"`).
- **Card Subheaders / Small Labels**: `fontSize: 11` or `12`, `fontWeight: "500"`, `letterSpacing: 0.5`.

---

## Table Controls & Pagination

All data listings (Sales and Purchases) follow a uniform control schema:

### Actions and Filters
- **Control Bar**: Positioned above the table. Integrates a search input field (240px width, placeholder `Buscar por nombre, CUIT...`) and a secondary **Filtrar** button on the left.
- **Header Actions**: Group action buttons (e.g. **Exportar** and **Agregar Compra/Venta**) side-by-side on the right of the table title.

### Pagination Row
- **Structure**: A single flex row at the bottom of the table containing:
  - **Left**: Pagination info text: `Mostrando 1-20 de 240 (Pág. 1 de 12)`.
  - **Center**: Navigation page controls (Active page highlighted with brand color `#FF5C00`, inactive page buttons, and chevron-right icons).
  - **Right**: Page size selector dropdown button displaying `Mostrar: 20` with a chevron indicator.

---

## Form & Modal Layout (Agrupado)

Modals containing forms (like the Voucher Modal) must organize inputs into structured, logical sections:

- **Section Containers**: Inputs are grouped inside subtle card wrappers (background `#111113`, border `#1F1F23`, `cornerRadius: 8`).
- **Numbered Headers**: Each group starts with a header styled in `#FF5C00` (e.g., `1. Identificación y Fechas`, `2. Numeración y Clasificación`).
- **Groupings**:
  1. *Section 1: Identificación y Fechas* (Cliente / Proveedor, Fecha).
  2. *Section 2: Numeración y Clasificación* (Punto de Venta, Número, Tipo).
  3. *Section 3: Importes y Totales* (Monto Total, Monto Pagado).
- **Actions**: Submit button styled with primary brand accent color (`#FF5C00`, `cornerRadius: 6`, padding `[12, 0]`) located at the bottom of the modal.
