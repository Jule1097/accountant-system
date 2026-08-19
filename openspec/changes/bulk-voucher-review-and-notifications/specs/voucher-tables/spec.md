## ADDED Requirements

### Requirement: Voucher Routes Can Launch Batch Review
The system SHALL align voucher-related route behavior with the dedicated `conciliations` batch review entrypoint.

#### Scenario: Sales route receives a completed parsing batch notification
- **WHEN** a sales parsing batch is ready to review
- **THEN** the route ecosystem MUST expose navigation into the corresponding `conciliations` batch context instead of requiring in-place review on the sales screen
- **AND** the target route MUST land in the `Ventas` tab context for that batch

#### Scenario: Purchases route receives a completed parsing batch notification
- **WHEN** a purchases parsing batch is ready to review
- **THEN** the route ecosystem MUST expose navigation into the corresponding `conciliations` batch context instead of requiring in-place review on the purchases screen
- **AND** the target route MUST land in the `Compras` tab context for that batch

### Requirement: Voucher Tables Show Exchange Rate
The system SHALL expose the invoice exchange rate in both sales and purchases voucher tables.

#### Scenario: Voucher table renders a persisted voucher
- **WHEN** a sales or purchases table row is rendered
- **THEN** the row MUST include the persisted exchange-rate value
- **AND** the displayed value MUST match the voucher payload that was accepted in the form or review flow
