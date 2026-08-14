## Context

The accounting system requires adding a Reconciliations screen to verify and process Sales and Purchases vouchers. In addition, the login card container (`Login Card` at `/login`) must adapt dynamically to the light theme (white mode), resolving a bug where it remains dark regardless of the active theme.

## Goals / Non-Goals

**Goals:**
*   Create the `/conciliations` page containing a tabbed interface (Ventas / Compras) and a card-based feed layout.
*   Implement pagination controls at the bottom of the feed consistent with other system modules.
*   Secure correct theme adaptability (light/dark mode) for the login card at `/login` by utilizing responsive Tailwind CSS properties.
*   Integrate quick action buttons: `"Revisar"`, `"Regenerar"`, and `"Eliminar"` (visual elements).

**Non-Goals:**
*   No KPI or summary cards will be implemented on the Conciliations screen (explicitly removed to simplify workspace).
*   No custom theme-toggle component is included in this change; the app relies on Tailwind's default dark mode variant detection (html tag classes or prefers-color-scheme). The toggle is already present in the layout.

## Decisions

### 1. Reconciliations Tabs State (Ventas vs Compras)
*   **Decision:** Sync the tab selection using Next.js route query parameters (`?tab=sales|purchases`).
*   **Rationale:** Keeps route URL bookmarks shareable, supports natural browser back/forward history navigation, and cleanly separates pagination states for each tab type.
*   **Alternatives considered:** React local state (`useState`), which would be lost upon page refresh.

### 2. Resolving the Login Card Theme Bug
*   **Decision:** Remove hardcoded dark colors (like `bg-[#0A0A0B]` or `bg-zinc-950`) from the login card and replace them with responsive Tailwind utility classes:
    *   Card background: `bg-white dark:bg-zinc-950`
    *   Borders: `border border-zinc-200 dark:border-zinc-800`
    *   Texts: `text-zinc-900 dark:text-zinc-100` (titles) and `text-zinc-500 dark:text-zinc-400` (subtitles/labels).
*   **Rationale:** Enables CSS components to respond automatically to the `.dark` class on the root `<html>` tag or system preferences.

### 3. Handling Repeated Vouchers & Queue Exclusions
*   **Decision:** Represent duplicate vouchers with a yellow badge (`"Duplicado"`) and a warning/alert icon. Place a subtle `"Eliminar"` button (with trash icon) in the upper-right corner of the card. Clicking it removes the item from the local state list and displays a success toast.
*   **Rationale:** Users need a simple mechanism to dismiss duplicate vouchers to keep the list clean. Doing this via local state removal with a toast mimics a real discard flow without requiring complex backend database updates in this frontend-heavy iteration.

## Risks / Trade-offs

*   **[Risk]** Disconnected navigation experience when switching tabs.
    *   *Mitigation:* Use native Next.js Link/push navigation with `scroll: false` to avoid page jumps.
*   **[Risk]** Lack of backend connection for the action buttons in this phase.
    *   *Mitigation:* Define standard handler props (`onReview`, `onRegenerate`, and `onDelete`) in the components to ease future API integrations.
