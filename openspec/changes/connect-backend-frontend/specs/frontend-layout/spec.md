## MODIFIED Requirements

### Requirement: User Session Modal
The system SHALL display the currently authenticated user's name at the bottom of the sidebar. Clicking it MUST open a modal or dropdown with a "Cerrar sesión" option.

#### Scenario: User opens session menu
- **WHEN** user clicks their name at the bottom of the sidebar
- **THEN** a dropdown/modal appears showing the "Cerrar sesión" button

#### Scenario: User clicks cerrar sesion
- **WHEN** user clicks the "Cerrar sesión" button
- **THEN** the system logs the user out from Supabase Auth
- **AND** redirects the user to the `/login` page.

## ADDED Requirements

### Requirement: Active Company Selector Modal
The system SHALL verify upon startup if the user has selected an active company. If the user has multiple assigned companies and none is stored in local storage, the system SHALL display a blocking modal selector to choose one.

#### Scenario: Multiple companies but none active
- **WHEN** the user logs in and has multiple companies, but no active company is stored in local storage
- **THEN** a blocking modal selector is displayed showing the list of companies
- **AND** the user MUST select a company to proceed.

#### Scenario: Single company access
- **WHEN** the user logs in and belongs to exactly one company
- **THEN** the system automatically selects that company and stores it as active without displaying the selector modal.
