# Frontend Design Guidelines

This document outlines the visual aesthetics, theme color palette, spacing tokens, table layouts, and form modal structures established for the application.

---

## Theme & Color Tokens (Light, Dark, and System)

To ensure the application supports switching between **Dark**, **Light**, and **System** themes seamlessly, **never hardcode specific HEX colors** for canvas, text, cards, or border elements on layout nodes. Instead, use Tailwind's semantic utility classes which map to the active theme variables:

### Semantic CSS Tokens Mapping
| Element Type | Design Hex Reference (Dark Theme) | Tailwind Utility Class | Description |
| :--- | :--- | :--- | :--- |
| **App Canvas** | `#0A0A0B` | `bg-background` / `text-foreground` | Main viewport canvas and primary text. |
| **Cards & Containers** | `#141417` | `bg-card` / `text-card-foreground` | Metrics cards, tables wrapper, list panels. |
| **Secondary Accents** | `#1A1A1D` | `bg-secondary` / `text-secondary-foreground` | Inactive button states, active item indicators. |
| **Borders & Dividers** | `#2A2A2E` | `border-border` / `border-input` | Outer outlines, input borders. |
| **Muted Annotations** | `#8B8B90` / `#6B6B70` | `text-muted-foreground` | Subtitles, footnotes, inactive states, labels. |
| **Grouped Card bg** | `#111113` | `bg-muted/40` or `bg-accent/40` | Section backgrounds for the grouped modal layout. |

### Brand & Interactive Accent
- **Brand Accent**: `#FF5C00` (Core primary interactive elements, highlights, active states, active pagination, primary buttons like "Agregar"). This accent remains consistent across both Light and Dark modes. Use `bg-[#FF5C00]`, `text-[#FF5C00]`, or `border-[#FF5C00]` utility classes.

### Status & Semantic Indicators
- **Positive (Success)**: `text-emerald-500` / `bg-emerald-500/10` (Income values, "Pagado" badge, positive metrics).
- **Warning (Notice)**: `text-amber-500` / `bg-amber-500/10` ("Parcial" badge status).
- **Negative (Danger)**: `text-red-500` / `bg-red-500/10` (Expenses values, "Pendiente" badge, top supplier amounts).


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
