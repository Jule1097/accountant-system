## Purpose

Provides the core structural layout of the application, including a collapsible sidebar for navigation and theme management capabilities (dark/light mode).

## ADDED Requirements

### Requirement: Shared Layout with Sidebar
The system SHALL provide a shared layout for the dashboard, sales, purchases, and analytics routes that includes a sidebar on the left and a main content area on the right.

#### Scenario: Shared layout renders across routes
- **WHEN** user navigates between dashboard, sales, purchases, or analytics
- **THEN** the sidebar and layout structure remain persistent without full page reloads

### Requirement: Collapsible Sidebar Navigation
The system SHALL display a sidebar with navigation links ("Dashboard", "Ventas", "Compras", "Analíticas"). The sidebar MUST be collapsible into a "hamburger" menu style or icon-only mode to save space.

#### Scenario: User collapses the sidebar
- **WHEN** user clicks the collapse/hamburger button on the sidebar
- **THEN** the sidebar width reduces, hiding the text labels and showing only icons (or hiding completely on small screens)

### Requirement: Theme Toggle
The system SHALL include a toggle button in the layout to switch between light and dark themes. The initial default theme MUST be dark mode.

#### Scenario: User toggles theme
- **WHEN** user clicks the theme toggle button
- **THEN** the application switches between dark and light themes and persists the choice
- **AND** the persistence is handled via `next-themes` using `localStorage` to ensure the selection is remembered across sessions

### Requirement: User Session Modal
The system SHALL display the currently authenticated user's name at the bottom of the sidebar. Clicking it MUST open a modal or dropdown with a "Cerrar sesión" option.

#### Scenario: User opens session menu
- **WHEN** user clicks their name at the bottom of the sidebar
- **THEN** a dropdown/modal appears showing the "Cerrar sesión" button
