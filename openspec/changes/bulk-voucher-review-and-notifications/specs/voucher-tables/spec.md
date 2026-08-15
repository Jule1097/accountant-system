## ADDED Requirements

### Requirement: Voucher Routes Can Launch Batch Review
The system SHALL align voucher-related route behavior with the dedicated `conciliations` batch review entrypoint.

#### Scenario: Sales route receives a completed parsing batch notification
- **WHEN** a sales parsing batch is ready to review
- **THEN** the route ecosystem MUST expose navigation into the corresponding `conciliations` batch context instead of requiring in-place review on the sales screen

#### Scenario: Purchases route receives a completed parsing batch notification
- **WHEN** a purchases parsing batch is ready to review
- **THEN** the route ecosystem MUST expose navigation into the corresponding `conciliations` batch context instead of requiring in-place review on the purchases screen
