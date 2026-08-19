## 1. Setup & Shared Layout Updates

- [x] 1.1 Update the shared `Sidebar` component to change the menu text from "Notificaciones" to "Conciliaciones" and switch the menu icon to "scale" (using the Lucide icon library).
- [x] 1.2 Update the shared `Header` component to add the notification bell button (icon `bell` wrapped in a border-radius container) aligned to the top-right.

## 2. Login Page Theme Correction

- [x] 2.1 Locate or scaffold the login screen at `/src/app/login/page.tsx`.
- [x] 2.2 Replace hardcoded dark-mode background colors on the Login Card container with responsive Tailwind variants (`bg-white dark:bg-zinc-950` and `border border-zinc-200 dark:border-zinc-800`).
- [x] 2.3 Ensure login labels, input fields, and placeholder text colors adapt with proper contrast in both light and dark themes.

## 3. Conciliations Page UI Implementation

- [x] 3.1 Create the new route directory and page component at `/src/app/conciliations/page.tsx`.
- [x] 3.2 Implement the horizontal `Tabs Bar` displaying "Ventas" and "Compras" tabs, syncing the active state with URL search parameters (`?tab=sales` by default).
- [x] 3.3 Create the horizontal voucher feed cards displaying ID, date, third party, status badge (Listo, Error, Duplicado), description message, and icons based on the pending status (check, cross, or warning).
- [x] 3.4 Bind action buttons inside each card: a primary `"Revisar"` button, a secondary outline `"Regenerar"` button, and a subtle `"Eliminar"` button (with trash icon) in the upper/lateral section for duplicate vouchers.
- [x] 3.5 Implement state logic to remove a voucher card from the UI list and trigger a success toast when the `"Eliminar"` button is clicked.
- [x] 3.6 Re-integrate the `Table Pagination` controls at the bottom of the feed list, syncing it with the page URL queries.

## 4. Component Testing

- [x] 4.1 Write Jest tests for page routing, query parameters syncing, and correct CSS theme classes application on the Login Card.
