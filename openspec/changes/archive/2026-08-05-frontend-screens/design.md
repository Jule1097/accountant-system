## Context

The application is built with Next.js 16 (App Router), relying on React Server Components where possible, and using Shadcn/ui for consistent styling. We need to implement the core layouts, data tables, and an isolated login page. The data tables must support dynamic columns based on taxation (retentions and perceptions) defined in the backend `RetentionConcept` model.

## Goals / Non-Goals

**Goals:**
- Implement a reusable layout using Next.js route groups `(dashboard)` and `(auth)`.
- Build a generic `VoucherTable` component that can accept an array of dynamic columns to render taxes/retentions dynamically.
- Utilize Shadcn/ui for all interactive elements (Sidebar, Table, Form, DropdownMenu).
- Implement the initial layout and structure for the `/analytics` page using mock visualizations.

**Non-Goals:**
- Connecting to the live backend API (mock data will be used initially).
- Complex chart integrations (placeholder containers will be built).
- Full implementation of authentication state (just the UI).

## Decisions

- **Route Grouping**: Use Next.js route groups `(auth)` and `(dashboard)` to enforce isolated layouts for login vs. internal application screens.
  - *Rationale*: Allows different root structures without sharing the sidebar in the login page.
- **Dynamic Columns in Table**: The table will accept a `columns` configuration prop, alongside a `taxes` or `retentions` configuration array. It will map over the data to inject the dynamic columns dynamically. The table container will use `overflow-x-auto` to handle many columns.
  - *Rationale*: Hardcoding columns is impossible due to custom jurisdictions and tax concepts in the database.
- **Client Components**: The sidebar, theme toggle, and table components will be Client Components (`"use client"`) due to their interactive nature (state management, collapsing, clicks). 
  - *Rationale*: While Next.js prefers Server Components, interaction requires client-side execution. We'll compose them within Server Components where possible.
- **Page Modularization**: `page.tsx` files will act strictly as component mounters. All complex logic, data fetching methods, and state handlers will be modularized into their corresponding entity files/folders to separate responsibilities.
  - *Rationale*: Avoids grouping logic with rendering and adheres to clean frontend architecture.
- **Form Management & Validation**: Use `react-hook-form` paired with `@hookform/resolvers/zod` and Shadcn's `<Form>`.
  - *Rationale*: Creation forms in modals will have dynamic logic depending on whether they belong to Sales (Client Schema, Retentions) or Purchases (Supplier Schema, Perceptions).
- **Modals**: The "Agregar" buttons will open Shadcn/ui `Dialog` components housing the creation forms.
- **AI File Dropzone**: The forms will include a drag-and-drop component to accept PDF or JPG files.
  - *Rationale*: This will later feed the Gemini API endpoint for automated parsing and field auto-population.
- **Notifications**: Implement a reusable Shadcn/ui `Toast` for warning the user about empty AI parsed fields or showing duplicate voucher errors.
- **Theme Persistence**: Use `next-themes` and explicitly configure it to use `localStorage`.

## Risks / Trade-offs

- **Table Horizontal Overflow**: A high number of retentions may make the table difficult to read.
  - *Mitigation*: Ensure sticky headers and an obvious horizontal scrollbar, or consider sticky first columns (Fecha, Cliente) if horizontal scrolling becomes too wide.
- **Client-Side Hydration Overhead**: Heavy use of Shadcn interactive elements might increase bundle size.
  - *Mitigation*: Keep Server Components as wrappers whenever feasible, pushing state only to the leaves (e.g. `ThemeToggle`, `SidebarToggle`).
