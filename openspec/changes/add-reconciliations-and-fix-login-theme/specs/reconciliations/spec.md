## Purpose

The Reconciliations module allows users to view, categorize (Ventas vs Compras), and manually process pending vouchers via review or regeneration actions.

## ADDED Requirements

### Requirement: Tabbed navigation for vouchers
The Reconciliations interface SHALL allow users to segment vouchers using tabs: "Ventas" (sales) and "Compras" (purchases). The system SHALL instantly update the list when switching tabs and visually highlight the active tab.

#### Scenario: Switching to Compras tab
- **WHEN** user clicks on the "Compras" tab
- **THEN** the system loads and displays only pending purchase vouchers and marks the "Compras" tab as active.

#### Scenario: Switching to Ventas tab
- **WHEN** user clicks on the "Ventas" tab
- **THEN** the system loads and displays only pending sales vouchers and marks the "Ventas" tab as active.

### Requirement: Voucher list layout as horizontal cards
The system SHALL display vouchers in a vertical feed of horizontal descriptive cards, explicitly excluding any KPI or metrics cards. Each card SHALL present: Voucher ID, date, third party, amount, status badge ("Listo" in green, "Error" in red, or "Duplicado" in yellow), detailed status message (OCR status, API error, or duplicate alert), and status icon on the left (check for OK, cross for failed, or warning/exclamation for duplicates).

#### Scenario: Initial feed rendering
- **WHEN** the Conciliations page loads on the Ventas tab
- **THEN** the system renders the sales cards containing voucher details, status badge, status description message, and appropriate action buttons.

### Requirement: Contextual quick actions
The system SHALL provide specific actions for each voucher depending on its processing status:
1. For vouchers in "Listo" status, the system SHALL display a primary action button `"Revisar"`.
2. For vouchers in "Error" status, the system SHALL display a secondary outline action button `"Regenerar"`.
3. For vouchers in "Duplicado" status, the system SHALL display a subtle `"Eliminar"` button (with a trash icon) in the upper/lateral section of the card to discard it.

#### Scenario: Reviewing a successfully parsed voucher
- **WHEN** user clicks the `"Revisar"` button on a voucher in "Listo" status
- **THEN** the system redirects the user or opens the manual review modal for manual validation and confirmation.

#### Scenario: Regenerating a failed voucher
- **WHEN** user clicks the `"Regenerar"` button on a voucher in "Error" status
- **THEN** the system displays a visual loading indicator on the specific card to simulate the re-processing state.

#### Scenario: Removing a duplicate voucher from the queue
- **WHEN** user clicks the `"Eliminar"` button on a duplicate voucher card
- **THEN** the system removes that voucher card from the active list/queue and displays a success toast/notification.

### Requirement: Voucher pagination
The voucher card list SHALL include a pagination control component at the bottom of the feed to navigate between records when the total voucher count exceeds the default page size limit.

#### Scenario: Navigating to the next page
- **WHEN** user clicks the next page button in the pagination controls
- **THEN** the system fetches and displays the next set of cards for the active tab.
