## Why

Currently, the system lacks a centralized user interface to review and reconcile processed vouchers. Furthermore, the login screen displays a visual bug in light theme (white mode) where the card container remains dark (#0A0A0B), which breaks visual harmony and readability.

## What Changes

*   **Reconciliations Module:**
    *   New `/conciliations` page (accessible from the sidebar navigation).
    *   Tabbed interface ("Ventas" and "Compras") to organize the vouchers.
    *   Feed/list layout featuring horizontal descriptive cards for vouchers requiring manual action.
    *   Contextual actions: `"Revisar"` button (for vouchers processed successfully), `"Regenerar"` button (for failed vouchers), and `"Eliminar"` button (to discard duplicate vouchers).
    *   Support for duplicate/repeated vouchers: displays a yellow/warning status icon/badge to alert the user of duplicate records.
    *   Pagination controls for lists.
    *   Exclusion of KPI/metric cards on this page to optimize reading space.
*   **Login Page Theme Fix:**
    *   Resolve the styling bug in the login form container (`Login Card` at `/login`), ensuring that background, border, and text colors adapt appropriately to light/white theme.

## Capabilities

### New Capabilities
*   `reconciliations`: Ability to list, segment (via Ventas/Compras tabs), perform actions (review/regenerate/delete duplicate), and discard/remove duplicate items from the queue with real-time UI updates and success toast notifications, supporting both light and dark themes.
*   `auth`: Proper theme support (light and dark modes) for form containers and text elements in the Login screen.

### Modified Capabilities
*(None - the main specs directory is empty)*

## Impact

*   **Frontend Routes:** Creation of `/conciliations/page.tsx`.
*   **Components:** Update the shared `Sidebar` component to include the "Conciliaciones" menu link (using the balance scale icon) and update the `Header` component to integrate the notifications bell button on the top right.
*   **Styles / Themes:** Modify styles in the Login card (`src/app/login/page.tsx` or equivalent) to correct background rendering in white mode.
