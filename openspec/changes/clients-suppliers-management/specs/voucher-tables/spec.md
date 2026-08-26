## MODIFIED Requirements

### Requirement: Voucher Modal Third-Party Resolution
The system MUST let users resolve a missing client or supplier directly from the voucher modal when the selected third party does not yet exist in the active company.

#### Scenario: User creates an individual voucher outside batch processing
- **WHEN** the user is loading a single sales or purchases voucher through the regular voucher create flow
- **THEN** the inline client or supplier creation behavior MUST be available in that shared voucher modal

#### Scenario: User reviews a single conciliation item
- **WHEN** the user opens an individual staged voucher from conciliations in the shared review modal
- **THEN** the inline client or supplier creation behavior MUST also be available there if the selected third party is missing

#### Scenario: Parsed voucher detects a missing third party
- **WHEN** AI parsing fills `thirdPartyCuit` or `thirdPartyName` but no matching `thirdPartyId` exists for the active route and company
- **THEN** the voucher modal MUST allow the user to create the missing client or supplier inline without closing the voucher flow

#### Scenario: User creates the missing third party inline
- **WHEN** the user submits the inline client or supplier modal with valid `name` and `cuit`
- **THEN** the system MUST persist that record in the active company and current voucher route
- **AND** it MUST refresh the available third-party options
- **AND** it MUST auto-select the created record in the voucher form
- **AND** it MUST keep the voucher modal open with the current voucher values preserved

#### Scenario: Inline create starts from parsed data
- **WHEN** AI parsing already detected a candidate `thirdPartyName` or `thirdPartyCuit`
- **THEN** the inline creation modal MUST prefill the available detected values
- **AND** the user MUST still be able to edit them before confirming

#### Scenario: Inline create hits a duplicate record
- **WHEN** the user submits an inline client or supplier create request that matches an existing record for the active company and current role
- **THEN** the system MUST try to resolve the existing persisted record
- **AND** if exactly one match is resolved, it MUST refresh options and auto-select that record in the voucher form
- **AND** if the record cannot be resolved, it MUST show a Spanish error toast and keep the voucher modal open

### Requirement: Parsed Voucher Type And Letter Select Resolution
The system MUST resolve parsed voucher type and voucher letter values into the correct select-backed ids even when AI returns human-readable labels that do not exactly match the stored catalog text.

#### Scenario: AI returns exact catalog values
- **WHEN** AI returns a voucher type and voucher letter that exactly match the catalog values
- **THEN** the system MUST resolve the corresponding `voucherTypeId` and `voucherLetterId`

#### Scenario: AI returns a combined voucher label
- **WHEN** AI returns a combined human-readable label such as `Factura A` or `Nota de Crédito A`
- **THEN** the system MUST resolve the correct voucher type id and voucher letter id for the shared voucher form selects

#### Scenario: AI returns a MiPyME naming variant
- **WHEN** AI returns a voucher type label for a MiPyME credit invoice using a wording variant that still refers to the same catalog concept
- **THEN** the system MUST resolve the correct voucher type id instead of leaving the select without value

#### Scenario: Combined label cannot be resolved safely
- **WHEN** AI returns a voucher type or voucher letter label that cannot be mapped unambiguously to the current catalogs
- **THEN** the system MUST leave the unresolved select value empty
- **AND** it MUST preserve the rest of the parsed voucher data already mapped into the form
