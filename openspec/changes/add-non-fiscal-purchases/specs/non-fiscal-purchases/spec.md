## Purpose

Enable purchase records without supplier tax identification or fiscal numbering while keeping fiscal purchases and their duplicate controls reliable.

## ADDED Requirements

### Requirement: Purchases preserve their identification mode
The system SHALL persist a purchase identification mode for every purchase voucher. A purchase created for a supplier with a CUIT MUST be fiscal, and a purchase created for a supplier without a CUIT MUST be non-fiscal. A persisted purchase identification mode MUST remain unchanged when the supplier is later updated.

#### Scenario: Purchase from a supplier with CUIT is fiscal
- **WHEN** a user creates a purchase for a supplier identified with a valid CUIT
- **THEN** the system MUST persist the purchase as fiscal and require voucher letter, point of sale, and voucher number

#### Scenario: Purchase from a supplier without CUIT is non-fiscal
- **WHEN** a user creates a purchase for a supplier identified without a CUIT
- **THEN** the system MUST persist the purchase as non-fiscal and store its voucher letter, point of sale, and voucher number as null

#### Scenario: Supplier gains a CUIT after a non-fiscal purchase
- **WHEN** a supplier without a CUIT is updated to include a valid CUIT after non-fiscal purchases exist
- **THEN** the existing purchases MUST remain non-fiscal and editable without fiscal numbering

### Requirement: Purchase supplier changes require an explicit compatible conversion
The system SHALL require an explicit conversion when an edited purchase is associated with a supplier whose tax-identification mode is incompatible with the persisted purchase identification mode.

#### Scenario: Non-fiscal purchase changes to a supplier with CUIT
- **WHEN** a user changes a non-fiscal purchase to a supplier with a CUIT
- **THEN** the system MUST require explicit conversion to fiscal mode and valid voucher letter, point of sale, and voucher number before saving

#### Scenario: Fiscal purchase changes to a supplier without CUIT
- **WHEN** a user changes a fiscal purchase to a supplier without a CUIT
- **THEN** the system MUST require explicit conversion to non-fiscal mode and clear fiscal numbering before saving

### Requirement: Non-fiscal purchases use warning-based duplicate handling
The system SHALL retain strict duplicate prevention for fiscal purchases. For non-fiscal purchases, the system SHALL detect records in the same company with the same supplier, date, and total amount and require user confirmation before persisting a possible duplicate.

#### Scenario: Fiscal duplicate is rejected
- **WHEN** a fiscal purchase matches the existing fiscal duplicate identity criteria
- **THEN** the system MUST reject the save with the existing duplicate-voucher error

#### Scenario: Possible non-fiscal duplicate is confirmed
- **WHEN** a non-fiscal purchase matches an existing non-fiscal purchase by supplier, date, and total amount
- **THEN** the interface MUST show `Posible comprobante duplicado` and allow the user to cancel or choose `Guardar de todos modos`

#### Scenario: Confirmed non-fiscal duplicate is persisted
- **WHEN** a user confirms saving a possible non-fiscal duplicate
- **THEN** the system MUST persist the purchase without applying fiscal duplicate rejection

### Requirement: Purchase voucher types are applicable to their flow
The system SHALL persist voucher-type applicability as sale, purchase, or both. It MUST provide the purchase-only types `Liquidación de expensas`, `Pago de impuesto`, `Resumen bancario`, and `Otro comprobante`; existing shared types MUST remain applicable to both flows.

#### Scenario: Purchase-only type is selected for a purchase
- **WHEN** a user opens the purchase form
- **THEN** the voucher-type selector MUST include types applicable to purchases and both flows

#### Scenario: Purchase-only type is rejected for a sale
- **WHEN** a consumer submits a sale with a purchase-only voucher type
- **THEN** the system MUST reject the request as invalid

### Requirement: Unresolved parsed suppliers require review
The system SHALL not automatically create a supplier without a CUIT from AI or batch extraction when the supplier cannot be identified reliably.

#### Scenario: Parser cannot identify a supplier
- **WHEN** parsed purchase data lacks a resolvable supplier identity
- **THEN** the batch item MUST remain pending review so the user can select or create the intended supplier
