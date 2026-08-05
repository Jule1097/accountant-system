## Why

The current system needs the core frontend screens (Dashboard, Sales, Purchases, Analytics, Login) to provide users with a functional interface for managing their accounting data. The layout needs to be scalable, responsive, and follow a premium design aesthetic using Shadcn/ui.

## What Changes

- Add a root layout with dark/light mode toggle.
- Create a `(dashboard)` route group with a shared layout containing a collapsible hamburger sidebar.
- Add dynamic data tables for Sales and Purchases that render standard voucher data alongside dynamic columns for retentions (sales) and perceptions (purchases) mapped to `RetentionConcept`.
- Build an initial dashboard view with KPI cards (income, expenses, balance).
- Add an isolated `/login` page for authentication.
- Add an initial analytics page under `/analytics` with visual chart placeholders.

## Capabilities

### New Capabilities
- `frontend-layout`: Core layout, sidebar, and theme management.
- `voucher-tables`: Reusable and dynamic tables for sales and purchases, capable of rendering dynamic tax/retention columns based on the database schema.
- `dashboard-metrics`: UI cards for displaying high-level metrics.
- `auth-ui`: User interface for login and session management (UI only).
- `analytics-ui`: Initial analytics view with chart placeholders.

### Modified Capabilities

## Impact

- Introduces new routes and UI components using Next.js App Router.
- Uses Shadcn/ui for consistent styling.
- Sets the foundation for future backend integration.
