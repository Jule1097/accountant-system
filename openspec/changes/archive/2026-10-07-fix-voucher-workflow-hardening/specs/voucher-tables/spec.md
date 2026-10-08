# Spec Delta

## ADDED Requirements

### Requirement: Voucher forms show workflow-specific calculated amounts
The voucher creation and editing modal SHALL expose gross and net calculated amounts appropriate to the selected workflow. Sales forms SHALL not expose purchase-only amount components, while purchase forms SHALL expose those components and include them in the calculated totals.

#### Scenario: User opens a sales creation modal
- **WHEN** a user opens the sales voucher creation modal
- **THEN** it displays calculated total gross and net-to-collect amounts
- **AND** it does not display non-taxable amount, exempt amount, or other taxes

#### Scenario: User opens a purchase creation modal
- **WHEN** a user opens the purchase voucher creation modal
- **THEN** it displays calculated gross and net-to-pay amounts
- **AND** it displays the non-taxable and exempt amount components
- **AND** it represents other taxes through the perceptions section instead of a direct amount input
